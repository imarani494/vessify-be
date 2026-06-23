import "dotenv/config";
import { serve } from "@hono/node-server";
import app from "./app.js";
import { env } from "./lib/env.js";

serve(
  {
    fetch: app.fetch,
    port: env.PORT,
  },
  () => {
    console.log(`🚀 Server running at http://localhost:${env.PORT}`);
  }
);
