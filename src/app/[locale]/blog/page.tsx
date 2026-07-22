import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buildAlternates } from "@/lib/seo";
import { getAllPosts, coverGrad } from "@/content/blog";

const SERIF = "var(--font-source-serif), Georgia, serif";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return {
    title: t("title"),
    description: t("subtitle"),
    alternates: buildAlternates(locale, "/blog"),
    openGraph: { title: t("title"), description: t("subtitle"), type: "website", url: `https://kabengosafaris.com/${locale}/blog` },
  };
}

export default async function BlogIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const common = await getTranslations({ locale, namespace: "common" });
  const posts = getAllPosts();
  const fmtDate = (iso: string) => new Intl.DateTimeFormat(locale, { year: "numeric", month: "long", day: "numeric" }).format(new Date(iso));

  return (
    <div style={{ fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", background: "linear-gradient(175deg,#faf8f5,#f1ece3 150%)", color: "#4a3f34", minHeight: "100vh" }}>
      {/* hero */}
      <header style={{ textAlign: "center", padding: "clamp(104px,15vh,150px) clamp(18px,5vw,56px) clamp(20px,3vw,32px)", maxWidth: 760, margin: "0 auto" }}>
        <div style={{ color: "#96631a", fontSize: 12, fontWeight: 600, letterSpacing: ".18em", textTransform: "uppercase", marginBottom: 14 }}>{t("latest")}</div>
        <h1 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: "clamp(32px,5.2vw,54px)", lineHeight: 1.04, letterSpacing: "-.015em", margin: "0 0 14px" }}>{t("title")}</h1>
        <p style={{ color: "#4a3f34", fontSize: "clamp(16px,2vw,19px)", lineHeight: 1.55, margin: 0 }}>{t("subtitle")}</p>
      </header>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "clamp(20px,3vw,32px) clamp(18px,5vw,56px) clamp(56px,8vw,88px)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 24 }}>
          {posts.map((p) => (
            <article key={p.slug} style={{ background: "#fff", border: "1px solid #e4ddd1", borderRadius: 18, overflow: "hidden", boxShadow: "0 8px 28px rgba(62,21,2,.06)", display: "flex", flexDirection: "column" }}>
              <Link href={`/blog/${p.slug}`} style={{ display: "block", position: "relative", aspectRatio: "16 / 9", background: coverGrad(p.slug) }} aria-label={p.title}>
                <span style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 40%,rgba(20,12,4,.5))" }} />
              </Link>
              <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {p.tags.slice(0, 2).map((tag) => (
                    <span key={tag} style={{ background: "#f3e6c8", color: "#96631a", fontSize: 11.5, fontWeight: 600, padding: "4px 10px", borderRadius: 20 }}>{tag}</span>
                  ))}
                </div>
                <h2 style={{ fontFamily: SERIF, fontWeight: 700, color: "#2a2018", fontSize: 20, lineHeight: 1.2, margin: "0 0 10px" }}>
                  <Link href={`/blog/${p.slug}`} style={{ color: "inherit" }}>{p.title}</Link>
                </h2>
                <p style={{ color: "#7a6f61", fontSize: 14.5, lineHeight: 1.6, margin: "0 0 16px", flex: 1 }}>{p.excerpt}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, paddingTop: 14, borderTop: "1px solid #e4ddd1" }}>
                  <span style={{ color: "#7a6f61", fontSize: 12.5 }}>{fmtDate(p.date)} · {t("readTime", { min: p.readMinutes })}</span>
                  <Link href={`/blog/${p.slug}`} style={{ color: "#96631a", fontWeight: 600, fontSize: 13.5 }}>{common("readMore")} →</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
