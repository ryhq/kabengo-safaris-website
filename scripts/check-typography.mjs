#!/usr/bin/env node
/**
 * Fails the build if punctuation nobody types gets back into the site.
 *
 * The content across this product read as machine-written, and the tell was never the wording.
 * It was em dashes joining clauses, middle dots separating a footer, curly quotes, ellipsis
 * glyphs and stars standing in for a rating. One sweep fixed it. This is what stops the next
 * paste from putting it back.
 *
 * `typography.json` at the repository root is the map, and the identical file is committed in
 * the API, the management panel and the other website, because none of them can import the
 * others. Changing it here alone gives you a site that disagrees with every document the API
 * produces.
 *
 * Run as its own step, not as a lint rule: this repository's CI runs `npm run lint || true`, so
 * a failure there would be swallowed.
 *
 * What it will never flag:
 *
 *   - A letter, in any script. The navigation lists language names natively, uk.json is
 *     Cyrillic throughout, and five catalogues are built from accented letters.
 *   - Punctuation a language owns, in the files written in that language. German writes
 *     „Anführungszeichen“, French writes « guillemets » and l’hôtel, Spanish opens with ¿.
 *     That is the `keepIn` section of the map, and folding it would anglicise seven
 *     translations so a German reader sees English quotes around German words.
 *   - Comments, in any file. A comment is written for whoever reads the source.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SRC = join(ROOT, 'src')
const MAP = JSON.parse(readFileSync(join(ROOT, 'typography.json'), 'utf8'))

const FOLD = new Map(Object.entries(MAP.fold))
const MANUAL = new Map(Object.entries(MAP.manual))
const INTERNAL = new Set(Object.keys(MAP.foldInternal))
const KEEP = new Set(Object.keys(MAP.keep))
const KEEP_IN = Object.entries(MAP.keepIn ?? {})
  .filter(([pattern]) => pattern !== '_')
  .map(([pattern, chars]) => [new RegExp(pattern), new Set(chars)])

const CODE = 0
const LINE_COMMENT = 1
const BLOCK_COMMENT = 2

/**
 * Every character that is not inside a comment, with its line.
 *
 * Not a parser. It knows the two comment forms and the three quotes, which is enough to tell a
 * comment from everything else. A lone apostrophe in JSX text can still fool it; the cost is a
 * missed character rather than a false alarm.
 */
function* outsideComments(src, isJson) {
  if (isJson) {
    let line = 1
    for (const c of src) {
      if (c === '\n') line++
      else yield [c, line]
    }
    return
  }

  let state = CODE
  let quote = null
  let line = 1

  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (c === '\n') line++

    if (state === LINE_COMMENT) {
      if (c === '\n') state = CODE
      continue
    }
    if (state === BLOCK_COMMENT) {
      if (c === '*' && src[i + 1] === '/') { state = CODE; i++ }
      continue
    }
    if (quote) {
      if (c === '\\') { i++; continue }
      if (c === quote) quote = null
      else yield [c, line]
      continue
    }
    if (c === '/' && src[i + 1] === '/') { state = LINE_COMMENT; i++; continue }
    if (c === '/' && src[i + 1] === '*') { state = BLOCK_COMMENT; i++; continue }
    if (c === "'" || c === '"' || c === '`') { quote = c; continue }
    yield [c, line]
  }
}

/** Letters and the marks that go on them are content, whatever the script. */
const isLetter = (c) => /\p{L}|\p{M}/u.test(c)

function keptIn(path) {
  const posix = relative(ROOT, path).split(sep).join('/')
  const kept = new Set()
  for (const [pattern, chars] of KEEP_IN) {
    if (pattern.test(posix)) for (const c of chars) kept.add(c)
  }
  return kept
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next' || name.startsWith('.')) continue
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (/\.(ts|tsx|js|jsx|mjs|json)$/.test(name)) out.push(path)
  }
  return out
}

const files = walk(SRC)
const offences = []

for (const file of files) {
  const kept = keptIn(file)
  const src = readFileSync(file, 'utf8')
  for (const [c, line] of outsideComments(src, file.endsWith('.json'))) {
    if (c.codePointAt(0) < 128) continue
    if (KEEP.has(c) || INTERNAL.has(c) || kept.has(c) || isLetter(c)) continue

    const where = `${relative(ROOT, file)}:${line}`
    if (FOLD.has(c)) offences.push(`${where}  '${c}'  ->  '${FOLD.get(c)}'`)
    else if (MANUAL.has(c)) offences.push(`${where}  '${c}'  ->  ${MANUAL.get(c)}`)
    else offences.push(`${where}  '${c}'  ->  nobody has decided about this one. Add it to typography.json, in all four repositories.`)
  }
}

if (offences.length) {
  console.error(
    `\n${offences.length} character(s) nobody types, in text a visitor reads.\n` +
      `The map is typography.json. Comments are not checked, and a language keeps its own\n` +
      `punctuation in its own catalogue, so this is only about the rest.\n`,
  )
  const unique = [...new Set(offences)]
  for (const o of unique.slice(0, 60)) console.error(`  ${o}`)
  if (unique.length > 60) console.error(`  ... and ${unique.length - 60} more`)
  console.error('')
  process.exit(1)
}

console.log(`no untyped punctuation in ${files.length} source files`)
