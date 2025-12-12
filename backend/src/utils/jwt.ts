import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-super-secret';
const JWT_EXPIRES_IN = '7d';

export interface JwtPayload {
  userId: string;
  companyId?: string;
  role: string;
  email: string;
  isSuperAdmin?: boolean;
}

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

// alias per compatibilità con quello che usano i controller
export function generateAccessToken(payload: JwtPayload): string {
  return signToken(payload);
}

export function generateRefreshToken(payload: JwtPayload): string {
  // per ora identico: se un domani vuoi refresh separato, cambiamo qui
  return signToken(payload);
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, JWT_SECRET);
  return decoded as JwtPayload;
} 
