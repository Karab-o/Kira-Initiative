import admin from 'firebase-admin';

// Initialize Firebase Admin (uses GOOGLE_APPLICATION_CREDENTIALS env var)
// Download your service account key from Firebase Console → Project Settings
const db = admin.firestore();

// ============ USER OPERATIONS ============
export async function createUser(userId, userData) {
  await db.collection('users').doc(userId).set({
    ...userData,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function getUser(userId) {
  const doc = await db.collection('users').doc(userId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

export async function updateUser(userId, updates) {
  await db.collection('users').doc(userId).update({
    ...updates,
    updatedAt: new Date(),
  });
}

export async function getUserByEmail(email) {
  const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
  return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

// ============ SESSION OPERATIONS ============
export async function createSession(sessionId, sessionData) {
  await db.collection('sessions').doc(sessionId).set({
    ...sessionData,
    createdAt: new Date(),
    status: 'active',
  });
}

export async function getSession(sessionId) {
  const doc = await db.collection('sessions').doc(sessionId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

export async function updateSession(sessionId, updates) {
  await db.collection('sessions').doc(sessionId).update({
    ...updates,
    updatedAt: new Date(),
  });
}

export async function getSessionsByPatient(patientId) {
  const snapshot = await db.collection('sessions')
    .where('patientId', '==', patientId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getSessionsByDoctor(doctorId) {
  const snapshot = await db.collection('sessions')
    .where('doctorId', '==', doctorId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ============ APPOINTMENT OPERATIONS ============
export async function createAppointment(appointmentId, appointmentData) {
  await db.collection('appointments').doc(appointmentId).set({
    ...appointmentData,
    createdAt: new Date(),
    status: 'scheduled',
  });
}

export async function getAppointment(appointmentId) {
  const doc = await db.collection('appointments').doc(appointmentId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

export async function updateAppointment(appointmentId, updates) {
  await db.collection('appointments').doc(appointmentId).update({
    ...updates,
    updatedAt: new Date(),
  });
}

export async function getAppointmentsByDoctor(doctorId) {
  const snapshot = await db.collection('appointments')
    .where('doctorId', '==', doctorId)
    .orderBy('appointmentTime', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getAppointmentsByPatient(patientId) {
  const snapshot = await db.collection('appointments')
    .where('patientId', '==', patientId)
    .orderBy('appointmentTime', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ============ CONSULTATION OPERATIONS ============
export async function createConsultation(consultationId, consultationData) {
  await db.collection('consultations').doc(consultationId).set({
    ...consultationData,
    createdAt: new Date(),
    status: 'active',
  });
}

export async function getConsultation(consultationId) {
  const doc = await db.collection('consultations').doc(consultationId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

export async function updateConsultation(consultationId, updates) {
  await db.collection('consultations').doc(consultationId).update({
    ...updates,
    updatedAt: new Date(),
  });
}

// ============ PRESCRIPTION OPERATIONS ============
export async function createPrescription(prescriptionId, prescriptionData) {
  await db.collection('prescriptions').doc(prescriptionId).set({
    ...prescriptionData,
    createdAt: new Date(),
    status: 'active',
  });
}

export async function getPrescriptionsByPatient(patientId) {
  const snapshot = await db.collection('prescriptions')
    .where('patientId', '==', patientId)
    .orderBy('createdAt', 'desc')
    .get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ============ BATCH OPERATIONS ============
export async function batchWrite(operations) {
  const batch = db.batch();
  
  operations.forEach(({ type, collection, id, data }) => {
    const ref = db.collection(collection).doc(id);
    if (type === 'set') batch.set(ref, data);
    if (type === 'update') batch.update(ref, data);
    if (type === 'delete') batch.delete(ref);
  });
  
  await batch.commit();
}

// ============ QUERIES ============
export async function queryCollection(collectionName, filters = []) {
  let query = db.collection(collectionName);
  
  filters.forEach(({ field, operator, value }) => {
    query = query.where(field, operator, value);
  });
  
  const snapshot = await query.get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export { db };
