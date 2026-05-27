import admin from 'firebase-admin';
import { logger } from '../utils/logger.js';

// Initialize Firebase Admin (must be called from index.js first)
const db = admin.firestore();

/**
 * Firebase Database Service - Drop-in replacement for Prisma
 * Maintains all business logic and access control from existing code
 */

// ════════════════════════════════════════════════════════════════
// ANONYMOUS SESSIONS
// ════════════════════════════════════════════════════════════════

export const anonymousSession = {
  async create(data) {
    const sessionId = admin.firestore().collection('_').doc().id;
    const sessionData = {
      id: sessionId,
      sessionToken: data.sessionToken,
      language: data.language || 'en',
      currentTopic: null,
      isSexualHealth: false,
      scanLocked: false,
      severityLevel: 'green',
      offenceCount: 0,
      createdAt: new Date(),
      expiresAt: data.expiresAt,
    };
    await db.collection('anonymousSessions').doc(sessionId).set(sessionData);
    return sessionData;
  },

  async findUnique(where) {
    if (where.id) {
      const doc = await db.collection('anonymousSessions').doc(where.id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }
    if (where.sessionToken) {
      const snapshot = await db
        .collection('anonymousSessions')
        .where('sessionToken', '==', where.sessionToken)
        .limit(1)
        .get();
      return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
  },

  async update(where, data) {
    const sessionId = where.id;
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    await db.collection('anonymousSessions').doc(sessionId).update(updateData);
    return this.findUnique({ id: sessionId });
  },

  async delete(where) {
    const sessionId = where.id;
    // Cascade delete: messages and scans
    const messages = await db.collection('messages').where('sessionId', '==', sessionId).get();
    const scans = await db.collection('scanImages').where('sessionId', '==', sessionId).get();
    const escalation = await db.collection('escalations').where('sessionId', '==', sessionId).limit(1).get();

    const batch = db.batch();
    messages.docs.forEach(doc => batch.delete(doc.ref));
    scans.docs.forEach(doc => batch.delete(doc.ref));
    escalation.docs.forEach(doc => batch.delete(doc.ref));
    batch.delete(db.collection('anonymousSessions').doc(sessionId));

    await batch.commit();
  },

  async findMany(where) {
    let query = db.collection('anonymousSessions');
    if (where?.expiresAt) {
      // For cleanup: find expired sessions
      query = query.where('expiresAt', '<', new Date());
    }
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
};

// ════════════════════════════════════════════════════════════════
// MESSAGES (in sessions)
// ════════════════════════════════════════════════════════════════

export const message = {
  async create(data) {
    const messageId = admin.firestore().collection('_').doc().id;
    const messageData = {
      id: messageId,
      sessionId: data.sessionId,
      role: data.role,
      content: data.content,
      scanImageId: data.scanImageId || null,
      scanResult: data.scanResult || null,
      careBadge: data.careBadge || null,
      createdAt: new Date(),
    };
    await db.collection('messages').doc(messageId).set(messageData);
    return messageData;
  },

  async findMany(where) {
    const snapshot = await db
      .collection('messages')
      .where('sessionId', '==', where.sessionId)
      .orderBy('createdAt', 'asc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async findUnique(where) {
    const doc = await db.collection('messages').doc(where.id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },
};

// ════════════════════════════════════════════════════════════════
// SCAN IMAGES
// ════════════════════════════════════════════════════════════════

export const scanImage = {
  async create(data) {
    const scanId = admin.firestore().collection('_').doc().id;
    const scanData = {
      id: scanId,
      sessionId: data.sessionId,
      filePath: data.filePath || null,
      bodyArea: data.bodyArea,
      approved: data.approved || false,
      claudeAnalysis: data.claudeAnalysis || null,
      severity: data.severity || null,
      createdAt: new Date(),
    };
    await db.collection('scanImages').doc(scanId).set(scanData);
    return scanData;
  },

  async findUnique(where) {
    const doc = await db.collection('scanImages').doc(where.id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  async update(where, data) {
    const scanId = where.id;
    await db.collection('scanImages').doc(scanId).update(data);
    return this.findUnique({ id: scanId });
  },

  async findMany(where) {
    const snapshot = await db
      .collection('scanImages')
      .where('sessionId', '==', where.sessionId)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
};

// ════════════════════════════════════════════════════════════════
// DOCTORS
// ════════════════════════════════════════════════════════════════

export const doctor = {
  async create(data) {
    const doctorId = admin.firestore().collection('_').doc().id;
    const doctorData = {
      id: doctorId,
      email: data.email,
      passwordHash: data.passwordHash,
      fullName: data.fullName,
      medicalLicenseId: data.medicalLicenseId,
      specialty: data.specialty,
      department: data.department,
      hospitalId: data.hospitalId,
      licenseFilePath: data.licenseFilePath || null,
      profilePhoto: data.profilePhoto || null,
      verificationStatus: 'pending', // pending | approved | rejected
      verificationNote: null,
      isOnline: false,
      twoFAEnabled: false,
      twoFASecret: null,
      role: 'doctor', // doctor | admin
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection('doctors').doc(doctorId).set(doctorData);
    return doctorData;
  },

  async findUnique(where) {
    if (where.id) {
      const doc = await db.collection('doctors').doc(where.id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }
    if (where.email) {
      const snapshot = await db
        .collection('doctors')
        .where('email', '==', where.email)
        .limit(1)
        .get();
      return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
  },

  async update(where, data) {
    const doctorId = where.id;
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    await db.collection('doctors').doc(doctorId).update(updateData);
    return this.findUnique({ id: doctorId });
  },

  async findMany(where) {
    let query = db.collection('doctors');
    if (where?.hospitalId) {
      query = query.where('hospitalId', '==', where.hospitalId);
    }
    if (where?.verificationStatus) {
      query = query.where('verificationStatus', '==', where.verificationStatus);
    }
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
};

// ════════════════════════════════════════════════════════════════
// HOSPITALS
// ════════════════════════════════════════════════════════════════

export const hospital = {
  async create(data) {
    const hospitalId = admin.firestore().collection('_').doc().id;
    const hospitalData = {
      id: hospitalId,
      name: data.name,
      fullName: data.fullName,
      address: data.address,
      helpdeskPhone: data.helpdeskPhone,
      type: data.type,
      menHealth: data.menHealth || true,
      departments: data.departments || [],
      createdAt: new Date(),
    };
    await db.collection('hospitals').doc(hospitalId).set(hospitalData);
    return hospitalData;
  },

  async findUnique(where) {
    const doc = await db.collection('hospitals').doc(where.id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  async findMany() {
    const snapshot = await db.collection('hospitals').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
};

// ════════════════════════════════════════════════════════════════
// ESCALATIONS
// ════════════════════════════════════════════════════════════════

export const escalation = {
  async create(data) {
    const escalationId = admin.firestore().collection('_').doc().id;
    const escalationData = {
      id: escalationId,
      sessionId: data.sessionId,
      patientName: data.patientName,
      patientAge: data.patientAge,
      patientPhone: data.patientPhone,
      patientEmail: data.patientEmail || null,
      hospitalId: data.hospitalId,
      symptomSummary: data.symptomSummary,
      escalationReason: data.escalationReason,
      severityAtEscalation: data.severityAtEscalation,
      status: 'pending', // pending | assigned | in-consultation | closed
      assignedDoctorId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection('escalations').doc(escalationId).set(escalationData);
    return escalationData;
  },

  async findUnique(where) {
    if (where.id) {
      const doc = await db.collection('escalations').doc(where.id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }
    if (where.sessionId) {
      const snapshot = await db
        .collection('escalations')
        .where('sessionId', '==', where.sessionId)
        .limit(1)
        .get();
      return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
  },

  async update(where, data) {
    const escalationId = where.id;
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    await db.collection('escalations').doc(escalationId).update(updateData);
    return this.findUnique({ id: escalationId });
  },

  async findMany(where) {
    let query = db.collection('escalations');
    if (where?.hospitalId) {
      query = query.where('hospitalId', '==', where.hospitalId);
    }
    if (where?.status) {
      query = query.where('status', '==', where.status);
    }
    if (where?.assignedDoctorId) {
      query = query.where('assignedDoctorId', '==', where.assignedDoctorId);
    }
    if (where?.orderBy) {
      const [field, direction] = where.orderBy;
      query = query.orderBy(field, direction);
    }
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
};

// ════════════════════════════════════════════════════════════════
// CONSULTATIONS
// ════════════════════════════════════════════════════════════════

export const consultation = {
  async create(data) {
    const consultationId = admin.firestore().collection('_').doc().id;
    const consultationData = {
      id: consultationId,
      escalationId: data.escalationId,
      doctorId: data.doctorId,
      status: 'active', // active | paused | closed
      riskLevel: null,
      followUpDate: null,
      recommendation: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection('consultations').doc(consultationId).set(consultationData);
    return consultationData;
  },

  async findUnique(where) {
    if (where.id) {
      const doc = await db.collection('consultations').doc(where.id).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    }
    if (where.escalationId) {
      const snapshot = await db
        .collection('consultations')
        .where('escalationId', '==', where.escalationId)
        .limit(1)
        .get();
      return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
  },

  async update(where, data) {
    const consultationId = where.id;
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    await db.collection('consultations').doc(consultationId).update(updateData);
    return this.findUnique({ id: consultationId });
  },

  async findMany(where) {
    let query = db.collection('consultations');
    if (where?.doctorId) {
      query = query.where('doctorId', '==', where.doctorId);
    }
    if (where?.status) {
      query = query.where('status', '==', where.status);
    }
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async delete(where) {
    const consultationId = where.id;
    // Cascade delete: messages, internal notes, soap note, prescription
    const messages = await db.collection('consultMessages').where('consultationId', '==', consultationId).get();
    const notes = await db.collection('internalNotes').where('consultationId', '==', consultationId).get();
    const soap = await db.collection('soapNotes').where('consultationId', '==', consultationId).limit(1).get();
    const prescription = await db.collection('prescriptions').where('consultationId', '==', consultationId).limit(1).get();

    const batch = db.batch();
    messages.docs.forEach(doc => batch.delete(doc.ref));
    notes.docs.forEach(doc => batch.delete(doc.ref));
    soap.docs.forEach(doc => batch.delete(doc.ref));
    prescription.docs.forEach(doc => batch.delete(doc.ref));
    batch.delete(db.collection('consultations').doc(consultationId));

    await batch.commit();
  },
};

// ════════════════════════════════════════════════════════════════
// CONSULT MESSAGES
// ════════════════════════════════════════════════════════════════

export const consultMessage = {
  async create(data) {
    const messageId = admin.firestore().collection('_').doc().id;
    const messageData = {
      id: messageId,
      consultationId: data.consultationId,
      senderRole: data.senderRole, // patient | doctor
      content: data.content,
      fileUrl: data.fileUrl || null,
      seenByPatient: data.seenByPatient || false,
      seenByDoctor: data.seenByDoctor || false,
      createdAt: new Date(),
    };
    await db.collection('consultMessages').doc(messageId).set(messageData);
    return messageData;
  },

  async findMany(where) {
    const snapshot = await db
      .collection('consultMessages')
      .where('consultationId', '==', where.consultationId)
      .orderBy('createdAt', 'asc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async update(where, data) {
    const messageId = where.id;
    await db.collection('consultMessages').doc(messageId).update(data);
    const doc = await db.collection('consultMessages').doc(messageId).get();
    return { id: doc.id, ...doc.data() };
  },
};

// ════════════════════════════════════════════════════════════════
// INTERNAL NOTES
// ════════════════════════════════════════════════════════════════

export const internalNote = {
  async create(data) {
    const noteId = admin.firestore().collection('_').doc().id;
    const noteData = {
      id: noteId,
      consultationId: data.consultationId,
      content: data.content,
      createdAt: new Date(),
    };
    await db.collection('internalNotes').doc(noteId).set(noteData);
    return noteData;
  },

  async findMany(where) {
    const snapshot = await db
      .collection('internalNotes')
      .where('consultationId', '==', where.consultationId)
      .orderBy('createdAt', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
};

// ════════════════════════════════════════════════════════════════
// SOAP NOTES
// ════════════════════════════════════════════════════════════════

export const soapNote = {
  async create(data) {
    const soapId = admin.firestore().collection('_').doc().id;
    const soapData = {
      id: soapId,
      consultationId: data.consultationId,
      subjective: data.subjective,
      objective: data.objective,
      assessment: data.assessment,
      plan: data.plan,
      finalized: data.finalized || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await db.collection('soapNotes').doc(soapId).set(soapData);
    return soapData;
  },

  async findUnique(where) {
    if (where.consultationId) {
      const snapshot = await db
        .collection('soapNotes')
        .where('consultationId', '==', where.consultationId)
        .limit(1)
        .get();
      return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    const doc = await db.collection('soapNotes').doc(where.id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  async update(where, data) {
    const soapId = where.id;
    const updateData = {
      ...data,
      updatedAt: new Date(),
    };
    await db.collection('soapNotes').doc(soapId).update(updateData);
    return this.findUnique({ id: soapId });
  },
};

// ════════════════════════════════════════════════════════════════
// PRESCRIPTIONS
// ════════════════════════════════════════════════════════════════

export const prescription = {
  async create(data) {
    const prescriptionId = admin.firestore().collection('_').doc().id;
    const prescriptionData = {
      id: prescriptionId,
      consultationId: data.consultationId,
      filePath: data.filePath,
      notes: data.notes || null,
      createdAt: new Date(),
    };
    await db.collection('prescriptions').doc(prescriptionId).set(prescriptionData);
    return prescriptionData;
  },

  async findUnique(where) {
    if (where.consultationId) {
      const snapshot = await db
        .collection('prescriptions')
        .where('consultationId', '==', where.consultationId)
        .limit(1)
        .get();
      return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
  },
};

// ════════════════════════════════════════════════════════════════
// APPOINTMENTS
// ════════════════════════════════════════════════════════════════

export const appointment = {
  async create(data) {
    const appointmentId = admin.firestore().collection('_').doc().id;
    const appointmentData = {
      id: appointmentId,
      escalationId: data.escalationId,
      doctorId: data.doctorId,
      hospitalId: data.hospitalId,
      scheduledAt: data.scheduledAt,
      type: data.type,
      status: 'scheduled', // scheduled | completed | cancelled | rescheduled
      notes: data.notes || null,
      createdAt: new Date(),
    };
    await db.collection('appointments').doc(appointmentId).set(appointmentData);
    return appointmentData;
  },

  async findUnique(where) {
    if (where.escalationId) {
      const snapshot = await db
        .collection('appointments')
        .where('escalationId', '==', where.escalationId)
        .limit(1)
        .get();
      return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    const doc = await db.collection('appointments').doc(where.id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  async findMany(where) {
    let query = db.collection('appointments');
    if (where?.doctorId) {
      query = query.where('doctorId', '==', where.doctorId);
    }
    if (where?.status) {
      query = query.where('status', '==', where.status);
    }
    const snapshot = await query.orderBy('scheduledAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async update(where, data) {
    const appointmentId = where.id;
    await db.collection('appointments').doc(appointmentId).update(data);
    return this.findUnique({ id: appointmentId });
  },
};

// ════════════════════════════════════════════════════════════════
// OTHERS ASKED FEED
// ════════════════════════════════════════════════════════════════

export const othersAskedEntry = {
  async create(data) {
    const entryId = admin.firestore().collection('_').doc().id;
    const entryData = {
      id: entryId,
      question: data.question,
      aiAnswer: data.aiAnswer,
      topic: data.topic,
      careBadge: data.careBadge,
      createdAt: new Date(),
    };
    await db.collection('othersAskedEntries').doc(entryId).set(entryData);
    return entryData;
  },

  async findMany(where) {
    let query = db.collection('othersAskedEntries');
    if (where?.topic) {
      query = query.where('topic', '==', where.topic);
    }
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(where?.take || 20)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
};

// ════════════════════════════════════════════════════════════════
// SECURITY LOGS
// ════════════════════════════════════════════════════════════════

export const securityLog = {
  async create(data) {
    const logId = admin.firestore().collection('_').doc().id;
    const logData = {
      id: logId,
      doctorId: data.doctorId,
      event: data.event, // login | logout | view-escalation | finalize-consultation | etc
      details: data.details || null,
      createdAt: new Date(),
    };
    await db.collection('securityLogs').doc(logId).set(logData);
    return logData;
  },

  async findMany(where) {
    let query = db.collection('securityLogs');
    if (where?.doctorId) {
      query = query.where('doctorId', '==', where.doctorId);
    }
    const snapshot = await query
      .orderBy('createdAt', 'desc')
      .limit(where?.take || 100)
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
};

// ════════════════════════════════════════════════════════════════
// TRANSACTIONS
// ════════════════════════════════════════════════════════════════

/**
 * Transaction wrapper for complex operations
 * Usage: await firebaseDb.$transaction(async (tx) => { ... })
 */
export async function transaction(callback) {
  return await db.runTransaction(async (txn) => {
    return await callback(txn);
  });
}

export default {
  anonymousSession,
  message,
  scanImage,
  doctor,
  hospital,
  escalation,
  consultation,
  consultMessage,
  internalNote,
  soapNote,
  prescription,
  appointment,
  othersAskedEntry,
  securityLog,
  transaction: { $transaction: transaction },
  $transaction: transaction,
};
