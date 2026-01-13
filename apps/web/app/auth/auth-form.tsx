'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';

export default function AuthForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Get the 'next' parameter from URL (where to redirect after login)
  const nextUrl = searchParams.get('next');

  const requestMagicLink = trpc.auth.requestMagicLink.useMutation({
    onSuccess: () => {
      setIsSubmitted(true);
    },
    onError: (error) => {
      console.error('Failed to send magic link:', error);
      alert('Failed to send magic link. Please try again.');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      alert('Please enter your email address');
      return;
    }

    // Pass the next URL to the magic link request so it can be included in the verification link
    await requestMagicLink.mutateAsync({
      email,
      redirectTo: nextUrl || undefined,
    });
  };

  if (isSubmitted) {
    return (
      <div className="bg-surface border border-border rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-foreground mb-3">Check Your Email!</h2>
        <p className="text-muted leading-relaxed mb-4">
          We&apos;ve sent a magic link to <strong className="text-foreground">{email}</strong>
        </p>
        <p className="text-sm text-muted">
          Click the link in the email to sign in. The link will expire in 15 minutes.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-2xl p-8">
      <div className="mb-6">
        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          required
          disabled={requestMagicLink.isPending}
        />
      </div>

      <button
        type="submit"
        disabled={requestMagicLink.isPending}
        className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {requestMagicLink.isPending ? 'Sending...' : 'Send Magic Link →'}
      </button>

      <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted">
        <span>✓ No password needed</span>
        <span>✓ Free BETA access</span>
      </div>
    </form>
  );
}
