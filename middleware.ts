import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("token")?.value;

  console.log("MIDDLEWARE:", pathname, token ? "✅" : "❌");

  const publicRoutes = ["/auth/login", "/auth/signup","/api/auth/login","/api/auth/signup"];

  const isPublic = publicRoutes.includes(pathname);

  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
  if (token && isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/auth/login",
    "/auth/signup",
    "/((?!_next|favicon.ico).*)",
  ],
};