import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export const getDataFromToken = async (request: NextRequest): Promise<string | null> => {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) return null;

    const secret = process.env.JWT_SECRET || process.env.TOKEN_SECRET;
    if (!secret) return null;

    const decodedToken: any = jwt.verify(token, secret);
    return decodedToken.id;
  } catch (error: any) {
    console.error("JWT Verification failed:", error.message);
    return null;
  }
};
