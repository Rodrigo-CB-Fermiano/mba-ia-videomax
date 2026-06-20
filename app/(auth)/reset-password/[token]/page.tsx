import { NewPasswordForm } from "@/app/components/auth/new-password-form";

export default async function NewPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Set new password</h1>
        <NewPasswordForm token={token} />
      </div>
    </div>
  );
}
