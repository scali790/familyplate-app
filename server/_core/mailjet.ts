import { ENV } from "./env.js";

/**
 * Mailjet email service for sending transactional emails
 * Requires MAILJET_API_KEY and MAILJET_SECRET_KEY environment variables
 */

// @ts-ignore - Mailjet has incorrect TypeScript definitions
const Mailjet = (await import("node-mailjet")).default;

type MailjetClient = any;

let mailjetClient: MailjetClient | null = null;

/**
 * Initialize Mailjet client with API credentials
 */
function getMailjetClient(): MailjetClient | null {
  if (!ENV.mailjetApiKey || !ENV.mailjetSecretKey) {
    console.warn("[Mailjet] API credentials not configured. Set MAILJET_API_KEY and MAILJET_SECRET_KEY environment variables.");
    return null;
  }

  if (!mailjetClient) {
    // @ts-ignore - Mailjet has incorrect TypeScript definitions
    mailjetClient = Mailjet.apiConnect(
      ENV.mailjetApiKey,
      ENV.mailjetSecretKey
    );
  }

  return mailjetClient;
}

/**
 * Send a magic link email to the user
 */
export async function sendMagicLinkEmail(
  email: string,
  name: string | undefined,
  magicLink: string
): Promise<boolean> {
  const client = getMailjetClient();
  
  if (!client) {
    console.error("[Mailjet] Cannot send email: Mailjet client not initialized");
    return false;
  }

  try {
    const request = client
      .post("send", { version: "v3.1" })
      .request({
        Messages: [
          {
            From: {
              Email: "noreply@familyplate.ai",
              Name: "FamilyPlate"
            },
            To: [
              {
                Email: email,
                Name: name || email
              }
            ],
            Subject: "Your FamilyPlate Magic Link",
            TextPart: `Hi ${name || "there"},\n\nClick the link below to sign in to FamilyPlate:\n\n${magicLink}\n\nThis link will expire in 15 minutes.\n\nBest regards,\nThe FamilyPlate Team`,
            HTMLPart: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #0a7ea4;">Welcome to FamilyPlate!</h2>
                <p>Hi ${name || "there"},</p>
                <p>Click the button below to sign in to your account:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${magicLink}" style="background-color: #0a7ea4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Sign In to FamilyPlate
                  </a>
                </div>
                <p style="color: #666; font-size: 14px;">This link will expire in 15 minutes.</p>
                <p style="color: #666; font-size: 14px;">If you didn't request this email, you can safely ignore it.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px;">Best regards,<br>The FamilyPlate Team</p>
              </div>
            `
          }
        ]
      });

    const result = await request;
    console.log("[Mailjet] Magic link email sent successfully to:", email);
    return true;
  } catch (error: any) {
    console.error("[Mailjet] Failed to send magic link email:", error.statusCode || error.message);
    return false;
  }
}
