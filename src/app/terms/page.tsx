import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Terms and Conditions | GenreGenie',
  description: 'Terms and Conditions for GenreGenie writing prompt generator. Read our terms of service before using our platform.',
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
          <h1>Terms and Conditions</h1>
          <p><strong>Last updated:</strong> March 9, 2026</p>

          <p>
            Welcome to GenreGenie. By accessing or using writing-prompt-generator.top (&quot;the Service&quot;), you agree to be bound by these Terms and Conditions.
          </p>

          <h2>1. Use of Service</h2>
          <p>
            GenreGenie provides an AI-powered writing prompt generator. You may use the Service for personal and commercial writing purposes. You agree not to misuse the Service or use it for any unlawful purpose.
          </p>

          <h2>2. Accounts</h2>
          <p>
            You may need to create an account to access certain features. You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account.
          </p>

          <h2>3. Subscriptions and Payments</h2>
          <ul>
            <li>Free users receive a limited number of daily credits.</li>
            <li>Paid subscriptions provide additional credits and features.</li>
            <li>Payments are processed securely through Stripe.</li>
            <li>Subscriptions renew automatically unless cancelled before the renewal date.</li>
          </ul>

          <h2>4. Intellectual Property</h2>
          <p>
            Content generated using our writing prompt generator belongs to you. However, the Service itself, including its design, code, and branding, remains the intellectual property of GenreGenie.
          </p>

          <h2>5. Limitation of Liability</h2>
          <p>
            The Service is provided &quot;as is&quot; without warranties of any kind. GenreGenie shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.
          </p>

          <h2>6. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your access to the Service at our discretion, without prior notice, for conduct that we believe violates these Terms or is harmful to other users.
          </p>

          <h2>7. Changes to Terms</h2>
          <p>
            We may modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the updated Terms.
          </p>

          <h2>8. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at <a href="mailto:support@promptgenerators.cc">support@promptgenerators.cc</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
