import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type UserCredential,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Guard @firebase/auth PopupOperation against double-reject race conditions
// ("INTERNAL ASSERTION FAILED: Pending promise was never set") when popup poll fires after rejection
function patchFirebaseAuthPopupResolver(authInstance: unknown) {
  type PopupConsumer = {
    pendingPromise?: { resolve: (v: unknown) => void; reject: (e: unknown) => void } | null;
    reject?: (err: unknown) => void;
    resolve?: (cred: unknown) => void;
    unregisterAndCleanUp?: () => void;
    __patchedSafeReject?: boolean;
  };

  const internalAuth = authInstance as {
    _popupRedirectResolver?: {
      _initialize?: (a: unknown) => Promise<{
        registerConsumer?: (consumer: PopupConsumer) => void;
        __patchedRegister?: boolean;
      }>;
      _isIframeWebStorageSupported?: (a: unknown, cb: (supported: boolean) => void) => void;
    };
  };

  const resolver = internalAuth?._popupRedirectResolver;
  if (!resolver) return;

  resolver._isIframeWebStorageSupported = (_a: unknown, cb: (supported: boolean) => void) => {
    cb(true);
  };

  if (typeof resolver._initialize === 'function') {
    const origInit = resolver._initialize.bind(resolver);
    resolver._initialize = async (a: unknown) => {
      const manager = await origInit(a);
      if (manager && typeof manager.registerConsumer === 'function' && !manager.__patchedRegister) {
        manager.__patchedRegister = true;
        const origRegister = manager.registerConsumer.bind(manager);
        manager.registerConsumer = (consumer: PopupConsumer) => {
          if (consumer && !consumer.__patchedSafeReject) {
            consumer.__patchedSafeReject = true;
            consumer.reject = function (this: PopupConsumer, err: unknown) {
              if (!this.pendingPromise) {
                this.unregisterAndCleanUp?.();
                return;
              }
              this.pendingPromise.reject(err);
              this.unregisterAndCleanUp?.();
            };
            consumer.resolve = function (this: PopupConsumer, cred: unknown) {
              if (!this.pendingPromise) {
                this.unregisterAndCleanUp?.();
                return;
              }
              this.pendingPromise.resolve(cred);
              this.unregisterAndCleanUp?.();
            };
          }
          return origRegister(consumer);
        };
      }
      return manager;
    };
  }
}
patchFirebaseAuthPopupResolver(auth);

// Initialize Firebase App Check when reCAPTCHA v3 site key is configured
const recaptchaSiteKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RECAPTCHA_SITE_KEY) ||
  firebaseConfig.recaptchaSiteKey ||
  '';

if (typeof window !== 'undefined' && recaptchaSiteKey.trim().length > 0) {
  import('firebase/app-check')
    .then(({ initializeAppCheck, ReCaptchaV3Provider }) => {
      initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaSiteKey.trim()),
        isTokenAutoRefreshEnabled: true,
      });
    })
    .catch(() => {
      // App Check already initialized or environment unsupported
    });
}

// Validate Connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const VALIDATION_RULES = {
  ID_PATTERN: /^[a-zA-Z0-9_\-]+$/,
  MAX_Lengths: {
    customerName: 100,
    customerEmail: 120,
    locality: 200,
    acDetails: 100,
    subject: 60,
    messageText: 1000,
  },
  MESSAGE_SUBJECTS: [
    'General AC Inquiry',
    'Emergency Breakdown Support',
    'Commercial / AMC Quote',
    'Installation / Uninstallation Quote',
    'Service Feedback',
  ] as const,
};

export const ADMIN_EMAIL = 'coolbrosacservice@gmail.com';
export const AUTHORIZED_ADMIN_EMAILS = [
  'coolbrosacservice@gmail.com',
  'burnster1826@gmail.com',
] as const;

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (AUTHORIZED_ADMIN_EMAILS as readonly string[]).includes(normalized);
}

export type ServiceType = string;
export type MessageSubject = (typeof VALIDATION_RULES.MESSAGE_SUBJECTS)[number];

export function generateSafeDocId(prefix: string): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  const raw = `${prefix}_${Date.now()}_${randomPart}`;
  return raw.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 120);
}

let activeSignInPromise: Promise<UserCredential | null> | null = null;

export async function signInWithGoogle(): Promise<UserCredential | null> {
  if (activeSignInPromise) {
    return activeSignInPromise;
  }

  activeSignInPromise = (async () => {
    try {
      await auth.authStateReady();
      return await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      const message = err instanceof Error ? err.message : String(err);

      // Ignore benign popup closure or duplicate-click cancellation
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        message.includes('Pending promise was never set')
      ) {
        return null;
      }

      if (code === 'auth/unauthorized-domain') {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
        throw new Error(
          `To enable Google Sign-In on ${host}, add "${host}" in Firebase Console → Authentication → Settings → Authorized domains.`
        );
      }
      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment'
      ) {
        throw new Error(
          'Google Sign-In popup was blocked (common inside WhatsApp/Instagram browsers). Please open this site in Chrome or Safari, or book directly via WhatsApp (+91 9560415262).'
        );
      }
      throw err;
    } finally {
      activeSignInPromise = null;
    }
  })();

  return activeSignInPromise;
}

export async function signOutUser() {
  return firebaseSignOut(auth);
}

export interface CustomerMessageRecord {
  id: string;
  userId: string;
  senderName: string;
  senderEmail: string;
  locality: string;
  acDetails: string;
  subject: MessageSubject;
  messageText: string;
  createdAt?: Timestamp | null;
}

export interface CreateCustomerMessageInput {
  senderName: string;
  locality?: string;
  acDetails?: string;
  subject: MessageSubject;
  messageText: string;
}

export async function createCustomerMessageInFirestore(
  input: CreateCustomerMessageInput
): Promise<string | null> {
  const user = auth.currentUser;
  if (!user || !user.email || !user.emailVerified) {
    return null;
  }

  const messageId = generateSafeDocId('msg');
  const path = `messages/${messageId}`;

  const cleanName = input.senderName.trim().slice(0, VALIDATION_RULES.MAX_Lengths.customerName);
  const cleanEmail = user.email.trim().slice(0, VALIDATION_RULES.MAX_Lengths.customerEmail);
  const cleanLocality = (input.locality || '').trim().slice(0, VALIDATION_RULES.MAX_Lengths.locality);
  const cleanAcDetails = (input.acDetails || '')
    .trim()
    .slice(0, VALIDATION_RULES.MAX_Lengths.acDetails);
  const cleanText = input.messageText.trim().slice(0, VALIDATION_RULES.MAX_Lengths.messageText);

  if (cleanName.length < 2 || cleanText.length < 5) {
    return null;
  }

  try {
    await setDoc(doc(db, 'messages', messageId), {
      userId: user.uid,
      senderName: cleanName,
      senderEmail: cleanEmail,
      locality: cleanLocality,
      acDetails: cleanAcDetails,
      subject: input.subject,
      messageText: cleanText,
      createdAt: serverTimestamp(),
    });
    return messageId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteMessageInFirestore(messageId: string): Promise<void> {
  const path = `messages/${messageId}`;
  try {
    await deleteDoc(doc(db, 'messages', messageId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export interface CustomerReviewRecord {
  id: string;
  authorId: string;
  authorName: string;
  isVerifiedUser: boolean;
  approved: boolean;
  rating: number;
  serviceUsed: ServiceType;
  locality: string;
  reviewText: string;
  createdAt?: Timestamp | null;
}

export interface CreateReviewInput {
  authorName: string;
  rating: number;
  serviceUsed: ServiceType;
  locality: string;
  reviewText: string;
}

export async function createReviewInFirestore(
  input: CreateReviewInput
): Promise<{ id: string; approved: boolean }> {
  const user = auth.currentUser;
  const reviewId = generateSafeDocId('rev');
  const path = `reviews/${reviewId}`;

  const cleanName = input.authorName.trim().slice(0, 80);
  const cleanLocality = (input.locality.trim() || 'Delhi NCR').slice(0, 80);
  const cleanText = input.reviewText.trim().slice(0, 600);
  const safeRating = Math.max(1, Math.min(5, Math.round(input.rating)));

  if (cleanName.length < 2) {
    throw new Error('Please enter your name (minimum 2 characters).');
  }
  if (cleanLocality.length < 2) {
    throw new Error('Please enter your locality or city (minimum 2 characters).');
  }
  if (cleanText.length < 5) {
    throw new Error('Please write at least 5 characters in your review.');
  }

  const autoApproved = Boolean(user && user.emailVerified && isAdminEmail(user.email));

  const payload = {
    authorId: user ? user.uid : 'guest',
    authorName: cleanName,
    isVerifiedUser: Boolean(user && user.emailVerified),
    approved: autoApproved,
    rating: safeRating,
    serviceUsed: input.serviceUsed.slice(0, 80),
    locality: cleanLocality,
    reviewText: cleanText,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'reviews', reviewId), payload);
    return { id: reviewId, approved: autoApproved };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function setReviewApprovalInFirestore(
  reviewId: string,
  approved: boolean
): Promise<void> {
  const path = `reviews/${reviewId}`;
  try {
    await updateDoc(doc(db, 'reviews', reviewId), {
      approved,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteReviewInFirestore(reviewId: string): Promise<void> {
  const path = `reviews/${reviewId}`;
  try {
    await deleteDoc(doc(db, 'reviews', reviewId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export interface ServiceItemRecord {
  id: string;
  name: string;
  tagline: string;
  priceInr: number;
  iconIndex: number;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface UpsertServiceInput {
  id?: string;
  name: string;
  tagline?: string;
  priceInr: number;
  iconIndex?: number;
  existsInFirestore?: boolean;
}

export async function saveServiceInFirestore(input: UpsertServiceInput): Promise<string> {
  const user = auth.currentUser;
  if (!user || !user.email || !isAdminEmail(user.email)) {
    throw new Error('Please sign in with an authorized admin account to manage services.');
  }

  const serviceId =
    input.id && VALIDATION_RULES.ID_PATTERN.test(input.id)
      ? input.id.slice(0, 120)
      : generateSafeDocId('srv');
  const path = `services/${serviceId}`;

  const cleanName = input.name.trim().slice(0, 80);
  const cleanTagline = (input.tagline || '').trim().slice(0, 200);
  const safePrice = Math.max(49, Math.min(500000, Math.round(Number(input.priceInr) || 499)));
  const safeIconIndex = Math.max(0, Math.min(5, Math.round(Number(input.iconIndex) || 0)));

  if (cleanName.length < 2) {
    throw new Error('Service name must be at least 2 characters.');
  }

  try {
    if (input.existsInFirestore) {
      await updateDoc(doc(db, 'services', serviceId), {
        name: cleanName,
        tagline: cleanTagline,
        priceInr: safePrice,
        iconIndex: safeIconIndex,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'services', serviceId), {
        id: serviceId,
        name: cleanName,
        tagline: cleanTagline,
        priceInr: safePrice,
        iconIndex: safeIconIndex,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return serviceId;
  } catch (error) {
    handleFirestoreError(
      error,
      input.existsInFirestore ? OperationType.UPDATE : OperationType.CREATE,
      path
    );
  }
}

export async function deleteServiceInFirestore(serviceId: string): Promise<void> {
  const path = `services/${serviceId}`;
  try {
    await deleteDoc(doc(db, 'services', serviceId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
