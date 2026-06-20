import Link from "next/link";
import UploadClient from "@/app/components/upload/upload-client";

export default function UploadPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Upload Video</h1>
        <Link
          href="/library"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Library
        </Link>
      </div>
      <UploadClient />
    </main>
  );
}
