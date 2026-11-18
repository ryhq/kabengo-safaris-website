import type { MetadataRoute } from "next";

const BASE = "https://kabengosafaris.com";


/*
 * Nothing is blocked here and nothing ever was. The AI crawlers are named anyway.
 *
 * Checked by request before writing this: GPTBot, ClaudeBot, CCBot and PerplexityBot all
 * already receive 200 on /llms.txt and on a park page. So this is a statement of intent, not a
 * repair - and it means a future blanket rule under `*` cannot quietly exclude them without
 * somebody deleting a line that says what it is for.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "CCBot",
  "Google-Extended",
  "Applebot-Extended",
  "Bytespider",
  "Amazonbot",
  "meta-externalagent",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: AI_CRAWLERS, allow: "/" },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
