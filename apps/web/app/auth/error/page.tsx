"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  const errorMessages: Record<string, string> = {
    invalid_token: "Invalid or expired magic link",
    token_used: "This magic link has already been used",
    token_expired: "This magic link has expired (15 minutes)",
    verification_failed: "Verification failed. Please try again.",
  };

  const errorText = message ? errorMessages[message] || "Authentication error" : "Unknown error";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
        <p className="text-gray-600 mb-6">{errorText}</p>
        <Link
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
