"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function BridgeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get("sessionId");
    const next = searchParams.get("next") || "/dashboard";

    if (!sessionId) {
      setError("Missing sessionId");
      return;
    }

    // Call establish endpoint to set cookie
    fetch("/api/auth/establish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // CRITICAL: Include cookies
      body: JSON.stringify({ sessionId }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Establish failed: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.ok) {
          // Cookie is now set, redirect to next page
          router.push(next);
        } else {
          setError("Failed to establish session");
        }
      })
      .catch((err) => {
        console.error("[AUTH_BRIDGE] Error:", err);
        setError(err.message);
      });
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Authentication Error</h1>
          <p className="mt-2 text-gray-600">{error}</p>
          <a href="/auth" className="mt-4 inline-block text-blue-600 hover:underline">
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
        <p className="text-gray-600">Completing login...</p>
      </div>
    </div>
  );
}

export default function AuthBridgePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <BridgeContent />
    </Suspense>
  );
}
