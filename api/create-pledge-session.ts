import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Missing email." });

    const origin = "https://www.surveymetrix.com";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "SurveyMetrix Founding Tester Pledge",
            description: "Lock in founding tester pricing — applied as credit when we launch.",
          },
          unit_amount: 500,
        },
        quantity: 1,
      }],
      mode: "payment",
      customer_email: email,
      metadata: { email },
      success_url: `${origin}/?pledge=success`,
      cancel_url: `${origin}/?pledge=cancelled`,
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error("Stripe session error:", error);
    return res.status(500).json({ message: "Could not create payment session. Please try again." });
  }
}
