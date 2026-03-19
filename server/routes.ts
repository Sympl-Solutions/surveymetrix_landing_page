import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWaitlistSchema } from "@shared/schema";
import { z } from "zod";
import Stripe from "stripe";
import { appendWaitlistRow, updatePledgeStatusByEmail, ensureSheetHeaders } from "./googleSheets";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

const hasDatabase = !!process.env.DATABASE_URL;

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Write column headers to the sheet on startup (safe no-op if already present)
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (sheetId) {
    ensureSheetHeaders(sheetId).catch((e) =>
      console.warn("[Sheets] Header check failed:", e.message)
    );
  }

  // ── Waitlist signup ──────────────────────────────────────────────────────────
  app.post("/api/waitlist", async (req, res) => {
    try {
      const parsed = insertWaitlistSchema.parse(req.body);

      // Duplicate check — use DB if available, otherwise skip (Sheets handles deduplication visually)
      if (hasDatabase) {
        const existing = await storage.getWaitlistByEmail(parsed.email);
        if (existing) {
          return res.status(200).json({
            message: "You're already on the waitlist!",
            alreadyExists: true,
            entry: existing,
          });
        }
      }

      // Write to DB (if available)
      let entry: any = null;
      if (hasDatabase) {
        entry = await storage.addToWaitlist(parsed);
      }

      // Write to Google Sheets (primary when no DB, secondary when DB present)
      appendWaitlistRow({
        id: entry?.id ?? null,
        name: parsed.name ?? null,
        email: parsed.email,
        organization: parsed.organization ?? null,
        sector: parsed.sector ?? null,
        pledged: false,
        createdAt: new Date(),
      }).catch((e) => console.warn("[Sheets] Append failed:", e.message));

      return res.status(201).json({
        message: "You're on the waitlist!",
        entry: entry ?? { email: parsed.email },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Please enter a valid email address." });
      }
      console.error("Waitlist error:", error);
      return res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  // ── Stripe Checkout Session ──────────────────────────────────────────────────
  app.post("/api/create-pledge-session", async (req, res) => {
    try {
      const { waitlistId, email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Missing email." });
      }

      const origin = req.headers.origin || `${req.protocol}://${req.get("host")}`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "SurveyMetrix Founding Tester Pledge",
                description: "Lock in founding tester pricing — applied as credit when we launch.",
              },
              unit_amount: 500, // $5.00
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        customer_email: email,
        // Store both email and waitlistId in metadata for webhook
        metadata: {
          email,
          waitlistId: waitlistId ? String(waitlistId) : "",
        },
        success_url: `${origin}/?pledge=success`,
        cancel_url: `${origin}/?pledge=cancelled`,
      });

      return res.json({ url: session.url });
    } catch (error) {
      console.error("Stripe session error:", error);
      return res.status(500).json({ message: "Could not create payment session. Please try again." });
    }
  });

  // ── Stripe Webhook ───────────────────────────────────────────────────────────
  // On successful payment: marks pledged in DB (if available) and updates Google Sheet
  app.post("/api/stripe-webhook", async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
      if (webhookSecret && sig) {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        event = req.body as Stripe.Event;
      }
    } catch (err) {
      console.error("Webhook signature error:", err);
      return res.status(400).send("Webhook error");
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.metadata?.email || session.customer_email || "";
      const waitlistId = session.metadata?.waitlistId;

      // Update DB (if available)
      if (hasDatabase && waitlistId) {
        await storage.markAsPledged(Number(waitlistId));
      }

      // Update Google Sheet by email (works on both Replit and Vercel)
      if (email) {
        updatePledgeStatusByEmail(email).catch((e) =>
          console.warn("[Sheets] Pledge update failed:", e.message)
        );
      }
    }

    return res.json({ received: true });
  });

  return httpServer;
}
