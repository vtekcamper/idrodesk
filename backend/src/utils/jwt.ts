import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'changeme-super-secret';
const JWT_EXPIRES_IN = '7d'; // puoi cambiarla a piacere

// Payload base che metteremo nel token.
// Se nel progetto Cursor ha usato un'interfaccia diversa, puoi aggiungere campi.
export interface JwtPayload {
  userId: string;
  companyId: string;
  role: string;
}

// Genera un token JWT
export function signToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
  };

  return jwt.sign(payload, JWT_SECRET, options);
}

// Verifica un token e restituisce il payload tipizzato
export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, JWT_SECRET);
  return decoded as JwtPayload;
}
