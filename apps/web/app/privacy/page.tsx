import Link from 'next/link';

export default function PrivacyPolicy() {
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
        <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
        <p className="text-muted mb-8">Last Updated: January 5, 2025</p>

        <div className="prose prose-lg max-w-none space-y-8 text-foreground">
          <p>
            BTW Marketing FCZO ("we," "our," or "us") operates FamilyPlate (the "Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website.
          </p>

          <p className="font-semibold">
            By using FamilyPlate, you agree to the collection and use of information in accordance with this policy.
          </p>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">1. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">1.1 Personal Information</h3>
            <p>When you create an account, we collect:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li><strong>Email address</strong> - Used for authentication and communication</li>
              <li><strong>Name</strong> - Optional, for personalization</li>
              <li><strong>Family preferences</strong> - Dietary restrictions, taste preferences, family size</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">1.2 Usage Information</h3>
            <p>We automatically collect:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li><strong>Meal plan data</strong> - Generated meal plans, votes, and regenerations</li>
              <li><strong>Device information</strong> - Device type, operating system, app version</li>
              <li><strong>Usage analytics</strong> - Features used, session duration, interactions</li>
              <li><strong>Log data</strong> - IP address, browser type, access times</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">1.3 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li><strong>Feedback and support requests</strong> - When you contact us</li>
              <li><strong>Voting data</strong> - Your family's meal preferences and votes</li>
              <li><strong>Shopping lists</strong> - Generated grocery lists</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li><strong>Provide the Service</strong> - Generate personalized meal plans and shopping lists</li>
              <li><strong>Improve AI recommendations</strong> - Learn your family's preferences over time</li>
              <li><strong>Communicate with you</strong> - Send magic links, updates, and support responses</li>
              <li><strong>Analyze usage</strong> - Improve features and user experience</li>
              <li><strong>Prevent fraud</strong> - Detect and prevent abuse or unauthorized access</li>
              <li><strong>Comply with legal obligations</strong> - Respond to legal requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">3. How We Share Your Information</h2>
            <p>We do not sell your personal information. We may share your information with:</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Service Providers</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li><strong>Email delivery</strong> - Mailjet (for magic link authentication)</li>
              <li><strong>Cloud hosting</strong> - AWS or similar providers</li>
              <li><strong>AI processing</strong> - OpenAI or similar AI providers (anonymized data)</li>
              <li><strong>Analytics</strong> - Usage analytics providers</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Legal Requirements</h3>
            <p>We may disclose your information if required by law or in response to valid legal requests.</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Business Transfers</h3>
            <p>If FamilyPlate is acquired or merged, your information may be transferred to the new owner.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">4. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide services. You can request deletion of your account and data at any time by contacting us at <a href="mailto:info@btwmarketing.com" className="text-primary hover:underline">info@btwmarketing.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">5. Your Rights</h2>
            <p>Depending on your location, you may have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li><strong>Access</strong> - Request a copy of your personal data</li>
              <li><strong>Correction</strong> - Update or correct your information</li>
              <li><strong>Deletion</strong> - Request deletion of your account and data</li>
              <li><strong>Opt-out</strong> - Unsubscribe from marketing emails</li>
              <li><strong>Data portability</strong> - Receive your data in a portable format</li>
            </ul>
            <p className="mt-4">
              To exercise these rights, contact us at <a href="mailto:info@btwmarketing.com" className="text-primary hover:underline">info@btwmarketing.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">6. Data Security</h2>
            <p>We implement industry-standard security measures to protect your information, including:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>Encryption in transit (HTTPS/TLS)</li>
              <li>Encryption at rest for sensitive data</li>
              <li>Secure authentication (magic links, no password storage)</li>
              <li>Regular security audits</li>
            </ul>
            <p className="mt-4">
              However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">7. Children's Privacy</h2>
            <p>
              FamilyPlate is intended for use by adults (18+). We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">8. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">9. Cookies and Tracking</h2>
            <p>We use cookies and similar technologies to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted">
              <li>Remember your preferences</li>
              <li>Analyze usage patterns</li>
              <li>Improve user experience</li>
            </ul>
            <p className="mt-4">You can control cookies through your browser settings.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">10. Third-Party Links</h2>
            <p>
              Our Service may contain links to third-party websites (e.g., grocery stores). We are not responsible for the privacy practices of these external sites.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through the app. Continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mt-8 mb-4">12. Contact Us</h2>
            <div className="bg-surface p-6 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">BTW Marketing FCZO</h3>
              <p><strong>Location:</strong> Dubai, United Arab Emirates</p>
              <p><strong>Email:</strong> <a href="mailto:info@btwmarketing.com" className="text-primary hover:underline">info@btwmarketing.com</a></p>
              <p><strong>Website:</strong> <a href="https://www.familyplate.ai" className="text-primary hover:underline">www.familyplate.ai</a></p>
            </div>
            <p className="mt-6 text-sm text-muted">This Privacy Policy is effective as of January 5, 2025.</p>
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
