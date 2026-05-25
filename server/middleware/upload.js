import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadRoot = path.resolve(__dirname, '..', process.env.UPLOAD_DIR || './uploads');

if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });

function sub(dir) {
  const p = path.join(uploadRoot, dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  return p;
}

function makeStorage(folder) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, sub(folder)),
    filename: (_req, file, cb) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safe}`);
    },
  });
}

const imageFilter = (_req, file, cb) => {
  if (/^image\/(png|jpe?g|webp)$/.test(file.mimetype)) return cb(null, true);
  cb(new Error('Only PNG, JPG, and WebP images are allowed'));
};

const pdfFilter = (_req, file, cb) => {
  if (file.mimetype === 'application/pdf') return cb(null, true);
  cb(new Error('Only PDF files are allowed'));
};

export const uploadScan = multer({
  storage: makeStorage('scans'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadPrescription = multer({
  storage: makeStorage('prescriptions'),
  fileFilter: pdfFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadLicense = multer({
  storage: makeStorage('licenses'),
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' || /^image\//.test(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error('License must be PDF or image'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadProfilePhoto = multer({
  storage: makeStorage('profiles'),
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

export { uploadRoot };
