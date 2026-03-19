import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | Kabengo Safaris",
  description: "Terms and conditions for booking safaris and using the Kabengo Safaris website.",
};

export default function TermsPage() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 font-serif mb-2">
          Terms & Conditions
        </h1>
        <p className="text-sm text-stone-400 mb-10">Last updated: March 19, 2026</p>

        <div className="prose prose-stone max-w-none space-y-8 text-stone-600 leading-relaxed text-[15px]">
          <div>
            <h2 className="text-xl font-bold text-stone-800 font-serif mb-3">1. Introduction</h2>
            <p>
              These Terms & Conditions govern the use of the Kabengo Safaris website (<strong>kabengosafaris.com</strong>) and the booking of safari tours and related services provided by Kabengo Safaris, a company registered in Tanzania and based in Arusha.
            </p>
            <p className="mt-2">
              By using our website or booking a safari with us, you agree to these terms. Please read them carefully before making a booking.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-stone-800 font-serif mb-3">2. Booking & Confirmation</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>All bookings are subject to availability and confirmation by Kabengo Safaris.</li>
              <li>A booking is confirmed only after we receive the required deposit and send you a written confirmation.</li>
              <li>Please ensure all information provided during booking (names, dates, preferences) is accurate. Kabengo Safaris is not responsible for errors in information provided by the client.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-stone-800 font-serif mb-3">3. Payment Terms</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>A <strong>non-refundable deposit</strong> is required at the time of booking to secure your safari.</li>
              <li>The <strong>full remaining balance</strong> must be paid at least <strong>30 days before</strong> the safari start date.</li>
              <li>If full payment is not received by the due date, Kabengo Safaris reserves the right to cancel the booking and retain the deposit.</li>
              <li>Payment methods and instructions will be provided upon booking confirmation.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-stone-800 font-serif mb-3">4. Cancellation Policy</h2>
            <p>
              If you need to cancel your booking, the following cancellation fees apply based on how far in advance you notify us:
            </p>

            <div className="mt-4 rounded-xl border border-stone-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50">
                    <th className="text-left px-4 py-3 font-semibold text-stone-700">Notice Period</th>
                    <th className="text-left px-4 py-3 font-semibold text-stone-700">Refund</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  <tr>
                    <td className="px-4 py-3">30+ days before departure</td>
                    <td className="px-4 py-3 text-green-700 font-medium">Full refund (minus deposit)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">14–29 days before departure</td>
                    <td className="px-4 py-3 text-amber-700 font-medium">50% refund</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Less than 14 days before departure</td>
                    <td className="px-4 py-3 text-red-700 font-medium">No refund</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
              <p className="text-sm font-semibold text-stone-700 mb-2">Example:</p>
              <p className="text-sm text-stone-600">
                You book a safari for <strong>April 20</strong> and pay the full amount. If you cancel on <strong>March 15</strong> (36 days before), you receive a full refund minus the deposit. If you cancel on <strong>April 10</strong> (10 days before), no refund is issued.
              </p>
            </div>

            <p className="mt-3">
              All cancellations must be submitted in writing via email to <strong>info@kabengosafaris.com</strong>. The cancellation date is the date we receive your written notice.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-stone-800 font-serif mb-3">5. Changes by Kabengo Safaris</h2>
            <p>
              In rare cases, we may need to modify your itinerary due to circumstances beyond our control, including but not limited to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>Adverse weather conditions</li>
              <li>National park closures or access restrictions</li>
              <li>Road conditions or vehicle breakdowns</li>
              <li>Government regulations or safety advisories</li>
            </ul>
            <p className="mt-3">
              In such cases, we will make every effort to provide a suitable alternative of equal or greater value. If the alternative results in a change of cost, the difference will be communicated to you and adjusted accordingly.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-stone-800 font-serif mb-3">6. Travel Insurance</h2>
            <p>
              Kabengo Safaris <strong>strongly recommends</strong> that all clients obtain comprehensive travel insurance before departure. Your insurance should cover trip cancellation, medical emergencies, evacuation, lost luggage, and personal liability.
            </p>
            <p className="mt-2">
              Kabengo Safaris does not provide travel insurance and is not responsible for any costs arising from the lack of adequate insurance coverage.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-stone-800 font-serif mb-3">7. Liability</h2>
            <p>
              Kabengo Safaris acts as a tour operator and arranges services including transportation, accommodation, and guided activities through vetted local partners.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1.5">
              <li>We are not liable for any injury, illness, death, loss, damage, or expense resulting from circumstances beyond our control.</li>
              <li>Safari activities involve inherent risks associated with wildlife and outdoor environments. By booking with us, you acknowledge and accept these risks.</li>
              <li>Kabengo Safaris is not responsible for loss or damage to personal belongings, luggage, or valuables during the safari.</li>
              <li>Clients are responsible for ensuring they have the required travel documents (passport, visas, vaccinations).</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-stone-800 font-serif mb-3">8. Client Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Follow all safety instructions provided by your guide at all times.</li>
              <li>Respect wildlife and maintain a safe distance from animals.</li>
              <li>Respect local communities, customs, and regulations.</li>
              <li>Ensure you are physically fit for the activities included in your itinerary.</li>
              <li>Inform us of any medical conditions, allergies, or dietary requirements before the trip.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-stone-800 font-serif mb-3">9. Intellectual Property</h2>
            <p>
              All content on this website — including text, images, logos, and design — is the property of Kabengo Safaris and is protected by copyright law. You may not reproduce, distribute, or use any content without our written permission.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-stone-800 font-serif mb-3">10. Governing Law</h2>
            <p>
              These Terms & Conditions are governed by the laws of the United Republic of Tanzania. Any disputes shall be resolved in the courts of Arusha, Tanzania.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-stone-800 font-serif mb-3">11. Contact Us</h2>
            <p>
              If you have any questions about these Terms & Conditions, please contact us:
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
