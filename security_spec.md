# Cool Bros AC Service — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants

1. **Zero-Trust Default Deny**: Any path not explicitly matched (`/services/{serviceId}`, `/bookings/{bookingId}`, `/reminders/{reminderId}`, `/messages/{messageId}`, `/reviews/{reviewId}`) is unconditionally denied for both read and write.
2. **Admin RBAC (`isAdmin()`) & Service Catalog (`/services/{serviceId}`)**:
   - Only a verified admin user (`request.auth != null && request.auth.token.email_verified == true` with `request.auth.token.email == 'coolbrosacservice@gmail.com'` or `'burnster1826@gmail.com'`, or a document in `/admins/{uid}`) can `create`, `update`, or `delete` documents in `/services/{serviceId}`.
   - Public visitors can `get` and `list` `/services/{serviceId}` to view live pricing and available AC service packages.
   - `ServicePackage` writes strictly validate `id == serviceId`, `basePriceInr` (99 to 100000), `durationMinutes` (15 to 480), `warrantyDays` (0 to 730), `category` (`'cleaning' | 'repair' | 'amc'`), bounded `deliverables` array (1 to 6 strings), `updatedByEmail == request.auth.token.email`, and server timestamps.
3. **Verified Identity & Ownership**:
   - Standard user write operations (`create`, `update`, `delete`) require `request.auth != null` and `request.auth.token.email_verified == true`.
   - Every `Booking`, `MaintenanceReminder`, and `CustomerMessage` document must have `userId == request.auth.uid` on creation.
   - PII Isolation: Because `Booking` and `CustomerMessage` contain customer names, phone numbers, and emails, `get` and `list` operations strictly verify `resource.data.userId == request.auth.uid`. Blanket `isSignedIn()` reads are prohibited.
4. **Path Variable Hardening**:
   - Document IDs (`{serviceId}`, `{bookingId}`, `{reminderId}`, `{messageId}`, `{reviewId}`) on `get`, `create`, `update`, and `delete` must match `^[a-zA-Z0-9_\-]+$` with length `<= 128`.
5. **Schema & Volumetric Enforcement**:
   - Every string property enforces strict `minLength`, `maxLength`, and regex/enum constraints matching `firebase-blueprint.json`.
   - `hasAll` and `hasOnly` enforce exact key sets on `create` and `update` to block shadow fields.
6. **Temporal & Immutable Integrity**:
   - `createdAt` must equal `request.time` on `create` and remain immutable on `update`.
   - `updatedAt` must equal `request.time` on `create` and `update`.
   - `userId` and `id` are immutable on `update`.
7. **Terminal State Locking**:
   - Once a `Booking` reaches `status == 'completed'` or `status == 'cancelled'`, no further updates are permitted (unless `isAdmin()`).

---

## 2. The "Dirty Dozen" Payloads

1. **Payload 1 (Non-Admin Service Creation / Pricing Tamper)**: Authenticated non-admin user (`user@example.com`) attempts to `create` or `update` `/services/foam-jet` to change `basePriceInr: 1`. -> `PERMISSION_DENIED`
2. **Payload 2 (Unverified Admin Email Spoof)**: User with `email: "coolbrosacservice@gmail.com"` but `email_verified: false` attempts to modify `/services/foam-jet`. -> `PERMISSION_DENIED`
3. **Payload 3 (Shadow Field Injection on Create)**: Payload on `/services/foam-jet` or `/bookings/booking_03` includes all required keys plus `"isAdminOverride": true`. -> `PERMISSION_DENIED`
4. **Payload 4 (PII Cross-Tenant Read / Blanket List)**: Non-admin `user_A` attempts to `get` or `list` a booking or message belonging to `user_B`. -> `PERMISSION_DENIED`
5. **Payload 5 (ID Poisoning Attack)**: Creating a service, booking, or message with document ID containing spaces or special characters (`srv$123!`) or exceeding 128 chars. -> `PERMISSION_DENIED`
6. **Payload 6 (Phone Format / Volumetric Overflow)**: Creating a message with `senderPhone: "abc-invalid"` or a 5,000-character `messageText`. -> `PERMISSION_DENIED`
7. **Payload 7 (Client Timestamp Forgery)**: Creating a service or reminder with a past or future client-supplied timestamp (`createdAt != request.time`). -> `PERMISSION_DENIED`
8. **Payload 8 (Terminal State Mutation)**: Attempting to update a booking whose existing `status` is `'completed'` or `'cancelled'` as a standard user. -> `PERMISSION_DENIED`
9. **Payload 9 (Unauthorized Field Mutation on Service Update)**: Admin attempting to mutate `id` or `createdAt` during an update on `/services/{serviceId}`. -> `PERMISSION_DENIED`
10. **Payload 10 (Immutable `createdAt` or `userId` Tampering)**: Attempting to modify `createdAt` or `userId` during an update on `/reminders/{reminderId}`. -> `PERMISSION_DENIED`
11. **Payload 11 (Invalid Category / Enum Injection)**: Setting `category` on `/services/{serviceId}` to `"hacked-category"` or `deliverables` to an empty array `[]` or `> 6` items. -> `PERMISSION_DENIED`
12. **Payload 12 (Out-of-Bounds Pricing Values)**: Admin attempting to set `basePriceInr: -500` or `basePriceInr: 9999999` on `/services/{serviceId}`. -> `PERMISSION_DENIED`
