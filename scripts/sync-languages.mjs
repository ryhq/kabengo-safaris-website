#!/usr/bin/env node

/**
 * sync-languages.mjs
 *
 * Build-time script that syncs website locales with the backend's supported languages.
 *
 * What it does:
 * 1. Fetches supported languages from the backend translation API
 * 2. For any new language: translates en.json via the backend and creates the message file
 * 3. For any removed language: optionally removes the message file (with --prune flag)
 * 4. Updates src/i18n/routing.ts with the current locale list
 *
 * Usage:
 *   node scripts/sync-languages.mjs                    # Dry-run (preview changes)
 *   node scripts/sync-languages.mjs --apply            # Write files
 *   node scripts/sync-languages.mjs --apply --prune    # Also remove unused locale files
 *
 * Environment variables (set in .env.local or export before running):
 *   NEXT_PUBLIC_API_BASE_URL  - Backend API URL (default: http://localhost:4450/api)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

// ─── Config ──────────────────────────────────────────────────────────────────

const MESSAGES_DIR = path.join(PROJECT_ROOT, "src", "messages");
const ROUTING_FILE = path.join(PROJECT_ROOT, "src", "i18n", "routing.ts");
const ENV_FILE = path.join(PROJECT_ROOT, ".env.local");
const DEFAULT_LOCALE = "en";

// Backend translates one string at a time, so we batch to avoid huge payloads
const BATCH_SIZE = 50;

// ─── Parse args ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = !args.includes("--apply");
const PRUNE = args.includes("--prune");

if (DRY_RUN) {
  console.log("🔍 DRY RUN — no files will be written. Use --apply to write changes.\n");
}

// ─── Read .env.local into process.env (only missing keys) ────────────────────

function loadEnvFile() {
  if (!fs.existsSync(ENV_FILE)) return;
  const content = fs.readFileSync(ENV_FILE, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile();

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4450/api";

console.log(`📡 Backend API: ${API_BASE_URL}\n`);

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} from ${url}: ${text}`);
  }
  return res.json();
}

/** Flatten { nav: { home: "Home" } } → { "nav.home": "Home" } */
function flattenMessages(obj, prefix = "") {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenMessages(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

/** Unflatten { "nav.home": "Home" } → { nav: { home: "Home" } } */
function unflattenMessages(flat) {
  const result = {};
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split(".");
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in current)) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

/**
 * Translate texts via the backend's translation API.
 * POST /api/public/translation/translate-messages
 */
async function translateBatch(texts, targetLanguage) {
  const res = await postJson(`${API_BASE_URL}/public/translation/translate-messages`, {
    texts,
    targetLanguage,
  });
  return res.data.translations;
}

/**
 * Translate all message strings from en.json into a target language
 * using the backend's translation service.
 */
async function translateMessages(enMessages, targetLanguage) {
  const flat = flattenMessages(enMessages);
  const entries = Object.entries(flat).filter(([, v]) => typeof v === "string");
  const keys = entries.map(([k]) => k);
  const texts = entries.map(([, v]) => v);

  console.log(`    📦 ${keys.length} strings, ${texts.join("").length} chars total`);

  const translatedFlat = {};

  // Batch into groups of BATCH_SIZE
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batchTexts = texts.slice(i, i + BATCH_SIZE);
    const batchKeys = keys.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(texts.length / BATCH_SIZE);

    console.log(`    ⏳ Batch ${batchNum}/${totalBatches} (${batchTexts.length} strings)`);

    try {
      const translated = await translateBatch(batchTexts, targetLanguage);
      for (let j = 0; j < batchKeys.length; j++) {
        translatedFlat[batchKeys[j]] = translated[j];
      }
    } catch (err) {
      console.error(`    ❌ Batch ${batchNum} failed: ${err.message}`);
      // Fall back to prefixed English
      for (let j = 0; j < batchKeys.length; j++) {
        translatedFlat[batchKeys[j]] = `[${targetLanguage.toUpperCase()}] ${batchTexts[j]}`;
      }
    }
  }

  // Carry over non-string values
  for (const [key, value] of Object.entries(flat)) {
    if (typeof value !== "string") {
      translatedFlat[key] = value;
    }
  }

  return unflattenMessages(translatedFlat);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Fetch supported languages from backend
  console.log("📥 Fetching supported languages from backend...");
  let supportedCodes, nameMap;
  try {
    const res = await fetchJson(`${API_BASE_URL}/public/translation/languages`);
    const data = res.data;
    supportedCodes = data.supportedLanguages || [];
    nameMap = {};
    if (data.languages) {
      for (const lang of data.languages) {
        nameMap[lang.code] = lang.name;
      }
    }
  } catch (err) {
    console.error(`❌ Failed to fetch languages: ${err.message}`);
    console.error("   Make sure the backend is running and accessible.");
    process.exit(1);
  }

  console.log(`   Supported: ${supportedCodes.map((c) => `${c} (${nameMap[c] || c})`).join(", ")}\n`);

  // 2. Check existing message files
  const existingFiles = fs.readdirSync(MESSAGES_DIR).filter((f) => f.endsWith(".json"));
  const existingLocales = existingFiles.map((f) => f.replace(".json", ""));

  // Always include default locale
  const targetLocales = [...new Set([DEFAULT_LOCALE, ...supportedCodes])];
  const newLocales = targetLocales.filter((l) => !existingLocales.includes(l));
  const removedLocales = existingLocales.filter((l) => l !== DEFAULT_LOCALE && !targetLocales.includes(l));

  console.log(`📁 Existing locales:  ${existingLocales.join(", ")}`);
  console.log(`🎯 Target locales:    ${targetLocales.join(", ")}`);
  if (newLocales.length > 0) console.log(`✨ New locales:       ${newLocales.join(", ")}`);
  if (removedLocales.length > 0) console.log(`🗑️  Unused locales:    ${removedLocales.join(", ")}`);
  console.log();

  // 3. Translate and create missing message files
  if (newLocales.length > 0) {
    const enMessages = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, "en.json"), "utf-8"));

    for (const locale of newLocales) {
      const langName = nameMap[locale] || locale;
      console.log(`🌐 Translating en.json → ${locale}.json (${langName})...`);

      if (DRY_RUN) {
        console.log(`   [DRY RUN] Would create src/messages/${locale}.json\n`);
        continue;
      }

      try {
        const translated = await translateMessages(enMessages, locale);
        const outputPath = path.join(MESSAGES_DIR, `${locale}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(translated, null, 2) + "\n", "utf-8");
        console.log(`   ✅ Created src/messages/${locale}.json\n`);
      } catch (err) {
        console.error(`   ❌ Failed to translate ${locale}: ${err.message}\n`);
      }
    }
  }

  // 4. Remove unused message files (only with --prune)
  if (removedLocales.length > 0 && PRUNE) {
    for (const locale of removedLocales) {
      const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
      if (DRY_RUN) {
        console.log(`🗑️  [DRY RUN] Would remove src/messages/${locale}.json`);
      } else {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Removed src/messages/${locale}.json`);
      }
    }
    console.log();
  }

  // 5. Update routing.ts
  const routingContent = `import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ${JSON.stringify(targetLocales)},
  defaultLocale: "${DEFAULT_LOCALE}",
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
`;

  const currentRouting = fs.readFileSync(ROUTING_FILE, "utf-8");
  if (currentRouting.trim() !== routingContent.trim()) {
    if (DRY_RUN) {
      console.log(`📝 [DRY RUN] Would update src/i18n/routing.ts`);
      console.log(`   Locales: ${JSON.stringify(targetLocales)}`);
    } else {
      fs.writeFileSync(ROUTING_FILE, routingContent, "utf-8");
      console.log(`📝 Updated src/i18n/routing.ts — locales: ${JSON.stringify(targetLocales)}`);
    }
  } else {
    console.log("📝 src/i18n/routing.ts is already up to date");
  }

  // 6. Summary
  console.log("\n─── Summary ───────────────────────────────────────");
  console.log(`   Locales:     ${targetLocales.length} (${targetLocales.join(", ")})`);
  console.log(`   New:         ${newLocales.length > 0 ? newLocales.join(", ") : "none"}`);
  console.log(`   Removed:     ${PRUNE && removedLocales.length > 0 ? removedLocales.join(", ") : "none"}`);
  console.log(`   Default:     ${DEFAULT_LOCALE}`);
  if (DRY_RUN) console.log("\n   Run with --apply to write changes.");
  console.log();
}

main().catch((err) => {
  console.error("❌ Fatal error:", err.message);
  process.exit(1);
});
