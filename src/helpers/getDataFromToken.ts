import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export const getDataFromToken = async (request: NextRequest): Promise<string | null> => {
  try {
    const token = request.cookies.get("token")?.value;
    console.log("Token from cookie:", token);

    if (!token) return null;

    const decodedToken: any = jwt.verify(token, process.env.TOKEN_SECRET!);
    return decodedToken.id;
  } catch (error: any) {
    console.error("JWT Verification failed:", error.message);
    return null;
  }
};
