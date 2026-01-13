import { Metadata } from 'next';
import Link from 'next/link';
import { LINKS } from '@/lib/links';

export const metadata: Metadata = {
  title: 'FamilyPlate: Family Meal Planning App with Voting | AI Weekly Meal Planner',
  description: 'AI-powered family meal planning app where everyone votes. Create weekly meal plans your whole family loves. Stop dinner debates, start enjoying meals together.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span className="text-xl font-bold text-foreground">FamilyPlate</span>
            <span className="px-2 py-1 text-xs bg-primary text-white rounded">BETA</span>
          </Link>
          <nav className="hidden md:flex gap-6">
            <a href="#features" className="text-foreground hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="text-foreground hover:text-primary transition-colors">How It Works</a>
            <a href="#pricing" className="text-foreground hover:text-primary transition-colors">Pricing</a>
          </nav>
          <Link 
            href="https://staging.familyplate.ai/auth" 
            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-medium text-sm"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 max-w-7xl">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface rounded-full text-sm text-muted mb-6">
              <span>✨</span>
              <span>AI-Powered Meal Planning • 7-14 Day Plans</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
              End Dinner Debates.<br />
              Start Enjoying Meals<br />
              <span className="text-primary">Your Family Loves</span>
            </h1>
            
            <p className="text-lg text-muted mb-8 leading-relaxed">
              AI-powered family meal planning app where <strong className="text-primary">everyone votes</strong>. Create weekly meal plans your whole family actually wants to eat.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Link 
            href={LINKS.getStarted}
            className="inline-block px-8 py-4 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-semibold text-lg"
          >
            Get Your First Meal Plan Free →
          </Link>
              <a 
                href="#how-it-works"
                className="px-6 py-3 border border-border text-muted rounded-lg hover:border-muted transition-colors font-medium text-lg text-center"
              >
                How It Works
              </a>
            </div>

            <div className="flex gap-6 text-sm text-muted">
              <span>✓ Free BETA access</span>
              <span>✓ No credit card required</span>
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

      {/* Country Trust Badges */}
      <section className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="bg-surface rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-6">Trusted by Families in 5+ Countries</h2>
          <div className="flex justify-center gap-8 flex-wrap mb-4">
            {[
              { flag: '🇺🇸', name: 'USA' },
              { flag: '🇮🇳', name: 'India' },
              { flag: '🇩🇪', name: 'Germany' },
              { flag: '🇦🇪', name: 'UAE' },
              { flag: '🇸🇦', name: 'Saudi Arabia' },
            ].map((country) => (
              <div key={country.name} className="text-center">
                <div className="text-4xl mb-2">{country.flag}</div>
                <div className="text-sm text-muted">{country.name}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-6 text-sm text-success flex-wrap">
            <span>✓ Localized grocery stores</span>
            <span>✓ Regional cuisines</span>
            <span>✓ Local ingredients</span>
          </div>
        </div>
      </section>

      {/* Differentiator Section */}
      <section className="bg-gradient-to-br from-purple-600 to-purple-800 text-white py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-4xl font-bold text-center mb-4">Why Busy Families Choose FamilyPlate</h2>
          <p className="text-center text-purple-100 mb-12 text-lg">Three features that make dinner planning actually work</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Family Voting - #1 Feature */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border-2 border-orange-400 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                ⭐ #1 FEATURE
              </div>
              <div className="text-5xl mb-4 text-center">👨‍👩‍👧‍👦</div>
              <h3 className="text-2xl font-bold mb-3 text-center">Family Voting</h3>
              <p className="text-purple-100 leading-relaxed">
                Everyone votes 👍 😐 👎 on every meal. No more arguments. No more "I don't like this." Just meals your whole family actually wants to eat.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
              <div className="text-5xl mb-4 text-center">🤖</div>
              <h3 className="text-2xl font-bold mb-3 text-center">AI Weekly Planning</h3>
              <p className="text-purple-100 leading-relaxed">
                7 days planned in 60 seconds. Our AI learns what your family loves and creates personalized plans that get better every week.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
              <div className="text-5xl mb-4 text-center">🛒</div>
              <h3 className="text-2xl font-bold mb-3 text-center">One Shopping Trip</h3>
              <p className="text-purple-100 leading-relaxed">
                Smart, consolidated shopping lists. Everything you need for the week in one trip. Less waste, less stress, more time with family.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-surface py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">AI Meal Planning for Families</h2>
            <p className="text-lg text-muted">Everything you need for stress-free family dinners</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: '👨‍👩‍👧‍👦',
                title: 'Family Voting ⭐',
                description: 'Share your meal plan with a simple link. Everyone votes on each meal. Our AI learns from every "yes" and "no" to make next week\'s plan even better.',
              },
              {
                icon: '🤖',
                title: 'AI-Powered Meal Plans',
                description: 'Our AI learns your family\'s unique tastes and generates personalized 7-day meal plans in seconds. No more endless recipe scrolling.',
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
              <div key={feature.title} className="bg-background rounded-2xl p-6 border border-border hover:border-muted transition-colors">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Weekly Meal Planner for Families: How It Works</h2>
            <p className="text-lg text-muted">From chaos to calm in 3 simple steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                number: '1',
                title: 'Tell us what your family likes',
                description: 'A quick 2-minute setup. Share your family size, dietary needs, and favorite cuisines. Vote on 6 sample dishes so our AI understands your taste.',
              },
              {
                number: '2',
                title: 'We plan the week for you',
                description: 'Receive a complete 7-day meal plan tailored to your family. Share the link with everyone to vote. Swap anything you don\'t like—it\'s that easy.',
              },
              {
                number: '3',
                title: 'Shop once. Cook stress-free.',
                description: 'Get a smart shopping list with everything you need. Follow easy recipes. Enjoy peaceful dinners. The AI learns from your votes to make next week even better.',
              },
            ].map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-surface py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-4xl font-bold text-center text-foreground mb-12">What Families Say</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                stars: '⭐⭐⭐⭐⭐',
                text: 'No more dinner arguments. My kids vote and we actually agree on meals.',
                avatar: '👩',
                name: 'Sarah M.',
                role: 'Mom of 3',
              },
              {
                stars: '⭐⭐⭐⭐⭐',
                text: 'Halal meal planning with UAE grocery stores. Saves us 5+ hours every week.',
                avatar: '👨',
                name: 'Ahmed K.',
                role: 'Father of 2',
              },
              {
                stars: '⭐⭐⭐⭐⭐',
                text: 'The meal swap feature is genius. If we don\'t like something, just regenerate it.',
                avatar: '👩',
                name: 'Jennifer L.',
                role: 'Working Mom',
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-background rounded-2xl p-6 border border-border">
                <div className="text-yellow-500 text-lg mb-3">{testimonial.stars}</div>
                <p className="text-foreground italic mb-4 leading-relaxed">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{testimonial.avatar}</div>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-background">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-muted">Start free, upgrade when you're ready</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-surface rounded-2xl p-8 border-2 border-border">
              <h3 className="text-2xl font-bold text-foreground mb-2">Free</h3>
              <div className="text-3xl font-bold text-primary mb-6">
                $0<span className="text-lg font-normal text-muted">/month</span>
              </div>
              <ul className="space-y-3 text-muted mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-success mt-1">✓</span>
                  <span>AI-generated weekly meal plans</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success mt-1">✓</span>
                  <span><strong className="text-foreground">Family voting system</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success mt-1">✓</span>
                  <span>All dietary restrictions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success mt-1">✓</span>
                  <span>Shopping lists & recipes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success mt-1">✓</span>
                  <span>2 meal swaps/week</span>
                </li>
              </ul>
               <Link 
                href={LINKS.getStarted}
                className="inline-block w-full text-center px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold text-lg"
              >
                Get Started Free →
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="bg-surface rounded-2xl p-8 border-2 border-primary relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-sm font-semibold rounded-full">
                Coming Soon
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Premium</h3>
              <div className="text-3xl font-bold text-primary mb-6">
                $9.99<span className="text-lg font-normal text-muted">/month</span>
              </div>
              <p className="text-sm text-muted mb-4">For families who want more flexibility</p>
              <ul className="space-y-3 text-muted mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-success mt-1">✓</span>
                  <span>Everything in Free, plus:</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success mt-1">✓</span>
                  <span><strong className="text-foreground">Unlimited meal swaps</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success mt-1">✓</span>
                  <span>Advanced substitutions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success mt-1">✓</span>
                  <span>Nutrition insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success mt-1">✓</span>
                  <span>Multi-week planning</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-success mt-1">✓</span>
                  <span>Priority support</span>
                </li>
              </ul>
              <div className="space-y-3">
                <Link 
                  href={LINKS.getStarted}
                  className="block w-full px-6 py-3 bg-primary text-white text-center rounded-lg hover:bg-primary/90 transition-colors font-semibold"
                >
                  Get Started Free →
                </Link>
                <p className="text-xs text-center text-muted">
                  Start with Free plan. We'll notify you when Premium launches!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-surface">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h2 className="text-4xl font-bold text-foreground mb-4">Ready to End Dinner Debates?</h2>
          <p className="text-lg text-muted mb-8 leading-relaxed">
            Click below to get started. We'll send you a magic link to create your account (no password needed).
          </p>

              <Link 
                href={LINKS.getStarted}
                className="inline-block px-8 py-4 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity font-semibold text-lg"
              >
                Get Your First Meal Plan Free →
              </Link>

          <div className="flex justify-center gap-6 text-sm text-muted mt-6">
            <span>✓ Free BETA access</span>
            <span>✓ No credit card required</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🍽️</span>
                <span className="text-xl font-bold text-foreground">FamilyPlate</span>
              </Link>
              <p className="text-sm text-muted">Family Meal Planning Made Simple</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">Product</h3>
              <div className="flex flex-col gap-2 text-sm text-muted">
                <a href="#features" className="hover:text-primary transition-colors">Features</a>
                <a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a>
                <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
                <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">Company</h3>
              <div className="flex flex-col gap-2 text-sm text-muted">
                <Link href="/about" className="hover:text-primary transition-colors">About</Link>
                <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
                <a href="https://staging.familyplate.ai/feedback" className="hover:text-primary transition-colors">💬 Give Feedback</a>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-4 text-sm uppercase tracking-wide">Legal</h3>
              <div className="flex flex-col gap-2 text-sm text-muted">
                <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-primary transition-colors">Terms of Use</Link>
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
