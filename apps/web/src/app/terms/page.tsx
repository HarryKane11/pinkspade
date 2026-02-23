import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata = {
  title: 'Terms of Service - Pink Spade',
  description: 'Pink Spade Terms of Service. Read the terms governing your use of our AI creative asset platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 pt-28 pb-20">
        <h1 className="text-3xl font-medium tracking-tight text-zinc-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-zinc-400 mb-10">Last updated: February 23, 2026</p>

        <div className="prose-custom space-y-8 text-sm text-zinc-600 leading-relaxed">
          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              Welcome to Pink Spade. These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Pink Spade platform and services (the &quot;Service&quot;), operated by Pink Spade Inc. (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;).
            </p>
            <p className="mt-2">
              By creating an account or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">2. Description of Service</h2>
            <p>
              Pink Spade is an AI-powered creative asset generation platform that enables users to create marketing images, social media content, and branded visuals using artificial intelligence models. The Service includes:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>AI image generation using multiple model providers</li>
              <li>Brand DNA extraction and management</li>
              <li>Multi-channel format creation (Instagram, YouTube, Naver, Kakao, etc.)</li>
              <li>AI-powered copywriting</li>
              <li>Image export in various formats (PNG, PPTX)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">3. Account Registration</h2>
            <p>
              To use certain features of the Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Provide accurate and complete registration information</li>
              <li>Keep your account credentials secure and confidential</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Be responsible for all activities that occur under your account</li>
            </ul>
            <p className="mt-2">
              You must be at least 16 years old to create an account and use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">4. Credits and Billing</h2>

            <h3 className="text-sm font-medium text-zinc-800 mt-4 mb-2">4.1 Credit System</h3>
            <p>
              The Service uses a credit-based system. Each AI generation consumes credits based on the model used. Free accounts receive 500 credits per month. Paid plans offer additional credits as described on our Pricing page.
            </p>

            <h3 className="text-sm font-medium text-zinc-800 mt-4 mb-2">4.2 Subscriptions</h3>
            <p>
              Paid subscriptions are billed on a monthly or annual basis through Polar.sh. By subscribing, you authorize recurring charges. You may cancel at any time; access continues until the end of the current billing period.
            </p>

            <h3 className="text-sm font-medium text-zinc-800 mt-4 mb-2">4.3 Refunds</h3>
            <p>
              Credits are non-refundable once consumed. Subscription refunds may be requested within 14 days of initial purchase if no credits have been used during the billing period. Contact support for refund requests.
            </p>

            <h3 className="text-sm font-medium text-zinc-800 mt-4 mb-2">4.4 Price Changes</h3>
            <p>
              We reserve the right to modify pricing with at least 30 days&apos; notice. Existing subscribers will be notified before any price change takes effect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">5. Intellectual Property</h2>

            <h3 className="text-sm font-medium text-zinc-800 mt-4 mb-2">5.1 Your Content</h3>
            <p>
              You retain ownership of content you upload (product images, brand assets, prompts). By uploading content, you grant us a limited license to process it for the purpose of providing the Service.
            </p>

            <h3 className="text-sm font-medium text-zinc-800 mt-4 mb-2">5.2 Generated Content</h3>
            <p>
              Images and content generated through the Service are yours to use for commercial and non-commercial purposes, subject to the following:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>You may use generated content for marketing, advertising, and branding</li>
              <li>You may not claim the AI-generated content as human-created artwork where such disclosure is legally required</li>
              <li>Generated content must comply with applicable laws and these Terms</li>
            </ul>

            <h3 className="text-sm font-medium text-zinc-800 mt-4 mb-2">5.3 Our Property</h3>
            <p>
              The Service, including its design, code, algorithms, and branding (including the Pink Spade name and logo), is the property of Pink Spade Inc.. You may not copy, modify, distribute, or reverse engineer any part of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">6. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Generate content that is illegal, harmful, threatening, abusive, or harassing</li>
              <li>Create deepfakes or misleading content depicting real individuals without consent</li>
              <li>Generate content that infringes on the intellectual property rights of others</li>
              <li>Produce content involving the exploitation of minors</li>
              <li>Create content that promotes violence, discrimination, or hate speech</li>
              <li>Attempt to circumvent credit limits or abuse the Service</li>
              <li>Resell or redistribute access to the Service without authorization</li>
              <li>Use automated tools to scrape or extract data from the Service</li>
            </ul>
            <p className="mt-2">
              We reserve the right to suspend or terminate accounts that violate these guidelines without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">7. Service Availability</h2>
            <p>
              We strive to maintain high availability but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control. We are not liable for any loss resulting from service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">8. AI-Generated Content Disclaimer</h2>
            <p>
              AI-generated images may occasionally produce unexpected, inaccurate, or biased results. We do not guarantee the accuracy, quality, or appropriateness of generated content. You are responsible for reviewing all generated content before use and ensuring it complies with applicable laws and regulations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">9. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, PINK SPADE INC. AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE SERVICE IN THE 12 MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Pink Spade Inc., its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the Service, your violation of these Terms, or your infringement of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">11. Termination</h2>
            <p>
              We may suspend or terminate your account at any time for violation of these Terms or for any reason with reasonable notice. Upon termination, your right to use the Service ceases immediately. Sections regarding intellectual property, limitation of liability, and indemnification survive termination.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">12. Governing Law</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of the Republic of Korea. Any disputes shall be resolved in the courts of Seoul, South Korea.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Material changes will be communicated via email or through the Service with at least 30 days&apos; notice. Continued use of the Service after modifications constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-zinc-900 mb-3">14. Contact Information</h2>
            <p>
              For questions about these Terms, please contact us:
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
