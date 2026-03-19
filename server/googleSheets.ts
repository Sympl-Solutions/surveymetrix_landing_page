// Google Sheets integration
// Supports two auth modes:
//   1. Replit connector (dev on Replit) — uses REPLIT_CONNECTORS_HOSTNAME
//   2. Google Service Account (Vercel / production) — uses GOOGLE_SERVICE_ACCOUNT_KEY env var
import { google } from "googleapis";

// ── Auth helpers ─────────────────────────────────────────────────────────────

let replitConnectionSettings: any;

async function getReplitAccessToken() {
  if (
    replitConnectionSettings?.settings?.expires_at &&
    new Date(replitConnectionSettings.settings.expires_at).getTime() > Date.now()
  ) {
    return replitConnectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;

  if (!hostname || !xReplitToken) throw new Error("Replit connector not available");

  replitConnectionSettings = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=google-sheet`,
    { headers: { Accept: "application/json", "X-Replit-Token": xReplitToken } }
  ).then((r) => r.json()).then((d) => d.items?.[0]);

  const token =
    replitConnectionSettings?.settings?.access_token ||
    replitConnectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!token) throw new Error("Google Sheet not connected via Replit");
  return token;
}

// WARNING: Never cache — tokens expire. Always call fresh.
async function getUncachableSheetsClient() {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    // Production / Vercel: use Service Account JSON stored as env var
    const credentials = JSON.parse(serviceAccountKey);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    return google.sheets({ version: "v4", auth });
  } else {
    // Dev on Replit: use OAuth connector
    const accessToken = await getReplitAccessToken();
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    return google.sheets({ version: "v4", auth: oauth2Client });
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

const HEADERS = ["ID", "Name", "Email", "Organization", "Sector", "Pledged", "Signed Up At"];
const TAB = "Waitlist";

export async function ensureSheetHeaders(sheetId: string) {
  try {
    const sheets = await getUncachableSheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${TAB}!A1:G1`,
    });
    const firstRow = res.data.values?.[0];
    if (!firstRow || firstRow.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${TAB}!A1:G1`,
        valueInputOption: "RAW",
        requestBody: { values: [HEADERS] },
      });
      console.log("[Sheets] Headers written");
    }
  } catch (err: any) {
    console.error("[Sheets] Failed to ensure headers:", err.message);
  }
}

export async function appendWaitlistRow(entry: {
  id?: number | null;
  name: string | null;
  email: string;
  organization: string | null;
  sector: string | null;
  pledged: boolean;
  createdAt: Date;
}) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) { console.warn("[Sheets] GOOGLE_SHEET_ID not set"); return; }
  try {
    const sheets = await getUncachableSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${TAB}!A:G`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          entry.id ?? "",
          entry.name ?? "",
          entry.email,
          entry.organization ?? "",
          entry.sector ?? "",
          entry.pledged ? "Yes" : "No",
          entry.createdAt.toISOString(),
        ]],
      },
    });
    console.log(`[Sheets] Appended row for ${entry.email}`);
  } catch (err: any) {
    console.error("[Sheets] Failed to append row:", err.message);
  }
}

// Finds row by email (column C) and marks Pledged = Yes
export async function updatePledgeStatusByEmail(email: string) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) { console.warn("[Sheets] GOOGLE_SHEET_ID not set"); return; }
  try {
    const sheets = await getUncachableSheetsClient();
    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${TAB}!C:C`,
    });
    const rows = readRes.data.values ?? [];
    const rowIndex = rows.findIndex((r) => r[0]?.toLowerCase() === email.toLowerCase());
    if (rowIndex === -1) { console.warn(`[Sheets] Row not found for ${email}`); return; }
    const sheetRow = rowIndex + 1;
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${TAB}!F${sheetRow}`,
      valueInputOption: "RAW",
      requestBody: { values: [["Yes"]] },
    });
    console.log(`[Sheets] Marked pledged for ${email}`);
  } catch (err: any) {
    console.error("[Sheets] Failed to update pledge status:", err.message);
  }
}
