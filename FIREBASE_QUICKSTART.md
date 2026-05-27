# Firebase Quick Start Guide

## Step 1: Set Up Firebase Project

### 1.1 Create Project in Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Name it "kira-initiative"
4. Continue through setup wizard

### 1.2 Get Service Account Key
1. Go to **Project Settings** → **Service Accounts**
2. Click **Generate New Private Key**
3. Save as `firebase-service-account.json` at project root
4. ⚠️ **DO NOT commit this file** - Add to `.gitignore`

### 1.3 Enable Services
- ✅ Firestore Database
- ✅ Firebase Authentication
- ✅ Firebase Storage
- ✅ Cloud Functions (optional)

---

## Step 2: Configure Environment

### 2.1 Copy `.env.example` to `.env`
```bash
cp .env.example .env
```

### 2.2 Add Firebase Credentials

**Option A: Using Service Account File** (Recommended for Development)
```env
FIREBASE_SERVICE_ACCOUNT_KEY=./firebase-service-account.json
```

**Option B: Using Environment Variables** (Better for Production)
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-key-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=your-service@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
```

---

## Step 3: Install Dependencies

```bash
cd server
npm install firebase-admin
```

---

## Step 4: Update Server Code

### 4.1 Update `server/index.js` - Add Firebase Initialization
```javascript
import 'dotenv/config';
import express from 'express';
import { initializeFirebase } from './utils/firebase.js';  // ADD THIS
import authRoutes from './routes/auth-firebase.js';       // ADD THIS

// Initialize Firebase FIRST
initializeFirebase();  // ADD THIS

const app = express();
// ... rest of your setup

// Use new auth routes
app.use('/api/auth', authRoutes);  // Change from old auth routes
```

### 4.2 Update `server/package.json` - Remove Prisma
```json
{
  "scripts": {
    "dev": "node --env-file=../.env --watch index.js",
    "start": "node --env-file=../.env index.js"
    // Remove: "db:migrate", "db:deploy", "db:seed", etc.
  },
  "dependencies": {
    // Remove: "@prisma/client"
    // Add: "firebase-admin"
  }
}
```

---

## Step 5: Set Up Firestore Collections

Create these collections in Firestore (leave empty for now):
- `users`
- `sessions`
- `appointments`
- `consultations`
- `prescriptions`
- `scans`
- `doctors`
- `hospitals`
- `feed`

---

## Step 6: Update Client-Side Auth

### 6.1 Install Firebase SDK
```bash
cd client
npm install firebase
```

### 6.2 Update `src/hooks/useAuth.js`
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export function useAuth() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          token,
          displayName: firebaseUser.displayName,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return {
    user,
    loading,
    signup: (email, password) => createUserWithEmailAndPassword(auth, email, password),
    login: (email, password) => signInWithEmailAndPassword(auth, email, password),
    logout: () => signOut(auth),
  };
}
```

### 6.3 Update API Calls to Include Token
```javascript
// In src/lib/api.js
async function apiCall(endpoint, options = {}) {
  const { user } = useAuth();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(user?.token && { 'Authorization': `Bearer ${user.token}` }),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  return response.json();
}
```

### 6.4 Add to `client/.env.local`
```env
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

---

## Step 7: Test the Setup

### 7.1 Start Server
```bash
cd server
npm run dev
```

### 7.2 Test Signup
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"John Doe","role":"patient"}'
```

### 7.3 Get ID Token (from Firebase Console → Authentication → User)
```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

---

## Step 8: Migrate Existing Data (Optional)

If you have existing PostgreSQL data, export it and import to Firestore:

```bash
# Export from Postgres
pg_dump -U user -d kira > backup.sql

# Create migration script to convert SQL to Firestore
node scripts/migrate-to-firestore.js
```

---

## Security Rules for Firestore

Copy this to **Firestore Rules** in Firebase Console:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Sessions accessible by involved users
    match /sessions/{sessionId} {
      allow read: if request.auth.uid in resource.data.participantIds;
      allow write: if request.auth.uid in resource.data.participantIds;
    }

    // Appointments accessible by doctor or patient
    match /appointments/{appointmentId} {
      allow read, write: if request.auth.uid in [resource.data.doctorId, resource.data.patientId];
    }

    // Prescriptions - patient can read, doctor can write
    match /prescriptions/{prescriptionId} {
      allow read: if request.auth.uid == resource.data.patientId;
      allow write: if request.auth.uid == resource.data.doctorId;
    }

    // Public feed
    match /feed/{document=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

---

## Troubleshooting

### Error: "Can't reach database server at localhost:5432"
✅ **Fix**: You're still using Prisma. Update to use Firestore instead.

### Error: "Firebase credentials not found"
✅ **Fix**: Ensure `FIREBASE_SERVICE_ACCOUNT_KEY` or env variables are set.

### Error: "Permission denied" when accessing Firestore
✅ **Fix**: Check Firestore Security Rules. Start with permissive rules during development.

### Error: "Invalid ID token"
✅ **Fix**: Ensure token is fresh. Firebase tokens expire after 1 hour.

---

## Next: Migrate Other Features

Once auth is working:
1. Migrate Appointments
2. Migrate Sessions  
3. Migrate Consultations
4. Migrate Prescriptions
5. Update real-time features (Socket.io or Firebase Realtime DB)

See `FIREBASE_MIGRATION_GUIDE.md` for detailed migration steps.
