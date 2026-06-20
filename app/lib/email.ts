import { createElement } from "react";
import { Resend } from "resend";
import { render } from "@react-email/components";
import PasswordResetEmail from "@/app/emails/password-reset";

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const html = await render(
    createElement(PasswordResetEmail, { name, resetUrl })
  );

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "VideoMax <noreply@localhost>",
    to,
    subject: "Reset your VideoMax password",
    html,
  });
}
