# Firebase Implementation Checklist

Complete these steps in order to migrate your database to Firebase.

---

## Phase 1: Firebase Setup (30 minutes)

- [ ] Create Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
- [ ] Go to **Project Settings** → **Service Accounts** → **Generate New Private Key**
- [ ] Save as `firebase-service-account.json` in project root
- [ ] Add to `.gitignore`:
  ```
  firebase-service-account.json
  ```
- [ ] Add to `.env`:
  ```
  FIREBASE_SERVICE_ACCOUNT_KEY=./firebase-service-account.json
  ```

---

## Phase 2: Install Dependencies (5 minutes)

- [ ] Run in `server/` directory:
  ```bash
  npm install firebase-admin
  ```

---

## Phase 3: Firestore Setup (10 minutes)

In Firebase Console → **Firestore Database**:

- [ ] Click **Create Database**
- [ ] Choose **Production mode** 
- [ ] Select your region (closest to you)
- [ ] Create these empty collections:
  - [ ] `anonymousSessions`
  - [ ] `messages`
  - [ ] `scanImages`
  - [ ] `doctors`
  - [ ] `hospitals`
  - [ ] `escalations`
  - [ ] `consultations`
  - [ ] `consultMessages`
  - [ ] `internalNotes`
  - [ ] `soapNotes`
  - [ ] `prescriptions`
  - [ ] `appointments`
  - [ ] `othersAskedEntries`
  - [ ] `securityLogs`

---

## Phase 4: Code Updates (45 minutes)

### Step 1: Update `server/index.js`
- [ ] Add Firebase import at top:
  ```javascript
  import { initializeFirebase } from './utils/firebaseInit.js';
  ```
- [ ] Add Firebase init right after imports:
  ```javascript
  initializeFirebase();
  ```
- [ ] Remove Prisma imports and instantiation

### Step 2: Update Route Files (Find & Replace)
For each file in `server/routes/`:
- [ ] `auth.js`
  - [ ] Remove Prisma import
  - [ ] Add: `import firebaseDb from '../utils/firebase-db.js';`
  - [ ] Replace `prisma.` with `firebaseDb.`
  
- [ ] `escalations.js`
  - [ ] Remove Prisma import
  - [ ] Add: `import firebaseDb from '../utils/firebase-db.js';`
  - [ ] Replace `prisma.` with `firebaseDb.`
  
- [ ] `consultations.js`
  - [ ] Remove Prisma import
  - [ ] Add: `import firebaseDb from '../utils/firebase-db.js';`
  - [ ] Replace `prisma.` with `firebaseDb.`
  
- [ ] `scans.js`
  - [ ] Remove Prisma import
  - [ ] Add: `import firebaseDb from '../utils/firebase-db.js';`
  - [ ] Replace `prisma.` with `firebaseDb.`
  
- [ ] `sessions.js`
  - [ ] Remove Prisma import
  - [ ] Add: `import firebaseDb from '../utils/firebase-db.js';`
  - [ ] Replace `prisma.` with `firebaseDb.`
  
- [ ] `appointments.js`
  - [ ] Remove Prisma import
  - [ ] Add: `import firebaseDb from '../utils/firebase-db.js';`
  - [ ] Replace `prisma.` with `firebaseDb.`
  
- [ ] `doctors.js`
  - [ ] Remove Prisma import
  - [ ] Add: `import firebaseDb from '../utils/firebase-db.js';`
  - [ ] Replace `prisma.` with `firebaseDb.`
  
- [ ] `hospitals.js`
  - [ ] Remove Prisma import
  - [ ] Add: `import firebaseDb from '../utils/firebase-db.js';`
  - [ ] Replace `prisma.` with `firebaseDb.`
  
- [ ] `prescriptions.js`
  - [ ] Remove Prisma import
  - [ ] Add: `import firebaseDb from '../utils/firebase-db.js';`
  - [ ] Replace `prisma.` with `firebaseDb.`
  
- [ ] `feed.js`
  - [ ] Remove Prisma import
  - [ ] Add: `import firebaseDb from '../utils/firebase-db.js';`
  - [ ] Replace `prisma.` with `firebaseDb.`
  
- [ ] `admin.js`
  - [ ] Remove Prisma import
  - [ ] Add: `import firebaseDb from '../utils/firebase-db.js';`
  - [ ] Replace `prisma.` with `firebaseDb.`

### Step 3: Update Service Files
- [ ] `server/services/safetyEngine.js`
  - [ ] Remove Prisma import
  - [ ] Add: `import firebaseDb from '../utils/firebase-db.js';`
  - [ ] Replace all `prisma.` with `firebaseDb.`

- [ ] `server/services/sessionCleanup.js`
  - [ ] Remove Prisma import
  - [ ] Add: `import firebaseDb from '../utils/firebase-db.js';`
  - [ ] Replace all `prisma.` with `firebaseDb.`

---

## Phase 5: Testing (30 minutes)

- [ ] Start server:
  ```bash
  cd server
  npm run dev
  ```

- [ ] Check console shows:
  ```
  ✓ Firebase Admin SDK initialized successfully
  ```

- [ ] Test each endpoint:
  - [ ] Doctor signup works
  - [ ] Doctor login works
  - [ ] Anonymous session creation works
  - [ ] Escalation creation works
  - [ ] Consultation creation works
  - [ ] Messages can be sent
  - [ ] Can view appointments

- [ ] Check Firestore Console - data should appear in collections

---

## Phase 6: Cleanup (10 minutes)

- [ ] Delete `server/utils/prisma.js`
- [ ] Delete `server/prisma/` folder (or keep for reference)
- [ ] Update `server/package.json`:
  - [ ] Remove `@prisma/client` from dependencies
  - [ ] Remove `prisma` from devDependencies
  - [ ] Run: `npm install`

- [ ] Remove from `.env`:
  - [ ] Remove `DATABASE_URL` (PostgreSQL connection)

- [ ] Optional: Stop PostgreSQL service if not needed

---

## Phase 7: Set Firestore Security Rules

In Firebase Console → **Firestore Database** → **Rules**:

- [ ] Click **Edit Rules**
- [ ] Replace with this:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow service account (backend) full access
    // This is handled by Firebase Admin SDK authentication
    
    // Anonymous sessions
    match /anonymousSessions/{sessionId} {
      allow read, write: if true;
    }

    // Messages in sessions
    match /messages/{messageId} {
      allow read, write: if true;
    }

    // Scan images
    match /scanImages/{scanId} {
      allow read, write: if true;
    }

    // Doctors - locked to their own data
    match /doctors/{doctorId} {
      allow read: if request.auth.uid == doctorId || request.auth.token.role == 'admin';
      allow write: if request.auth.uid == doctorId;
    }

    // Default: Allow backend operations, deny frontend
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

- [ ] Click **Publish**

---

## Verification Checklist

After completing all steps:

- [ ] ✅ Firebase credentials loaded successfully
- [ ] ✅ All 14 Firestore collections created
- [ ] ✅ Server starts without errors
- [ ] ✅ Doctor signup creates record in Firestore
- [ ] ✅ Doctor login works
- [ ] ✅ Patient sessions work
- [ ] ✅ Escalations are saved
- [ ] ✅ Consultations are saved
- [ ] ✅ Messages are saved
- [ ] ✅ All existing features work the same

---

## Troubleshooting

### Error: "Firebase credentials not found"
```
✓ Check firebase-service-account.json exists
✓ Check .env has correct path
✓ Check JSON file is valid
✓ Restart server after changing .env
```

### Error: "Collection not found"
```
✓ Create the collection in Firebase Console
✓ Collection names are case-sensitive
✓ Must match exactly: anonymousSessions (not anonymousessions)
```

### Error: "Permission denied"
```
✓ Check Security Rules are set correctly
✓ Backend uses service account (not frontend user)
✓ Service account has Firestore permissions
```

### App still works but data isn't saving
```
✓ Check Firestore rules allow writes
✓ Check error logs for specific issues
✓ Verify each route was updated (all prisma → firebaseDb)
```

---

## Rollback Plan

If something breaks:

```bash
# Revert one file
git checkout server/routes/auth.js

# Revert all
git checkout .

# Restart
npm run dev
```

---

## Performance Tips

- [ ] Enable Firestore indexes for common queries
- [ ] Use pagination with `limit` in your queries
- [ ] Archive old sessions periodically
- [ ] Monitor Firestore usage in Firebase Console

---

## Next Steps (Optional)

After database is working:

- [ ] Set up Firebase Storage for file uploads
- [ ] Set up Firebase Cloud Functions for serverless tasks
- [ ] Migrate to Firebase Authentication (optional)
- [ ] Set up Firebase Realtime Database for Socket.io data
- [ ] Configure automatic backups

---

## Success! 🎉

Your app is now using Firebase as the database. All data is:
- ✅ Automatically backed up
- ✅ Encrypted in transit and at rest
- ✅ Accessible with proper authentication
- ✅ Scalable globally
- ✅ Secure with Firebase admin SDK

Enjoy your fully Firebase-powered app!
