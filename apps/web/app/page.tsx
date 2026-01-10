'use client';

import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { trpc } from '../lib/trpc';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const requestMagicLink = trpc.auth.requestMagicLink.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      await requestMagicLink.mutateAsync({ email });
      setMessage('✅ Check your email! We sent you a magic link to sign in.');
      setEmail('');
    } catch (error) {
      setMessage('❌ Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span className="text-xl font-bold text-foreground">FamilyPlate</span>
            <span className="px-2 py-1 text-xs bg-primary text-white rounded">BETA</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <a href="#features" className="text-foreground hover:text-primary">Features</a>
            <a href="#how-it-works" className="text-foreground hover:text-primary">How It Works</a>
            <a href="#pricing" className="text-foreground hover:text-primary">Pricing</a>
          </nav>
          <Button size="sm">Get Started</Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface rounded-full text-sm text-muted mb-6">
              <span>✨</span>
              <span>AI-Powered Meal Planning • 7-14 Day Plans</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4">
              End Dinner Debates.<br />
              Start Enjoying Meals<br />
              <span className="text-primary">Your Family Loves</span>
            </h1>
            
            <p className="text-lg text-muted mb-8">
              FamilyPlate uses AI to create personalized weekly meal plans that match your family's tastes, 
              dietary needs, and busy schedule. Let everyone vote on meals—no more "what's for dinner?" stress.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Button size="lg" className="text-lg">
                Get Your First Meal Plan Free →
              </Button>
              <Button size="lg" variant="outline" className="text-lg">
                How It Works
              </Button>
            </div>

            <div className="flex gap-6 text-sm text-muted">
              <span>✓ Free BETA access</span>
              <span>✓ Help shape the product</span>
              <span>✓ Early adopter perks</span>
            </div>
          </div>

          {/* Mock Phone Preview */}
          <div className="relative">
            <div className="bg-surface border-4 border-foreground rounded-3xl p-6 shadow-2xl max-w-sm mx-auto">
              <div className="bg-background rounded-2xl p-4">
                <div className="text-sm font-semibold text-foreground mb-2">This Week's Meals</div>
                <div className="text-xs text-muted mb-4">Jan 5 - Jan 11</div>
                
                {[
                  { day: 'MON', meal: '🍗 Honey Garlic Chicken', votes: '4 yes • 1 maybe • 0 no' },
                  { day: 'TUE', meal: '🌮 Beef Tacos', votes: '5 yes • 0 maybe • 0 no' },
                  { day: 'WED', meal: '🐟 Salmon Teriyaki', votes: '3 yes • 2 maybe • 0 no' },
                ].map((item) => (
                  <div key={item.day} className="bg-surface rounded-lg p-3 mb-2">
                    <div className="text-xs text-primary font-semibold mb-1">{item.day}</div>
                    <div className="text-sm font-medium text-foreground mb-1">{item.meal}</div>
                    <div className="text-xs text-muted">{item.votes}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 text-center">
          <div>
            <div className="text-4xl font-bold text-primary mb-2">500+</div>
            <div className="text-sm text-muted">Families Joined</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
            <div className="text-sm text-muted">Meal Plans Created</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">5+ Hours</div>
            <div className="text-sm text-muted">Saved Per Week</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-surface py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Everything Your Family Needs</h2>
            <p className="text-lg text-muted">Powerful features that make meal planning effortless</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '🤖',
                title: 'AI-Powered Meal Plans',
                description: 'Our AI learns your family\'s preferences and generates personalized 7-day meal plans in seconds. No more endless recipe scrolling.',
              },
              {
                icon: '👨‍👩‍👧‍👦',
                title: 'Family Voting',
                description: 'Share meal plans with your family. Everyone votes 👍 😐 or 👎 on each meal. The AI learns what everyone loves.',
              },
              {
                icon: '🥗',
                title: 'Dietary Restrictions',
                description: 'Halal, Kosher, Vegetarian, Vegan, Gluten-Free, Nut-Free—we handle all dietary needs and allergies automatically.',
              },
              {
                icon: '🔄',
                title: 'Instant Meal Swaps',
                description: 'Don\'t like a meal? Swap it instantly. Get fresh alternatives that still match your preferences. 2 free swaps every week!',
              },
              {
                icon: '🛒',
                title: 'Smart Shopping Lists',
                description: 'Automatically generated shopping lists with local store links. Organized by category, localized for your country.',
              },
              {
                icon: '📖',
                title: 'Full Recipes',
                description: 'Every meal includes detailed ingredients, step-by-step instructions, prep time, and difficulty level.',
              },
            ].map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">Ready to End Dinner Debates?</h2>
          <p className="text-lg text-muted mb-8">
            Enter your email to get started - we'll send you a magic link to create your account (no password needed!)
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isSubmitting}
            />
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Get Your First Meal Plan Free →'}
            </Button>
          </form>

          {message && (
            <div className={`text-sm ${message.startsWith('✅') ? 'text-success' : 'text-error'}`}>
              {message}
            </div>
          )}

          <div className="flex justify-center gap-6 text-sm text-muted mt-4">
            <span>✓ Free BETA access</span>
            <span>✓ Help shape the product</span>
            <span>✓ No credit card required</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🍽️</span>
                <span className="text-xl font-bold text-foreground">FamilyPlate</span>
              </div>
              <p className="text-sm text-muted">Family Meal Planning Made Simple</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4">PRODUCT</h3>
              <div className="flex flex-col gap-2 text-sm text-muted">
                <a href="#features">Features</a>
                <a href="#how-it-works">How It Works</a>
                <a href="#pricing">Pricing</a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">COMPANY</h3>
              <div className="flex flex-col gap-2 text-sm text-muted">
                <a href="#">About</a>
                <a href="#">Contact</a>
                <a href="#">💬 Give Feedback</a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4">LEGAL</h3>
              <div className="flex flex-col gap-2 text-sm text-muted">
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Use</a>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted">
            © 2025 BTW Marketing FCZO. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
