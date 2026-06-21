import bcrypt from "bcryptjs";

export function hashSecret(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifySecret(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
