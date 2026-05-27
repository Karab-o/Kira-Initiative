import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────

async function hash(pw) {
  return bcrypt.hash(pw, 12);
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function hoursFromNow(h) {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

function todayAt(hour, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d;
}

// ─── Hospitals ──────────────────────────────────────────────────────────────

const HOSPITALS = [
  {
    name: 'Rwanda Military Hospital',
    fullName: 'Rwanda Military Hospital',
    code: 'RMH',
    address: 'Kanombe, Kigali',
    helpdeskPhone: '+250788302000',
    type: 'referral',
    menHealth: true,
    departments: ['Gynecology', 'Urology', 'Sexual Health', 'Cardiology', 'Internal Medicine', 'General Practice'],
  },
  {
    name: 'King Faisal Hospital',
    fullName: 'King Faisal Hospital Rwanda',
    code: 'KFH',
    address: 'KG 544 St, Kigali',
    helpdeskPhone: '+250252582421',
    type: 'private',
    menHealth: true,
    departments: ['Urology', 'General Practice', 'Internal Medicine', 'Mental Health', 'Cardiology'],
  },
  {
    name: 'CHUK',
    fullName: 'Centre Hospitalier Universitaire de Kigali',
    code: 'CHUK',
    address: 'KN 4 Ave, Kigali',
    helpdeskPhone: '+250788310000',
    type: 'public',
    menHealth: true,
    departments: ['Urology', 'Pediatrics', 'Mental Health', 'Internal Medicine', 'Sexual Health', 'General Practice'],
  },
  {
    name: 'Kibagabaga District Hospital',
    fullName: 'Kibagabaga District Hospital',
    code: 'KGB',
    address: 'Kibagabaga, Kigali',
    helpdeskPhone: '+250788303305',
    type: 'public',
    menHealth: true,
    departments: ['General Practice', 'Internal Medicine', 'Mental Health', 'Counseling'],
  },
  {
    name: 'Masaka District Hospital',
    fullName: 'Masaka District Hospital',
    code: 'MSK',
    address: 'Masaka, Kigali',
    helpdeskPhone: '+250788862000',
    type: 'public',
    menHealth: true,
    departments: ['General Practice', 'Sexual Health', 'Internal Medicine'],
  },
];

// ─── Access codes ────────────────────────────────────────────────────────────

const ACCESS_CODES = [
  // RMH
  { code: 'KIRA-RMH-GYN1', hospitalCode: 'RMH', specialty: 'Gynecologist' },
  { code: 'KIRA-RMH-GYN2', hospitalCode: 'RMH', specialty: 'Gynecologist' },
  { code: 'KIRA-RMH-URO1', hospitalCode: 'RMH', specialty: 'Urologist' },
  { code: 'KIRA-RMH-GP01', hospitalCode: 'RMH', specialty: 'General Practitioner' },
  { code: 'KIRA-RMH-SXH1', hospitalCode: 'RMH', specialty: 'Sexual Health Specialist' },
  // KFH
  { code: 'KIRA-KFH-URO1', hospitalCode: 'KFH', specialty: 'Urologist' },
  { code: 'KIRA-KFH-GP01', hospitalCode: 'KFH', specialty: 'General Practitioner' },
  { code: 'KIRA-KFH-MNT1', hospitalCode: 'KFH', specialty: 'Mental Health Specialist' },
  // CHUK
  { code: 'KIRA-CHUK-PED1', hospitalCode: 'CHUK', specialty: 'Pediatrician' },
  { code: 'KIRA-CHUK-MNT1', hospitalCode: 'CHUK', specialty: 'Mental Health Specialist' },
  { code: 'KIRA-CHUK-URO1', hospitalCode: 'CHUK', specialty: 'Urologist' },
  { code: 'KIRA-CHUK-GP01', hospitalCode: 'CHUK', specialty: 'General Practitioner' },
  // KGB
  { code: 'KIRA-KGB-GP01', hospitalCode: 'KGB', specialty: 'General Practitioner' },
  { code: 'KIRA-KGB-CNS1', hospitalCode: 'KGB', specialty: 'Counselor' },
  // MSK
  { code: 'KIRA-MSK-GP01', hospitalCode: 'MSK', specialty: 'General Practitioner' },
  { code: 'KIRA-MSK-SXH1', hospitalCode: 'MSK', specialty: 'Sexual Health Specialist' },
];

// ─── Doctors ─────────────────────────────────────────────────────────────────

const DOCTORS = [
  // ── RMH ──────────────────────────────────────────────────────────────────
  {
    fullName: 'Dr. Sarah Uwase',
    email: 'sarah.uwase@rmh.gov.rw',
    medicalLicenseId: 'RW-GYN-4420',
    specialty: 'Gynecologist',
    department: 'Gynecology',
    hospitalCode: 'RMH',
    // This is the primary demo login: email sarah.uwase@rmh.gov.rw / KiraDev123!
  },
  {
    fullName: 'Dr. Amina Uwimana',
    email: 'amina.uwimana@rmh.gov.rw',
    medicalLicenseId: 'RW-SXH-3318',
    specialty: 'Sexual Health Specialist',
    department: 'Sexual Health',
    hospitalCode: 'RMH',
  },
  {
    fullName: 'Dr. Eric Ntamuhanga',
    email: 'eric.ntamuhanga@rmh.gov.rw',
    medicalLicenseId: 'RW-GP-2201',
    specialty: 'General Practitioner',
    department: 'General Practice',
    hospitalCode: 'RMH',
  },
  // ── KFH ──────────────────────────────────────────────────────────────────
  {
    fullName: 'Dr. Moses Gatete',
    email: 'moses.gatete@kfh.gov.rw',
    medicalLicenseId: 'RW-URO-5501',
    specialty: 'Urologist',
    department: 'Urology',
    hospitalCode: 'KFH',
  },
  {
    fullName: 'Dr. Solange Kaneza',
    email: 'solange.kaneza@kfh.gov.rw',
    medicalLicenseId: 'RW-GP-10485',
    specialty: 'General Practitioner',
    department: 'General Practice',
    hospitalCode: 'KFH',
  },
  {
    fullName: 'Dr. Jean-Pierre Habimana',
    email: 'jp.habimana@kfh.gov.rw',
    medicalLicenseId: 'RW-MNT-7720',
    specialty: 'Mental Health Specialist',
    department: 'Mental Health',
    hospitalCode: 'KFH',
  },
  // ── CHUK ─────────────────────────────────────────────────────────────────
  {
    fullName: 'Dr. Emmanuel Mugisha',
    email: 'emmanuel.mugisha@chuk.gov.rw',
    medicalLicenseId: 'RW-URO-10293',
    specialty: 'Urologist',
    department: 'Urology',
    hospitalCode: 'CHUK',
  },
  {
    fullName: 'Dr. Claudine Ingabire',
    email: 'claudine.ingabire@chuk.gov.rw',
    medicalLicenseId: 'RW-PED-6610',
    specialty: 'Pediatrician',
    department: 'Pediatrics',
    hospitalCode: 'CHUK',
  },
  {
    fullName: 'Dr. Patrick Nzeyimana',
    email: 'patrick.nzeyimana@chuk.gov.rw',
    medicalLicenseId: 'RW-MNT-9901',
    specialty: 'Mental Health Specialist',
    department: 'Mental Health',
    hospitalCode: 'CHUK',
  },
  // ── KGB ──────────────────────────────────────────────────────────────────
  {
    fullName: 'Dr. Alice Mukamazimpaka',
    email: 'alice.mukamazimpaka@kgb.gov.rw',
    medicalLicenseId: 'RW-GP-11272',
    specialty: 'General Practitioner',
    department: 'General Practice',
    hospitalCode: 'KGB',
  },
  {
    fullName: 'Dr. Robert Nkurunziza',
    email: 'robert.nkurunziza@kgb.gov.rw',
    medicalLicenseId: 'RW-CNS-4480',
    specialty: 'Counselor',
    department: 'Counseling',
    hospitalCode: 'KGB',
  },
];

const ADMIN = {
  fullName: 'Kira Admin',
  email: 'admin@kirainitiative.rw',
  medicalLicenseId: 'RW-ADMIN-0001',
  specialty: 'Administration',
  department: 'Operations',
  hospitalCode: 'RMH',
  role: 'admin',
};

// ─── Escalations ─────────────────────────────────────────────────────────────
// Each entry: { hospital, doctorEmail(optional), patientName, patientAge, phone,
//               symptomSummary, escalationReason, severity, status, daysAgoCreated }

function makeEscalations(sarahId, aminaId, ericId, mosesId, emmanuelId) {
  const now = new Date();

  return [
    // ── RMH — Active assigned to Sarah (3) ──────────────────────────────
    {
      hospital: 'RMH',
      doctorId: sarahId,
      patientName: 'Karim M.',
      patientAge: 34,
      patientPhone: '+250780112233',
      symptomSummary:
        'Patient reports 3 weeks of lower abdominal discomfort and unusual discharge. Sexual health history disclosed during AI chat. Possible STI, recommends clinical exam and STI panel.',
      escalationReason: 'Possible sexually transmitted infection — requires clinical screening',
      severity: 'amber',
      status: 'active',
      daysAgo: 3,
    },
    {
      hospital: 'RMH',
      doctorId: sarahId,
      patientName: 'David N.',
      patientAge: 28,
      patientPhone: '+250780334455',
      symptomSummary:
        'Patient describes painful urination and groin swelling for 5 days. No prior STI history. AI flags moderate risk — urological or STI evaluation recommended.',
      escalationReason: 'Dysuria + groin swelling — urological or STI evaluation needed',
      severity: 'amber',
      status: 'active',
      daysAgo: 1,
    },
    {
      hospital: 'RMH',
      doctorId: sarahId,
      patientName: 'Jean-Paul T.',
      patientAge: 45,
      patientPhone: '+250780556677',
      symptomSummary:
        'Patient reports recurrent pelvic pain, blood in urine once last week, nocturia 3×/night. AI rates high risk. Urgent urology consult recommended — rule out bladder/prostate pathology.',
      escalationReason: 'Haematuria + pelvic pain — urgent clinical review',
      severity: 'red',
      status: 'active',
      daysAgo: 2,
    },
    // ── RMH — Pending (5) ────────────────────────────────────────────────
    {
      hospital: 'RMH',
      patientName: 'Théo K.',
      patientAge: 22,
      patientPhone: '+250780778899',
      symptomSummary:
        'Young male reporting anxiety about recent unprotected intercourse. AI flagged HIV/STI exposure risk. Patient consented to escalation — counselling and PEP assessment required.',
      escalationReason: 'Potential HIV/STI exposure — PEP window assessment needed',
      severity: 'red',
      status: 'pending',
      daysAgo: 0,
    },
    {
      hospital: 'RMH',
      patientName: 'Eric B.',
      patientAge: 39,
      patientPhone: '+250780990011',
      symptomSummary:
        'Patient reports persistent fatigue, low mood and reduced libido over 2 months. AI suggests possible low testosterone or thyroid dysfunction. Endocrine workup recommended.',
      escalationReason: 'Fatigue + low libido — hormonal panel needed',
      severity: 'amber',
      status: 'pending',
      daysAgo: 1,
    },
    {
      hospital: 'RMH',
      patientName: 'Samuel R.',
      patientAge: 51,
      patientPhone: '+250781122334',
      symptomSummary:
        'Patient describes burning sensation after sex and white penile discharge for 1 week. First-time STI concern. AI rates amber risk. Clinical STI screening indicated.',
      escalationReason: 'Penile discharge + burning — STI screening required',
      severity: 'amber',
      status: 'pending',
      daysAgo: 2,
    },
    {
      hospital: 'RMH',
      patientName: 'André M.',
      patientAge: 33,
      patientPhone: '+250781334455',
      symptomSummary:
        'Patient mentions intermittent chest tightness during exertion, family history of early cardiac events. AI recommends cardiovascular workup — not ignoring somatic symptoms.',
      escalationReason: 'Exertional chest tightness + family cardiac history',
      severity: 'amber',
      status: 'pending',
      daysAgo: 4,
    },
    {
      hospital: 'RMH',
      patientName: 'Innocent W.',
      patientAge: 19,
      patientPhone: '+250781556677',
      symptomSummary:
        'Teenager reporting episodes of extreme sadness and self-isolation over 3 weeks. Disclosed difficulty sleeping and not eating properly. AI flagged emotional crisis pathway.',
      escalationReason: 'Adolescent emotional crisis — mental health assessment required',
      severity: 'amber',
      status: 'pending',
      daysAgo: 0,
    },
    // ── RMH — Follow-up (2) ──────────────────────────────────────────────
    {
      hospital: 'RMH',
      doctorId: sarahId,
      patientName: 'Pierre N.',
      patientAge: 37,
      patientPhone: '+250781778899',
      symptomSummary:
        'Post-treatment follow-up. Patient was treated for chlamydia 3 weeks ago. Follow-up to confirm clearance and review safe-sex counselling.',
      escalationReason: 'Post-STI treatment follow-up check',
      severity: 'green',
      status: 'follow_up',
      daysAgo: 21,
    },
    {
      hospital: 'RMH',
      doctorId: aminaId,
      patientName: 'Michel K.',
      patientAge: 41,
      patientPhone: '+250781990011',
      symptomSummary:
        'Follow-up for recurrent UTI. Last consult 10 days ago — patient was prescribed antibiotics. Checking resolution and any new symptoms.',
      escalationReason: 'Recurrent UTI follow-up',
      severity: 'green',
      status: 'follow_up',
      daysAgo: 10,
    },
    // ── RMH — Closed (3) ────────────────────────────────────────────────
    {
      hospital: 'RMH',
      doctorId: ericId,
      patientName: 'Alain B.',
      patientAge: 29,
      patientPhone: '+250782112233',
      symptomSummary: 'Patient complained of skin rash on inner thigh. Resolved after antifungal treatment.',
      escalationReason: 'Groin rash — resolved',
      severity: 'green',
      status: 'closed',
      daysAgo: 14,
    },
    {
      hospital: 'RMH',
      doctorId: sarahId,
      patientName: 'Thierry M.',
      patientAge: 55,
      patientPhone: '+250782334455',
      symptomSummary:
        'Elevated PSA concern — patient had full urological workup. Benign prostatic hyperplasia confirmed. Monitoring plan established.',
      escalationReason: 'Elevated PSA workup — BPH confirmed',
      severity: 'amber',
      status: 'closed',
      daysAgo: 30,
    },
    {
      hospital: 'RMH',
      doctorId: aminaId,
      patientName: 'Frank U.',
      patientAge: 24,
      patientPhone: '+250782556677',
      symptomSummary: 'HIV test anxiety post-exposure. Negative result confirmed at 28-day mark. Safe-sex counselling provided.',
      escalationReason: 'HIV anxiety — negative test confirmed',
      severity: 'green',
      status: 'closed',
      daysAgo: 28,
    },
    // ── KFH — Mixed cases ────────────────────────────────────────────────
    {
      hospital: 'KFH',
      doctorId: mosesId,
      patientName: 'Olivier H.',
      patientAge: 48,
      patientPhone: '+250783112233',
      symptomSummary:
        'Patient reports difficulty urinating, weak stream and dribbling for 6 months. AI analysis points to obstructive uropathy or BPH. Urgent urology evaluation recommended.',
      escalationReason: 'Obstructive urinary symptoms — BPH / uropathy workup',
      severity: 'amber',
      status: 'active',
      daysAgo: 5,
    },
    {
      hospital: 'KFH',
      patientName: 'Gérard N.',
      patientAge: 62,
      patientPhone: '+250783334455',
      symptomSummary:
        'Elderly male with sudden onset haematuria. No trauma history. AI flags high clinical urgency — malignancy or stone disease needs rapid exclusion.',
      escalationReason: 'Painless haematuria — urgent malignancy exclusion',
      severity: 'red',
      status: 'pending',
      daysAgo: 0,
    },
    {
      hospital: 'KFH',
      patientName: 'Benjamin K.',
      patientAge: 31,
      patientPhone: '+250783556677',
      symptomSummary:
        'Patient reports panic attacks and chronic work stress. Unable to sleep well for 3 weeks. AI recommends mental health pathway with anxiety assessment.',
      escalationReason: 'Panic attacks + work stress — mental health assessment',
      severity: 'amber',
      status: 'pending',
      daysAgo: 2,
    },
    // ── CHUK — Mixed cases ───────────────────────────────────────────────
    {
      hospital: 'CHUK',
      doctorId: emmanuelId,
      patientName: 'Simon B.',
      patientAge: 44,
      patientPhone: '+250784112233',
      symptomSummary:
        'Recurrent testicular pain over 2 months, bilateral, no fever. AI flagged varicocele or epididymitis. Scrotal ultrasound recommended.',
      escalationReason: 'Bilateral testicular pain — scrotal ultrasound needed',
      severity: 'amber',
      status: 'active',
      daysAgo: 7,
    },
    {
      hospital: 'CHUK',
      patientName: 'Josué M.',
      patientAge: 16,
      patientPhone: '+250784334455',
      symptomSummary:
        'Adolescent expressing thoughts of self-harm. AI immediately flagged crisis pathway. Very high risk — urgent mental health crisis intervention required.',
      escalationReason: 'Self-harm ideation — mental health crisis intervention',
      severity: 'red',
      status: 'pending',
      daysAgo: 0,
    },
    {
      hospital: 'CHUK',
      patientName: 'Christophe U.',
      patientAge: 38,
      patientPhone: '+250784556677',
      symptomSummary:
        'Patient reports persistent cough for 3 weeks, night sweats and weight loss. AI suggests infectious pathology — TB screening required.',
      escalationReason: 'Cough + night sweats + weight loss — TB screening',
      severity: 'red',
      status: 'pending',
      daysAgo: 1,
    },
    {
      hospital: 'CHUK',
      patientName: 'Pascal N.',
      patientAge: 27,
      patientPhone: '+250784778899',
      symptomSummary:
        'Patient seeks advice on sexual performance anxiety. Reports erectile dysfunction onset after relationship stress. AI recommends counselling pathway.',
      escalationReason: 'Stress-related erectile dysfunction — counselling indicated',
      severity: 'amber',
      status: 'pending',
      daysAgo: 3,
    },
  ];
}

// ─── Others Have Asked feed ───────────────────────────────────────────────────

const OTHERS_ASKED = [
  {
    question: "I've been feeling exhausted no matter how much I sleep — is this normal?",
    aiAnswer:
      "Many men experience persistent fatigue from stress, poor sleep quality, low iron, or thyroid issues. Try keeping a consistent sleep schedule for two weeks and notice if it improves. If you still feel drained, a quick blood test with a GP can rule out something easy to fix.",
    topic: 'general',
    careBadge: 'green',
  },
  {
    question: "I have headaches almost every day and I'm only 32. Should I worry?",
    aiAnswer:
      "Daily headaches at your age are often linked to stress, screen time, dehydration, or undiagnosed high blood pressure. Try drinking more water, taking short breaks from screens, and checking your blood pressure at a clinic. If they last more than two weeks, see a doctor.",
    topic: 'heart-hypertension',
    careBadge: 'amber',
  },
  {
    question: "I feel down most days but I'm scared to talk to anyone about it.",
    aiAnswer:
      "What you're feeling matters and reaching out — even here — takes courage. Many men carry this quietly. A short conversation with a counsellor at a local clinic is confidential and can really help. You don't have to face this alone.",
    topic: 'mental-health',
    careBadge: 'amber',
  },
  {
    question: 'My urine has been darker than usual for a few days.',
    aiAnswer:
      "This often happens with mild dehydration. Try drinking more water for two days. If the colour stays dark, has a reddish tint, or you feel pain when urinating, a doctor can check this quickly with a simple urine test.",
    topic: 'prostate-urology',
    careBadge: 'amber',
  },
  {
    question: 'I had unprotected sex last week and I am anxious. What should I do?',
    aiAnswer:
      "The right next step is a confidential HIV and STI test at a health centre — Rwanda has free testing at most district hospitals. If it was recent, ask about PEP medication. Whatever the result, you'll know and can act.",
    topic: 'hiv-stis',
    careBadge: 'red',
  },
  {
    question: 'I get up to urinate three or four times every night. Is this normal at 45?',
    aiAnswer:
      "This is common as men age but worth understanding. Cutting fluids two hours before bed often helps. If it persists, a doctor can check your prostate — early checks make later care much easier.",
    topic: 'prostate-urology',
    careBadge: 'amber',
  },
  {
    question: 'I have a small rash on my neck that has been there for two weeks.',
    aiAnswer:
      "Many neck rashes are caused by irritation, heat, or shaving. Keep the area clean and dry and avoid scented products. If it spreads, itches strongly, or weeps fluid, a doctor can give it a proper look.",
    topic: 'skin-eye',
    careBadge: 'green',
  },
  {
    question: 'I had a fever for four days and now I feel weak. Could it be malaria?',
    aiAnswer:
      "Yes, malaria is possible — especially in Rwanda — and a fever lasting four days deserves attention. Visit the nearest health centre for a quick malaria test. Treatment works very well when started early. Don't wait this one out.",
    topic: 'malaria-fever',
    careBadge: 'red',
  },
  {
    question: 'I want to lose weight but I get tired easily. Where do I start?',
    aiAnswer:
      "Start small — a 20-minute walk after dinner, and swapping sweet drinks for water for two weeks. Many men feel a real difference within a month. If the tiredness is unusual, ask a doctor to check your blood sugar and blood pressure.",
    topic: 'diabetes-nutrition',
    careBadge: 'green',
  },
  {
    question: 'My eyes are red and itchy after working long hours.',
    aiAnswer:
      "Many men get this from screen strain or dry eyes. Try the 20-20-20 rule — every 20 minutes look 20 feet away for 20 seconds — and use lubricating eye drops from a pharmacy. If redness lasts more than a week or vision changes, see a doctor.",
    topic: 'skin-eye',
    careBadge: 'green',
  },
  {
    question: "I've been having trouble getting or keeping an erection. What could cause this?",
    aiAnswer:
      "Erectile difficulties are common and mostly treatable. Stress, fatigue, alcohol, and anxiety are the top causes in younger men. In older men, blood pressure or blood sugar can play a role. A doctor can help identify the cause discreetly — this is a medical issue, not a weakness.",
    topic: 'prostate-urology',
    careBadge: 'amber',
  },
  {
    question: 'I feel a lump in one of my testicles. Should I panic?',
    aiAnswer:
      "Most testicular lumps are benign — cysts or varicoceles — but some need prompt evaluation. Don't wait more than a week before seeing a doctor. Testicular cancer is very treatable when caught early. This is worth getting checked quickly.",
    topic: 'prostate-urology',
    careBadge: 'red',
  },
  {
    question: 'I drink alcohol every day to relax. Is that a problem?',
    aiAnswer:
      "Daily alcohol use does affect sleep quality, blood pressure, and mood — often making stress worse over time. Many men use it to cope. A counsellor or GP can help find what's underneath that without judgement. You don't have to stop overnight.",
    topic: 'mental-health',
    careBadge: 'amber',
  },
  {
    question: 'How do I know if I have high blood pressure without a machine?',
    aiAnswer:
      "You often can't — high blood pressure rarely causes symptoms, which is why it's called a silent killer. The only way to know is to get it measured. Most pharmacies and health centres in Rwanda can check it for free. If you haven't checked in over a year, go today.",
    topic: 'heart-hypertension',
    careBadge: 'amber',
  },
  {
    question: 'I have been avoiding people and feel worthless. Is this depression?',
    aiAnswer:
      "What you're describing — withdrawing, feeling worthless — are real symptoms that deserve attention. Many men push through alone and it gets harder. Speaking to a counsellor or mental health specialist is the single most effective first step. You deserve support.",
    topic: 'mental-health',
    careBadge: 'red',
  },
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding Kira Initiative database…\n');

  // ── 1. Hospitals ──────────────────────────────────────────────────────────
  console.log('→ Hospitals…');
  const hospitalMap = new Map();
  for (const h of HOSPITALS) {
    const existing = await prisma.hospital.findUnique({ where: { code: h.code } });
    const record = existing
      ? await prisma.hospital.update({ where: { code: h.code }, data: h })
      : await prisma.hospital.create({ data: h });
    hospitalMap.set(h.code, record);
    console.log(`  ${existing ? 'updated' : 'created'} ${h.name}`);
  }

  // ── 2. Access codes ───────────────────────────────────────────────────────
  console.log('\n→ Access codes…');
  for (const ac of ACCESS_CODES) {
    const hospital = hospitalMap.get(ac.hospitalCode);
    if (!hospital) continue;
    const existing = await prisma.accessCode.findUnique({ where: { code: ac.code } });
    if (!existing) {
      await prisma.accessCode.create({
        data: { code: ac.code, hospitalId: hospital.id, specialty: ac.specialty },
      });
      console.log(`  created ${ac.code}`);
    }
  }

  // ── 3. Doctors ────────────────────────────────────────────────────────────
  console.log('\n→ Doctors…');
  const doctorMap = new Map();
  const passwordHash = await hash('KiraDev123!');

  for (const d of DOCTORS) {
    const hospital = hospitalMap.get(d.hospitalCode);
    if (!hospital) throw new Error(`Hospital ${d.hospitalCode} not found`);
    const existing = await prisma.doctor.findUnique({ where: { email: d.email } });
    const record = existing
      ? existing
      : await prisma.doctor.create({
          data: {
            fullName: d.fullName,
            email: d.email,
            passwordHash,
            medicalLicenseId: d.medicalLicenseId,
            specialty: d.specialty,
            department: d.department,
            hospitalId: hospital.id,
            verificationStatus: 'approved',
            role: 'doctor',
          },
        });
    doctorMap.set(d.email, record);
    console.log(`  ${existing ? 'exists' : 'created'} ${d.fullName} (${d.specialty})`);
  }

  // Admin
  {
    const hospital = hospitalMap.get(ADMIN.hospitalCode);
    const existing = await prisma.doctor.findUnique({ where: { email: ADMIN.email } });
    if (!existing) {
      await prisma.doctor.create({
        data: {
          fullName: ADMIN.fullName,
          email: ADMIN.email,
          passwordHash,
          medicalLicenseId: ADMIN.medicalLicenseId,
          specialty: ADMIN.specialty,
          department: ADMIN.department,
          hospitalId: hospital.id,
          verificationStatus: 'approved',
          role: 'admin',
        },
      });
      console.log('  created Admin');
    }
  }

  const sarah    = doctorMap.get('sarah.uwase@rmh.gov.rw');
  const amina    = doctorMap.get('amina.uwimana@rmh.gov.rw');
  const eric     = doctorMap.get('eric.ntamuhanga@rmh.gov.rw');
  const moses    = doctorMap.get('moses.gatete@kfh.gov.rw');
  const emmanuel = doctorMap.get('emmanuel.mugisha@chuk.gov.rw');

  // ── 4. Escalations ────────────────────────────────────────────────────────
  console.log('\n→ Escalations…');
  const escalationDefs = makeEscalations(sarah.id, amina.id, eric.id, moses.id, emmanuel.id);
  const escalationRecords = [];

  for (const e of escalationDefs) {
    const hospital = hospitalMap.get(e.hospital);

    // Each escalation needs a fake anonymous session
    const sessionToken = `seed-session-${Math.random().toString(36).slice(2, 14)}`;
    const session = await prisma.anonymousSession.create({
      data: {
        sessionToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        severityLevel: e.severity,
      },
    });

    const created = await prisma.escalation.create({
      data: {
        sessionId: session.id,
        patientName: e.patientName,
        patientAge: e.patientAge,
        patientPhone: e.patientPhone,
        hospitalId: hospital.id,
        symptomSummary: e.symptomSummary,
        escalationReason: e.escalationReason,
        severityAtEscalation: e.severity,
        status: e.status,
        assignedDoctorId: e.doctorId || null,
        createdAt: daysAgo(e.daysAgo),
      },
    });
    escalationRecords.push({ ...e, record: created });
    console.log(`  created [${e.severity}/${e.status}] ${e.patientName}`);
  }

  // ── 5. Consultations + SOAP notes ────────────────────────────────────────
  console.log('\n→ Consultations + SOAP notes…');
  const activeEscalations = escalationRecords.filter(
    (e) => e.status === 'active' && e.doctorId,
  );

  for (const e of activeEscalations.slice(0, 5)) {
    const existing = await prisma.consultation.findUnique({
      where: { escalationId: e.record.id },
    });
    if (existing) continue;

    const consult = await prisma.consultation.create({
      data: {
        escalationId: e.record.id,
        doctorId: e.doctorId,
        status: 'active',
        riskLevel: e.severity === 'red' ? 'critical' : 'medium',
        recommendation: 'Clinical examination and targeted diagnostic panel in progress.',
      },
    });

    // Seed a couple of consult messages
    await prisma.consultMessage.createMany({
      data: [
        {
          consultationId: consult.id,
          senderRole: 'doctor',
          content: `Hello ${e.patientName.split(' ')[0]}, I've reviewed the summary from your chat session. I'd like to ask a few follow-up questions.`,
          seenByPatient: true,
          seenByDoctor: true,
        },
        {
          consultationId: consult.id,
          senderRole: 'patient',
          content: 'Yes, I can answer. The symptoms started about 3 weeks ago.',
          seenByPatient: true,
          seenByDoctor: true,
        },
        {
          consultationId: consult.id,
          senderRole: 'doctor',
          content: 'Thank you. Please come in for a physical examination — I will send appointment details shortly.',
          seenByPatient: false,
          seenByDoctor: true,
        },
      ],
    });

    // SOAP note for first 3
    if (activeEscalations.indexOf(e) < 3) {
      await prisma.soapNote.create({
        data: {
          consultationId: consult.id,
          subjective: `Patient reports ${e.escalationReason.toLowerCase()}. Onset ${e.record.createdAt ? Math.ceil((Date.now() - new Date(e.record.createdAt).getTime()) / 86400000) : 3} days ago. No relevant past medical history disclosed.`,
          objective: 'Vital signs pending physical exam. Reported symptoms consistent with clinical presentation. No fever documented.',
          assessment: e.severity === 'red'
            ? 'High clinical urgency. Differential includes infectious, inflammatory, and structural pathology. Immediate workup warranted.'
            : 'Moderate clinical concern. Targeted investigation recommended to establish diagnosis.',
          plan: 'Arrange in-person clinical examination within 48 hours. Order relevant diagnostic panel (urinalysis, STI screen, ultrasound as indicated). Follow up on results within 72 hours.',
          finalized: false,
        },
      });
    }

    // Internal note
    await prisma.internalNote.create({
      data: {
        consultationId: consult.id,
        content: `Patient escalated via AI chat. Specialty match: ${e.severity === 'red' ? 'Priority case — expedite' : 'Routine clinic slot acceptable'}. Access code used: KIRA-RMH-GYN1.`,
      },
    });

    console.log(`  consultation for ${e.patientName}`);
  }

  // ── 6. Appointments ───────────────────────────────────────────────────────
  console.log('\n→ Appointments…');
  const rmhHospital = hospitalMap.get('RMH');

  // Pick 2 active RMH escalations for today's appointments
  const rmhActive = escalationRecords.filter(
    (e) => e.hospital === 'RMH' && e.status === 'active' && e.doctorId === sarah.id,
  );

  const apptSlots = [
    { hours: 9, minutes: 30, type: 'in-person' },
    { hours: 14, minutes: 0, type: 'in-person' },
    { hours: 10, minutes: 0, type: 'video' },
  ];

  for (let i = 0; i < Math.min(rmhActive.length, 2); i++) {
    const e = rmhActive[i];
    const existing = await prisma.appointment.findUnique({ where: { escalationId: e.record.id } });
    if (existing) continue;
    await prisma.appointment.create({
      data: {
        escalationId: e.record.id,
        doctorId: sarah.id,
        hospitalId: rmhHospital.id,
        scheduledAt: todayAt(apptSlots[i].hours, apptSlots[i].minutes),
        type: apptSlots[i].type,
        status: 'scheduled',
        notes: 'Confirmed via SMS',
      },
    });
    console.log(`  appointment today at ${apptSlots[i].hours}:${String(apptSlots[i].minutes).padStart(2, '0')} for ${e.patientName}`);
  }

  // One upcoming appointment (tomorrow)
  if (rmhActive.length >= 3) {
    const e = rmhActive[2];
    const existing = await prisma.appointment.findUnique({ where: { escalationId: e.record.id } });
    if (!existing) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(11, 0, 0, 0);
      await prisma.appointment.create({
        data: {
          escalationId: e.record.id,
          doctorId: sarah.id,
          hospitalId: rmhHospital.id,
          scheduledAt: tomorrow,
          type: 'in-person',
          status: 'scheduled',
          notes: 'Urgent follow-up',
        },
      });
      console.log(`  appointment tomorrow at 11:00 for ${e.patientName}`);
    }
  }

  // ── 7. Security logs ──────────────────────────────────────────────────────
  console.log('\n→ Security logs…');
  const securityEvents = [
    { doctorId: sarah.id,    event: 'login',          ipAddress: '41.186.21.10', daysAgo: 0 },
    { doctorId: sarah.id,    event: 'login',          ipAddress: '41.186.21.10', daysAgo: 1 },
    { doctorId: sarah.id,    event: 'login',          ipAddress: '41.186.21.10', daysAgo: 2 },
    { doctorId: sarah.id,    event: 'case_opened',    ipAddress: '41.186.21.10', daysAgo: 0 },
    { doctorId: sarah.id,    event: 'case_opened',    ipAddress: '41.186.21.10', daysAgo: 1 },
    { doctorId: sarah.id,    event: 'note_created',   ipAddress: '41.186.21.10', daysAgo: 1 },
    { doctorId: amina.id,    event: 'login',          ipAddress: '41.186.22.15', daysAgo: 0 },
    { doctorId: amina.id,    event: 'case_opened',    ipAddress: '41.186.22.15', daysAgo: 0 },
    { doctorId: eric.id,     event: 'login',          ipAddress: '41.186.25.44', daysAgo: 3 },
    { doctorId: eric.id,     event: 'case_closed',    ipAddress: '41.186.25.44', daysAgo: 3 },
    { doctorId: moses.id,    event: 'login',          ipAddress: '41.186.30.71', daysAgo: 1 },
    { doctorId: moses.id,    event: 'case_opened',    ipAddress: '41.186.30.71', daysAgo: 1 },
    { doctorId: emmanuel.id, event: 'login',          ipAddress: '41.186.45.9',  daysAgo: 2 },
    { doctorId: emmanuel.id, event: 'soap_finalized', ipAddress: '41.186.45.9',  daysAgo: 2 },
    { doctorId: null,        event: 'login_failed',   ipAddress: '197.250.33.8', daysAgo: 0,
      metadata: { reason: 'bad_password', email: 'unknown@test.com' } },
  ];

  const existingLogCount = await prisma.securityLog.count();
  if (existingLogCount === 0) {
    for (const ev of securityEvents) {
      await prisma.securityLog.create({
        data: {
          doctorId: ev.doctorId,
          event: ev.event,
          ipAddress: ev.ipAddress,
          userAgent: 'Mozilla/5.0 (seed data)',
          metadata: ev.metadata || null,
          createdAt: daysAgo(ev.daysAgo),
        },
      });
    }
    console.log(`  created ${securityEvents.length} security log entries`);
  } else {
    console.log('  skipped (logs already exist)');
  }

  // ── 8. Others Have Asked feed ────────────────────────────────────────────
  console.log('\n→ Others Have Asked feed…');
  for (const entry of OTHERS_ASKED) {
    const existing = await prisma.othersAskedEntry.findFirst({ where: { question: entry.question } });
    if (!existing) {
      await prisma.othersAskedEntry.create({ data: entry });
      console.log(`  created "${entry.question.slice(0, 50)}…"`);
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Demo login credentials (all passwords: KiraDev123!)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  sarah.uwase@rmh.gov.rw   → Dr. Sarah Uwase, Gynecologist @ RMH');
  console.log('  amina.uwimana@rmh.gov.rw → Dr. Amina Uwimana, Sexual Health @ RMH');
  console.log('  moses.gatete@kfh.gov.rw  → Dr. Moses Gatete, Urologist @ KFH');
  console.log('  admin@kirainitiative.rw  → Admin');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Sample access codes:');
  console.log('  KIRA-RMH-GYN1  → RMH / Gynecologist');
  console.log('  KIRA-RMH-URO1  → RMH / Urologist');
  console.log('  KIRA-KFH-URO1  → KFH / Urologist');
  console.log('  KIRA-CHUK-MNT1 → CHUK / Mental Health Specialist');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
