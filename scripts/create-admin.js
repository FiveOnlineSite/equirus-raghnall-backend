import "dotenv/config";
import bcrypt from "bcryptjs";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import Admin from "../src/models/Admin.js";

const username = process.env.INITIAL_ADMIN_USERNAME?.toLowerCase().trim();
const password = process.env.INITIAL_ADMIN_PASSWORD;

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is required.");
}

if (!username || !password) {
  throw new Error("INITIAL_ADMIN_USERNAME and INITIAL_ADMIN_PASSWORD are required.");
}

if (password.length < 12) {
  throw new Error("INITIAL_ADMIN_PASSWORD must contain at least 12 characters.");
}

try {
  await connectDatabase();
  const existingAdmin = await Admin.findOne({ username });

  if (existingAdmin) {
    console.log(`Admin already exists: ${username}`);
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    await Admin.create({
      name: "Administrator",
      username,
      passwordHash,
      role: "admin",
      isActive: true,
    });
    console.log(`Admin created: ${username}`);
  }
} catch (error) {
  console.error("Unable to create admin:", error.message);
  process.exitCode = 1;
} finally {
  await disconnectDatabase();
}
