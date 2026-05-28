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
  // RMH — gynaecology, urology, sexual health
  { code: 'KIRA-RMH-GYN1', hospitalCode: 'RMH', specialty: 'Gynecologist' },
  { code: 'KIRA-RMH-GYN2', hospitalCode: 'RMH', specialty: 'Gynecologist' },
  { code: 'KIRA-RMH-URO1', hospitalCode: 'RMH', specialty: 'Urologist' },
  { code: 'KIRA-RMH-SXH1', hospitalCode: 'RMH', specialty: 'Sexual Health Specialist' },
  // KFH — urology, gynaecology
  { code: 'KIRA-KFH-URO1', hospitalCode: 'KFH', specialty: 'Urologist' },
  { code: 'KIRA-KFH-GYN1', hospitalCode: 'KFH', specialty: 'Gynecologist' },
  // CHUK — urology, gynaecology, sexual health
  { code: 'KIRA-CHUK-URO1', hospitalCode: 'CHUK', specialty: 'Urologist' },
  { code: 'KIRA-CHUK-GYN1', hospitalCode: 'CHUK', specialty: 'Gynecologist' },
  { code: 'KIRA-CHUK-SXH1', hospitalCode: 'CHUK', specialty: 'Sexual Health Specialist' },
  // KGB — sexual health, gynaecology
  { code: 'KIRA-KGB-SXH1', hospitalCode: 'KGB', specialty: 'Sexual Health Specialist' },
  { code: 'KIRA-KGB-GYN1', hospitalCode: 'KGB', specialty: 'Gynecologist' },
  // MSK — sexual health
  { code: 'KIRA-MSK-SXH1', hospitalCode: 'MSK', specialty: 'Sexual Health Specialist' },
  { code: 'KIRA-MSK-URO1', hospitalCode: 'MSK', specialty: 'Urologist' },
];

// ─── Doctors ─────────────────────────────────────────────────────────────────
// Kira works exclusively with gynaecologists, urologists, and sexual health specialists.

const DOCTORS = [
  // ── RMH ──────────────────────────────────────────────────────────────────
  {
    fullName: 'Dr. Sarah Uwase',
    email: 'sarah.uwase@rmh.gov.rw',
    medicalLicenseId: 'RW-GYN-4420',
    specialty: 'Gynecologist',
    department: 'Gynecology',
    hospitalCode: 'RMH',
    // Primary demo login: sarah.uwase@rmh.gov.rw / KiraDev123!
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
    fullName: 'Dr. Jean-Luc Habimana',
    email: 'jeanluc.habimana@rmh.gov.rw',
    medicalLicenseId: 'RW-URO-6680',
    specialty: 'Urologist',
    department: 'Urology',
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
    // Secondary demo login: moses.gatete@kfh.gov.rw / KiraDev123!
  },
  {
    fullName: 'Dr. Solange Kaneza',
    email: 'solange.kaneza@kfh.gov.rw',
    medicalLicenseId: 'RW-GYN-7743',
    specialty: 'Gynecologist',
    department: 'Gynecology',
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
    medicalLicenseId: 'RW-GYN-6610',
    specialty: 'Gynecologist',
    department: 'Gynecology',
    hospitalCode: 'CHUK',
  },
  // ── KGB ──────────────────────────────────────────────────────────────────
  {
    fullName: 'Dr. Alice Mukamazimpaka',
    email: 'alice.mukamazimpaka@kgb.gov.rw',
    medicalLicenseId: 'RW-SXH-11272',
    specialty: 'Sexual Health Specialist',
    department: 'Sexual Health',
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

function makeEscalations(sarahId, aminaId, mosesId, emmanuelId, claudineId) {
  return [
    // ── RMH — Active assigned to Sarah (3) ──────────────────────────────
    {
      hospital: 'RMH',
      doctorId: sarahId,
      patientName: 'Karim M.',
      patientAge: 34,
      patientPhone: '+250780112233',
      symptomSummary:
        'Patient reports 3 weeks of lower abdominal discomfort and unusual discharge. Sexual health history disclosed during AI chat. Possible STI — clinical exam and STI panel recommended.',
      escalationReason: 'Possible sexually transmitted infection — requires clinical screening',
      severity: 'amber',
      status: 'active',
      daysAgo: 3,
    },
    {
      hospital: 'RMH',
      doctorId: sarahId,
      patientName: 'Diane N.',
      patientAge: 28,
      patientPhone: '+250780334455',
      symptomSummary:
        'Female patient reports painful urination and pelvic discomfort for 5 days, yellowish vaginal discharge. First-time STI concern. AI flags moderate risk — gynaecological and STI evaluation recommended.',
      escalationReason: 'Pelvic pain + abnormal discharge — gynaecological assessment needed',
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
        'Male patient reports recurrent pelvic pain and haematuria once last week. AI rates high risk. Urgent urology consult recommended — rule out urological pathology.',
      escalationReason: 'Haematuria + pelvic pain — urgent urological review',
      severity: 'red',
      status: 'active',
      daysAgo: 2,
    },
    // ── RMH — Pending ────────────────────────────────────────────────────
    {
      hospital: 'RMH',
      patientName: 'Théo K.',
      patientAge: 22,
      patientPhone: '+250780778899',
      symptomSummary:
        'Young male reporting anxiety about recent unprotected intercourse within last 48 hours. AI flagged HIV/STI exposure risk. PEP window still open — urgent assessment required.',
      escalationReason: 'Potential HIV exposure — PEP window assessment needed urgently',
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
        'Male patient reports persistent erectile dysfunction and significantly reduced libido over 3 months. AI suggests possible low testosterone or vascular cause. Urological and hormonal evaluation recommended.',
      escalationReason: 'Persistent ED + low libido — urological / hormonal assessment needed',
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
        'Male patient describes burning sensation after sex and white penile discharge for 1 week. First-time STI concern. AI rates amber risk. Clinical STI screening indicated.',
      escalationReason: 'Penile discharge + burning — STI screening required',
      severity: 'amber',
      status: 'pending',
      daysAgo: 2,
    },
    {
      hospital: 'RMH',
      patientName: 'Marie U.',
      patientAge: 25,
      patientPhone: '+250781556677',
      symptomSummary:
        'Young female reports irregular periods for 4 months, pelvic pain, and difficulty conceiving after 10 months of trying. AI flagged possible PCOS or other gynaecological cause. Gynaecological evaluation and hormonal panel recommended.',
      escalationReason: 'Irregular periods + pelvic pain + fertility concern — gynaecological assessment',
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
      doctorId: aminaId,
      patientName: 'Alain B.',
      patientAge: 29,
      patientPhone: '+250782112233',
      symptomSummary: 'Male patient with genital rash and itching — confirmed as genital herpes simplex. Patient counselled on management, antiviral therapy initiated. Follow-up scheduled.',
      escalationReason: 'Genital rash — herpes simplex confirmed, treatment initiated',
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
        'Male patient reports inability to achieve erection for the past 4 months. Patient attributes this to stress and fatigue. AI recommends urological evaluation to rule out vascular or hormonal cause.',
      escalationReason: 'Erectile dysfunction persisting 4 months — urological evaluation needed',
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
      patientName: 'Josiane M.',
      patientAge: 23,
      patientPhone: '+250784334455',
      symptomSummary:
        'Female patient reports severe lower abdominal pain, one-sided, with late period and spotting. AI flagged possible ectopic pregnancy — urgent gynaecological assessment required immediately.',
      escalationReason: 'Suspected ectopic pregnancy — urgent gynaecological assessment',
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
        'Male patient reports foul-smelling penile discharge and scrotal swelling for 2 weeks. History of unprotected sex with multiple partners. AI suggests gonorrhoea or chlamydia with epididymitis risk.',
      escalationReason: 'Penile discharge + scrotal swelling — possible epididymitis / STI',
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
  // ── STIs & Testing ─────────────────────────────────────────────────────────
  {
    question: 'I noticed unusual discharge and a burning feeling when I urinate.',
    aiAnswer:
      "These are common signs of a sexually transmitted infection such as gonorrhoea or chlamydia — both are treatable with antibiotics. Visit a health centre as soon as you can. Testing is confidential. Avoid sexual contact until you have been checked and treated so your partner is also protected.",
    topic: 'stis-testing',
    careBadge: 'amber',
  },
  {
    question: 'How do I know if I have an STI if I have no symptoms?',
    aiAnswer:
      "Many STIs — including chlamydia and early HIV — cause no obvious symptoms, which is how they spread silently. If you have had unprotected sex with a new or multiple partners, getting tested is the only reliable way to know. Health centres in Rwanda offer confidential testing. Knowing protects both you and your partners.",
    topic: 'stis-testing',
    careBadge: 'amber',
  },
  {
    question: 'What happens during an STI test at a health centre in Rwanda?',
    aiAnswer:
      "An STI test is simple and confidential. A healthcare worker will take a small urine sample or a swab from the affected area. For HIV, a finger-prick blood test gives results in 15–20 minutes. All testing is free at government health centres and no referral is needed. Results are shared only with you.",
    topic: 'stis-testing',
    careBadge: 'green',
  },
  {
    question: 'I have genital sores that come and go. What could this be?',
    aiAnswer:
      "Recurring genital sores are often herpes simplex (HSV-2). They appear as clusters of blisters or ulcers, heal within 1–2 weeks, and return periodically — often triggered by stress. Herpes is very common and manageable, not curable. A doctor can confirm the diagnosis and prescribe antiviral therapy to reduce outbreaks and transmission risk.",
    topic: 'stis-testing',
    careBadge: 'amber',
  },
  // ── HIV / PEP / PrEP ───────────────────────────────────────────────────────
  {
    question: 'I may have been exposed to HIV. What should I do immediately?',
    aiAnswer:
      "If the exposure happened within the last 72 hours, go to a district hospital or health centre right now and ask for PEP (post-exposure prophylaxis). PEP is free in Rwanda and is highly effective when started quickly. After 72 hours PEP is no longer effective, so timing matters. An HIV test will also be offered.",
    topic: 'hiv-prep-pep',
    careBadge: 'red',
  },
  {
    question: 'I want to protect myself from HIV. Is PrEP available in Rwanda?',
    aiAnswer:
      "Yes — PrEP (pre-exposure prophylaxis for HIV) is available in Rwanda at TRAC Plus facilities and selected health centres including Kibagabaga Hospital. It is highly effective when taken daily. Speak to a healthcare provider about whether it is right for you. Condom use remains important for protection against other STIs.",
    topic: 'hiv-prep-pep',
    careBadge: 'green',
  },
  {
    question: 'My partner tested positive for HIV. What do I do now?',
    aiAnswer:
      "First: if your partner disclosed recently and you have had unprotected sex in the last 72 hours, go to a hospital immediately for PEP — this can prevent transmission if started quickly. Then: get tested yourself. If your test is negative, talk to a doctor about PrEP for ongoing protection. Your partner's status doesn't have to determine yours.",
    topic: 'hiv-prep-pep',
    careBadge: 'red',
  },
  // ── Women's Health ─────────────────────────────────────────────────────────
  {
    question: 'I have been having unusual vaginal discharge with a bad smell.',
    aiAnswer:
      "Abnormal discharge — especially with a foul or fishy odour — often signals bacterial vaginosis (BV) or an STI. BV is very common and easily treated with antibiotics. If the discharge is also yellowish or green with pelvic pain, it could be an STI. A gynaecologist or sexual health clinic can identify the cause with a simple swab test.",
    topic: 'womens-health',
    careBadge: 'amber',
  },
  {
    question: 'Sex has been painful for me lately.',
    aiAnswer:
      "Painful sex (dyspareunia) is common but not something to ignore. In women, it is often caused by insufficient lubrication, a vaginal infection, endometriosis, or pelvic inflammatory disease. If it has been going on for more than two weeks, a gynaecologist can identify the cause and offer treatment.",
    topic: 'womens-health',
    careBadge: 'amber',
  },
  {
    question: 'My periods have become very irregular in the past few months.',
    aiAnswer:
      "Irregular periods are often caused by stress, significant weight changes, thyroid issues, or polycystic ovary syndrome (PCOS). PCOS is the most common hormonal disorder in women of reproductive age — symptoms include irregular periods, excess hair, and difficulty conceiving. A gynaecologist can confirm the diagnosis with a blood test and ultrasound.",
    topic: 'womens-health',
    careBadge: 'amber',
  },
  {
    question: 'How often should I have a cervical screening (Pap smear)?',
    aiAnswer:
      "Cervical screening (Pap smear) is recommended every 3 years for sexually active women aged 21 and older. It detects early cell changes caused by HPV before they become cancer — catching this early is completely lifesaving. Screening is available at CHUK, King Faisal, Rwanda Military Hospital, and all district hospitals.",
    topic: 'womens-health',
    careBadge: 'green',
  },
  // ── Men's Health ───────────────────────────────────────────────────────────
  {
    question: "I've been having trouble getting or keeping an erection.",
    aiAnswer:
      "Erectile difficulties are common and mostly treatable. Stress, fatigue, alcohol, and anxiety are the top causes in younger men. In older men, blood pressure or diabetes can play a role. A urologist can help identify the cause discreetly — this is a medical issue, not a weakness. Persistent ED lasting more than 3 months needs evaluation.",
    topic: 'mens-health',
    careBadge: 'amber',
  },
  {
    question: 'I finish too quickly during sex and it is affecting my relationship.',
    aiAnswer:
      "Premature ejaculation is one of the most common male sexual concerns — you are not alone. Behavioural techniques (start-stop, squeeze method) help many men significantly. Stress, anxiety, and relationship tension often play a big role. A urologist or sexual health specialist can discuss options discreetly; there is no shame in asking.",
    topic: 'mens-health',
    careBadge: 'green',
  },
  {
    question: 'I feel a lump in one of my testicles. Should I be worried?',
    aiAnswer:
      "Most testicular lumps are benign — cysts or varicoceles — but some need prompt evaluation. Any new testicular lump should be seen by a urologist within a week. Testicular cancer is very treatable when caught early. This is worth getting checked quickly rather than waiting.",
    topic: 'mens-health',
    careBadge: 'red',
  },
  {
    question: 'I have penile discharge and pain. What does this mean?',
    aiAnswer:
      "Penile discharge combined with pain or burning is a classic sign of gonorrhoea or chlamydia. Both are common and fully treatable with antibiotics. Visit a health centre for a quick STI test — it is confidential and free. Avoid sexual contact until you and your partner(s) have been tested and treated.",
    topic: 'mens-health',
    careBadge: 'amber',
  },
  // ── Contraception ──────────────────────────────────────────────────────────
  {
    question: 'What contraception options are available for free in Rwanda?',
    aiAnswer:
      "Rwanda offers several free contraceptive methods at all health centres: condoms, combined oral contraceptive pills, the injectable (Depo-Provera, every 3 months), the implant (3 years), and the IUD (5–10 years). Emergency contraception (morning-after pill) is available within 72 hours at pharmacies. A nurse can help you choose the best option for you.",
    topic: 'contraception',
    careBadge: 'green',
  },
  {
    question: 'I had unprotected sex. Is there something I can take to prevent pregnancy?',
    aiAnswer:
      "Yes — emergency contraception (the morning-after pill) can prevent pregnancy if taken within 72 hours of unprotected sex, with maximum effectiveness in the first 24 hours. It is available at pharmacies across Rwanda without a prescription. It is safe to use but not intended as regular contraception.",
    topic: 'contraception',
    careBadge: 'amber',
  },
  {
    question: 'I want a long-term contraception method. What should I consider?',
    aiAnswer:
      "The best long-term options are the implant (inserted under the skin, effective 3 years) and the IUD (inserted into the uterus, effective 5–10 years). Both are over 99% effective and reversible. They are free at government health centres. A gynaecologist or trained nurse will help you decide which fits your health and lifestyle.",
    topic: 'contraception',
    careBadge: 'green',
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
  const moses    = doctorMap.get('moses.gatete@kfh.gov.rw');
  const emmanuel = doctorMap.get('emmanuel.mugisha@chuk.gov.rw');
  const claudine = doctorMap.get('claudine.ingabire@chuk.gov.rw');

  // ── 4. Escalations ────────────────────────────────────────────────────────
  console.log('\n→ Escalations…');
  const escalationDefs = makeEscalations(sarah.id, amina.id, moses.id, emmanuel.id, claudine.id);
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
    { doctorId: claudine.id, event: 'login',          ipAddress: '41.186.25.44', daysAgo: 3 },
    { doctorId: claudine.id, event: 'case_closed',    ipAddress: '41.186.25.44', daysAgo: 3 },
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
  console.log('  sarah.uwase@rmh.gov.rw      → Dr. Sarah Uwase, Gynecologist @ RMH');
  console.log('  amina.uwimana@rmh.gov.rw    → Dr. Amina Uwimana, Sexual Health Specialist @ RMH');
  console.log('  moses.gatete@kfh.gov.rw     → Dr. Moses Gatete, Urologist @ KFH');
  console.log('  emmanuel.mugisha@chuk.gov.rw→ Dr. Emmanuel Mugisha, Urologist @ CHUK');
  console.log('  admin@kirainitiative.rw     → Admin');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Sample access codes:');
  console.log('  KIRA-RMH-GYN1  → RMH / Gynecologist');
  console.log('  KIRA-RMH-SXH1  → RMH / Sexual Health Specialist');
  console.log('  KIRA-KFH-URO1  → KFH / Urologist');
  console.log('  KIRA-CHUK-URO1 → CHUK / Urologist');
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
