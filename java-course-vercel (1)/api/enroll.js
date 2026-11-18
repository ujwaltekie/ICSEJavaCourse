// Vercel Serverless Function: receives the enquiry form and emails it to you via Resend.
// Required environment variables (set in Vercel > Project > Settings > Environment Variables):
//   RESEND_API_KEY  - your Resend API key
//   TO_EMAIL        - the email address that should receive enquiries
// Optional:
//   FROM_EMAIL      - e.g. "Code Craft Club <enquiries@yourdomain.com>" (needs a verified domain in Resend)
//                     If omitted, "Code Craft Club <onboarding@resend.dev>" is used (testing only).

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const clean = (v, max = 120) => String(v ?? "").trim().slice(0, max);

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  let b = req.body;
  if (typeof b === "string") {
    try { b = JSON.parse(b); } catch { b = {}; }
  }
  b = b || {};

  // Honeypot: real people never fill this hidden field, bots do.
  if (b.website) return res.status(200).json({ ok: true });

  const d = {
    studentName: clean(b.studentName),
    parentName: clean(b.parentName),
    grade: clean(b.grade, 30),
    mobile: clean(b.mobile, 20),
    location: clean(b.location),
    school: clean(b.school, 160),
    referral: clean(b.referral),
    pkg: clean(b.package, 30),
  };

  const phone = d.mobile.replace(/[\s-]/g, "");
  if (!d.studentName || !d.parentName || !d.grade || !d.location || !d.school || !/^(\+?91)?[6-9]\d{9}$/.test(phone)) {
    return res.status(400).json({ ok: false, error: "Please fill in all required fields correctly." });
  }

  const { RESEND_API_KEY, TO_EMAIL } = process.env;
  const FROM = process.env.FROM_EMAIL || "Code Craft Club <onboarding@resend.dev>";
  if (!RESEND_API_KEY || !TO_EMAIL) {
    console.error("Missing RESEND_API_KEY or TO_EMAIL environment variable");
    return res.status(500).json({ ok: false, error: "Server is not configured." });
  }

  const rows = [
    ["Student name", d.studentName],
    ["Parent name", d.parentName],
    ["Parent mobile", d.mobile],
    ["Student grade", d.grade],
    ["Student location", d.location],
    ["School", d.school],
    ["Referred by", d.referral || "-"],
    ["Package interested in", d.pkg || "Not sure yet"],
  ];
  const html =
    `<div style="font-family:Arial,sans-serif;max-width:560px">` +
    `<h2 style="margin:0 0 12px">New Java course enquiry</h2>` +
    `<table style="border-collapse:collapse;width:100%">` +
    rows.map(([k, v]) => `<tr><td style="padding:8px 10px;border:1px solid #e3e9f1;background:#f6f8fb;width:40%"><b>${esc(k)}</b></td><td style="padding:8px 10px;border:1px solid #e3e9f1">${esc(v)}</td></tr>`).join("") +
    `</table></div>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [TO_EMAIL],
        subject: `New enquiry: ${d.studentName} (${d.grade})`,
        html,
        text,
      }),
    });
    if (!r.ok) {
      console.error("Resend error:", r.status, await r.text());
      return res.status(502).json({ ok: false, error: "Could not send email." });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Unexpected error." });
  }
};
