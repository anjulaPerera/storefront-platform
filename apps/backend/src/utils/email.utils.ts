import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY ?? "");
  }
  return resendClient;
}

const FROM = () =>
  `${process.env.FROM_NAME ?? "Storefront"} <${process.env.FROM_EMAIL ?? "noreply@example.com"}>`;

const isDev = (): boolean =>
  !process.env.RESEND_API_KEY || process.env.NODE_ENV === "test";

async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  if (isDev()) {
    console.log(`\n📧 [DEV EMAIL]`);
    console.log(`   To:      ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(
      `   Preview: ${html
        .replace(/<[^>]*>/g, "")
        .trim()
        .slice(0, 200)}\n`,
    );
    return;
  }
  await getResend().emails.send({ from: FROM(), to, subject, html });
}

export async function sendVerificationEmail(
  to: string,
  firstName: string,
  verifyUrl: string,
): Promise<void> {
  await sendEmail(
    to,
    "Verify your email address",
    `<p>Hi ${firstName},</p>
     <p>Thanks for signing up. Please verify your email:</p>
     <p><a href="${verifyUrl}" style="padding:10px 20px;background:#1D4ED8;color:#fff;border-radius:6px;text-decoration:none;">Verify Email</a></p>
     <p>This link expires in 24 hours. If you didn't sign up, ignore this email.</p>`,
  );
}

export async function sendPasswordResetEmail(
  to: string,
  firstName: string,
  resetUrl: string,
): Promise<void> {
  await sendEmail(
    to,
    "Reset your password",
    `<p>Hi ${firstName},</p>
     <p>You requested a password reset. Click below to set a new password:</p>
     <p><a href="${resetUrl}" style="padding:10px 20px;background:#1D4ED8;color:#fff;border-radius:6px;text-decoration:none;">Reset Password</a></p>
     <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>`,
  );
}

export async function sendEnquiryNotification(
  adminEmail: string,
  enquirerName: string,
  enquirerEmail: string,
  message: string,
  productName?: string,
): Promise<void> {
  await sendEmail(
    adminEmail,
    `New enquiry from ${enquirerName}`,
    `<p><strong>New enquiry received:</strong></p>
     <p><strong>From:</strong> ${enquirerName} (${enquirerEmail})</p>
     ${productName ? `<p><strong>Product:</strong> ${productName}</p>` : ""}
     <p><strong>Message:</strong><br>${message}</p>`,
  );
}
