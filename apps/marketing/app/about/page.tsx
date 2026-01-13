import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About FamilyPlate - Our Mission',
  description: 'Learn about FamilyPlate\'s mission to end dinner debates and bring families together through AI-powered meal planning.',
};

export default function AboutPage() {
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
        <h1 className="text-5xl font-bold text-foreground mb-8 text-center">About FamilyPlate</h1>
        
        <div className="prose prose-invert max-w-none">
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Mission</h2>
            <p className="text-muted text-lg leading-relaxed mb-4">
              FamilyPlate was born from a simple observation: every family struggles with the same question every day—
              &ldquo;What&apos;s for dinner?&rdquo; We believe meal planning shouldn&apos;t be a source of stress, but an opportunity to bring 
              families together.
            </p>
            <p className="text-muted text-lg leading-relaxed">
              Our mission is to end dinner debates by giving every family member a voice through our unique voting system, 
              while leveraging AI to create meal plans that everyone actually wants to eat.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Why We Built This</h2>
            <p className="text-muted text-lg leading-relaxed mb-4">
              Traditional meal planning apps focus on the person doing the cooking—usually one parent making all the decisions. 
              But families are teams. When everyone has a say, meals become something to look forward to, not argue about.
            </p>
            <p className="text-muted text-lg leading-relaxed">
              We combined AI technology with family collaboration to create something unique: a meal planner that learns from 
              everyone&apos;s preferences and gets better every week.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-surface rounded-xl p-6 border border-border">
                <h3 className="text-xl font-bold text-foreground mb-2">👨‍👩‍👧‍👦 Family First</h3>
                <p className="text-muted">Every feature is designed to bring families together, not just feed them.</p>
              </div>
              <div className="bg-surface rounded-xl p-6 border border-border">
                <h3 className="text-xl font-bold text-foreground mb-2">🌍 Inclusive</h3>
                <p className="text-muted">We support all dietary needs, cuisines, and cultures. Everyone deserves great meals.</p>
              </div>
              <div className="bg-surface rounded-xl p-6 border border-border">
                <h3 className="text-xl font-bold text-foreground mb-2">🤖 Smart Technology</h3>
                <p className="text-muted">AI should make life easier, not more complicated. We keep it simple.</p>
              </div>
              <div className="bg-surface rounded-xl p-6 border border-border">
                <h3 className="text-xl font-bold text-foreground mb-2">🔒 Privacy</h3>
                <p className="text-muted">Your family&apos;s data is yours. We protect it like it&apos;s our own.</p>
              </div>
            </div>
          </section>

          <section className="text-center bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-white mb-4">Join Our BETA</h2>
            <p className="text-purple-100 text-lg mb-6 max-w-2xl mx-auto">
              We&apos;re still in BETA and actively shaping the product based on feedback from families like yours. 
              Join us and help build the future of family meal planning.
            </p>
            <Link 
              href="https://staging.familyplate.ai/auth"
              className="inline-block px-8 py-4 bg-white text-purple-700 rounded-lg hover:bg-purple-50 transition-colors font-semibold text-lg"
            >
              Get Started Free →
            </Link>
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
