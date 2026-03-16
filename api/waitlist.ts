import type { VercelRequest, VercelResponse } from "@vercel/node";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq } from "drizzle-orm";
import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

const waitlistEntries = pgTable("waitlist_entries", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  organization: text("organization"),
  sector: text("sector"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const insertWaitlistSchema = createInsertSchema(waitlistEntries).pick({
  email: true,
  name: true,
  organization: true,
  sector: true,
});

let pool: pg.Pool | null = null;

function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }
  if (!pool) {
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  }
  return drizzle(pool, { schema: { waitlistEntries } });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const parsed = insertWaitlistSchema.parse(req.body);
    const db = getDb();

    const [existing] = await db
      .select()
      .from(waitlistEntries)
      .where(eq(waitlistEntries.email, parsed.email));

    if (existing) {
      return res.status(200).json({
        message: "You're already on the waitlist!",
        alreadyExists: true,
      });
    }

    const [entry] = await db
      .insert(waitlistEntries)
      .values(parsed)
      .returning();

    return res.status(201).json({ message: "You're on the waitlist!", entry });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }
    console.error("Waitlist error:", error);
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}
