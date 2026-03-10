import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Refund Policy | GenreGenie',
  description: 'Refund Policy for GenreGenie writing prompt generator. Learn about our refund and cancellation policies.',
  alternates: { canonical: '/refund' },
};

export default function RefundPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto prose prose-neutral dark:prose-invert">
          <h1>Refund Policy</h1>
          <p><strong>Last updated:</strong> March 9, 2026</p>

          <p>
            Thank you for using GenreGenie. We want you to be satisfied with our writing prompt generator service. This Refund Policy outlines the conditions under which refunds may be issued.
          </p>

          <h2>Subscription Cancellation</h2>
          <p>
            You may cancel your subscription at any time through your account dashboard. Upon cancellation, you will continue to have access to paid features until the end of your current billing period. No partial refunds are provided for the remaining days of the billing cycle.
          </p>

          <h2>Refund Eligibility</h2>
          <ul>
            <li><strong>Within 7 days of purchase:</strong> If you are unsatisfied with our service, you may request a full refund within 7 days of your initial subscription purchase.</li>
            <li><strong>After 7 days:</strong> Refunds are generally not provided after the 7-day period, except in cases of technical issues that prevent you from using the Service.</li>
            <li><strong>Renewals:</strong> Refunds for automatic renewal charges may be requested within 48 hours of the renewal date.</li>
          </ul>

          <h2>How to Request a Refund</h2>
          <p>
            To request a refund, please contact us at <a href="mailto:support@promptgenerators.cc">support@promptgenerators.cc</a> with your account email and reason for the refund. We aim to process all refund requests within 5-7 business days.
          </p>

          <h2>Non-Refundable Items</h2>
          <ul>
            <li>Credits that have already been consumed</li>
            <li>Subscriptions cancelled after the 7-day refund window</li>
          </ul>

          <h2>Contact Us</h2>
          <p>
            If you have any questions about our Refund Policy, please contact us at <a href="mailto:support@promptgenerators.cc">support@promptgenerators.cc</a>.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
