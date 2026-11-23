import { SignJWT, jwtVerify } from 'jose';

export type AdminSession = {
  userId: string;
  email: string;
  role: 'admin';
};

function getSecret() {
  const secretValue = process.env.SESSION_SECRET;
  if (!secretValue || secretValue.length < 32) {
    throw new Error('SESSION_SECRET must contain at least 32 characters.');
  }
  return new TextEncoder().encode(secretValue);
}

export async function encrypt(payload: AdminSession) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function decrypt(token: string | undefined): Promise<AdminSession | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());

    if (
      payload.role !== 'admin' ||
      typeof payload.userId !== 'string' ||
      typeof payload.email !== 'string'
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: 'admin',
    };
  } catch {
    return null;
  }
}
