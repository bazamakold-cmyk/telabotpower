import { hash, compare } from "bcryptjs";

export function hashSecret(plain: string): Promise<string> {
  return hash(plain, 10);
}

export function verifySecret(plain: string, hashed: string): Promise<boolean> {
  return compare(plain, hashed);
}
