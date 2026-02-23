import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Mail, MapPin, Clock } from 'lucide-react';

export const metadata = {
  title: 'Contact - Pink Spade',
  description: 'Get in touch with the Pink Spade team for support, questions, or partnerships.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 pt-28 pb-20">
        <h1 className="text-3xl font-medium tracking-tight text-zinc-900 mb-2">Contact Us</h1>
        <p className="text-sm text-zinc-500 mb-10">
          Have questions, feedback, or need support? We&apos;d love to hear from you.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* General Inquiries */}
          <div className="border border-zinc-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-zinc-600" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-zinc-900">General Inquiries</h2>
                <p className="text-[11px] text-zinc-400">Questions about the service</p>
              </div>
            </div>
            <a
              href="mailto:hello@pinkspade.ai"
              className="text-sm text-zinc-900 underline hover:text-zinc-600 transition-colors"
            >
              hello@pinkspade.ai
            </a>
          </div>

          {/* Support */}
          <div className="border border-zinc-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-zinc-900">Technical Support</h2>
                <p className="text-[11px] text-zinc-400">Bug reports and account issues</p>
              </div>
            </div>
            <a
              href="mailto:support@pinkspade.ai"
              className="text-sm text-zinc-900 underline hover:text-zinc-600 transition-colors"
            >
              support@pinkspade.ai
            </a>
          </div>

          {/* Privacy */}
          <div className="border border-zinc-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-zinc-900">Privacy & Legal</h2>
                <p className="text-[11px] text-zinc-400">Data requests and legal matters</p>
              </div>
            </div>
            <a
              href="mailto:privacy@pinkspade.ai"
              className="text-sm text-zinc-900 underline hover:text-zinc-600 transition-colors"
            >
              privacy@pinkspade.ai
            </a>
          </div>

          {/* Partnerships */}
          <div className="border border-zinc-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-zinc-900">Partnerships</h2>
                <p className="text-[11px] text-zinc-400">Business and integration inquiries</p>
              </div>
            </div>
            <a
              href="mailto:partners@pinkspade.ai"
              className="text-sm text-zinc-900 underline hover:text-zinc-600 transition-colors"
            >
              partners@pinkspade.ai
            </a>
          </div>
        </div>

        {/* Office Information */}
        <div className="border border-zinc-200 rounded-xl p-6">
          <h2 className="text-sm font-medium text-zinc-900 mb-4">Office</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-zinc-700">Pink Spade Inc.</p>
                <p className="text-sm text-zinc-500">Seoul, South Korea</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-zinc-700">Business Hours</p>
                <p className="text-sm text-zinc-500">Monday - Friday: 9:00 AM - 6:00 PM (KST)</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">Support emails are typically answered within 1-2 business days.</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Teaser */}
        <div className="mt-8 text-center">
          <p className="text-xs text-zinc-400">
            Looking for quick answers? Check our <a href="/pricing" className="text-zinc-700 underline">Pricing page</a> for plan details or visit your <a href="/dashboard" className="text-zinc-700 underline">Dashboard</a> for account management.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
