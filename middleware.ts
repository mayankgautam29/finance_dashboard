import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("token")?.value;

  console.log("MIDDLEWARE:", pathname, token ? "✅" : "❌");

  const publicRoutes = ["/login", "/signup"];

  const isPublic = publicRoutes.includes(pathname);

  // ❌ Not logged in → block everything except login/signup
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
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
    "/login",
    "/signup",
    "/((?!_next|favicon.ico).*)",
  ],
};