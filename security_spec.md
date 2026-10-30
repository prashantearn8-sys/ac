# Cool Bros AC Service — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **Zero-Trust Default Deny**: Any path not explicitly matched (`/bookings/{bookingId}`, `/reminders/{reminderId}`, `/messages/{messageId}`) is unconditionally denied for both read and write.
2. **Verified Identity & Ownership**:
   - Every write operation (`create`, `update`, `delete`) requires `request.auth != null` and `request.auth.token.email_verified == true`.
   - Every `Booking`, `MaintenanceReminder`, and `CustomerMessage` document must have `userId == request.auth.uid` on creation.
   - PII Isolation: Because `Booking` and `CustomerMessage` contain customer names, phone numbers, and emails, `get` and `list` operations strictly verify `resource.data.userId == request.auth.uid || isAdmin()`. Blanket `isSignedIn()` reads are prohibited.
   - Bootstrapped Admin (`isAdmin()`): Verified email (`request.auth.token.email_verified == true`) matching `'burnster1826@gmail.com'` or `'coolbrosacservice@gmail.com'`.
3. **Path Variable Hardening**:
   - Document IDs (`{bookingId}`, `{reminderId}`, `{messageId}`) on `get`, `create`, `update`, and `delete` must match `^[a-zA-Z0-9_\-]+$` with length `<= 128`.
4. **Schema & Volumetric Enforcement**:
   - Every string property enforces strict `minLength`, `maxLength`, and regex/enum constraints matching `firebase-blueprint.json`.
   - `hasAll` and `hasOnly` enforce exact key sets on `create` and `update` to block shadow fields.
5. **Temporal & Immutable Integrity**:
   - `createdAt` must equal `request.time` on `create` and remain immutable on `update`.
   - `updatedAt` must equal `request.time` on `create` and `update`.
   - `userId` is immutable on `update`.
   - `CustomerMessage` documents are immutable after creation (no updates permitted; only owner or admin can delete).
6. **Terminal State Locking**:
   - Once a `Booking` reaches `status == 'completed'` or `status == 'cancelled'`, no further updates are permitted (unless `isAdmin()`).

---

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 (Identity Spoofing on Booking/Message Create)**: Authenticated user `user_A` attempts to create a booking or message with `userId: "user_B"`. -> `PERMISSION_DENIED`
2. **Payload 2 (Unverified Email Write / Admin Spoof)**: Authenticated user with `email_verified: false` (even with `email: "burnster1826@gmail.com"`) attempts to read or write. -> `PERMISSION_DENIED`
3. **Payload 3 (Shadow Field Injection on Create)**: Payload includes all required keys plus `"isAdminOverride": true`. -> `PERMISSION_DENIED`
4. **Payload 4 (PII Cross-Tenant Read / Blanket List)**: Non-admin `user_A` attempts to `get` or `list` a booking or message belonging to `user_B`. -> `PERMISSION_DENIED`
5. **Payload 5 (ID Poisoning Attack)**: Creating a booking or message with document ID containing spaces or special characters (`msg$123!`) or exceeding 128 chars. -> `PERMISSION_DENIED`
6. **Payload 6 (Phone Format / Volumetric Overflow)**: Creating a message with `senderPhone: "abc-invalid"` or a 5,000-character `messageText`. -> `PERMISSION_DENIED`
7. **Payload 7 (Client Timestamp Forgery)**: Creating a message or reminder with a past or future client-supplied timestamp (`createdAt != request.time`). -> `PERMISSION_DENIED`
8. **Payload 8 (Terminal State Mutation)**: Attempting to update a booking whose existing `status` is `'completed'` or `'cancelled'` as a standard user. -> `PERMISSION_DENIED`
9. **Payload 9 (Unauthorized Field Mutation on Booking Update)**: Attempting to change `estimatedTotal` or `customerEmail` during a status/schedule update action. -> `PERMISSION_DENIED`
10. **Payload 10 (Immutable `createdAt` or `userId` Tampering)**: Attempting to modify `createdAt` or `userId` during an update on `/reminders/{reminderId}`. -> `PERMISSION_DENIED`
11. **Payload 11 (Invalid Enum Injection)**: Setting `subject` on `/messages/{messageId}` to `"Spam Injection"` or `emailDeliveryStatus` to `"hacked"`. -> `PERMISSION_DENIED`
12. **Payload 12 (Out-of-Bounds Numeric Values)**: Setting `unitCount: 0` or `unitCount: 999`, or `estimatedTotal: -500`. -> `PERMISSION_DENIED`
