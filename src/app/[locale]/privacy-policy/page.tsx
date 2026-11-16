import type { Metadata } from "next";
import { buildAlternates } from "@/lib/seo";
import { fetchLegalNotice } from "@/lib/server-api";
import { ObfuscatedEmail, ObfuscatedPhone } from "@/components/ui/ObfuscatedContact";

/**
 * The privacy notice, read from the API rather than written here.
 *
 * It used to be markup in this file, and that was wrong in two ways that both bit. There are two
 * of these websites, near-identical, so one sentence meant two edits and two deploys and the two
 * copies drifted. And the text made promises about systems this page knows nothing about: it
 * stated plainly that we collect nothing automatically and set no cookies, which stopped being
 * true the day the client portal shipped a session.
 *
 * Now there is one notice, edited at Settings and versioned, so the version a customer agreed to
 * stays retrievable after the words have moved on.
 *
 * The contact block below is deliberately still local: it is the only part that is specific to
 * this site, and the obfuscated email and phone components exist to keep those two out of the
 * page source for scrapers.
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const notice = await fetchLegalNotice("privacy-policy", locale);
  return {
    title: notice?.title ?? "Privacy Policy",
    description: "How we collect, use and protect your personal information.",
    alternates: buildAlternates(locale, "/privacy-policy"),
  };
}

export default async function PrivacyPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const notice = await fetchLegalNotice("privacy-policy", locale);

  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-900 font-serif mb-2">
          {notice?.title ?? "Privacy Policy"}
        </h1>
        {notice?.effectiveFrom && (
          <p className="text-sm text-stone-400 mb-10">
            In effect from {notice.effectiveFrom}
            {notice.version ? ` | version ${notice.version}` : ""}
          </p>
        )}

        {notice ? (
          /*
           * Rendered and escaped on the server from a small plain-text markup. Nothing a person
           * typed reaches this as markup, which is why it can be injected at all.
           */
          <div
            className="prose prose-stone max-w-none space-y-4 text-stone-600 leading-relaxed text-[15px] [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-stone-800 [&_h2]:font-serif [&_h2]:mt-8 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1.5"
            dangerouslySetInnerHTML={{ __html: notice.html }}
          />
        ) : (
          /*
           * Honest rather than blank. A heading over nothing reads as a company that has not got
           * a policy, which is worse than one that says it is being updated and offers a person
           * to ask.
           */
          <div className="prose prose-stone max-w-none text-stone-600 leading-relaxed text-[15px]">
            <p>
              Our privacy notice is being updated. Ask us for the current version and we will send
              it to you.
            </p>
          </div>
        )}

        <div className="mt-10 border-t border-stone-200 pt-8 text-stone-600 text-[15px]">
          <h2 className="text-xl font-bold text-stone-800 font-serif mb-3">Contact us</h2>
          <p>
            If you have any question about this notice, about what is held about you, or if you
            would like it erased, write to us:
          </p>
          <p className="mt-2">
            Email: <ObfuscatedEmail />
            <br />
            Phone: <ObfuscatedPhone />
          </p>
        </div>
      </div>
    </section>
  );
}
