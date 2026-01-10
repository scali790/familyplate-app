import Link from 'next/link';

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span className="text-xl font-bold text-foreground">FamilyPlate</span>
            <span className="px-2 py-1 text-xs bg-primary text-white rounded">BETA</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Use</h1>
        <p className="text-muted mb-8">Last Updated: January 5, 2025</p>

        <div className="prose prose-lg max-w-none space-y-8 text-foreground">
          <p>
            Welcome to FamilyPlate! These Terms of Use ("Terms") govern your access to and use of the FamilyPlate mobile application and website (collectively, the "Service") operated by BTW Marketing FCZO ("we," "our," or "us"), a company registered in Dubai, United Arab Emirates.
          </p>

          <p className="font-semibold">
            By accessing or using FamilyPlate, you agree to be bound by these Terms. If you do not agree, please do not use the Service.
          </p>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>By creating an account or using FamilyPlate, you confirm that:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>You are at least 18 years old</li>
              <li>You have the legal capacity to enter into these Terms</li>
              <li>You will comply with all applicable laws and regulations</li>
              <li>All information you provide is accurate and up-to-date</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">2. Description of Service</h2>
            <p>FamilyPlate is an AI-powered meal planning platform that:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>Generates personalized weekly meal plans based on your family's preferences</li>
              <li>Allows family members to vote on meals</li>
              <li>Provides shopping lists and recipes</li>
              <li>Supports dietary restrictions and allergies</li>
              <li>Offers meal regeneration and substitution features</li>
            </ul>
            <p className="mt-4 font-semibold">
              BETA Status: FamilyPlate is currently in BETA testing. Features may change, and the Service may experience interruptions or errors.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">3. User Accounts</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Account Creation</h3>
            <p>
              To use FamilyPlate, you must create an account using a valid email address. We use magic link authentication—no password is required.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Account Security</h3>
            <p>You are responsible for:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>Maintaining the confidentiality of your email account</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Account Termination</h3>
            <p>
              We reserve the right to suspend or terminate your account if you violate these Terms or engage in fraudulent, abusive, or illegal activity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">4. Subscription and Pricing</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">4.1 Free Tier</h3>
            <p>FamilyPlate offers a free tier that includes:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>AI-generated weekly meal plans</li>
              <li>Family voting system</li>
              <li>Dietary restrictions support</li>
              <li>Shopping lists and recipes</li>
              <li>2 meal regenerations per week</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Premium Tier (Coming Soon)</h3>
            <p>Premium features will include:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>Unlimited meal regenerations</li>
              <li>Advanced ingredient substitutions</li>
              <li>Nutrition insights and tracking</li>
              <li>Multi-week planning</li>
              <li>Priority support</li>
            </ul>
            <p className="mt-4">
              Pricing and payment terms will be provided before Premium is launched. Subscriptions will auto-renew unless canceled.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Refunds</h3>
            <p>
              The free tier does not involve payment. For Premium subscriptions (when available), refund policies will be clearly stated at the time of purchase.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">5. User Conduct</h2>
            <p>You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Scrape, copy, or reverse-engineer the Service</li>
              <li>Upload malicious code, viruses, or harmful content</li>
              <li>Impersonate another person or entity</li>
              <li>Share your account with others</li>
              <li>Use the Service to spam or harass others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">6. Content and Intellectual Property</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">6.1 Our Content</h3>
            <p>
              All content provided by FamilyPlate, including meal plans, recipes, shopping lists, and AI-generated recommendations, is owned by BTW Marketing FCZO or licensed to us. You may not:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>Republish or redistribute our content commercially</li>
              <li>Remove copyright or proprietary notices</li>
              <li>Use our content to train competing AI models</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.2 Your Content</h3>
            <p>
              You retain ownership of any content you provide (e.g., feedback, preferences, votes). By using the Service, you grant us a license to use this data to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>Provide and improve the Service</li>
              <li>Generate personalized meal plans</li>
              <li>Train and improve our AI models (anonymized)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">6.3 Third-Party Content</h3>
            <p>
              Recipes and meal suggestions may be sourced from public databases or AI-generated. We do not guarantee the accuracy, safety, or suitability of any recipe. Always verify ingredients and cooking instructions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">7. Disclaimers and Limitations of Liability</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">7.1 No Medical or Nutritional Advice</h3>
            <p className="font-semibold text-warning">
              FamilyPlate is NOT a substitute for professional medical or nutritional advice. We do not provide medical guidance. If you have allergies, dietary restrictions, or health conditions, consult a healthcare professional before following any meal plan.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.2 Accuracy of Information</h3>
            <p>We strive to provide accurate meal plans, recipes, and shopping lists, but we do not guarantee:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>The accuracy or completeness of nutritional information</li>
              <li>The availability of ingredients at local stores</li>
              <li>The suitability of meals for your specific health needs</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.3 Service Availability</h3>
            <p>We do not guarantee that the Service will be:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>Available at all times or without interruption</li>
              <li>Error-free or secure</li>
              <li>Compatible with all devices or operating systems</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">7.4 Limitation of Liability</h3>
            <p>
              To the fullest extent permitted by law, BTW Marketing FCZO and its affiliates, officers, employees, and partners shall NOT be liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>Any indirect, incidental, special, or consequential damages</li>
              <li>Loss of profits, data, or goodwill</li>
              <li>Personal injury or property damage resulting from use of the Service</li>
              <li>Errors or omissions in meal plans, recipes, or shopping lists</li>
            </ul>
            <p className="mt-4 font-semibold">
              In no event shall our total liability exceed the amount you paid us in the past 12 months (or $100 USD, whichever is greater).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">8. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless BTW Marketing FCZO from any claims, damages, losses, or expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">9. Third-Party Services</h2>
            <p>
              FamilyPlate may integrate with third-party services (e.g., grocery stores, payment processors). We are not responsible for the availability, accuracy, or practices of these third parties. Your use of third-party services is subject to their own terms and policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">10. Privacy</h2>
            <p>
              Your use of FamilyPlate is also governed by our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, which explains how we collect, use, and protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">11. Changes to Terms</h2>
            <p>We may update these Terms from time to time. We will notify you of significant changes by:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>Posting the updated Terms on our website</li>
              <li>Sending an email notification</li>
              <li>Displaying an in-app notice</li>
            </ul>
            <p className="mt-4">
              Continued use of the Service after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">12. Termination</h2>
            <p>
              You may terminate your account at any time by contacting us at <a href="mailto:info@btwmarketing.com" className="text-primary hover:underline">info@btwmarketing.com</a>. Upon termination:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>Your access to the Service will be revoked</li>
              <li>Your data will be deleted in accordance with our Privacy Policy</li>
              <li>Any outstanding payments remain due</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">13. Governing Law and Dispute Resolution</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">13.1 Governing Law</h3>
            <p>
              These Terms are governed by the laws of the United Arab Emirates and the Emirate of Dubai, without regard to conflict of law principles.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">13.2 Dispute Resolution</h3>
            <p>Any disputes arising from these Terms or your use of the Service shall be resolved through:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li><strong>Informal negotiation</strong> - Contact us first to resolve the issue</li>
              <li><strong>Arbitration</strong> - If negotiation fails, disputes will be resolved through binding arbitration in Dubai, UAE</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">14. Severability</h2>
            <p>
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">15. Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and BTW Marketing FCZO regarding the use of FamilyPlate.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">16. Contact Us</h2>
            <div className="bg-surface p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">BTW Marketing FCZO</h3>
              <p><strong>Location:</strong> Dubai, United Arab Emirates</p>
              <p><strong>Email:</strong> <a href="mailto:info@btwmarketing.com" className="text-primary hover:underline">info@btwmarketing.com</a></p>
              <p><strong>Website:</strong> <a href="https://www.familyplate.ai" className="text-primary hover:underline">www.familyplate.ai</a></p>
            </div>
            <p className="mt-6 text-sm text-muted">These Terms of Use are effective as of January 5, 2025.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/" className="text-primary hover:underline">
            ← Back to Home
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-sm text-muted">
          © 2025 BTW Marketing FCZO. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
