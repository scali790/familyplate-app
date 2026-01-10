import Mailjet from "node-mailjet";

const mailjet = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY || "",
  process.env.MAILJET_SECRET_KEY || ""
);

export async function sendMagicLinkEmail(
  email: string,
  name: string,
  magicLink: string
): Promise<boolean> {
  try {
    const fromEmail = process.env.MAILJET_FROM_EMAIL || "noreply@familyplate.ai";
    const fromName = process.env.MAILJET_FROM_NAME || "FamilyPlate";

    await mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: fromEmail,
            Name: fromName,
          },
          To: [
            {
              Email: email,
              Name: name,
            },
          ],
          Subject: "Your FamilyPlate Login Link",
          HTMLPart: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>FamilyPlate Login</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      <tr>
                        <td style="padding: 40px 40px 20px 40px; text-align: center;">
                          <h1 style="color: #0a7ea4; margin: 0; font-size: 28px;">FamilyPlate</h1>
                          <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Family Meal Planning Made Simple</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 20px 40px;">
                          <h2 style="color: #333; margin: 0 0 20px 0; font-size: 22px;">Hi ${name}! 👋</h2>
                          <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
                            Click the button below to log in to your FamilyPlate account. This link will expire in 15 minutes.
                          </p>
                          <div style="text-align: center; margin: 30px 0;">
                            <a href="${magicLink}" style="display: inline-block; background-color: #0a7ea4; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: bold; font-size: 16px;">
                              Log In to FamilyPlate
                            </a>
                          </div>
                          <p style="color: #999; font-size: 12px; line-height: 1.6; margin: 20px 0 0 0;">
                            If you didn't request this email, you can safely ignore it. This link will expire in 15 minutes and can only be used once.
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 20px 40px 40px 40px; text-align: center; border-top: 1px solid #eee;">
                          <p style="color: #999; font-size: 12px; margin: 0;">
                            FamilyPlate uses passwordless authentication for your security.<br>
                            You'll receive a new magic link each time you log in.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `,
        },
      ],
    });

    console.log(`[mailjet] Magic link email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("[mailjet] Failed to send magic link email:", error);
    return false;
  }
}
