import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get("token")?.value;

  console.log("MIDDLEWARE:", pathname, token ? "✅" : "❌");
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const publicPages = ["/auth/login", "/auth/signup"];
  const isPublicPage = publicPages.some((route) =>
    pathname.startsWith(route)
  );

  if (isPublicPage) {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
  return NextResponse.next();
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};