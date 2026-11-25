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

// account emails: one button, plain-text copy of the link for clients that strip HTML
async function sendLinkEmail(to: string, subject: string, heading: string, body: string, button: string, url: string, footer: string) {
  const mailer = transport();
  if (!mailer) {
    // walang SMTP locally: print the link so the flow can still be tested
    if (process.env.NODE_ENV !== "production") console.info(`[mail] SMTP not set. ${subject} for ${to}:\n${url}`);
    else console.warn(`[mail] SMTP_USER/SMTP_PASS not set, "${subject}" email skipped`);
    return;
  }
  const text = [heading, "", body, "", `${button}: ${url}`, "", footer].join("\n");
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#172340;max-width:480px">
<h2 style="margin:0 0 12px;font-size:22px">${esc(heading)}</h2>
<p style="margin:0 0 20px">${esc(body)}</p>
<p style="margin:0 0 20px"><a href="${esc(url)}" style="display:inline-block;background:#e2f57a;color:#172340;font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:10px">${esc(button)}</a></p>
<p style="margin:0 0 8px;font-size:13px;color:#5b6478">Or paste this link into your browser:<br><a href="${esc(url)}" style="color:#4757b8;word-break:break-all">${esc(url)}</a></p>
<p style="margin:16px 0 0;font-size:13px;color:#5b6478">${esc(footer)}</p>
</div>`;
  await mailer.sendMail({ from: `"RaceLink" <${process.env.SMTP_USER}>`, to, subject, text, html });
}

export function sendVerificationEmail(to: string, name: string, url: string) {
  return sendLinkEmail(
    to,
    "Verify your RaceLink email",
    `Hi ${name.split(" ")[0]}, confirm your email`,
    "Tap the button to verify your email and finish setting up your RaceLink runner account.",
    "Verify email",
    url,
    "The link expires in 24 hours. If you didn't sign up for RaceLink, you can ignore this email.",
  );
}

export function sendPasswordResetEmail(to: string, name: string, url: string) {
  return sendLinkEmail(
    to,
    "Reset your RaceLink password",
    `Hi ${name.split(" ")[0]}, reset your password`,
    "We got a request to reset the password for your RaceLink account. Tap the button to choose a new one.",
    "Reset password",
    url,
    "The link expires in 1 hour. If you didn't ask for this, you can ignore this email and your password stays the same.",
  );
}

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
