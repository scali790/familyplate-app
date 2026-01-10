import { Suspense } from "react";
import { AuthErrorContent } from "./error-content";

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
