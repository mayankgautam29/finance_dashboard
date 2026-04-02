import { getRole } from "@/helpers/getRole";
import Record from "@/models/recordModel";
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbconfig/dbconnect";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connect();

    const user = await getRole(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, role } = user;

    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;

    const skip = (page - 1) * limit;

    let matchCondition: any = {};

    if (role === "Viewer") {
      matchCondition.userId = new mongoose.Types.ObjectId(id);
    }

    // Filters
    if (type) matchCondition.type = type;
    if (category) matchCondition.category = category;

    if (search) {
      matchCondition.$or = [
        { category: { $regex: search, $options: "i" } },
        { note: { $regex: search, $options: "i" } },
      ];
    }

    const records = await Record.aggregate([
      { $match: matchCondition },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      {
        $project: {
          _id: 1,
          amount: 1,
          type: 1,
          category: 1,
          date: 1,
          note: 1,
          username: "$user.username",
        },
      },
    ]);

    const total = await Record.countDocuments(matchCondition);

    return NextResponse.json({
      success: true,
      role,
      data: records,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: "Error fetching records" },
      { status: 500 }
    );
  }
}