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

// Verbatim Validation Constants from firebase-blueprint.json
export const VALIDATION_RULES = {
  ID_PATTERN: /^[a-zA-Z0-9_\-]+$/,
  PHONE_PATTERN: /^[0-9+\-\s()]{10,20}$/,
  DATE_PATTERN: /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/,
  MAX_Lengths: {
    userId: 128,
    customerName: 100,
    customerPhone: 20,
    customerEmail: 120,
    serviceAddress: 300,
    acType: 40,
    serviceType: 60,
    tonnage: 20,
    scheduledDate: 10,
    timeSlot: 30,
    status: 20,
    notes: 500,
    technicianName: 100,
    unitLabel: 80,
    brandModel: 80,
    healthStatus: 20,
    subject: 60,
    messageText: 1000,
  },
  AC_TYPES: ['Split AC', 'Window AC', 'Cassette AC', 'Ductable / VRF'] as const,
  SERVICE_TYPES: [
    'Foam Power Jet Service',
    'Anti-Rust Deep Chemical Wash',
    'Gas Charging & Leak Fix',
    'Diagnostic & PCB Repair',
    'Installation / Uninstallation',
    'Annual Maintenance Contract (AMC)',
  ] as const,
  TONNAGES: ['1.0 Ton', '1.5 Ton', '2.0 Ton', '3.0+ Ton'] as const,
  TIME_SLOTS: [
    '09:00 AM - 11:00 AM',
    '11:30 AM - 01:30 PM',
    '02:30 PM - 04:30 PM',
    '05:00 PM - 07:00 PM',
  ] as const,
  BOOKING_STATUSES: ['scheduled', 'in-progress', 'completed', 'cancelled'] as const,
  HEALTH_STATUSES: ['optimal', 'due-soon', 'overdue'] as const,
  MESSAGE_SUBJECTS: [
    'General AC Inquiry',
    'Emergency Breakdown Support',
    'Commercial / AMC Quote',
    'Service Feedback',
    'Callback Request',
  ] as const,
};

export type AcType = (typeof VALIDATION_RULES.AC_TYPES)[number];
export type ServiceType = (typeof VALIDATION_RULES.SERVICE_TYPES)[number];
export type TonnageType = (typeof VALIDATION_RULES.TONNAGES)[number];
export type TimeSlotType = (typeof VALIDATION_RULES.TIME_SLOTS)[number];
export type BookingStatus = (typeof VALIDATION_RULES.BOOKING_STATUSES)[number];
export type HealthStatus = (typeof VALIDATION_RULES.HEALTH_STATUSES)[number];
export type MessageSubject = (typeof VALIDATION_RULES.MESSAGE_SUBJECTS)[number];

export interface BookingRecord {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceAddress: string;
  acType: AcType;
  serviceType: ServiceType;
  unitCount: number;
  tonnage: TonnageType;
  scheduledDate: string;
  timeSlot: TimeSlotType;
  estimatedTotal: number;
  status: BookingStatus;
  notes: string;
  technicianName: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface MaintenanceReminderRecord {
  id: string;
  userId: string;
  unitLabel: string;
  acType: AcType;
  brandModel: string;
  lastServicedDate: string;
  nextDueDate: string;
  intervalMonths: number;
  healthStatus: HealthStatus;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

const LEAD_TECHNICIANS = [
  'Vikram Singh (Sr. HVAC Lead)',
  'Arjun Mehta (VRF & Inverter Specialist)',
  'Rajesh Kumar (Master Cryo-Jet Tech)',
  'Sandeep Verma (Diagnostic Engineer)',
];

export function generateSafeDocId(prefix: string): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  const raw = `${prefix}_${Date.now()}_${randomPart}`;
  return raw.replace(/[^a-zA-Z0-9_\-]/g, '').slice(0, 120);
}

export function computeHealthStatus(nextDueDate: string): HealthStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${nextDueDate}T00:00:00`);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 21) return 'due-soon';
  return 'optimal';
}

export function addMonthsToDateString(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1 + months, d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function signOutUser() {
  return firebaseSignOut(auth);
}

export interface CreateBookingInput {
  customerName: string;
  customerPhone: string;
  serviceAddress: string;
  acType: AcType;
  serviceType: ServiceType;
  unitCount: number;
  tonnage: TonnageType;
  scheduledDate: string;
  timeSlot: TimeSlotType;
  estimatedTotal: number;
  notes: string;
}

export async function createBookingInFirestore(input: CreateBookingInput): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Please sign in with Google to confirm your booking.');
  }

  const bookingId = generateSafeDocId('bk');
  const path = `bookings/${bookingId}`;

  const cleanName = input.customerName.trim().slice(0, VALIDATION_RULES.MAX_Lengths.customerName);
  const cleanPhone = input.customerPhone.trim().slice(0, VALIDATION_RULES.MAX_Lengths.customerPhone);
  const cleanAddress = input.serviceAddress.trim().slice(0, VALIDATION_RULES.MAX_Lengths.serviceAddress);
  const cleanNotes = (input.notes || '').trim().slice(0, VALIDATION_RULES.MAX_Lengths.notes);
  const cleanEmail = (user.email || 'customer@coolbrosac.com').slice(
    0,
    VALIDATION_RULES.MAX_Lengths.customerEmail
  );

  if (cleanName.length < 2) {
    throw new Error('Customer name must be at least 2 characters.');
  }
  if (!VALIDATION_RULES.PHONE_PATTERN.test(cleanPhone)) {
    throw new Error('Please enter a valid 10 to 15 digit phone number.');
  }
  if (cleanAddress.length < 5) {
    throw new Error('Please enter a complete service address (minimum 5 characters).');
  }
  if (!VALIDATION_RULES.DATE_PATTERN.test(input.scheduledDate)) {
    throw new Error('Please select a valid service date.');
  }

  const assignedTech =
    LEAD_TECHNICIANS[Math.floor(Math.random() * LEAD_TECHNICIANS.length)];

  const payload = {
    userId: user.uid,
    customerName: cleanName,
    customerPhone: cleanPhone,
    customerEmail: cleanEmail,
    serviceAddress: cleanAddress,
    acType: input.acType,
    serviceType: input.serviceType,
    unitCount: Math.max(1, Math.min(20, Math.round(input.unitCount))),
    tonnage: input.tonnage,
    scheduledDate: input.scheduledDate,
    timeSlot: input.timeSlot,
    estimatedTotal: Math.max(199, Math.min(500000, Math.round(input.estimatedTotal))),
    status: 'scheduled' as BookingStatus,
    notes: cleanNotes,
    technicianName: assignedTech,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'bookings', bookingId), payload);
    return bookingId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateBookingStatusInFirestore(
  bookingId: string,
  status: BookingStatus
): Promise<void> {
  const path = `bookings/${bookingId}`;
  try {
    await updateDoc(doc(db, 'bookings', bookingId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function rescheduleBookingInFirestore(
  bookingId: string,
  scheduledDate: string,
  timeSlot: TimeSlotType,
  notes: string
): Promise<void> {
  const path = `bookings/${bookingId}`;
  if (!VALIDATION_RULES.DATE_PATTERN.test(scheduledDate)) {
    throw new Error('Invalid date format.');
  }
  try {
    await updateDoc(doc(db, 'bookings', bookingId), {
      scheduledDate,
      timeSlot,
      notes: notes.trim().slice(0, VALIDATION_RULES.MAX_Lengths.notes),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteBookingInFirestore(bookingId: string): Promise<void> {
  const path = `bookings/${bookingId}`;
  try {
    await deleteDoc(doc(db, 'bookings', bookingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export interface CreateReminderInput {
  unitLabel: string;
  acType: AcType;
  brandModel: string;
  lastServicedDate: string;
  intervalMonths: number;
}

export async function createReminderInFirestore(input: CreateReminderInput): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Please sign in with Google to add equipment reminders.');
  }

  const reminderId = generateSafeDocId('rm');
  const path = `reminders/${reminderId}`;

  const cleanLabel = input.unitLabel.trim().slice(0, VALIDATION_RULES.MAX_Lengths.unitLabel);
  const cleanBrand = input.brandModel.trim().slice(0, VALIDATION_RULES.MAX_Lengths.brandModel);

  if (cleanLabel.length < 2) {
    throw new Error('Room / Unit label must be at least 2 characters.');
  }
  if (cleanBrand.length < 2) {
    throw new Error('Brand & model must be at least 2 characters.');
  }
  if (!VALIDATION_RULES.DATE_PATTERN.test(input.lastServicedDate)) {
    throw new Error('Invalid last serviced date.');
  }

  const safeInterval = Math.max(1, Math.min(24, Math.round(input.intervalMonths)));
  const nextDueDate = addMonthsToDateString(input.lastServicedDate, safeInterval);
  const healthStatus = computeHealthStatus(nextDueDate);

  const payload = {
    userId: user.uid,
    unitLabel: cleanLabel,
    acType: input.acType,
    brandModel: cleanBrand,
    lastServicedDate: input.lastServicedDate,
    nextDueDate,
    intervalMonths: safeInterval,
    healthStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'reminders', reminderId), payload);
    return reminderId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function markReminderServicedTodayInFirestore(
  reminderId: string,
  intervalMonths: number
): Promise<void> {
  const path = `reminders/${reminderId}`;
  const todayStr = new Date().toISOString().split('T')[0];
  const safeInterval = Math.max(1, Math.min(24, Math.round(intervalMonths)));
  const nextDueDate = addMonthsToDateString(todayStr, safeInterval);
  const healthStatus = computeHealthStatus(nextDueDate);

  try {
    await updateDoc(doc(db, 'reminders', reminderId), {
      lastServicedDate: todayStr,
      nextDueDate,
      intervalMonths: safeInterval,
      healthStatus,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteReminderInFirestore(reminderId: string): Promise<void> {
  const path = `reminders/${reminderId}`;
  try {
    await deleteDoc(doc(db, 'reminders', reminderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export interface CreateCustomerMessageInput {
  senderName: string;
  senderPhone: string;
  senderEmail: string;
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
  const cleanPhone = input.senderPhone.trim().slice(0, VALIDATION_RULES.MAX_Lengths.customerPhone);
  const cleanEmail = (input.senderEmail.trim() || user.email || 'customer@coolbrosac.com').slice(
    0,
    VALIDATION_RULES.MAX_Lengths.customerEmail
  );
  const cleanText = input.messageText.trim().slice(0, VALIDATION_RULES.MAX_Lengths.messageText);

  if (
    cleanName.length < 2 ||
    !VALIDATION_RULES.PHONE_PATTERN.test(cleanPhone) ||
    cleanText.length < 5
  ) {
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

