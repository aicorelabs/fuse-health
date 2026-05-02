// Auth disabled for now — dashboard is open. Re-enable by restoring the
// PROTECTED_PREFIXES check below and the matcher.
// import { NextRequest, NextResponse } from "next/server";
// import { SESSION_CONFIG, verifySession } from "@/lib/session";
//
// const PROTECTED_PREFIXES = ["/admin", "/dashboard"];
// const LOGIN_PATH = "/login";
//
// export async function middleware(req: NextRequest) {
//   const { pathname } = req.nextUrl;
//   const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
//   if (!isProtected) return NextResponse.next();
//
//   const token = req.cookies.get(SESSION_CONFIG.cookieName)?.value;
//   if (!token) return redirectToLogin(req);
//
//   const session = await verifySession(token);
//   if (!session) return redirectToLogin(req);
//
//   return NextResponse.next();
// }
//
// function redirectToLogin(req: NextRequest): NextResponse {
//   const url = req.nextUrl.clone();
//   url.pathname = LOGIN_PATH;
//   url.searchParams.set("next", req.nextUrl.pathname);
//   return NextResponse.redirect(url);
// }

export const config = {
  matcher: [],
};
