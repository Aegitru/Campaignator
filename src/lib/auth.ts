import { createHash, randomBytes } from "crypto";

/** SHA-256 hex hash. Stable, no salt - cdc explicitly asks for SHA-256. */
export function hashPassword(password: string): string {
  return createHash("sha256").update(password, "utf8").digest("hex");
}

export function checkPassword(password: string, stored: string): boolean {
  return hashPassword(password) === stored;
}

/** Generate a short opaque session token (non-cryptographic, just identifier). */
export function generateSessionToken(): string {
  return randomBytes(16).toString("hex");
}
