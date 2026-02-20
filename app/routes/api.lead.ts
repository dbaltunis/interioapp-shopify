import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import fs from "node:fs";
import path from "node:path";

// Public endpoint (no auth) intended for the marketing website.
// IMPORTANT: Deploy behind HTTPS and add basic abuse protections (rate limit / captcha) before scaling.
// This is a pragmatic MVP so enquiries stop disappearing.

type Lead = {
  email: string;
  name?: string;
  company?: string;
  phone?: string;
  message?: string;
  source?: string;
  createdAt: string;
  ua?: string;
  ip?: string | null;
};

function getJsonBody(req: Request) {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) return req.json();
  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) return req.formData();
  return req.text();
}

async function sendMailgun(lead: Lead) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const to = process.env.LEADS_TO || "hello@interiorshopapps.com";
  const from = process.env.LEADS_FROM || `InteriorShopApps <leads@${domain}>`;

  if (!apiKey || !domain) return { ok: false, skipped: true as const, reason: "Missing MAILGUN_API_KEY or MAILGUN_DOMAIN" };

  const subject = `New enquiry: ${lead.name || lead.email}${lead.company ? ` — ${lead.company}` : ""}`;
  const text = [
    `Email: ${lead.email}`,
    lead.name ? `Name: ${lead.name}` : null,
    lead.company ? `Company: ${lead.company}` : null,
    lead.phone ? `Phone: ${lead.phone}` : null,
    lead.source ? `Source: ${lead.source}` : null,
    lead.message ? `Message: ${lead.message}` : null,
    `CreatedAt: ${lead.createdAt}`,
  ].filter(Boolean).join("\n");

  const form = new URLSearchParams();
  form.set("from", from);
  form.set("to", to);
  form.set("subject", subject);
  form.set("text", text);

  const url = `https://api.mailgun.net/v3/${domain}/messages`;
  const auth = Buffer.from(`api:${apiKey}`).toString("base64");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    return { ok: false, skipped: false as const, status: res.status, body: bodyText };
  }
  return { ok: true };
}

async function maybeAutoReply(lead: Lead) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const from = process.env.LEADS_TO || "hello@interiorshopapps.com";
  if (!apiKey || !domain) return { ok: false, skipped: true as const };

  const subject = "Thanks — we received your enquiry";
  const text = "Thanks for reaching out to InteriorShopApps. We’ve received your enquiry and will reply shortly.\n\n— Darius";

  const form = new URLSearchParams();
  form.set("from", from);
  form.set("to", lead.email);
  form.set("subject", subject);
  form.set("text", text);

  const url = `https://api.mailgun.net/v3/${domain}/messages`;
  const auth = Buffer.from(`api:${apiKey}`).toString("base64");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form,
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    return { ok: false, skipped: false as const, status: res.status, body: bodyText };
  }

  return { ok: true };
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  let payload: any = null;
  try {
    const body = await getJsonBody(request);
    if (body instanceof FormData) {
      payload = Object.fromEntries(body.entries());
    } else if (typeof body === "string") {
      payload = { raw: body };
    } else {
      payload = body;
    }
  } catch (e: any) {
    return json({ ok: false, error: "Invalid body" }, { status: 400 });
  }

  const lead: Lead = {
    email: String(payload.email || "").trim(),
    name: payload.name ? String(payload.name).trim() : undefined,
    company: payload.company ? String(payload.company).trim() : undefined,
    phone: payload.phone ? String(payload.phone).trim() : undefined,
    message: payload.message ? String(payload.message).trim() : undefined,
    source: payload.source ? String(payload.source).trim() : (new URL(request.url).searchParams.get("source") || undefined),
    createdAt: new Date().toISOString(),
    ua: request.headers.get("user-agent") || undefined,
    ip: request.headers.get("x-forwarded-for"),
  };

  if (!lead.email || !lead.email.includes("@")) {
    return json({ ok: false, error: "Valid email required" }, { status: 400 });
  }

  // Store locally (best-effort). On Heroku this is ephemeral but still useful for immediate debugging.
  try {
    const outDir = process.env.LEADS_DIR || "/tmp";
    const outPath = path.join(outDir, "interioapp-leads.jsonl");
    fs.appendFileSync(outPath, JSON.stringify(lead) + "\n", { encoding: "utf8" });
  } catch {
    // ignore
  }

  const notify = await sendMailgun(lead);
  const autoreply = await maybeAutoReply(lead);

  return json({ ok: true, notify, autoreply });
}
