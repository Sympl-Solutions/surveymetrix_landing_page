import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWaitlistSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.post("/api/waitlist", async (req, res) => {
    try {
      const parsed = insertWaitlistSchema.parse(req.body);

      const existing = await storage.getWaitlistByEmail(parsed.email);
      if (existing) {
        return res.status(200).json({ message: "You're already on the waitlist!", alreadyExists: true });
      }

      const entry = await storage.addToWaitlist(parsed);
      return res.status(201).json({ message: "You're on the waitlist!", entry });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Please enter a valid email address." });
      }
      console.error("Waitlist error:", error);
      return res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  return httpServer;
}
