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

    if (!admin || String(admin.role).toLowerCase() !== "admin") {
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

    const roleMap: Record<string, string> = {
      viewer: "Viewer",
      analyst: "Analyst",
      admin: "Admin",
    };
    const roleKey =
      typeof body.role === "string" ? body.role.toLowerCase() : "";
    const role =
      roleMap[roleKey] ??
      (["Viewer", "Analyst", "Admin"].includes(body.role) ? body.role : null);

    if (!role) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const update: { role: string; isActive?: boolean } = { role };
    if (typeof body.isActive === "boolean") {
      update.isActive = body.isActive;
    }

    const updated = await User.findByIdAndUpdate(id, update, {
      new: true,
    }).select("-password");

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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