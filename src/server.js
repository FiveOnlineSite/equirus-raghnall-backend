import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { validateEnvironment } from "./config/env.js";

validateEnvironment();

const port = Number(process.env.PORT) || 5000;
const app = createApp();

connectDatabase()
  .then(() => console.log("MongoDB connected."))
  .catch((error) => console.error("Initial MongoDB connection failed; requests will retry:", error.message));

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Raghnall API listening on port ${port}.`);
});

async function shutdown(signal) {
  console.log(`${signal} received. Shutting down.`);
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
