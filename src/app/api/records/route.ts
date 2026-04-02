import { getDataFromToken } from "@/helpers/getDataFromToken";
import Record from "@/models/recordModel";
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbconfig/dbconnect";

export async function GET(req: NextRequest) {
  try {
    await connect();

    const userId = await getDataFromToken(req);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const records = await Record.find({ userId })
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: records,
    });
  } catch (error: any) {
    console.log("GET RECORD ERROR:", error.message);

    return NextResponse.json(
      { error: "Error fetching records" },
      { status: 500 }
    );
  }
}