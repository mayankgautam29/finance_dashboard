import { connect } from "@/dbconfig/dbconnect";
import { getRole } from "@/helpers/getRole";
import Record from "@/models/recordModel";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: RouteContext) {
  try {
    await connect();

    const user = await getRole(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await ctx.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json();

    const updated = await Record.findByIdAndUpdate(
      id,
      {
        category: body.category,
        amount: body.amount,
        note: body.note,
      },
      { new: true }
    );

    return NextResponse.json({ success: true, data: updated });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    await connect();

    const user = await getRole(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await ctx.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await Record.findByIdAndDelete(id);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}