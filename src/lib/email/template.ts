interface TemplateData {
  title: string;
  preheader: string;
  greeting: string;
  sections: Array<{
    heading?: string;
    content: string;
  }>;
  footer?: string;
}

export function buildEmailHtml(data: TemplateData): string {
  const sectionsHtml = data.sections
    .map(
      (s) => `
      ${s.heading ? `<h2 style="color: #A3FF3C; font-size: 16px; margin: 24px 0 8px 0; font-weight: 600;">${s.heading}</h2>` : ""}
      <div style="color: #cccccc; font-size: 14px; line-height: 1.7;">${s.content}</div>
    `
    )
    .join('<hr style="border: none; border-top: 1px solid #2a2a2a; margin: 20px 0;">');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <!--[if mso]><style>body{font-family:Arial,sans-serif}</style><![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="display: none; max-height: 0; overflow: hidden;">${data.preheader}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom: 32px; text-align: center;">
              <span style="font-size: 24px; font-weight: 700; color: #A3FF3C;">Masari</span>
              <span style="font-size: 14px; color: #666; margin-left: 8px;">مصاري</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color: #141414; border-radius: 16px; padding: 32px; border: 1px solid #2a2a2a;">

              <!-- Greeting -->
              <h1 style="color: #f5f5f5; font-size: 20px; margin: 0 0 4px 0; font-weight: 600;">${data.greeting}</h1>

              ${sectionsHtml}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 24px; text-align: center; color: #555; font-size: 12px;">
              ${data.footer || "Sent by Masari — Your AI-powered personal accountant"}
              <br>
              <a href="${process.env.APP_URL || "https://masari-eight.vercel.app"}/dashboard" style="color: #A3FF3C; text-decoration: none;">Open Dashboard</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

export function formatMoneyHtml(amount: number, currency: string, color?: string): string {
  const colorStyle = color ? `color: ${color};` : "color: #f5f5f5;";
  const formatted =
    currency === "USD"
      ? `$${Math.abs(amount).toFixed(2)}`
      : `${Math.abs(amount).toFixed(2)} JOD`;
  return `<span style="${colorStyle} font-weight: 600;">${formatted}</span>`;
}

export function progressBarHtml(percentage: number, width: number = 100): string {
  const color =
    percentage >= 100 ? "#FF4444" : percentage >= 80 ? "#FF8A00" : "#A3FF3C";
  const fillWidth = Math.min(percentage, 100);
  return `
    <div style="background: #1f1f1f; border-radius: 8px; height: 8px; width: ${width}%; margin: 4px 0;">
      <div style="background: ${color}; border-radius: 8px; height: 8px; width: ${fillWidth}%;"></div>
    </div>`;
}

export function statRowHtml(label: string, value: string): string {
  return `<div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #1f1f1f;">
    <span style="color: #888;">${label}</span>
    <span style="color: #f5f5f5; font-weight: 500;">${value}</span>
  </div>`;
}
