import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import { connectDatabase } from "../config/database.js";
import { createAdminToken } from "../services/tokenService.js";

function cookieOptions() {
  const production = process.env.NODE_ENV === "production";
  const sameSite = process.env.COOKIE_SAME_SITE || (production ? "none" : "lax");

  return {
    httpOnly: true,
    secure: production,
    sameSite,
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: "/",
    maxAge: 8 * 60 * 60 * 1000,
  };
}

export async function login(request, response, next) {
  try {
    const username = typeof request.body.username === "string"
      ? request.body.username.toLowerCase().trim()
      : "";
    const password = typeof request.body.password === "string" ? request.body.password : "";

    if (!username || !password) {
      return response.status(400).json({
        success: false,
        message: "Username and password are required.",
      });
    }

    await connectDatabase();
    const admin = await Admin.findOne({ username });

    if (!admin || !admin.isActive) {
      return response.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, admin.passwordHash);

    if (!passwordMatches) {
      return response.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    const token = await createAdminToken(admin);
    response.cookie("admin_token", token, cookieOptions());
    response.json({ success: true, message: "Login successful." });
  } catch (error) {
    next(error);
  }
}

export function logout(request, response) {
  response.clearCookie("admin_token", cookieOptions());
  response.json({ success: true, message: "Logged out successfully." });
}

export function session(request, response) {
  response.json({
    success: true,
    admin: {
      id: request.admin.id,
      username: request.admin.username,
      role: request.admin.role,
    },
  });
}
