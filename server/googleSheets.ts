// Google Sheets integration — uses Replit connector (conn_google-sheet_01KM1R11D2Z8FA3CPESKKCAPP9)
// WARNING: Never cache this client — tokens expire. Always call getUncachableGoogleSheetClient() fresh.
import { google } from "googleapis";

let connectionSettings: any;

async function getAccessToken() {
  if (
    connectionSettings &&
    connectionSettings.settings.expires_at &&
    new Date(connectionSettings.settings.expires_at).getTime() > Date.now()
  ) {
    return connectionSettings.settings.access_token;
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? "depl " + process.env.WEB_REPL_RENEWAL
    : null;

  if (!hostname || !xReplitToken) {
    throw new Error("Google Sheets connector not available in this environment");
  }

  connectionSettings = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=google-sheet",
    {
      headers: {
        Accept: "application/json",
        "X-Replit-Token": xReplitToken,
      },
    }
  )
    .then((res) => res.json())
    .then((data) => data.items?.[0]);

  const accessToken =
    connectionSettings?.settings?.access_token ||
    connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error("Google Sheet not connected");
  }
  return accessToken;
}

export async function getUncachableGoogleSheetClient() {
  const accessToken = await getAccessToken();
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return google.sheets({ version: "v4", auth: oauth2Client });
}

const HEADERS = ["ID", "Name", "Email", "Organization", "Sector", "Pledged", "Signed Up At"];

export async function appendWaitlistRow(entry: {
  id: number;
  name: string | null;
  email: string;
  organization: string | null;
  sector: string | null;
  pledged: boolean;
  createdAt: Date;
}) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    console.warn("[Sheets] GOOGLE_SHEET_ID not set — skipping sync");
    return;
  }
  try {
    const sheets = await getUncachableGoogleSheetClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Waitlist!A:G",
      valueInputOption: "RAW",
      requestBody: {
        values: [[
          entry.id,
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
  } catch (err) {
    console.error("[Sheets] Failed to append row:", err);
  }
}

export async function updatePledgeStatus(waitlistId: number, email: string) {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    console.warn("[Sheets] GOOGLE_SHEET_ID not set — skipping pledge update");
    return;
  }
  try {
    const sheets = await getUncachableGoogleSheetClient();
    // Find the row by ID (column A)
    const readRes = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Waitlist!A:A",
    });
    const rows = readRes.data.values ?? [];
    const rowIndex = rows.findIndex((r) => String(r[0]) === String(waitlistId));
    if (rowIndex === -1) {
      console.warn(`[Sheets] Row not found for ID ${waitlistId}`);
      return;
    }
    const sheetRow = rowIndex + 1; // 1-indexed
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `Sheet1!F${sheetRow}`,
      valueInputOption: "RAW",
      requestBody: { values: [["Yes"]] },
    });
    console.log(`[Sheets] Marked pledged for ID ${waitlistId} (${email})`);
  } catch (err) {
    console.error("[Sheets] Failed to update pledge status:", err);
  }
}

export async function ensureSheetHeaders(sheetId: string) {
  try {
    const sheets = await getUncachableGoogleSheetClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Waitlist!A1:G1",
    });
    const firstRow = res.data.values?.[0];
    if (!firstRow || firstRow.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: "Waitlist!A1:G1",
        valueInputOption: "RAW",
        requestBody: { values: [HEADERS] },
      });
      console.log("[Sheets] Headers written");
    }
  } catch (err) {
    console.error("[Sheets] Failed to ensure headers:", err);
  }
}
