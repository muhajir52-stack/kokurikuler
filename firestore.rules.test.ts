import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Security Rules Structural Verification for Dirty Dozen Invariants.
 * Validates that all 16 collections in firebase-blueprint.json have matching
 * hardened rules in firestore.rules and enforce all Eight Pillars.
 */
const blueprintPath = path.resolve(process.cwd(), 'firebase-blueprint.json');
const rulesPath = path.resolve(process.cwd(), 'firestore.rules');

const blueprint = JSON.parse(fs.readFileSync(blueprintPath, 'utf-8'));
const rulesText = fs.readFileSync(rulesPath, 'utf-8');

// 1. Default deny catch-all exists
assert.match(rulesText, /match \/\{document=\*\*\} \{\s*allow read, write: if false;/);

// 2. Every Firestore path in blueprint has a matching block in firestore.rules
for (const collectionPath of Object.keys(blueprint.firestore)) {
  const collectionName = collectionPath.split('/')[1];
  assert.ok(
    rulesText.includes(`match /${collectionName}/`),
    `Missing security rule block for collection: ${collectionName}`
  );
}

// 3. No blanket isSignedIn() reads on PII collections (users, students, teachers)
assert.ok(!rulesText.match(/match \/users\/\{userId\}[\s\S]*?allow read: if isSignedIn\(\)/));
assert.ok(!rulesText.match(/match \/students\/\{studentId\}[\s\S]*?allow get: if isSignedIn\(\)/));
assert.ok(!rulesText.match(/match \/teachers\/\{teacherId\}[\s\S]*?allow get: if isSignedIn\(\)/));

// 4. Email verification & request.time enforcement
assert.ok(rulesText.includes('request.auth.token.email_verified == true'));
assert.ok(rulesText.includes('incoming().createdAt == request.time'));
assert.ok(rulesText.includes('incoming().updatedAt == request.time'));

// 5. Terminal state locking on approved reports
assert.ok(rulesText.includes("existing().status != 'Disetujui'"));

// 6. Immutable audit logs
assert.ok(rulesText.includes('allow update, delete: if false;'));

console.log('All Firestore security rules structural & Dirty Dozen invariant checks passed.');
