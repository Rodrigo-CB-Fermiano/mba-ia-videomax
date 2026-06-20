import { ResetPasswordForm } from "@/app/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Reset your password</h1>
        <p className="text-sm text-gray-500 mb-6 text-center">
          Enter your email and we&apos;ll send you a reset link.
        </p>
        <ResetPasswordForm />
      </div>
    </div>
  );
}
