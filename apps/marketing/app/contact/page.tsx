import { Metadata } from 'next';
import Link from 'next/link';
import { LINKS } from '@/lib/links';

export const metadata: Metadata = {
  title: 'Contact Us - FamilyPlate Support',
  description: 'Get in touch with the FamilyPlate team. We\'re here to help!',
};

export default function ContactPage() {
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
        <h1 className="text-5xl font-bold text-foreground mb-4 text-center">Get in Touch</h1>
        <p className="text-xl text-muted mb-16 text-center">
          We&apos;d love to hear from you. Choose the best way to reach us.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-surface rounded-2xl p-8 border border-border">
            <div className="text-4xl mb-4">💬</div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Feedback & Support</h2>
            <p className="text-muted mb-6 leading-relaxed">
              Have a question or suggestion? We&apos;re actively listening to our BETA users.
            </p>
            <a 
              href={LINKS.feedback}
              className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              Send Feedback
            </a>
          </div>

          <div className="bg-surface rounded-2xl p-8 border border-border">
            <div className="text-4xl mb-4">📧</div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Email Us</h2>
            <p className="text-muted mb-6 leading-relaxed">
              For general inquiries, partnerships, or press.
            </p>
            <a 
              href="mailto:hello@familyplate.ai"
              className="inline-block px-6 py-3 border border-border text-muted rounded-lg hover:border-muted transition-colors font-medium"
            >
              hello@familyplate.ai
            </a>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Looking for Support?</h2>
          <p className="text-purple-100 text-lg mb-6 max-w-2xl mx-auto">
            If you&apos;re already using FamilyPlate and need help, please use the in-app feedback feature 
            or send us a message through your dashboard.
          </p>
          <Link 
            href={LINKS.dashboard}
            className="inline-block px-6 py-3 bg-white text-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-medium"
          >
            Go to Dashboard
          </Link>
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
