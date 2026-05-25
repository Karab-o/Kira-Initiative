import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const HOSPITALS = [
  {
    name: 'CHUK',
    fullName: 'Centre Hospitalier Universitaire de Kigali',
    address: 'KN 4 Ave, Kigali',
    helpdeskPhone: '+250788310000',
    type: 'public',
    departments: ['Urology', 'Internal Medicine', 'Cardiology', 'Mental Health', 'Sexual Health'],
  },
  {
    name: 'King Faisal Hospital',
    fullName: 'King Faisal Hospital Rwanda',
    address: 'KG 544 St, Kigali',
    helpdeskPhone: '+250252582421',
    type: 'private',
    departments: ['Urology', 'Cardiology', 'Diabetes & Endocrinology', 'Internal Medicine'],
  },
  {
    name: 'Kibagabaga District Hospital',
    fullName: 'Kibagabaga District Hospital',
    address: 'Kibagabaga, Kigali',
    helpdeskPhone: '+250788303305',
    type: 'public',
    departments: ['General Practice', 'Internal Medicine', 'Mental Health'],
  },
  {
    name: 'Masaka District Hospital',
    fullName: 'Masaka District Hospital',
    address: 'Masaka, Kigali',
    helpdeskPhone: '+250788862000',
    type: 'public',
    departments: ['General Practice', 'Sexual Health', 'Internal Medicine'],
  },
  {
    name: 'Rwanda Military Hospital',
    fullName: 'Rwanda Military Hospital',
    address: 'Kanombe, Kigali',
    helpdeskPhone: '+250788302000',
    type: 'referral',
    departments: ['Urology', 'Sexual Health', 'Cardiology', 'Internal Medicine'],
  },
];

const DOCTORS = [
  {
    fullName: 'Dr. Emmanuel Mugisha',
    email: 'emmanuel.mugisha@kirainitiative.rw',
    medicalLicenseId: 'RW-MD-10293',
    specialty: "Men's Health & Urology",
    department: 'Urology',
    hospitalName: 'CHUK',
  },
  {
    fullName: 'Dr. Solange Kaneza',
    email: 'solange.kaneza@kirainitiative.rw',
    medicalLicenseId: 'RW-MD-10485',
    specialty: 'Internal Medicine',
    department: 'Internal Medicine',
    hospitalName: 'King Faisal Hospital',
  },
  {
    fullName: 'Dr. Patrick Habimana',
    email: 'patrick.habimana@kirainitiative.rw',
    medicalLicenseId: 'RW-MD-11272',
    specialty: 'General Practice',
    department: 'General Practice',
    hospitalName: 'Kibagabaga District Hospital',
  },
  {
    fullName: 'Dr. Amina Uwase',
    email: 'amina.uwase@kirainitiative.rw',
    medicalLicenseId: 'RW-MD-11801',
    specialty: 'Sexual Health',
    department: 'Sexual Health',
    hospitalName: 'Rwanda Military Hospital',
  },
];

const ADMIN = {
  fullName: 'Kira Admin',
  email: 'admin@kirainitiative.rw',
  medicalLicenseId: 'RW-ADMIN-0001',
  specialty: 'Administration',
  department: 'Operations',
  hospitalName: 'CHUK',
  role: 'admin',
};

const OTHERS_ASKED = [
  {
    question: "I've been feeling exhausted no matter how much I sleep — is this normal?",
    aiAnswer:
      "Many men experience this kind of persistent fatigue. It can come from stress, poor sleep quality, low iron, or sometimes thyroid issues. Try keeping a consistent sleep schedule for two weeks and notice if it improves. If you still feel drained, a quick blood test with a GP can rule out something easy to fix.",
    topic: 'general',
    careBadge: 'green',
  },
  {
    question: "I have headaches almost every day and I'm only 32. Should I worry?",
    aiAnswer:
      "Headaches at your age are common and often linked to stress, screen time, dehydration, or undiagnosed high blood pressure. Try drinking more water, taking short breaks from screens, and checking your blood pressure at a clinic. If they last more than two weeks, see a doctor.",
    topic: 'heart-hypertension',
    careBadge: 'amber',
  },
  {
    question: "I feel down most days but I'm scared to talk to anyone about it.",
    aiAnswer:
      "What you're feeling matters and reaching out — even here — already takes courage. Many men carry this quietly. A short conversation with a counsellor at a local clinic is confidential and can really help. You don't have to face this alone.",
    topic: 'mental-health',
    careBadge: 'amber',
  },
  {
    question: 'My urine has been darker than usual for a few days.',
    aiAnswer:
      "Many men notice this when they're a bit dehydrated. Try drinking more water for two days. If the colour stays dark, has a reddish tint, or you feel pain when urinating, a doctor can check this quickly with a simple urine test.",
    topic: 'prostate-urology',
    careBadge: 'amber',
  },
  {
    question: 'I had unprotected sex last week and I am anxious. What should I do?',
    aiAnswer:
      "Many men face this and feel exactly what you're feeling now. The right next step is a confidential HIV and STI test at a health centre — Rwanda has free testing at most district hospitals. If it was recent, ask about PEP medication. Whatever the result, you'll know and can act.",
    topic: 'hiv-stis',
    careBadge: 'red',
  },
  {
    question: 'I get up to urinate three or four times every night. Is this normal at 45?',
    aiAnswer:
      "This is common as men age but it's worth understanding why. Cutting fluids two hours before bed often helps. If it persists, a doctor can check your prostate with a simple exam — early checks make later care much easier.",
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
      "Start small — a 20 minute walk after dinner, and swapping sweet drinks for water for two weeks. Many men feel a real difference within a month. If the tiredness is unusual, ask a doctor to check your blood sugar and blood pressure.",
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
];

async function upsertHospital(h) {
  const existing = await prisma.hospital.findFirst({ where: { name: h.name } });
  if (existing) return existing;
  return prisma.hospital.create({ data: h });
}

async function upsertDoctor(d, hospitalMap, isAdmin = false) {
  const passwordHash = await bcrypt.hash('KiraDev123!', 12);
  const hospital = hospitalMap.get(d.hospitalName);
  if (!hospital) throw new Error(`Hospital ${d.hospitalName} not seeded`);

  const existing = await prisma.doctor.findUnique({ where: { email: d.email } });
  if (existing) return existing;

  return prisma.doctor.create({
    data: {
      fullName: d.fullName,
      email: d.email,
      passwordHash,
      medicalLicenseId: d.medicalLicenseId,
      specialty: d.specialty,
      department: d.department,
      hospitalId: hospital.id,
      verificationStatus: 'approved',
      role: isAdmin ? 'admin' : 'doctor',
    },
  });
}

async function main() {
  console.log('Seeding hospitals…');
  const hospitalRecords = await Promise.all(HOSPITALS.map(upsertHospital));
  const hospitalMap = new Map(hospitalRecords.map((h) => [h.name, h]));

  console.log('Seeding doctors…');
  for (const d of DOCTORS) await upsertDoctor(d, hospitalMap);
  await upsertDoctor(ADMIN, hospitalMap, true);

  console.log('Seeding Others Have Asked feed…');
  for (const entry of OTHERS_ASKED) {
    const existing = await prisma.othersAskedEntry.findFirst({ where: { question: entry.question } });
    if (!existing) await prisma.othersAskedEntry.create({ data: entry });
  }

  console.log('Seed complete.');
  console.log('');
  console.log('Doctor login (dev): any seeded doctor email above, password "KiraDev123!"');
  console.log('Admin login:        admin@kirainitiative.rw / KiraDev123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
