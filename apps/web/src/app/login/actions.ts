"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkAdminCredentials } from "@/lib/auth";
import { SESSION_CONFIG, signSession } from "@/lib/session";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Email and password required" };
  }

  const result = await checkAdminCredentials(email, password);
  if (!result.ok) {
    if (result.reason === "no-config") {
      return { error: "Admin credentials are not configured on the server" };
    }
    return { error: "Invalid credentials" };
  }

  const token = await signSession({ sub: result.email! });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_CONFIG.cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_CONFIG.ttlSeconds,
  });

  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_CONFIG.cookieName);
  redirect("/login");
}
