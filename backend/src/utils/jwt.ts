import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-super-secret';
const JWT_EXPIRES_IN = '7d';

export interface JwtPayload {
  userId: string;
  companyId?: string;
  role: string;
  email: string;
  isSuperAdmin?: boolean;
  isImpersonated?: boolean;
  impersonatedBy?: string;
}

export function signToken(payload: JwtPayload, expiresIn?: string): string {
  const options: SignOptions = {
    expiresIn: (expiresIn || JWT_EXPIRES_IN) as string,
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

// Alias per compatibilità
export function verifyAccessToken(token: string): JwtPayload {
  return verifyToken(token);
}

export function verifyRefreshToken(token: string): JwtPayload {
  return verifyToken(token);
} 
