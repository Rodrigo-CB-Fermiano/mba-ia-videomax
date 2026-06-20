import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/app/lib/db";
import { newPasswordSchema } from "@/app/lib/validations/auth";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const parsed = newPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { code: "AUTH006", errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { token, password } = parsed.data;

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!record) {
    return NextResponse.json(
      { code: "AUTH004", message: "This link has expired. Request a new password reset." },
      { status: 400 }
    );
  }

  if (record.expiresAt < new Date()) {
    return NextResponse.json(
      { code: "AUTH005", message: "This link has expired. Request a new password reset." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { email: record.email },
    data: { passwordHash },
  });

  await prisma.passwordResetToken.delete({ where: { tokenHash } });

  return NextResponse.json({
    success: true,
    message: "Password updated successfully. You can now log in.",
  });
}
