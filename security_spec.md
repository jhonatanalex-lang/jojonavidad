# Security Specification — Navidad Secreta (Firestore)

## 1. Data Invariants
1. **No Unauthenticated Access**: Every read/write on `groups`, `members`, `wishes`, and `wishPhotos` requires an active Firebase Auth session (`request.auth != null`, via automatic Anonymous Auth or verified Google Auth). Admin privileges strictly require `request.auth.token.email_verified == true`.
2. **Group Integrity**:
   - On `create` of `groups/{groupCode}`: `code == groupCode`, `creatorUid == request.auth.uid`, `expectedMembers` is an integer between 2 and 100.
   - Only the group creator (`creatorUid == request.auth.uid`) or Admin can update (`name`, `expectedMembers`, `updatedAt`) or delete a group, and only the creator can `list` their created groups (`where('creatorUid', '==', uid)`).
   - Any authenticated session that knows the exact `groupCode` can `get` `/groups/{groupCode}` to join (and `resource == null` is permitted for existence checks).
3. **Ownership & Identity Integrity**:
   - On `create` of `members`: `ownerUid == request.auth.uid` (or `ownerUid == 'UNCLAIMED'` only when `isAdmin()` or `isGroupCreator(incoming().familyCode)`).
   - On `create` of `wishes`: `ownerUid == request.auth.uid` and the referenced `/members/{memberId}` document MUST exist (`exists(...)`), and if `isAdmin()` is false, the member's `ownerUid == request.auth.uid`.
   - On `create` of `wishPhotos`: `ownerUid == request.auth.uid` and `dataUrl.size() <= 350000`.
4. **Immutability**: `createdAt`, `familyCode`, and `memberId` never change on `update`. `ownerUid` on `wishes` and `wishPhotos` never changes; on `members`, `ownerUid` can only transition from `'UNCLAIMED'` to `request.auth.uid`. On `groups`, `code` and `creatorUid` never change.
5. **Tiered Updates**:
   - Wish owners / Admin can edit wish details (`title`, `description`, `productUrl`, `linkTitle`, `linkImage`, `linkSite`, `linkDesc`, `linkPrice`, `photoId`, `reservedAnonymously`, `updatedAt`).
   - Other family participants can ONLY toggle `['reservedAnonymously', 'updatedAt']` on a wish.
6. **Temporal Integrity**: `createdAt == request.time` on create; `updatedAt == request.time` on create and update.
7. **No PII Stored**: No email, phone, or physical address is stored in `groups`, `members`, `wishes`, or `wishPhotos`.

## 2. Dirty Dozen Attack Payloads (All Must Return PERMISSION_DENIED)
1. Unauthenticated (`request.auth == null`) `get` / `list` on `/groups`, `/wishes`, or `/members`.
2. Creating a `/groups/{groupCode}` with mismatched `code != groupCode` or spoofed `creatorUid`.
3. Non-creator attempting to `list` all `/groups` without `creatorUid == request.auth.uid`, or updating another user's group `expectedMembers`.
4. Creating `/groups/{groupCode}` with `expectedMembers: 1` or `expectedMembers: 999` or shadow field `isOfficial: true`.
5. Spoofed admin token (`email == 'yiroku20@gmail.com'`, `email_verified: false`) attempting `Admin` privileges.
6. Spoofed `ownerUid` on `create` of `/wishes` (setting `ownerUid` to another user's UID).
7. Shadow field injection (`isAdmin: true` or `extraField: "hack"`) on `create` of `/members` or `/wishes`.
8. Poisoned oversized `title` (> 140 chars) or `description` (> 600 chars) or `memberId` (> 128 chars or invalid regex).
9. Forged `createdAt` or `updatedAt` timestamp not equal to `request.time`.
10. Non-owner attempting to edit `title` or `description` on another user's `/wishes/{wishId}`.
11. Non-admin / non-creator attempting to create an `'UNCLAIMED'` member slot in `/members/{memberId}`.
12. Uploading a `wishPhotos/{photoId}` exceeding 350,000 characters or creating a `/wishes/{wishId}` referencing a non-existent `/members/{memberId}`.
