import { type WaitlistEntry, type InsertWaitlistEntry, waitlistEntries } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  addToWaitlist(entry: InsertWaitlistEntry): Promise<WaitlistEntry | null>;
  getWaitlistByEmail(email: string): Promise<WaitlistEntry | undefined>;
  getWaitlistById(id: number): Promise<WaitlistEntry | undefined>;
  markAsPledged(id: number): Promise<WaitlistEntry | undefined>;
}

export class DatabaseStorage implements IStorage {
  async addToWaitlist(entry: InsertWaitlistEntry): Promise<WaitlistEntry | null> {
    if (!db) return null;
    const [result] = await db.insert(waitlistEntries).values(entry).returning();
    return result;
  }

  async getWaitlistByEmail(email: string): Promise<WaitlistEntry | undefined> {
    if (!db) return undefined;
    const [result] = await db.select().from(waitlistEntries).where(eq(waitlistEntries.email, email));
    return result;
  }

  async getWaitlistById(id: number): Promise<WaitlistEntry | undefined> {
    if (!db) return undefined;
    const [result] = await db.select().from(waitlistEntries).where(eq(waitlistEntries.id, id));
    return result;
  }

  async markAsPledged(id: number): Promise<WaitlistEntry | undefined> {
    if (!db) return undefined;
    const [result] = await db
      .update(waitlistEntries)
      .set({ pledged: true })
      .where(eq(waitlistEntries.id, id))
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
