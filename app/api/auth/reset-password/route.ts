import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/app/lib/db";
import { sendPasswordResetEmail } from "@/app/lib/email";
import { resetPasswordSchema } from "@/app/lib/validations/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { code: "AUTH003", message: "Invalid email format." },
      { status: 400 }
    );
  }

  const { email } = parsed.data;

  const always = NextResponse.json({
    success: true,
    message: "If that email is registered, a reset link has been sent.",
  });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return always;

  await prisma.passwordResetToken.deleteMany({ where: { email } });

  const plainToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(plainToken).digest("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { email, tokenHash, expiresAt },
  });

  const resetUrl = `${process.env.AUTH_URL}/reset-password/${plainToken}`;
  await sendPasswordResetEmail(email, user.name, resetUrl);

  return always;
}
