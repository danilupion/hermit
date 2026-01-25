import * as argon2 from 'argon2';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'hermit-dev-secret-change-in-production',
);
const JWT_ISSUER = 'hermit-relay';
const JWT_AUDIENCE = 'hermit-client';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export const hashPassword = async (password: string): Promise<string> => {
  return argon2.hash(password);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return argon2.verify(hash, password);
};

export const generateAccessToken = async (userId: string, email: string): Promise<string> => {
  return new jose.SignJWT({ sub: userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
};

export const generateRefreshToken = async (userId: string): Promise<string> => {
  return new jose.SignJWT({ sub: userId, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
};

export type TokenPayload = {
  sub: string;
  email?: string;
  type?: string;
};

export const verifyToken = async (token: string): Promise<TokenPayload> => {
  const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
  return payload as TokenPayload;
};

export const generateMachineToken = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = Buffer.from(bytes).toString('base64url');
  return `hmt_${token}`;
};

export const hashMachineToken = async (token: string): Promise<string> => {
  return argon2.hash(token);
};

export const verifyMachineToken = async (token: string, hash: string): Promise<boolean> => {
  return argon2.verify(hash, token);
};
