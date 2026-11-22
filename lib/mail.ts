import "server-only";
import nodemailer from "nodemailer";
import type { RaceRequestInput } from "@/lib/request-form";

// RaceLink inbox: every new race request is sent here
export const RACELINK_EMAIL = "racelinkcc@gmail.com";

// Gmail SMTP with an app password (Google account > Security > App passwords).
// Without SMTP_USER / SMTP_PASS the email is skipped; the request is still saved
// and shows up in the organizer's Request Forms tab.
function transport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user, pass },
  });
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function sendRaceRequestEmail(req: RaceRequestInput, id: number | undefined) {
  const mailer = transport();
  if (!mailer) {
    console.warn("[mail] SMTP_USER/SMTP_PASS not set, race request email skipped");
    return;
  }

  const date = new Date(`${req.proposedDate}T00:00:00+08:00`).toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
  const rows: [string, string | number | null][] = [
    ["Organization", req.organization],
    ["Contact person", req.contactName],
    ["Email", req.email],
    ["Phone", req.phone],
    ["Race name", req.raceTitle],
    ["Preferred date", date],
    ["Location", req.location],
    ["Expected runners", req.expectedRunners],
    ["Distances", req.distances],
    ["Anything else", req.message],
  ];
  const filled = rows.filter(([, v]) => v !== null && v !== "");
  const base = process.env.BETTER_AUTH_URL?.replace(/\/$/, "");
  const link = base ? `${base}/organizer/requests` : null;

  const text = [
    `New race request${id ? ` #${id}` : ""}`,
    "",
    ...filled.map(([k, v]) => `${k}: ${v}`),
    "",
    link ? `Review it in RaceLink: ${link}` : "Review it in RaceLink under Request Forms.",
  ].join("\n");

  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#221a1a">
<h2 style="margin:0 0 12px;color:#d40000">New race request${id ? ` #${id}` : ""}</h2>
<table cellpadding="6" style="border-collapse:collapse">
${filled.map(([k, v]) => `<tr><td style="color:#6b5b58;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="white-space:pre-wrap">${esc(String(v))}</td></tr>`).join("\n")}
</table>
<p style="margin-top:16px">${link ? `<a href="${esc(link)}" style="color:#d40000;font-weight:bold">Review it in RaceLink</a>` : "Review it in RaceLink under Request Forms."}</p>
</div>`;

  await mailer.sendMail({
    from: `"RaceLink" <${process.env.SMTP_USER}>`,
    to: RACELINK_EMAIL,
    // reply goes straight to the organization
    replyTo: `"${req.contactName.replace(/"/g, "")}" <${req.email}>`,
    subject: `Race request: ${req.raceTitle} (${req.organization})`,
    text,
    html,
  });
}
