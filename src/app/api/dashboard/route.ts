import { connect } from "@/dbconfig/dbconnect";
import { getDataFromToken } from "@/helpers/getDataFromToken";
import Record from "@/models/recordModel";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";

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

    // 🔥 FIX: convert to ObjectId
    const objectUserId = new mongoose.Types.ObjectId(userId);

    // 🔥 TOTAL INCOME
    const income = await Record.aggregate([
      { $match: { userId: objectUserId, type: "income" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    // 🔥 TOTAL EXPENSE
    const expense = await Record.aggregate([
      { $match: { userId: objectUserId, type: "expense" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalIncome = income[0]?.total || 0;
    const totalExpense = expense[0]?.total || 0;
    const netBalance = totalIncome - totalExpense;

    // 🔥 CATEGORY BREAKDOWN
    const categories = await Record.aggregate([
      { $match: { userId: objectUserId, type: "expense" } },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
        },
      },
    ]);

    // 🔥 MONTHLY TRENDS
    const trends = await Record.aggregate([
      { $match: { userId: objectUserId } },
      {
        $group: {
          _id: {
            month: { $month: "$date" },
          },
          income: {
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
            },
          },
          expense: {
            $sum: {
              $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
            },
          },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    // 🔥 RECENT TRANSACTIONS
    const recent = await Record.find({ userId: objectUserId })
      .sort({ createdAt: -1 })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netBalance,
        categories,
        trends,
        recent,
      },
    });

  } catch (error: any) {
    console.log("DASHBOARD ERROR:", error.message);

    return NextResponse.json(
      { error: error.message || "Dashboard error" },
      { status: 500 }
    );
  }
}