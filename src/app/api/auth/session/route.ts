import { getRole } from "@/helpers/getRole";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const user = await getRole(req);
  return NextResponse.json({
    loggedIn: !!user,
    role: user?.role ?? null,
  });
}
