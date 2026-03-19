import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Kabengo Safaris",
  description: "Learn how Kabengo Safaris collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 font-serif mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-stone-400 mb-10">Last updated: March 19, 2026</p>

        <div className="prose prose-stone max-w-none space-y-8 text-stone-600 leading-relaxed text-[15px]">
          <div>
            <h2 className="text-xl font-bold text-stone-800 font-serif mb-3">1. Who We Are</h2>
            <p>
              Kabengo Safaris is a safari tour company registered in Tanzania, based in Arusha. We operate the website{" "}
              <strong>kabengosafaris.com</strong> and are committed to protecting your personal information.
            </p>
            <p className="mt-2">
              <strong>Contact:</strong> info@kabengosafaris.com
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-stone-800 font-serif mb-3">2. Information We Collect</h2>
            <p>We only collect information that you voluntarily provide to us through:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li><strong>Booking Inquiry Form</strong> — your name, email address, phone number, travel preferences, and message</li>
              <li><strong>Contact Form</strong> — your name, email address, and message</li>
              <li><strong>Newsletter Subscription</strong> — your email address</li>
            </ul>
            <p className="mt-3">
              We do <strong>not</strong> collect any data automatically. We do not use cookies, analytics tools, tracking pixels, or any third-party monitoring services.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-stone-800 font-serif mb-3">3. How We Use Your Information</h2>
            <p>We use the information you provide solely for the following purposes:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li><strong>Booking inquiries</strong> — to respond to your safari inquiry, prepare a quote, and coordinate your trip</li>
              <li><strong>Contact messages</strong> — to reply to your questions or feedback</li>
              <li><strong>Newsletter</strong> — to send you occasional updates about our safaris and travel tips (you can unsubscribe at any time)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-stone-800 font-serif mb-3">4. Data Sharing</h2>
            <p>
              We do <strong>not</strong> share, sell, rent, or trade your personal information with any third parties. Your data stays with us and is used only to serve you.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-stone-800 font-serif mb-3">5. Data Storage & Security</h2>
            <p>
              Your data is stored securely on our server hosted by DigitalOcean, a trusted cloud infrastructure provider with data centers that comply with industry security standards.
            </p>
            <p className="mt-2">
              We take reasonable measures to protect your information from unauthorized access, alteration, or destruction. However, no method of internet transmission is 100% secure.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-stone-800 font-serif mb-3">6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
              <li><strong>Correction</strong> — ask us to correct any inaccurate information</li>
              <li><strong>Deletion</strong> — request that we delete your personal data</li>
              <li><strong>Unsubscribe</strong> — opt out of newsletter emails at any time</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at <strong>info@kabengosafaris.com</strong>.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-stone-800 font-serif mb-3">7. Children&apos;s Privacy</h2>
            <p>
              Our website is not directed at children under 16. We do not knowingly collect personal information from children. If you believe a child has submitted personal data to us, please contact us and we will promptly delete it.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-stone-800 font-serif mb-3">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date. We encourage you to review this page periodically.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-stone-800 font-serif mb-3">9. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or how we handle your data, contact us at:
            </p>
            <p className="mt-2">
              <strong>Kabengo Safaris</strong><br />
              Arusha, Tanzania<br />
              Email: info@kabengosafaris.com<br />
              Phone: +255 786 345 408
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
