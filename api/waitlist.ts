import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { appendRow, findRowByEmail, ensureHeaders } from "./_sheets";

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
    await ensureHeaders();

    const parsed = schema.parse(req.body);

    // Check for duplicate by email
    const existingRow = await findRowByEmail(parsed.email);
    if (existingRow !== null) {
      return res.status(200).json({
        message: "You're already on the waitlist!",
        alreadyExists: true,
        entry: { email: parsed.email },
      });
    }

    await appendRow({
      name: parsed.name,
      email: parsed.email,
      organization: parsed.organization,
      sector: parsed.sector,
    });

    return res.status(201).json({
      message: "You're on the waitlist!",
      entry: { email: parsed.email },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Please fill in all required fields." });
    }
    console.error("Waitlist error:", error);
    return res.status(500).json({ message: "Something went wrong. Please try again." });
  }
}
