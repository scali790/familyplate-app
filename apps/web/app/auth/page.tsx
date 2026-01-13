import { Metadata } from 'next';
import { Suspense } from 'react';
import AuthForm from './auth-form';

export const metadata: Metadata = {
  title: 'Sign In - FamilyPlate',
  description: 'Sign in to FamilyPlate with a magic link. No password needed!',
  robots: {
    index: false, // Don't index auth pages
    follow: false,
  },
};

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-4xl">🍽️</span>
            <h1 className="text-3xl font-bold text-foreground">FamilyPlate</h1>
          </div>
          <p className="text-muted text-lg">
            Enter your email to get started
          </p>
        </div>

        <Suspense fallback={<div className="text-center text-muted">Loading...</div>}>
          <AuthForm />
        </Suspense>

        <div className="mt-8 text-center text-sm text-muted">
          <p>
            By signing in, you agree to our{' '}
            <a href="/terms" className="text-primary hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
