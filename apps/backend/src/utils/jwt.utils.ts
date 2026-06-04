import jwt from "jsonwebtoken";

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
}

function requireSecret(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Environment variable ${name} is not set`);
  return val;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, requireSecret("JWT_ACCESS_SECRET"), {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES ??
      "15m") as jwt.SignOptions["expiresIn"],
  });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, requireSecret("JWT_REFRESH_SECRET"), {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES ??
      "7d") as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(
    token,
    requireSecret("JWT_ACCESS_SECRET"),
  ) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(
    token,
    requireSecret("JWT_REFRESH_SECRET"),
  ) as RefreshTokenPayload;
}
