import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'FamilyPlate Privacy Policy - How we collect, use, and protect your data.',
};

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none">
          <p className="text-muted text-lg mb-6">Last updated: January 13, 2026</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">1. Information We Collect</h2>
            <p className="text-muted leading-relaxed mb-4">
              At FamilyPlate, we collect information that you provide directly to us, including your email address, 
              family preferences, dietary restrictions, and meal voting data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">2. How We Use Your Information</h2>
            <p className="text-muted leading-relaxed mb-4">
              We use the information we collect to provide, maintain, and improve our services, including generating 
              personalized meal plans and learning from your family&apos;s preferences.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">3. Data Security</h2>
            <p className="text-muted leading-relaxed mb-4">
              We implement appropriate technical and organizational measures to protect your personal data against 
              unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-4">4. Contact Us</h2>
            <p className="text-muted leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:privacy@familyplate.ai" className="text-primary hover:underline">
                privacy@familyplate.ai
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
