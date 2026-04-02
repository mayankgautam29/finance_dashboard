import { NextResponse } from "next/server";

export async function GET() {
  const response = NextResponse.json({
    message: "Logout successful",
    success: true,
  });
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
    path: "/",
    expires: new Date(0),
  });
  return response;
}
