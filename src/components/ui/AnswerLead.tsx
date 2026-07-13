/**
 * Answer-first lead paragraph — a concise, factual one-liner placed high on
 * detail pages. Written to be quotable by search engines and AI answer engines
 * (GEO). Text is composed by the page from localized copy + entity data.
 */
export default function AnswerLead({ text }: { text: string }) {
  if (!text) return null;
  return (
    <p className="text-lg md:text-xl text-stone-700 leading-relaxed font-serif border-l-4 border-brand-brown/60 pl-4 md:pl-5">
      {text}
    </p>
  );
}
