import { redirect } from "next/navigation";
import { auth } from "@/app/lib/auth";
import { LoginForm } from "@/app/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; reset?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/library");

  const params = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sign in to VideoMax</h1>
        {(params.created || params.reset) && (
          <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3 text-center">
            {params.created
              ? "Account created. You can now log in."
              : "Password updated successfully. You can now log in."}
          </p>
        )}
        <LoginForm />
      </div>
    </div>
  );
}
