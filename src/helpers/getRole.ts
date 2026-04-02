import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

type Role = "Viewer" | "Analyst" | "Admin";

export const getRole = async (
  request: NextRequest
): Promise<{ id: string; role: Role } | null> => {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) return null;

    const decodedToken: any = jwt.verify(
      token,
      process.env.JWT_SECRET!
    );

    return {
      id: decodedToken.id,
      role: decodedToken.role,
    };
  } catch (error: any) {
    console.error("JWT Verification failed:", error.message);
    return null;
  }
};