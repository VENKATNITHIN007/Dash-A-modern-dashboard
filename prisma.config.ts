import "dotenv/config"; // Automatically loads the standard .env file

import { config as dotenvConfig } from "dotenv";
import { defineConfig } from "prisma/config";

// This line specifically looks for a file called ".env.local"
// 'override: false' means if a variable is already set, don't change it.
dotenvConfig({ path: ".env.local", override: false });

export default defineConfig({
  schema: "prisma/schema.prisma", // Points to your database structure file
  migrations: {
    path: "prisma/migrations", // Where Prisma saves history of your table changes
  },
  datasource: {
    // SECURITY: We use process.env instead of typing the password here.
    // The '?? ""' is a fallback: if the variable is missing, use an empty string.
    url: process.env.DATABASE_URL ?? "", 
  },
});