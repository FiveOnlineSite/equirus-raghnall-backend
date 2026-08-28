import { getFrontendOrigins } from "../config/env.js";

export function validateOrigin(request, response, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    return next();
  }

  const origin = request.get("origin");
  const allowedOrigins = getFrontendOrigins();

  if (!origin || !allowedOrigins.includes(origin.replace(/\/$/, ""))) {
    return response.status(403).json({ success: false, message: "Origin not allowed." });
  }

  next();
}
