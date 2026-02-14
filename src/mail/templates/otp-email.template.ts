export function getOtpEmailTemplate(otp: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your OTP</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; margin: 0 auto; padding: 24px;">
    <tr>
      <td style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
        <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700; color: #18181b;">Verify your email</h1>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: #71717a; line-height: 1.5;">
          Use the code below to verify your email address. This code expires in 10 minutes.
        </p>
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; padding: 16px 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #92400e;">${otp}</span>
        </div>
        <p style="margin: 0; font-size: 13px; color: #a1a1aa;">
          If you didn't request this code, you can safely ignore this email.
        </p>
        <p style="margin: 20px 0 0 0; font-size: 13px; color: #a1a1aa;">
          — Yelo App
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
