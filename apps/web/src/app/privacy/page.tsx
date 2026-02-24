import type { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description:
    'Pink Spade 개인정보처리방침. 수집하는 정보, 사용 방법, 보호 조치를 안내합니다.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 pt-28 pb-20">
        <h1 className="text-3xl font-medium tracking-tight text-zinc-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-zinc-400 mb-10">Last updated: February 23, 2026</p>

        <div className="prose-custom space-y-8 text-sm text-zinc-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">1. Introduction</h2>
            <p>
              Pink Spade (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is operated by Pink Spade Inc.. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered creative asset generation service (the &quot;Service&quot;).
            </p>
            <p className="mt-2">
              By accessing or using Pink Spade, you agree to this Privacy Policy. If you do not agree with the terms of this policy, please do not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">2. Information We Collect</h2>

            <h3 className="text-sm font-medium text-zinc-800 mt-4 mb-2">2.1 Account Information</h3>
            <p>When you create an account, we collect:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Name and email address (via Google OAuth or email signup)</li>
              <li>Profile picture (if provided through OAuth)</li>
              <li>Account preferences and settings</li>
            </ul>

            <h3 className="text-sm font-medium text-zinc-800 mt-4 mb-2">2.2 Usage Data</h3>
            <p>We automatically collect:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Service usage logs (features used, generation requests, credit consumption)</li>
              <li>Device information (browser type, operating system, screen resolution)</li>
              <li>IP address and approximate geographic location</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>

            <h3 className="text-sm font-medium text-zinc-800 mt-4 mb-2">2.3 Content Data</h3>
            <p>When you use the Service, we process:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Text prompts and creative direction inputs</li>
              <li>Uploaded images (product photos, brand assets)</li>
              <li>Brand DNA data (colors, typography, tone extracted from websites)</li>
              <li>Generated images and creative assets</li>
            </ul>

            <h3 className="text-sm font-medium text-zinc-800 mt-4 mb-2">2.4 Payment Information</h3>
            <p>
              Payment processing is handled by Polar.sh (&quot;Polar&quot;), our third-party payment processor. We do not store your full credit card number. We receive transaction confirmation, plan type, and billing history from Polar.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">3. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Provide, operate, and maintain the Service</li>
              <li>Process your image generation requests using AI models</li>
              <li>Manage your account, credits, and subscription</li>
              <li>Improve and personalize the user experience</li>
              <li>Communicate with you about updates, support, and promotional offers</li>
              <li>Monitor usage patterns and prevent abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">4. Third-Party Services</h2>
            <p>We share data with the following third-party service providers:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Fal.ai</strong> &mdash; AI model hosting and image generation. Your prompts and uploaded images are sent to Fal.ai for processing.</li>
              <li><strong>Supabase</strong> &mdash; Authentication, database, and file storage.</li>
              <li><strong>Polar.sh</strong> &mdash; Payment processing and subscription management.</li>
              <li><strong>Vercel</strong> &mdash; Application hosting and edge network delivery.</li>
            </ul>
            <p className="mt-2">
              Each third-party service has its own privacy policy governing the use of your information. We encourage you to review their respective policies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">5. Data Retention</h2>
            <p>
              We retain your account information for as long as your account is active. Generated images are stored temporarily for delivery and may be cached for up to 30 days. You may delete your account and associated data at any time by contacting us.
            </p>
            <p className="mt-2">
              Usage logs and analytics data are retained for up to 24 months for service improvement purposes, after which they are anonymized or deleted.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">6. Data Security</h2>
            <p>
              We implement industry-standard security measures including encryption in transit (TLS), encryption at rest, access controls, and regular security reviews. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">7. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict certain processing activities</li>
              <li>Data portability (receive your data in a structured format)</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, please contact us at <a href="mailto:jsagi2000@gmail.com" className="text-zinc-900 underline">jsagi2000@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">8. Cookies</h2>
            <p>
              We use essential cookies for authentication and session management. We may also use analytics cookies to understand how the Service is used. You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">9. Children&apos;s Privacy</h2>
            <p>
              The Service is not intended for individuals under the age of 16. We do not knowingly collect personal information from children. If we learn that we have collected data from a child under 16, we will promptly delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own, including the United States, where our servers and third-party providers are located. We ensure appropriate safeguards are in place for such transfers in accordance with applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page with a revised &quot;Last updated&quot; date. Your continued use of the Service after any changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">12. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <div className="mt-3 p-4 bg-zinc-50 rounded-lg text-sm space-y-1">
              <p><strong>Pink Spade Inc.</strong></p>
              <p>Seoul, South Korea</p>
              <p>Email: <a href="mailto:jsagi2000@gmail.com" className="text-zinc-900 underline">jsagi2000@gmail.com</a></p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
