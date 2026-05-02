import bcrypt from "bcryptjs";

export interface AdminCheckResult {
  ok: boolean;
  email?: string;
  reason?: "no-config" | "wrong-email" | "wrong-password";
}

export async function checkAdminCredentials(
  email: string,
  password: string,
): Promise<AdminCheckResult> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminEmail || !adminHash) {
    return { ok: false, reason: "no-config" };
  }
  if (email !== adminEmail) {
    return { ok: false, reason: "wrong-email" };
  }
  const matches = await bcrypt.compare(password, adminHash);
  if (!matches) {
    return { ok: false, reason: "wrong-password" };
  }
  return { ok: true, email };
}
