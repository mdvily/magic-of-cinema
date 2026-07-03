import { SITE } from "./resend";

export function wrapEmailHtml(bodyHtml: string, unsubscribeToken: string): string {
  const unsubUrl = `${SITE}/unsubscribe?token=${unsubscribeToken}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Magic of Cinema</title>
</head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:Georgia,serif;color:#1A1A1A;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="border-bottom:3px solid #1A1A1A;padding-bottom:16px;margin-bottom:28px;">
      <p style="margin:0;font-size:13px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#C0272D;">Magic of Cinema</p>
      <h1 style="margin:4px 0 0;font-size:28px;font-weight:900;letter-spacing:-0.5px;">MovieMan's Weekly Digest</h1>
    </div>

    <!-- Body -->
    <div style="font-size:16px;line-height:1.7;color:#1A1A1A;">
      ${bodyHtml}
    </div>

    <!-- Footer -->
    <div style="margin-top:40px;padding-top:20px;border-top:1px solid #E0D9CE;font-size:12px;color:#888;text-align:center;">
      <p style="margin:0 0 6px;">You're receiving this because you subscribed at <a href="${SITE}" style="color:#C0272D;text-decoration:none;">magic-of-cinema.com</a>.</p>
      <p style="margin:0;"><a href="${unsubUrl}" style="color:#888;">Unsubscribe</a></p>
    </div>

  </div>
</body>
</html>`;
}
