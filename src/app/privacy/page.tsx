import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | GenreGenie',
  description: 'Privacy Policy for GenreGenie writing prompt generator. Learn how we collect, use, and protect your personal information.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
          <h1>Privacy Policy</h1>
          <p><strong>Last updated:</strong> March 9, 2026</p>

          <p>
            GenreGenie (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates the website writing-prompt-generator.top. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
          </p>

          <h2>Information We Collect</h2>
          <p>We may collect the following types of information:</p>
          <ul>
            <li><strong>Account Information:</strong> When you sign in via Google OAuth, we receive your name, email address, and profile picture.</li>
            <li><strong>Usage Data:</strong> We collect information about how you use our writing prompt generator, including prompts generated, features used, and session duration.</li>
            <li><strong>Payment Information:</strong> When you purchase a subscription, payment is processed by Stripe. We do not store your credit card details.</li>
            <li><strong>Cookies and Tracking:</strong> We use cookies to maintain your session and improve your experience.</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <ul>
            <li>To provide and maintain our writing prompt generator service</li>
            <li>To manage your account and subscription</li>
            <li>To improve our service and develop new features</li>
            <li>To communicate with you about service updates</li>
            <li>To detect and prevent fraud or abuse</li>
          </ul>

          <h2>Data Sharing</h2>
          <p>
            We do not sell your personal information. We may share data with third-party service providers (such as Stripe for payments and Supabase for authentication) solely to operate our service.
          </p>

          <h2>Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to protect your personal data. However, no method of transmission over the Internet is 100% secure.
          </p>

          <h2>Your Rights</h2>
          <p>
            You may request access to, correction of, or deletion of your personal data at any time by contacting us at <a href="mailto:support@promptgenerators.cc">support@promptgenerators.cc</a>.
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at <a href="mailto:support@promptgenerators.cc">support@promptgenerators.cc</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
