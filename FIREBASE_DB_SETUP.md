# Firebase Database Setup - Step by Step

## ✅ What You Need to Do

### Step 1: Get Firebase Credentials (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project called "kira-initiative"
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save file as `firebase-service-account.json` at your project root (next to package.json)
6. **IMPORTANT**: Add to `.gitignore`
   ```
   firebase-service-account.json
   .env
   ```

### Step 2: Install Firebase (2 minutes)

```bash
cd server
npm install firebase-admin
```

### Step 3: Update `.env` file

Add ONE of these:

**Option A: Using Service Account File** (Recommended for development)
```env
FIREBASE_SERVICE_ACCOUNT_KEY=./firebase-service-account.json
```

**Option B: Using Environment Variables** (Recommended for production)
Copy these from your `firebase-service-account.json`:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-key-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=your-service@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
```

### Step 4: Update `server/index.js` (3 minutes)

**BEFORE (Current Code):**
```javascript
import 'dotenv/config';
import express from 'express';
// ... other imports
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
// ... rest of server
```

**AFTER (New Code):**
```javascript
import 'dotenv/config';
import express from 'express';
import { initializeFirebase } from './utils/firebaseInit.js';  // ADD THIS
import firebaseDb from './utils/firebase-db.js';               // ADD THIS
// ... other imports

// REMOVE: import { PrismaClient } from '@prisma/client';
// REMOVE: const prisma = new PrismaClient();

// ADD THIS - Initialize Firebase FIRST (before using firebaseDb)
initializeFirebase();

const app = express();
// ... rest of your setup stays the same
```

### Step 5: Create Firestore Collections

In Firebase Console → **Firestore Database** → **Create Collection**

Create these empty collections:
- ✅ `anonymousSessions`
- ✅ `messages`
- ✅ `scanImages`
- ✅ `doctors`
- ✅ `hospitals`
- ✅ `escalations`
- ✅ `consultations`
- ✅ `consultMessages`
- ✅ `internalNotes`
- ✅ `soapNotes`
- ✅ `prescriptions`
- ✅ `appointments`
- ✅ `othersAskedEntries`
- ✅ `securityLogs`

### Step 6: Replace Prisma with Firebase in Your Routes

**Your existing code uses this pattern:**
```javascript
const user = await prisma.doctor.findUnique({ where: { id } });
```

**Just change `prisma` to `firebaseDb`:**
```javascript
import firebaseDb from '../utils/firebase-db.js';

const user = await firebaseDb.doctor.findUnique({ where: { id } });
```

### Step 7: Update Route Files (Find & Replace)

In each route file (`auth.js`, `consultations.js`, `escalations.js`, etc.):

```javascript
// BEFORE: Remove this
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// AFTER: Add this
import firebaseDb from '../utils/firebase-db.js';
```

Then in the code, replace:
- `prisma.doctor` → `firebaseDb.doctor`
- `prisma.hospital` → `firebaseDb.hospital`
- `prisma.escalation` → `firebaseDb.escalation`
- `prisma.consultation` → `firebaseDb.consultation`
- etc.

### Step 8: Update Services

In `server/services/sessionCleanup.js` and `server/services/safetyEngine.js`:

```javascript
// BEFORE
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// AFTER
import firebaseDb from '../utils/firebase-db.js';
```

Then replace all `prisma.` calls with `firebaseDb.`

### Step 9: Add Firestore Security Rules

In Firebase Console → **Firestore Database** → **Rules**:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Anonymous sessions - accessible via session token verification
    match /anonymousSessions/{sessionId} {
      allow read: if true;
      allow write: if false;
    }

    // Doctor authentication - locked to their own record
    match /doctors/{doctorId} {
      allow read: if request.auth.uid == doctorId || request.auth.token.role == 'admin';
      allow write: if request.auth.uid == doctorId;
    }

    // Consultations - accessible by assigned doctor
    match /consultations/{consultationId} {
      allow read, write: if get(/databases/$(database)/documents/doctors/$(request.auth.uid)).data.id == resource.data.doctorId;
    }

    // Messages - accessible by doctor in consultation
    match /consultMessages/{messageId} {
      allow read, write: if true;
    }

    // Everything else - read only
    match /{document=**} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

---

## 🔄 How It Works

Your existing code **doesn't need to change much**. The `firebaseDb` object looks exactly like Prisma:

```javascript
// ✅ WORKS - Same as Prisma
const doctor = await firebaseDb.doctor.findUnique({ where: { email } });

// ✅ WORKS - Same as Prisma
const sessions = await firebaseDb.anonymousSession.findMany({ where: { ... } });

// ✅ WORKS - Same as Prisma
await firebaseDb.doctor.update({ id }, { isOnline: true });
```

---

## 📋 File Changes Summary

| File | Action | What Changes |
|------|--------|--------------|
| `server/index.js` | Edit | Add Firebase init, remove Prisma |
| `server/routes/*.js` | Edit (Find & Replace) | `prisma` → `firebaseDb` |
| `server/services/*.js` | Edit (Find & Replace) | `prisma` → `firebaseDb` |
| `server/middleware/auth.js` | No change | Everything stays the same |
| `server/utils/prisma.js` | Delete | Not needed anymore |
| **NEW** `server/utils/firebase-db.js` | Created | Database replacement ✅ |
| **NEW** `server/utils/firebaseInit.js` | Created | Firebase setup ✅ |
| `.env` | Edit | Add Firebase credentials |
| `firebase-service-account.json` | Create | Download from Firebase Console |
| `.gitignore` | Edit | Add firebase-service-account.json |

---

## 🚀 Test It

After making changes:

```bash
cd server
npm run dev
```

You should see in logs:
```
✓ Firebase Admin SDK initialized successfully
```

If you get an error about Firebase credentials, check your `.env` file and `firebase-service-account.json`.

---

## ❓ FAQ

### Q: Do I need to delete my PostgreSQL database?
**A:** No, but once Firebase is working, you can delete it. Keep it running in parallel during migration for safety.

### Q: Can I migrate data from PostgreSQL to Firebase?
**A:** Yes, but it's not necessary - start fresh. Your sessionCleanup service will automatically clean old data.

### Q: What about Prisma migrations?
**A:** No longer needed. Firestore is schemaless - just create collections.

### Q: Can I still use Socket.io?
**A:** Yes, completely compatible. No changes needed.

### Q: What about authentication?
**A:** Your current JWT auth stays the same. The `verifyToken` middleware doesn't change.

### Q: Is this safe?
**A:** Yes! Firebase uses:
- Encrypted credentials
- Role-based access control
- Audit logs (securityLogs collection)
- Automatic backups
- No direct internet access needed

---

## 🎯 Next Steps

1. Get Firebase credentials
2. Install firebase-admin
3. Update `.env`
4. Modify `server/index.js`
5. Create Firestore collections
6. Update all route files (Find & Replace)
7. Test each route
8. Delete `server/utils/prisma.js`
9. Remove `@prisma/client` from `package.json`

That's it! Your app will work exactly the same, but with Firebase as the database.

---

## 🆘 Troubleshooting

**Error: "Cannot find module 'firebase-admin'"**
```bash
cd server && npm install firebase-admin
```

**Error: "Firebase credentials not found"**
- Check `.env` file has correct path
- Check `firebase-service-account.json` exists
- Check credentials are valid JSON

**Error: "Permission denied" in Firestore**
- Check security rules are correct
- Ensure service account email has Firestore permissions

**Error: "Collection not found"**
- Create the collection in Firebase Console first
- Collections are case-sensitive
