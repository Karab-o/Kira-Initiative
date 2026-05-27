# Firebase Database - Find & Replace Reference

Use this guide to quickly update all your files from Prisma to Firebase.

## Pattern: Replace All Prisma Calls

### In Every Route/Service File

**Remove these imports:**
```javascript
// DELETE THIS
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

**Add this import:**
```javascript
// ADD THIS
import firebaseDb from '../utils/firebase-db.js';
```

---

## Quick Replace Reference

| Prisma | Firebase | Usage |
|--------|----------|-------|
| `prisma.doctor` | `firebaseDb.doctor` | All doctor operations |
| `prisma.hospital` | `firebaseDb.hospital` | All hospital operations |
| `prisma.anonymousSession` | `firebaseDb.anonymousSession` | Session creation/fetching |
| `prisma.message` | `firebaseDb.message` | Chat messages |
| `prisma.escalation` | `firebaseDb.escalation` | Escalations |
| `prisma.consultation` | `firebaseDb.consultation` | Consultations |
| `prisma.consultMessage` | `firebaseDb.consultMessage` | Consultation messages |
| `prisma.soapNote` | `firebaseDb.soapNote` | SOAP notes |
| `prisma.prescription` | `firebaseDb.prescription` | Prescriptions |
| `prisma.appointment` | `firebaseDb.appointment` | Appointments |
| `prisma.internalNote` | `firebaseDb.internalNote` | Internal notes |
| `prisma.scanImage` | `firebaseDb.scanImage` | Scan images |
| `prisma.securityLog` | `firebaseDb.securityLog` | Security logs |
| `prisma.othersAskedEntry` | `firebaseDb.othersAskedEntry` | Feed entries |

---

## API Reference - Same Operations Work

### FIND UNIQUE
```javascript
// Prisma
const doc = await prisma.doctor.findUnique({ where: { id: '123' } });

// Firebase (EXACT SAME)
const doc = await firebaseDb.doctor.findUnique({ where: { id: '123' } });
```

### FIND MANY
```javascript
// Prisma
const doctors = await prisma.doctor.findMany({
  where: { verificationStatus: 'approved' }
});

// Firebase (EXACT SAME)
const doctors = await firebaseDb.doctor.findMany({
  where: { verificationStatus: 'approved' }
});
```

### CREATE
```javascript
// Prisma
const doc = await prisma.doctor.create({
  data: { email, fullName, hospitalId, ... }
});

// Firebase (EXACT SAME)
const doc = await firebaseDb.doctor.create({
  email, fullName, hospitalId, ...
});
```

### UPDATE
```javascript
// Prisma
await prisma.doctor.update({
  where: { id },
  data: { isOnline: true }
});

// Firebase (EXACT SAME)
await firebaseDb.doctor.update({
  where: { id },
  data: { isOnline: true }
});
```

### DELETE
```javascript
// Prisma
await prisma.doctor.delete({ where: { id } });

// Firebase (EXACT SAME)
await firebaseDb.doctor.delete({ where: { id } });
```

### TRANSACTIONS
```javascript
// Prisma
await prisma.$transaction(async (tx) => {
  await tx.consultation.create({ ... });
  await tx.escalation.update({ ... });
});

// Firebase (EXACT SAME)
await firebaseDb.$transaction(async (tx) => {
  // Operations work the same
});
```

---

## Files to Update - Priority Order

### HIGH PRIORITY (Core Routes)
1. **server/index.js** - Add Firebase init
2. **server/routes/auth.js** - Doctor authentication
3. **server/routes/escalations.js** - Escalation logic
4. **server/routes/consultations.js** - Consultation creation

### MEDIUM PRIORITY
5. **server/routes/scans.js** - Scan operations
6. **server/routes/appointments.js** - Appointments
7. **server/routes/sessions.js** - Sessions
8. **server/routes/doctors.js** - Doctor queries

### LOW PRIORITY
9. **server/routes/hospitals.js** - Hospital data
10. **server/routes/feed.js** - Feed entries
11. **server/routes/prescriptions.js** - Prescriptions
12. **server/routes/admin.js** - Admin/logs

### SERVICES
13. **server/services/safetyEngine.js** - Safety checks
14. **server/services/sessionCleanup.js** - Cleanup jobs

---

## Real Code Examples

### Example 1: Auth Route

**BEFORE (Prisma):**
```javascript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, medicalLicenseId, specialty, hospitalId } = req.body;
    
    const hashedPassword = await bcryptjs.hash(password, 10);
    
    const doctor = await prisma.doctor.create({
      data: {
        email,
        passwordHash: hashedPassword,
        fullName,
        medicalLicenseId,
        specialty,
        department: 'General',
        hospitalId,
      }
    });
    
    res.json({ id: doctor.id, email: doctor.email });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

**AFTER (Firebase):**
```javascript
import firebaseDb from '../utils/firebase-db.js';

router.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, medicalLicenseId, specialty, hospitalId } = req.body;
    
    const hashedPassword = await bcryptjs.hash(password, 10);
    
    const doctor = await firebaseDb.doctor.create({
      email,
      passwordHash: hashedPassword,
      fullName,
      medicalLicenseId,
      specialty,
      department: 'General',
      hospitalId,
    });
    
    res.json({ id: doctor.id, email: doctor.email });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

**Changes:**
- ✅ Remove Prisma import
- ✅ Add Firebase import  
- ✅ Change `prisma.doctor.create` to `firebaseDb.doctor.create`
- ✅ Remove `data:` wrapper (Firebase doesn't need it)

---

### Example 2: Complex Query

**BEFORE (Prisma):**
```javascript
const escalations = await prisma.escalation.findMany({
  where: {
    hospitalId,
    status: { in: ['pending', 'assigned'] },
    severityAtEscalation: 'red'
  },
  orderBy: { createdAt: 'desc' },
  take: 10
});
```

**AFTER (Firebase):**
```javascript
const escalations = await firebaseDb.escalation.findMany({
  where: {
    hospitalId,
    status: 'pending', // Note: Firestore doesn't support 'in' operator here
    severityAtEscalation: 'red'
  }
  // Firestore has limitations - might need multiple queries
});
```

**Note:** Firestore has some query limitations compared to SQL. For complex filters, you might need to:
1. Get all records
2. Filter in application code
3. Or create separate routes

---

### Example 3: Transaction

**BEFORE (Prisma):**
```javascript
await prisma.$transaction(async (tx) => {
  const consultation = await tx.consultation.create({
    data: { escalationId, doctorId }
  });

  await tx.escalation.update({
    where: { id: escalationId },
    data: { status: 'in-consultation', assignedDoctorId: doctorId }
  });
});
```

**AFTER (Firebase):**
```javascript
await firebaseDb.$transaction(async (tx) => {
  const consultation = await firebaseDb.consultation.create({
    escalationId, doctorId
  });

  await firebaseDb.escalation.update({
    id: escalationId,
    status: 'in-consultation',
    assignedDoctorId: doctorId
  });
});
```

---

## Common Patterns in Your Code

### Pattern 1: Find by Relation
```javascript
// BEFORE
const doctor = await prisma.doctor.findUnique({
  where: { id: doctorId },
  include: { consultations: true }  // ← Not needed
});

// AFTER - Just query the consultation collection separately
const doctor = await firebaseDb.doctor.findUnique({
  where: { id: doctorId }
});

const consultations = await firebaseDb.consultation.findMany({
  where: { doctorId }
});
```

### Pattern 2: Count
```javascript
// BEFORE
const count = await prisma.consultation.count({
  where: { doctorId }
});

// AFTER - Get all and count
const consultations = await firebaseDb.consultation.findMany({
  where: { doctorId }
});
const count = consultations.length;
```

### Pattern 3: Aggregate
```javascript
// BEFORE
const stats = await prisma.appointment.aggregate({
  _count: { id: true },
  where: { doctorId }
});

// AFTER
const appointments = await firebaseDb.appointment.findMany({
  where: { doctorId }
});
const count = appointments.length;
```

---

## Search & Replace Commands (For VS Code)

Press `Ctrl+H` to open Find & Replace:

1. **Replace `prisma.doctor` → `firebaseDb.doctor`**
   - Find: `prisma\.doctor`
   - Replace: `firebaseDb.doctor`
   - Use regex: ✓

2. **Replace all prisma imports**
   - Find: `import { PrismaClient }.*\nconst prisma.*`
   - Replace: `import firebaseDb from '../utils/firebase-db.js';`
   - Use regex: ✓

---

## Testing Each File

After updating each file:

```bash
npm run dev
```

Check console for:
```
✓ Firebase Admin SDK initialized successfully
```

If any error, check:
1. Firebase credentials in `.env`
2. Firestore collections created
3. Syntax errors in route files

---

## Rollback if Needed

Keep your Prisma files in case you need to rollback:

```bash
git checkout server/routes/auth.js  # Revert one file
git checkout .                       # Revert all files
```
