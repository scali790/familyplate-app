import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog - Family Meal Planning Tips & Recipes',
  description: 'Tips, recipes, and insights for stress-free family meal planning.',
};

export default function BlogPage() {
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

      <main className="container mx-auto px-4 py-16 max-w-6xl">
        <h1 className="text-5xl font-bold text-foreground mb-4 text-center">FamilyPlate Blog</h1>
        <p className="text-xl text-muted mb-16 text-center">
          Tips, recipes, and insights for stress-free family meal planning
        </p>

        <div className="bg-surface rounded-2xl p-12 text-center border border-border">
          <div className="text-6xl mb-6">📝</div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Coming Soon</h2>
          <p className="text-muted text-lg mb-8 max-w-2xl mx-auto">
            We're working on bringing you helpful content about family meal planning, 
            nutrition tips, and recipe ideas. Stay tuned!
          </p>
          <Link 
            href="/"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
