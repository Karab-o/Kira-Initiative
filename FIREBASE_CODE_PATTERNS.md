# Prisma/PostgreSQL → Firebase: Code Pattern Changes

## Database Operations

### ❌ OLD: Prisma
```javascript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create
await prisma.user.create({
  data: { email: 'user@example.com', name: 'John' }
});

// Read
const user = await prisma.user.findUnique({
  where: { id: userId }
});

// Query
const doctors = await prisma.user.findMany({
  where: { role: 'doctor' },
  take: 10
});

// Update
await prisma.user.update({
  where: { id: userId },
  data: { name: 'Jane' }
});

// Delete
await prisma.user.delete({
  where: { id: userId }
});
```

### ✅ NEW: Firebase Firestore
```javascript
import { db } from '../services/firestore.js';
import { collection, doc, setDoc, getDoc, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';

// Create
await setDoc(doc(db, 'users', userId), {
  email: 'user@example.com',
  name: 'John'
});

// Read
const userDoc = await getDoc(doc(db, 'users', userId));
const user = userDoc.exists() ? userDoc.data() : null;

// Query
const q = query(collection(db, 'users'), where('role', '==', 'doctor'));
const snapshot = await getDocs(q);
const doctors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).slice(0, 10);

// Update
await updateDoc(doc(db, 'users', userId), {
  name: 'Jane'
});

// Delete
await deleteDoc(doc(db, 'users', userId));
```

---

## Authentication

### ❌ OLD: JWT
```javascript
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';

// Signup
const hashedPassword = await bcryptjs.hash(password, 10);
await prisma.user.create({
  data: { email, passwordHash: hashedPassword }
});

// Login
const user = await prisma.user.findUnique({ where: { email } });
const isValid = await bcryptjs.compare(password, user.passwordHash);
const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

// Verify
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### ✅ NEW: Firebase Auth
```javascript
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import admin from 'firebase-admin';

// Firebase handles all auth internally
// Signup
await createUserWithEmailAndPassword(auth, email, password);

// Login
await signInWithEmailAndPassword(auth, email, password);

// Get token
const token = await user.getIdToken();

// Verify (server-side)
const decodedToken = await admin.auth().verifyIdToken(token);
```

---

## API Endpoint Changes

### ❌ OLD Pattern
```javascript
router.post('/api/users', async (req, res) => {
  try {
    const user = await prisma.user.create({
      data: req.body
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### ✅ NEW Pattern
```javascript
router.post('/api/users', verifyFirebaseToken, async (req, res) => {
  try {
    const userId = req.userId; // From Firebase token
    await setDoc(doc(db, 'users', userId), {
      ...req.body,
      createdAt: new Date()
    });
    res.json({ id: userId, ...req.body });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Session Management

### ❌ OLD: Database Sessions
```javascript
// Store session in database
const session = await prisma.anonymousSession.create({
  data: {
    sessionCode: generateCode(),
    patientId,
    doctorId,
    expiresAt: new Date(Date.now() + 3600000)
  }
});
```

### ✅ NEW: Firestore Sessions
```javascript
import { getDatabase, ref, set } from 'firebase/database';

// Option 1: Firestore
await setDoc(doc(db, 'sessions', sessionId), {
  sessionCode: generateCode(),
  patientId,
  doctorId,
  expiresAt: new Date(Date.now() + 3600000)
});

// Option 2: Realtime Database (better for real-time features)
const rtdb = getDatabase(app);
await set(ref(rtdb, `sessions/${sessionId}`), {
  sessionCode: generateCode(),
  patientId,
  doctorId,
  expiresAt: Date.now() + 3600000
});
```

---

## File Uploads

### ❌ OLD: Local Storage
```javascript
import multer from 'multer';

const upload = multer({ dest: './uploads' });

router.post('/api/upload', upload.single('file'), (req, res) => {
  res.json({ path: `/uploads/${req.file.filename}` });
});

// Serve files
app.use('/uploads', express.static('uploads'));
```

### ✅ NEW: Firebase Storage
```javascript
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const storage = getStorage(app);

router.post('/api/upload', async (req, res) => {
  const file = req.file;
  const storageRef = ref(storage, `uploads/${Date.now()}-${file.originalname}`);
  
  await uploadBytes(storageRef, file.buffer);
  const downloadURL = await getDownloadURL(storageRef);
  
  res.json({ url: downloadURL });
});
```

---

## Real-time Updates

### ❌ OLD: Socket.io Only
```javascript
io.on('connection', (socket) => {
  socket.on('message', (data) => {
    socket.broadcast.emit('message', data);
  });
});
```

### ✅ NEW: Firebase Realtime Listener
```javascript
import { onValue, ref } from 'firebase/database';

const messagesRef = ref(rtdb, `sessions/${sessionId}/messages`);
onValue(messagesRef, (snapshot) => {
  const messages = snapshot.val();
  // Update UI
  io.emit('messages-updated', messages);
});

// Or with Firestore
import { onSnapshot } from 'firebase/firestore';

const q = query(collection(db, 'messages'), where('sessionId', '==', sessionId));
onSnapshot(q, (snapshot) => {
  const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  io.emit('messages-updated', messages);
});
```

---

## Error Handling

### ❌ OLD: Prisma Errors
```javascript
try {
  await prisma.user.create({ data });
} catch (error) {
  if (error.code === 'P2002') {
    // Unique constraint
  }
}
```

### ✅ NEW: Firebase Errors
```javascript
try {
  await createUserWithEmailAndPassword(auth, email, password);
} catch (error) {
  if (error.code === 'auth/email-already-in-use') {
    // Email exists
  }
  if (error.code === 'auth/weak-password') {
    // Password too weak
  }
}
```

---

## Transactions

### ❌ OLD: Prisma Transactions
```javascript
await prisma.$transaction(async (tx) => {
  await tx.user.update({ where: { id: doctorId }, data: { balance } });
  await tx.payment.create({ data: paymentData });
});
```

### ✅ NEW: Firestore Transactions
```javascript
import { runTransaction } from 'firebase/firestore';

await runTransaction(db, async (transaction) => {
  transaction.update(doc(db, 'users', doctorId), { balance });
  transaction.set(doc(db, 'payments', paymentId), paymentData);
});
```

---

## Pagination

### ❌ OLD: Prisma
```javascript
const users = await prisma.user.findMany({
  skip: 0,
  take: 10,
  orderBy: { createdAt: 'desc' }
});
```

### ✅ NEW: Firestore
```javascript
import { query, collection, orderBy, limit, startAfter } from 'firebase/firestore';

const q = query(
  collection(db, 'users'),
  orderBy('createdAt', 'desc'),
  limit(10)
);

const snapshot = await getDocs(q);
const lastDoc = snapshot.docs[snapshot.docs.length - 1];

// Next page
const nextQ = query(
  collection(db, 'users'),
  orderBy('createdAt', 'desc'),
  startAfter(lastDoc),
  limit(10)
);
```

---

## Indexing

### ❌ OLD: Prisma
```prisma
model Appointment {
  @@index([doctorId])
  @@index([patientId])
  @@index([status])
}
```

### ✅ NEW: Firestore
- Create composite indexes in Firebase Console
- Go to **Firestore Database** → **Indexes**
- Create index on collection with fields needed for your queries

Example:
- Collection: `appointments`
- Fields: `doctorId` (Ascending), `createdAt` (Descending)

---

## Key Differences Summary

| Feature | Prisma + PostgreSQL | Firebase |
|---------|-----|---------|
| **Database** | SQL | NoSQL |
| **Transactions** | Full ACID | Limited to single doc/collection |
| **Joins** | Native SQL joins | Manual in application code |
| **Cost** | Pay for server + DB | Pay per read/write/delete |
| **Scaling** | Vertical (more powerful DB) | Horizontal (automatic) |
| **Real-time** | WebSocket (Socket.io) | Built-in listeners |
| **Authentication** | Manual JWT | Built-in with security |
| **File Storage** | Local filesystem | Cloud Storage |
| **Backup** | Manual | Automatic |

---

## Migration Checklist

- [ ] Setup Firebase project
- [ ] Install firebase-admin
- [ ] Create Firestore collections
- [ ] Update authentication logic
- [ ] Replace database calls with Firestore
- [ ] Update API endpoints
- [ ] Test all endpoints
- [ ] Update client-side Firebase config
- [ ] Test client-side auth flow
- [ ] Migrate real-time features
- [ ] Deploy to production
