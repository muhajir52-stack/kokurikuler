# Security Specification & Payload-First TDD

## 1. Data Invariants
1. **Identity & Privilege Invariant**: A user cannot self-assign `SUPER_ADMIN`, `KEPALA_SEKOLAH`, `KETUA_PELAKSANA`, or `GURU_PENDAMPING` roles during `users` document creation unless verified as the bootstrapped administrator (`muhajir52@guru.sma.belajar.id` with `email_verified == true`), created by an existing `SUPER_ADMIN`, or matching an existing `user_invites` document.
2. **Temporal Integrity Invariant**: All `createdAt` fields must equal `request.time` on creation and remain immutable on updates; all `updatedAt` fields must equal `request.time` on both creation and update.
3. **PII Isolation Invariant**: Personal contact data (`users` email/phone, `students` parentPhone) cannot be read by unauthenticated users or `SISWA` accounts belonging to other users.
4. **Relational Existence Invariant**: All activity child documents (`students`, `teachers`, `activity_participants`, `activity_schedules`, `activity_journals`, `activity_documentation`, `student_reflections`, `activity_evaluations`, `activity_reports`, `digital_archives`, `approvals`) must reference an existing parent document in `/activities/{activityId}`.
5. **Terminal State Locking Invariant**: Once an `activity_reports` document reaches `status == 'Disetujui'`, non-admin edits are rejected unless unlocked by `KEPALA_SEKOLAH` or `SUPER_ADMIN`.
6. **Student Reflection Ownership Invariant**: A `SISWA` can only create/update their own `student_reflections` (`studentUid == request.auth.uid`) and cannot modify `teacherScore`, `teacherFeedback`, `reviewStatus`, `reviewedByUid`, or `reviewedByName`.

## 2. The "Dirty Dozen" Attack Payloads (Must Return PERMISSION_DENIED)
1. **Privilege Escalation**: Uninvited student creates `/users/{uid}` with `role: "SUPER_ADMIN"`.
2. **Unverified Email Spoofing**: Request with matching admin email where `request.auth.token.email_verified == false`.
3. **Shadow Field Injection**: Creating `/students/{id}` with an extra undocumented field `isAdminApproved: true`.
4. **Timestamp Forgery**: Creating `/activity_journals/{id}` with backdated client timestamp `createdAt` != `request.time`.
5. **Immortal Field Mutation**: Updating `/student_reflections/{id}` and altering `studentUid` or `createdAt`.
6. **Self-Grading Reflection**: Student updating their own `/student_reflections/{id}` with `teacherScore: 100`.
7. **Orphaned Record Injection**: Creating `/activity_schedules/{id}` referencing nonexistent `activityId: "fake-activity-999"`.
8. **ID Poisoning**: Creating `/teachers/{1500_char_id}` exceeding 128 characters or containing invalid symbols.
9. **Resource Exhaustion (1MB String)**: Creating `/activities/{id}` with a 50,000-character `background` field exceeding `maxLength: 5000`.
10. **PII Blanket Read**: Student account attempting `get` or `list` on `/students` containing `parentPhone`.
11. **Terminal State Bypass**: Ketua Pelaksana attempting to edit `/activity_reports/{id}` after `status == 'Disetujui'`.
12. **Audit Log Tampering**: Any user attempting to `update` or `delete` an immutable `/audit_logs/{id}` entry.
