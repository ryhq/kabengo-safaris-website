import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buildAlternates } from "@/lib/seo";
import { JsonLd, getArticleJsonLd, getFAQJsonLd, getBreadcrumbJsonLd, localeUrl } from "@/lib/jsonld";
import { getAllPosts, getPost, coverGrad, type Block } from "@/content/blog";

const SERIF = "var(--font-source-serif), Georgia, serif";
const WHATSAPP = "https://wa.me/255786345408";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Not found" };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: buildAlternates(locale, `/blog/${slug}`),
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: `https://kabengosafaris.com/${locale}/blog/${slug}`,
      publishedTime: post.date,
      authors: [post.author],
    },
    twitter: { card: "summary_large_image", title: post.title, description: post.excerpt },
  };
}

function renderBlock(b: Block, i: number) {
  if (b.type === "h2") return <h2 key={i} style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(22px,3vw,30px)", lineHeight: 1.15, margin: "36px 0 14px" }}>{b.text}</h2>;
  if (b.type === "ul") return <ul key={i} style={{ margin: "0 0 18px", paddingLeft: 22, color: "#4a3f34", fontSize: 16.5, lineHeight: 1.75 }}>{b.items.map((it, j) => <li key={j} style={{ marginBottom: 6 }}>{it}</li>)}</ul>;
  return <p key={i} style={{ color: "#4a3f34", fontSize: 16.5, lineHeight: 1.8, margin: "0 0 18px" }}>{b.text}</p>;
}

export default async function BlogPostPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: "blog" });
  const nav = await getTranslations({ locale, namespace: "nav" });
  const footer = await getTranslations({ locale, namespace: "footer" });
  const fmtDate = (iso: string) => new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(new Date(iso));

  const breadcrumb = getBreadcrumbJsonLd([
    { name: nav("home"), url: localeUrl(locale) },
    { name: t("title"), url: localeUrl(locale, "/blog") },
    { name: post.title, url: localeUrl(locale, `/blog/${slug}`) },
  ]);

  return (
    <div style={{ fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", background: "linear-gradient(175deg,#faf8f5,#f1ece3 150%)", color: "#4a3f34", minHeight: "100vh" }}>
      <JsonLd data={getArticleJsonLd({ locale, slug, title: post.title, description: post.excerpt, datePublished: post.date, author: post.author })} />
      <JsonLd data={getFAQJsonLd(post.faqs)} />
      <JsonLd data={breadcrumb} />

      {/* hero */}
      <header style={{ position: "relative", overflow: "hidden", padding: "clamp(110px,16vh,170px) clamp(18px,5vw,56px) clamp(36px,5vw,52px)", background: coverGrad(slug) }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(20,12,4,.3) 0%,rgba(20,12,4,.4) 45%,rgba(20,12,4,.86) 100%)" }} />
        <div style={{ position: "relative", maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(242,236,224,.72)", fontSize: 12.5, marginBottom: 14 }}>
            <Link href="/blog" style={{ color: "rgba(242,236,224,.72)" }}>{t("title")}</Link>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {post.tags.map((tag) => <span key={tag} style={{ background: "rgba(250,248,245,.14)", backdropFilter: "blur(4px)", border: "1px solid rgba(250,248,245,.25)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20 }}>{tag}</span>)}
          </div>
          <h1 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: "clamp(28px,4.6vw,48px)", lineHeight: 1.08, letterSpacing: "-.015em", margin: "0 0 14px", textShadow: "0 2px 24px rgba(20,12,4,.4)" }}>{post.title}</h1>
          <div style={{ color: "rgba(242,236,224,.85)", fontSize: 13.5 }}>{t("by", { author: post.author })} · {fmtDate(post.date)} · {t("readTime", { min: post.readMinutes })}</div>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(32px,5vw,52px) clamp(18px,5vw,56px) 0" }}>
        <article>
          <p style={{ fontFamily: SERIF, color: "#5a1e03", fontSize: "clamp(18px,2.2vw,22px)", lineHeight: 1.5, margin: "0 0 28px" }}>{post.excerpt}</p>
          {post.body.map(renderBlock)}
        </article>

        {/* FAQ */}
        {post.faqs.length > 0 && (
          <section style={{ marginTop: "clamp(32px,5vw,48px)" }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(22px,3vw,30px)", margin: "0 0 18px" }}>{t("faqHeading")}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {post.faqs.map((f) => (
                <div key={f.q} style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 12, padding: "18px 20px" }}>
                  <h3 style={{ fontFamily: SERIF, fontWeight: 600, color: "#2a2018", fontSize: 16.5, margin: "0 0 8px" }}>{f.q}</h3>
                  <p style={{ color: "#4a3f34", fontSize: 14.5, lineHeight: 1.65, margin: 0 }}>{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div style={{ margin: "clamp(36px,5vw,52px) 0 0", paddingBottom: 8 }}>
          <Link href="/blog" style={{ color: "#96631a", fontWeight: 600, fontSize: 14 }}>← {t("backToBlog")}</Link>
        </div>
      </main>

      {/* CTA band */}
      <section style={{ position: "relative", overflow: "hidden", background: "#3d1402", padding: "clamp(48px,7vw,84px) clamp(18px,5vw,56px)", marginTop: "clamp(40px,6vw,64px)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#fff", fontSize: "clamp(26px,4vw,40px)", lineHeight: 1.1, margin: "0 0 16px" }}>{t("ctaTitle")}</h2>
          <p style={{ color: "rgba(242,236,224,.82)", fontSize: 17, lineHeight: 1.6, margin: "0 auto 28px", maxWidth: 520 }}>{t("ctaBody")}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
            <Link href="/plan" style={{ background: "#c48f2b", color: "#3d1402", fontWeight: 600, fontSize: 16, borderRadius: 9, padding: "16px 30px", boxShadow: "0 10px 30px rgba(196,143,43,.4)" }}>{nav("planYourSafari")} →</Link>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(242,236,224,.1)", color: "#fff", fontWeight: 600, fontSize: 16, border: "1.5px solid rgba(242,236,224,.4)", borderRadius: 9, padding: "15px 26px" }}>{footer("whatsapp")}</a>
          </div>
        </div>
      </section>
    </div>
  );
}
