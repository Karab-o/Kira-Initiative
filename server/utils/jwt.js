import jwt from 'jsonwebtoken';

const DEFAULT_TTL = '8h';

export function signDoctorToken(doctor) {
  return jwt.sign(
    {
      doctorId: doctor.id,
      email: doctor.email,
      role: doctor.role || 'doctor',
      hospitalId: doctor.hospitalId,
    },
    process.env.JWT_SECRET,
    { expiresIn: DEFAULT_TTL }
  );
}

export function verifyDoctorToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
