import { connect } from "@/dbconfig/dbconnect";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getRole } from "@/helpers/getRole";

type Context = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Context) {
  try {
    await connect();

    const admin = await getRole(req);

    if (!admin || admin.role !== "Admin") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await ctx.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const updated = await User.findByIdAndUpdate(
      id,
      {
        role: body.role,
        isActive: body.isActive,
      },
      { new: true }
    ).select("-password");

    return NextResponse.json({
      success: true,
      data: updated,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    );
  }
}