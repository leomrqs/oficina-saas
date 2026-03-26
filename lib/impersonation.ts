// lib/impersonation.ts — Utilitários de token de impersonação
import { createHmac } from "crypto";

export function signImpersonationToken(userId: string, secret: string): string {
  const timestamp = Date.now().toString();
  const payload = `${userId}:${timestamp}`;
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}:${signature}`).toString("base64url");
}

export function verifyImpersonationToken(token: string, secret: string, maxAgeMs = 5 * 60 * 1000) {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(":");
    if (parts.length !== 3) return null;
    const [userId, timestamp, signature] = parts;
    const expected = createHmac("sha256", secret).update(`${userId}:${timestamp}`).digest("hex");
    if (signature !== expected) return null;
    if (Date.now() - parseInt(timestamp) > maxAgeMs) return null;
    return { userId };
  } catch {
    return null;
  }
}
