import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { URL } from "node:url";
import { google } from "googleapis";

function loadEnvLocal() {
  const file = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}`;
const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/gmail.compose",
];

async function main() {
  loadEnvLocal();

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in .env.local"
    );
    process.exit(1);
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);
  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });

  console.log("\nOpen this URL in your browser to authorize:\n");
  console.log(authUrl);
  console.log("");

  const code: string = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        if (!req.url) return;
        const u = new URL(req.url, REDIRECT_URI);
        const c = u.searchParams.get("code");
        const e = u.searchParams.get("error");
        if (e) {
          res
            .writeHead(400, { "Content-Type": "text/plain" })
            .end(`Error: ${e}`);
          server.close();
          reject(new Error(e));
        } else if (c) {
          res
            .writeHead(200, { "Content-Type": "text/html" })
            .end(
              "<html><body><p>Authorization complete. You can close this tab.</p></body></html>"
            );
          server.close();
          resolve(c);
        } else {
          res.writeHead(404).end();
        }
      } catch (err) {
        reject(err);
      }
    });
    server.listen(PORT);
  });

  const { tokens } = await oauth2.getToken(code);
  if (!tokens.refresh_token) {
    console.error(
      "\nNo refresh_token returned. Revoke prior consent at https://myaccount.google.com/permissions and rerun."
    );
    process.exit(1);
  }

  console.log(
    "\nRefresh token (add to .env.local as GOOGLE_REFRESH_TOKEN):\n"
  );
  console.log(tokens.refresh_token);
  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
