import { verifyAdminToken } from "../services/tokenService.js";

export async function requireAdmin(request, response, next) {
  const token = request.cookies.admin_token;

  if (!token) {
    return response.status(401).json({ success: false, message: "Unauthorized." });
  }

  const admin = await verifyAdminToken(token);

  if (!admin || admin.role !== "admin") {
    return response.status(401).json({ success: false, message: "Unauthorized." });
  }

  request.admin = admin;
  next();
}
