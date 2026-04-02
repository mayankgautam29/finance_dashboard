import { connect } from "@/dbconfig/dbconnect";
import Record from "@/models/recordModel";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getRole } from "@/helpers/getRole";

export async function GET(req: NextRequest) {
  try {
    await connect();
    const user = await getRole(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: userId, role } = user;
    const roleKey = String(role).toLowerCase();

    const objectUserId = new mongoose.Types.ObjectId(userId);
    const matchCondition =
      roleKey === "viewer" ? { userId: objectUserId } : {};
    const income = await Record.aggregate([
      { $match: { ...matchCondition, type: "income" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const expense = await Record.aggregate([
      { $match: { ...matchCondition, type: "expense" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const totalIncome = income[0]?.total || 0;
    const totalExpense = expense[0]?.total || 0;
    const netBalance = totalIncome - totalExpense;
    const recent = await Record.aggregate([
      { $match: matchCondition },
      { $sort: { createdAt: -1 } },
      { $limit: 5 },

      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          category: 1,
          amount: 1,
          type: 1,
          createdAt: 1,
          username: "$user.username",
        },
      },
    ]);
    let data: any = {
      totalIncome,
      totalExpense,
      netBalance,
      recent,
    };

    if (roleKey === "analyst" || roleKey === "admin") {
      const categories = await Record.aggregate([
        { $match: { ...matchCondition, type: "expense" } },
        {
          $group: {
            _id: "$category",
            total: { $sum: "$amount" },
          },
        },
      ]);

      const trendsRaw = await Record.aggregate([
        { $match: matchCondition },

        {
          $project: {
            amount: 1,
            type: 1,
            month: {
              $month: { $ifNull: ["$date", "$createdAt"] },
            },
            year: {
              $year: { $ifNull: ["$date", "$createdAt"] },
            },
          },
        },

        {
          $group: {
            _id: {
              year: "$year",
              month: "$month",
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

        {
          $sort: {
            "_id.year": 1,
            "_id.month": 1,
          },
        },
      ]);

      let trends = trendsRaw.map((t) => ({
        month: `${new Date(0, t._id.month - 1).toLocaleString("default", {
          month: "short",
        })} ${t._id.year}`,
        income: t.income,
        expense: t.expense,
      }));

      if (trends.length === 0) {
        trends = [{ month: "Start", income: 0, expense: 0 }];
      }

      if (trends.length === 1) {
        trends = [{ month: "Start", income: 0, expense: 0 }, ...trends];
      }

      data = { ...data, categories, trends };
    }

    if (roleKey === "admin") {
      const usersData = await Record.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        {
          $group: {
            _id: "$user.username",
            totalIncome: {
              $sum: {
                $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
              },
            },
            totalExpense: {
              $sum: {
                $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
              },
            },
          },
        },
      ]);

      data.usersData = usersData;
    }
    return NextResponse.json({
      success: true,
      role,
      data,
    });
  } catch (error: any) {
    console.log("DASHBOARD ERROR:", error.message);

    return NextResponse.json(
      { error: error.message || "Dashboard error" },
      { status: 500 },
    );
  }
}
