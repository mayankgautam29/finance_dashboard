import { connect } from "@/dbconfig/dbconnect";
import { NextRequest, NextResponse } from "next/server";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    await connect();

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const { email, password, username, role } = await request.json();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      email,
      username,
      password: hashedPassword,
      role: role,
    });
    const savedUser = await newUser.save();
    const { password: _, ...userWithoutPassword } = savedUser.toObject();
    const tokenData = {
      id: savedUser._id,
      email: savedUser.email,
      role: savedUser.role,
    };
    const token = jwt.sign(tokenData, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    const response = NextResponse.json({
      message: "User created successfully",
      user: userWithoutPassword,
    });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      path: "/",
    });
    return response;
  } catch (error: any) {
    console.log("SIGNUP ERROR:", error.message);
    return NextResponse.json(
      { error: error.message || "Signup failed" },
      { status: 500 }
    );
  }
}