import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { getFrontendOrigins } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import { adminBannerRouter, publicBannerRouter } from "./routes/bannerRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import { adminHomePageRouter, publicHomePageRouter } from "./routes/homePageRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { validateOrigin } from "./middleware/validateOrigin.js";

export function createApp() {
  const app = express();
  const allowedOrigins = getFrontendOrigins();

  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      const normalizedOrigin = origin?.replace(/\/$/, "");

      if (!origin || allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS."));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  app.use(validateOrigin);

  app.get("/health", (request, response) => {
    response.json({
      status: "ok",
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    });
  });

  app.use("/api/admin", authRoutes);
  app.use("/api/admin", adminBannerRouter);
  app.use("/api/admin", adminHomePageRouter);
  app.use("/api/banners", publicBannerRouter);
  app.use("/api/home", publicHomePageRouter);
  app.use("/api/contact", contactRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
