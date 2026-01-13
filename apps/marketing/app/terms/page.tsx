import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'FamilyPlate Terms of Use - Rules and guidelines for using our service.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 max-w-7xl">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span className="text-xl font-bold text-foreground">FamilyPlate</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Use</h1>
        <div className="prose prose-invert max-w-none">
          <p className="text-muted text-lg mb-6">Last updated: January 13, 2026</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted leading-relaxed mb-4">
              By accessing and using FamilyPlate, you accept and agree to be bound by the terms and provisions of this agreement.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">2. Use License</h2>
            <p className="text-muted leading-relaxed mb-4">
              Permission is granted to temporarily use FamilyPlate for personal, non-commercial use only.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">3. User Responsibilities</h2>
            <p className="text-muted leading-relaxed mb-4">
              You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">4. Contact</h2>
            <p className="text-muted leading-relaxed">
              Questions about the Terms of Use should be sent to{' '}
              <a href="mailto:legal@familyplate.ai" className="text-primary hover:underline">
                legal@familyplate.ai
              </a>
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-border bg-surface py-8 mt-16">
        <div className="container mx-auto px-4 max-w-7xl text-center text-sm text-muted">
          <Link href="/" className="hover:text-primary transition-colors">← Back to Home</Link>
        </div>
      </footer>
    </div>
  );
}
