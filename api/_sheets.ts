// Shared Google Sheets helper for Vercel serverless functions
// Uses GOOGLE_SERVICE_ACCOUNT_KEY env var (full JSON string)
import { google } from "googleapis";

const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const TAB = "Waitlist";

export async function getSheetsClient() {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY not set");
  const credentials = JSON.parse(key);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

export async function findRowByEmail(email: string): Promise<number | null> {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!C:C`,
  });
  const rows = res.data.values ?? [];
  const idx = rows.findIndex((r) => r[0]?.toLowerCase() === email.toLowerCase());
  return idx === -1 ? null : idx + 1; // 1-indexed sheet row
}

export async function appendRow(entry: {
  name: string;
  email: string;
  organization: string;
  sector: string;
}) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A:G`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[
        "",                        // A: ID (blank for Sheets-only signups)
        entry.name,               // B: Name
        entry.email,              // C: Email
        entry.organization,       // D: Organization
        entry.sector,             // E: Sector
        "No",                     // F: Pledged
        new Date().toISOString(), // G: Signed Up At
      ]],
    },
  });
}

export async function markPledged(email: string) {
  const rowIndex = await findRowByEmail(email);
  if (!rowIndex) return;
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!F${rowIndex}`,
    valueInputOption: "RAW",
    requestBody: { values: [["Yes"]] },
  });
}

export async function ensureHeaders() {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A1:G1`,
  });
  if (!res.data.values?.[0]?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${TAB}!A1:G1`,
      valueInputOption: "RAW",
      requestBody: { values: [["ID", "Name", "Email", "Organization", "Sector", "Pledged", "Signed Up At"]] },
    });
  }
}
