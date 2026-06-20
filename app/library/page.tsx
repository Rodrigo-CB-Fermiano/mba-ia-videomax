import { auth } from "@/app/lib/auth";
import { signOut } from "@/app/lib/auth";

export default async function LibraryPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Library</h1>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded px-3 py-1.5"
            >
              Sign out
            </button>
          </form>
        </div>
        <p className="text-gray-500 mb-4">
          Welcome, {session?.user?.name ?? session?.user?.email}. Your video library will appear here.
        </p>
        <a
          href="/upload"
          className="inline-block px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Upload Video
        </a>
      </div>
    </div>
  );
}
