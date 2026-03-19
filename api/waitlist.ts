import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { getDb, COLLECTION } from "./_firebase";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  organization: z.string().min(1),
  sector: z.string().optional().default(""),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const parsed = schema.parse(req.body);
    const db = getDb();

    // Use email as document ID (sanitized) — natural dedup key
    const docId = parsed.email.toLowerCase().replace(/[^a-z0-9]/g, "_");
    const docRef = db.collection(COLLECTION).doc(docId);
    const existing = await docRef.get();

    if (existing.exists) {
      return res.status(200).json({
        message: "You're already on the waitlist!",
        alreadyExists: true,
        entry: { email: parsed.email },
      });
    }

    const entry = {
      name: parsed.name,
      email: parsed.email,
      organization: parsed.organization,
      sector: parsed.sector,
      pledged: false,
      createdAt: new Date().toISOString(),
    };

    await docRef.set(entry);

    return res.status(201).json({
      message: "You're on the waitlist!",
      entry,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }
    console.error("Waitlist error:", error);
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}
