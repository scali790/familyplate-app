import Mailjet_lib from "node-mailjet";
const Mailjet = Mailjet_lib.default || Mailjet_lib;
import { ENV } from "./env.js";

/**
 * Mailjet email service for sending transactional emails
 * Requires MAILJET_API_KEY and MAILJET_SECRET_KEY environment variables
 */

type MailjetClient = ReturnType<typeof Mailjet.apiConnect>;

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
    mailjetClient = Mailjet.apiConnect(
      ENV.mailjetApiKey,
      ENV.mailjetSecretKey
    );
  }

  return mailjetClient;
}

export interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  textContent: string;
  htmlContent: string;
  fromEmail?: string;
  fromName?: string;
}

/**
 * Send an email via Mailjet
 * @returns true if email was sent successfully, false otherwise
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const client = getMailjetClient();
  
  if (!client) {
    console.error("[Mailjet] Cannot send email - client not initialized");
    return false;
  }

  const fromEmail = options.fromEmail || ENV.mailjetFromEmail || "noreply@familyplate.ai";
  const fromName = options.fromName || ENV.mailjetFromName || "FamilyPlate";

  try {
    const request = client.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: fromEmail,
            Name: fromName,
          },
          To: [
            {
              Email: options.to,
              Name: options.toName || options.to,
            },
          ],
          Subject: options.subject,
          TextPart: options.textContent,
          HTMLPart: options.htmlContent,
        },
      ],
    });

    const result = await request;
    
    if (result.response.status === 200) {
      console.log(`[Mailjet] Email sent successfully to ${options.to}`);
      return true;
    } else {
      console.error(`[Mailjet] Failed to send email: ${result.response.statusText}`);
      return false;
    }
  } catch (error: any) {
    console.error("[Mailjet] Error sending email:", error.message || error);
    return false;
  }
}

/**
 * Send a magic link authentication email
 */
export async function sendMagicLinkEmail(
  email: string,
  name: string | null,
  magicLink: string,
  expiresInMinutes: number = 15
): Promise<boolean> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your FamilyPlate Login Link</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px 40px 20px; text-align: center;">
                  <h1 style="margin: 0; color: #0a7ea4; font-size: 28px; font-weight: bold;">🍽️ FamilyPlate</h1>
                  <p style="margin: 10px 0 0; color: #687076; font-size: 16px;">AI-Powered Family Meal Planner</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 20px 40px;">
                  <h2 style="margin: 0 0 20px; color: #11181C; font-size: 24px; font-weight: 600;">Welcome${name ? `, ${name}` : ''}!</h2>
                  <p style="margin: 0 0 20px; color: #11181C; font-size: 16px; line-height: 1.5;">
                    Click the button below to securely access your FamilyPlate account. This link works for both login and account recovery - no password needed!
                  </p>
                  
                  <!-- CTA Button -->
                  <table role="presentation" style="margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <a href="${magicLink}" style="display: inline-block; background-color: #0a7ea4; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 18px; font-weight: 600;">
                          Log In to FamilyPlate
                        </a>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="margin: 20px 0 0; color: #687076; font-size: 14px; line-height: 1.5;">
                    Or copy and paste this link into your browser:<br>
                    <a href="${magicLink}" style="color: #0a7ea4; word-break: break-all;">${magicLink}</a>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px 40px; border-top: 1px solid #E5E7EB;">
                  <p style="margin: 0 0 10px; color: #687076; font-size: 14px;">
                    ⏱️ This link expires in <strong>${expiresInMinutes} minutes</strong>.
                  </p>
                  <p style="margin: 0 0 10px; color: #687076; font-size: 14px;">
                    🔐 <strong>Passwordless Authentication:</strong> FamilyPlate uses magic links instead of passwords for secure, hassle-free access.
                  </p>
                  <p style="margin: 0; color: #687076; font-size: 14px;">
                    🔒 If you didn't request this link, you can safely ignore this email.
                  </p>
                </td>
              </tr>
            </table>
            
            <!-- Footer text -->
            <p style="margin: 20px 0 0; color: #9BA1A6; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} FamilyPlate. All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const textContent = `
Welcome to FamilyPlate!

Click this link to log in to your account:
${magicLink}

This link expires in ${expiresInMinutes} minutes.

If you didn't request this link, you can safely ignore this email.

© ${new Date().getFullYear()} FamilyPlate. All rights reserved.
  `.trim();

  return sendEmail({
    to: email,
    toName: name || undefined,
    subject: "Your FamilyPlate Login Link",
    textContent,
    htmlContent,
  });
}
