import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
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
    providerInfo?: {
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
  PHONE_PATTERN: /^[0-9+\-\s()]{10,20}$/,
  MAX_Lengths: {
    customerName: 100,
    customerPhone: 20,
    customerEmail: 120,
    subject: 60,
    messageText: 1000,
  },
  MESSAGE_SUBJECTS: [
    'General AC Inquiry',
    'Emergency Breakdown Support',
    'Commercial / AMC Quote',
    'Service Feedback',
    'Callback Request',
  ] as const,
};

export const ADMIN_EMAIL = 'coolbrosacservice@gmail.com';

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL;
}

export type ServiceType = string;
export type MessageSubject = (typeof VALIDATION_RULES.MESSAGE_SUBJECTS)[number];

export function generateSafeDocId(prefix: string): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  const raw = `${prefix}_${Date.now()}_${randomPart}`;
  return raw.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 120);
}

export async function signInWithGoogle() {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/unauthorized-domain') {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'your domain';
      throw new Error(
        `To enable Google Sign-In on ${host}, add "${host}" in Firebase Console → Authentication → Settings → Authorized domains.`
      );
    }
    throw err;
  }
}

export async function signOutUser() {
  return firebaseSignOut(auth);
}

export interface CreateCustomerMessageInput {
  senderName: string;
  senderPhone?: string;
  senderEmail?: string;
  subject: MessageSubject;
  messageText: string;
}

export async function createCustomerMessageInFirestore(
  input: CreateCustomerMessageInput
): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  const messageId = generateSafeDocId('msg');
  const path = `messages/${messageId}`;

  const cleanName = input.senderName.trim().slice(0, VALIDATION_RULES.MAX_Lengths.customerName);
  const cleanPhone = (input.senderPhone?.trim() || '9560415262').slice(
    0,
    VALIDATION_RULES.MAX_Lengths.customerPhone
  );
  const cleanEmail = (input.senderEmail?.trim() || user.email || 'customer@coolbrosac.com').slice(
    0,
    VALIDATION_RULES.MAX_Lengths.customerEmail
  );
  const cleanText = input.messageText.trim().slice(0, VALIDATION_RULES.MAX_Lengths.messageText);

  if (cleanName.length < 2 || cleanText.length < 5) {
    return null;
  }

  try {
    await setDoc(doc(db, 'messages', messageId), {
      userId: user.uid,
      senderName: cleanName,
      senderPhone: cleanPhone,
      senderEmail: cleanEmail,
      subject: input.subject,
      messageText: cleanText,
      createdAt: serverTimestamp(),
    });
    return messageId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export interface CustomerReviewRecord {
  id: string;
  authorId: string;
  authorName: string;
  isVerifiedUser: boolean;
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

export async function createReviewInFirestore(input: CreateReviewInput): Promise<string> {
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

  const payload = {
    authorId: user ? user.uid : 'guest',
    authorName: cleanName,
    isVerifiedUser: Boolean(user && user.emailVerified),
    rating: safeRating,
    serviceUsed: input.serviceUsed,
    locality: cleanLocality,
    reviewText: cleanText,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'reviews', reviewId), payload);
    return reviewId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
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
  updatedByEmail?: string;
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
  if (!user || !user.email) {
    throw new Error('Please sign in with coolbrosacservice@gmail.com to manage services.');
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
  const adminEmail = user.email.slice(0, 120);

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
        updatedByEmail: adminEmail,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'services', serviceId), {
        id: serviceId,
        name: cleanName,
        tagline: cleanTagline,
        priceInr: safePrice,
        iconIndex: safeIconIndex,
        updatedByEmail: adminEmail,
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
