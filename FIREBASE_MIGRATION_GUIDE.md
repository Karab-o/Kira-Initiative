# Firebase Migration Guide for Kira Initiative

## Phase 1: Setup Firebase Project

### Step 1: Create Firebase Project
```bash
npm install -g firebase-tools
firebase login
firebase init
```

Select:
- ✅ Firestore
- ✅ Authentication
- ✅ Cloud Functions
- ✅ Hosting
- ✅ Storage

### Step 2: Install Firebase Dependencies
```bash
cd server
npm install firebase-admin
npm install @firebase/app @firebase/firestore @firebase/auth
```

---

## Phase 2: Replace Database (Prisma → Firestore)

### Current: Prisma Model Example
```javascript
// prisma/schema.prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  name      String
  createdAt DateTime  @default(now())
}
```

### New: Firestore Structure
```javascript
// services/firestore.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Create user document
export async function createUser(userId, userData) {
  await setDoc(doc(db, 'users', userId), {
    ...userData,
    createdAt: new Date(),
  });
}

// Get user document
export async function getUser(userId) {
  const userDoc = await getDoc(doc(db, 'users', userId));
  return userDoc.exists() ? userDoc.data() : null;
}
```

---

## Phase 3: Replace Authentication (JWT → Firebase Auth)

### Remove JWT Logic
```bash
# You can remove these utilities:
# - server/utils/jwt.js
# - server/utils/hash.js
```

### New: Firebase Authentication Middleware
```javascript
// middleware/firebaseAuth.js
import { getAuth } from 'firebase-admin/auth';

export async function verifyFirebaseToken(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token', details: error.message });
  }
}
```

### Update Auth Route
```javascript
// routes/auth.js (Firebase version)
import { getAuth } from 'firebase-admin/auth';
import { createUser, getUser } from '../services/firestore.js';

export async function signup(req, res) {
  const { email, password, name } = req.body;

  try {
    // Create Firebase user
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName: name,
    });

    // Store additional data in Firestore
    await createUser(userRecord.uid, {
      email,
      name,
      role: 'patient',
      createdAt: new Date(),
    });

    res.json({ uid: userRecord.uid, email });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

export async function login(req, res) {
  // Firebase handles login on frontend
  // Backend just verifies the token
  res.json({ message: 'Use Firebase Auth on frontend' });
}
```

---

## Phase 4: Migrate Database Schema

### Mapping Tables → Collections

| Prisma Table | Firestore Collection | Notes |
|------------|-------------------|-------|
| User | `users/{userId}` | userId = Firebase UID |
| Session | `sessions/{sessionId}` | Real-time with Realtime DB |
| Appointment | `appointments/{appointmentId}` | Query by doctor/patient |
| Consultation | `consultations/{consultationId}` | Sub-collection structure |
| Prescription | `prescriptions/{prescriptionId}` | |

### Example Collection Structure
```
firestore
├── users/
│   └── {userId}
│       ├── email
│       ├── name
│       ├── role (doctor/patient)
│       └── profile
├── sessions/
│   └── {sessionId}
│       ├── patientId
│       ├── doctorId
│       ├── status
│       └── messages (sub-collection)
├── appointments/
│   └── {appointmentId}
│       ├── doctorId
│       ├── patientId
│       ├── time
│       └── status
└── consultations/
    └── {consultationId}
        ├── patientId
        ├── doctorId
        └── notes
```

---

## Phase 5: Update .env File

### Remove PostgreSQL
```bash
# OLD - DELETE
DATABASE_URL=postgresql://user:password@localhost:5432/kira

# NEW - ADD
FIREBASE_API_KEY=xxx
FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
FIREBASE_PROJECT_ID=xxx
FIREBASE_STORAGE_BUCKET=xxx.appspot.com
FIREBASE_MESSAGING_SENDER_ID=xxx
FIREBASE_APP_ID=xxx
```

---

## Phase 6: Real-time Updates (Socket.io → Firebase)

### Option A: Keep Socket.io
```javascript
// No changes needed - Socket.io still works with Firebase
```

### Option B: Use Firebase Realtime Database
```javascript
// services/realtimeDb.js
import { getDatabase, ref, set, onValue } from 'firebase/database';

const rtdb = getDatabase(app);

export function listenToSession(sessionId, callback) {
  const sessionRef = ref(rtdb, `sessions/${sessionId}`);
  onValue(sessionRef, (snapshot) => {
    callback(snapshot.val());
  });
}
```

---

## Phase 7: Update Client-Side Auth

### Replace Auth Hook
```javascript
// src/hooks/useAuth.js (Firebase version)
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

const firebaseConfig = { /* ... */ };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        setUser({ uid: firebaseUser.uid, email: firebaseUser.email, token });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
}
```

---

## Phase 8: Deployment

### Deploy to Firebase
```bash
# Initialize hosting
firebase init hosting

# Deploy
firebase deploy --only functions,firestore
```

### Alternative: Deploy Express to Cloud Run
```bash
# If using Hybrid approach
gcloud run deploy kira-api --source .
```

---

## Migration Checklist

- [ ] Create Firebase project
- [ ] Install Firebase dependencies
- [ ] Replace Prisma with Firestore
- [ ] Replace JWT with Firebase Auth
- [ ] Migrate database to Firestore
- [ ] Update .env variables
- [ ] Update server routes
- [ ] Update client auth hooks
- [ ] Test all API endpoints
- [ ] Deploy to Firebase

---

## Which Approach Should You Choose?

| Criteria | Full Firebase | Hybrid (Express + Firestore) |
|----------|--------------|-----|
| **Setup Time** | 1 day | 2-3 days |
| **Maintenance** | Minimal | More |
| **Cost** | Low | Medium |
| **Performance** | Good | Excellent |
| **Real-time** | Built-in | Needs Socket.io |
| **Best For** | MVPs, rapid dev | Production, scaling |

---

## Next Steps

1. **Choose your approach** (Full Firebase or Hybrid)
2. **Create Firebase project** and get credentials
3. **Start with one feature** (e.g., authentication)
4. **Test thoroughly** before migrating others
5. **Keep both systems running** during transition (blue-green deployment)
