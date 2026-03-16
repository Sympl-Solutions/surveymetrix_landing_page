import { type WaitlistEntry, type InsertWaitlistEntry, waitlistEntries } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  addToWaitlist(entry: InsertWaitlistEntry): Promise<WaitlistEntry>;
  getWaitlistByEmail(email: string): Promise<WaitlistEntry | undefined>;
}

export class DatabaseStorage implements IStorage {
  async addToWaitlist(entry: InsertWaitlistEntry): Promise<WaitlistEntry> {
    const [result] = await db.insert(waitlistEntries).values(entry).returning();
    return result;
  }

  async getWaitlistByEmail(email: string): Promise<WaitlistEntry | undefined> {
    const [result] = await db.select().from(waitlistEntries).where(eq(waitlistEntries.email, email));
    return result;
  }
}

export const storage = new DatabaseStorage();
