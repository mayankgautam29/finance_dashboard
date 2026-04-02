import { connect } from "@/dbconfig/dbconnect";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import { getRole } from "@/helpers/getRole";

export async function GET(req: NextRequest) {
  try {
    await connect();

    const user = await getRole(req);

    if (!user || String(user.role).toLowerCase() !== "admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const users = await User.find().select("-password");

    return NextResponse.json({
      success: true,
      data: users,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}