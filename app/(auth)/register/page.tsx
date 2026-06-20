import { redirect } from "next/navigation";
import { auth } from "@/app/lib/auth";
import { RegisterForm } from "@/app/components/auth/register-form";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const session = await auth();
  if (session) redirect("/library");

  const params = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Create your account</h1>
        {params.created && (
          <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3 text-center">
            Account created. You can now log in.
          </p>
        )}
        <RegisterForm />
      </div>
    </div>
  );
}
