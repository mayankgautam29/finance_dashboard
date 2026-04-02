import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("token")?.value;

  console.log("MIDDLEWARE:", pathname, token ? "✅" : "❌");

  const publicRoutes = ["/auth/login", "/auth/signup"];

  const isPublic = publicRoutes.includes(pathname);

  // ❌ Not logged in → block everything except login/signup
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // ❌ Logged in → block login/signup
  if (token && isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",                     // MUST include root
    "/auth/login",
    "/auth/signup",
    "/((?!_next|favicon.ico).*)",
  ],
};