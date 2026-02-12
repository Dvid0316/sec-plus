// scripts/generateFlashcards.mjs
// ESM script: node scripts/generateFlashcards.mjs
// Supports two input schemas:
//  1) Old: { domains: [{ name, sections:[{ name, bullets:[string] }]}] }
//  2) New: [{ front, back, tags:[string] }]
//
// Output: src/data/flashcards.generated.json

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import process from "node:process";

const DEFAULT_INPUT = "SECPLUS_COMPLETE_STUDY_DATA.json";
const DEFAULT_OUTPUT = "src/data/flashcards.generated.json";

// Filtering rules (tweak if you want)
const MIN_BULLET_LEN = 20;
const MUST_CONTAIN_LETTER = /[A-Za-z]/;
const DENYLIST_REGEX = /\b(continued|example|types|overview|many and varied|and much more)\b/i;

function sha1(s) {
  return crypto.createHash("sha1").update(s).digest("hex");
}

function normalizeWhitespace(s) {
  return String(s ?? "").replace(/\s+/g, " ").trim();
}

function safeArray(x) {
  return Array.isArray(x) ? x : [];
}

// SY0-701 domain keywords - check 2,3,4,5 first (Domain 1 is fallback)
const DOMAIN_KEYWORDS = [
  { domain: "2", keywords: /\b(phishing|ransomware|malware|trojan|worm|virus|reconnaissance|vulnerability|exploit|social engineering|on-path|man-in-the-middle|SQL injection|XSS|CSRF|threat actor|organized crime|nation-state|brute force|DDoS|keylogger|honeypot|watering hole|OSINT|penetration test|default credentials|buffer overflow|replay attack|DNS poisoning|smishing|hacktivist|side.?loading|jailbreak|misinformation|resource consumption|rogue access|collision|enumeration|insecure protocols|misconfiguration|open permissions|partially known|exfiltration|embedded system|escape|end-of-life|spoofing|credential stuffing|privilege escalation|backdoor|rootkit|spyware|adware|botnet|attack|attacker|blocked|intercept|impersonation|circumvent|malicious|inject|script)\b/i },
  { domain: "3", keywords: /\b(DMARC|SPF|DKIM|firewall|network security|identity|authentication|federation|LDAP|RADIUS|Kerberos|MFA|SSO|SAML|VPN|NAT|segmentation|VLAN|SASE|802\.1X|IPsec|WPA3|WAF|load balancer|jump server|containerization|blockchain|digital signature|OCSP|HSM|secure enclave|TPM|wireless|biometric|AAA|something you know|something you have|air gap|fail open|HTTPS|COPE|BYOD|smart card|development lifecycle|posture assessment|record.?level|journaling|traffic flow|port number|protected segment|access point)\b/i },
  { domain: "4", keywords: /\b(incident response|forensics|SIEM|SOAR|monitoring|recovery|backup|root cause|MTBF|MTTR|RTO|RPO|BIA|IOC|containment|escalation|tabletop exercise|chain of custody|alert tuning|NetFlow|hardening|patch|remediation|onboarding|offboarding|MDM|antivirus|quarantine|HIPS|file integrity|FIM|DLP|backout plan|disconnect|disabling|account|false negative|disaster recovery|outage|breach|configuration enforcement|availability|system availability|emergency|dispatching|continuity|alternative.*process|log entries|detect|validation|patching|vulnerability scan)\b/i },
  { domain: "5", keywords: /\b(policy|compliance|governance|audit|regulation|risk management|MOA|SLA|NDA|regulated|data owner|data custodian|due care|risk appetite|acceptance|self-assessment|responsibility matrix|conflict of interest|data sovereignty|privacy|user training|shadow IT|SLE|ALE|ARO|EF|exposure factor|uptime|automation|formal document|partnership|governmental|disclosure)\b/i },
  { domain: "1", keywords: /\b(CIA|confidentiality|integrity|availability|security controls|asset|zero trust|physical security|obfuscation|hashing|encryption|symmetric|asymmetric|PKI|non-repudiation|deterrent|detective|preventive|corrective|compensating|masking|tokenization|salting|least privilege|discretionary|access control vestibule|change management|gap analysis|create hash|complexity|verifies.*file|mitigate|race condition|removable media|trustworthiness)\b/i },
];

function inferDomain(card) {
  if (card.domain && String(card.domain).match(/^[1-5]$/)) return String(card.domain);
  const text = `${card.question ?? ""} ${card.answer ?? ""}`;
  for (const { domain, keywords } of DOMAIN_KEYWORDS) {
    if (keywords.test(text)) return domain;
  }
  return "1";
}

/**
 * Convert "new schema" array cards into internal canonical objects
 */
function fromCardArray(data) {
  // data: [{ front, back, tags }]
  const cards = [];

  for (let i = 0; i < data.length; i++) {
    const c = data[i];
    if (!c || typeof c !== "object") continue;

    const front = normalizeWhitespace(c.front);
    const back = normalizeWhitespace(c.back);

    if (!front || !back) continue;

    const tags = safeArray(c.tags).map((t) => normalizeWhitespace(t)).filter(Boolean);

    const id = c.id
      ? String(c.id)
      : `messer-${sha1(`${front}||${back}`).slice(0, 12)}`;

    const cardObj = { question: front, answer: back, domain: c.domain };
    cards.push({
      id,
      question: front,
      answer: back,
      tags,
      source: c.source ? String(c.source) : "messer-practice-exams",
      domain: cardObj.domain != null && String(cardObj.domain).match(/^[1-5]$/) ? String(cardObj.domain) : inferDomain(cardObj),
      section: c.section ?? null,
    });
  }

  return cards;
}

/**
 * Convert "old schema" domains/sections/bullets into internal canonical objects
 */
function fromDomainsSchema(data) {
  const cards = [];

  for (const domain of safeArray(data?.domains)) {
    const domainName = normalizeWhitespace(domain?.name || domain?.domain || "");

    for (const section of safeArray(domain?.sections)) {
      const sectionName = normalizeWhitespace(section?.name || section?.section || "");

      for (const rawBullet of safeArray(section?.bullets)) {
        const bullet = normalizeWhitespace(rawBullet);

        // Filters to avoid junk
        if (bullet.length < MIN_BULLET_LEN) continue;
        if (!MUST_CONTAIN_LETTER.test(bullet)) continue;
        if (DENYLIST_REGEX.test(bullet)) continue;

        const question = `What should you know about: ${bullet}?`;
        const answer = bullet; // or generate a tighter answer if you prefer

        const id = `secplus-${sha1(`${domainName}||${sectionName}||${bullet}`).slice(0, 12)}`;

        cards.push({
          id,
          question,
          answer,
          tags: [
            "security-plus",
            "sy0-701",
            ...(domainName ? [slug(domainName)] : []),
            ...(sectionName ? [slug(sectionName)] : []),
          ],
          source: "secplus-notes",
          domain: domainName || null,
          section: sectionName || null,
        });
      }
    }
  }

  return cards;
}

function slug(s) {
  return normalizeWhitespace(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function dedupe(cards) {
  // Dedupe by normalized question+answer
  const seen = new Set();
  const out = [];

  for (const c of cards) {
    const q = normalizeWhitespace(c.question).toLowerCase();
    const a = normalizeWhitespace(c.answer).toLowerCase();
    const key = `${q}||${a}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }

  return out;
}

// SY0-701 exam weight targets: D1=12%, D2=24%, D3=13%, D4=29%, D5=22%
const DOMAIN_TARGETS = { "1": 36, "2": 72, "3": 39, "4": 87, "5": 66 };

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function stratifiedSample(cards, totalTarget = 300) {
  const byDomain = {};
  for (const c of cards) {
    const d = String(c.domain ?? "1");
    if (!byDomain[d]) byDomain[d] = [];
    byDomain[d].push(c);
  }
  const result = [];
  const targets = { ...DOMAIN_TARGETS };
  for (const d of ["1", "2", "3", "4", "5"]) {
    const pool = shuffle(byDomain[d] ?? []);
    const take = Math.min(targets[d] ?? 0, pool.length);
    result.push(...pool.slice(0, take));
  }
  let need = totalTarget - result.length;
  if (need > 0) {
    const byDom = { "1": [], "2": [], "3": [], "4": [], "5": [] };
    for (const c of cards) {
      const d = String(c.domain ?? "1");
      if (!result.some((r) => r.id === c.id)) byDom[d].push(c);
    }
    const fillOrder = ["4", "2", "5", "3", "1"];
    for (const d of fillOrder) {
      if (need <= 0) break;
      const surplus = shuffle(byDom[d] ?? []).slice(0, need);
      result.push(...surplus);
      need -= surplus.length;
    }
  }
  return shuffle(result);
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

async function writeJson(filePath, obj) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const pretty = JSON.stringify(obj, null, 2);
  await fs.writeFile(filePath, pretty, "utf-8");
}

function getArg(name, fallback = null) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  const val = process.argv[idx + 1];
  return val ?? fallback;
}

async function main() {
  const input =
    getArg("--in") ||
    process.env.FLASHCARDS_INPUT ||
    DEFAULT_INPUT;

  const output =
    getArg("--out") ||
    process.env.FLASHCARDS_OUTPUT ||
    DEFAULT_OUTPUT;

  const maxCardsRaw = getArg("--max") || process.env.FLASHCARDS_MAX || null;
  const maxCards = maxCardsRaw ? Number(maxCardsRaw) : null;

  const absIn = path.resolve(process.cwd(), input);
  const absOut = path.resolve(process.cwd(), output);

  const data = await readJson(absIn);

  let cards = [];

  // Option A normalization (supports both formats)
  if (Array.isArray(data)) {
    // New schema: array of {front, back, tags}
    cards = fromCardArray(data);
  } else if (Array.isArray(data?.domains)) {
    // Old schema: {domains:[...]}
    cards = fromDomainsSchema(data);
  } else if (Array.isArray(data?.cards)) {
    // Nice-to-have: {cards:[{front/back...}]}
    cards = fromCardArray(data.cards);
  } else {
    throw new Error(
      `Unsupported flashcard JSON format.\n` +
      `Expected:\n` +
      ` - an array of { front, back, tags }\n` +
      ` - OR an object with { domains: [...] }\n` +
      `Input file: ${absIn}`
    );
  }

  cards = dedupe(cards);
  cards = stratifiedSample(cards, 300);

  const out = {
    generatedAt: new Date().toISOString(),
    count: cards.length,
    cards,
  };

  await writeJson(absOut, out);

  const dist = cards.reduce((acc, c) => {
    const d = String(c.domain ?? "1");
    acc[d] = (acc[d] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`Generated ${cards.length} flashcards`);
  console.log(`Domain distribution: ${JSON.stringify(dist)}`);
  console.log(`Input:  ${absIn}`);
  console.log(`Output: ${absOut}`);
}

main().catch((err) => {
  console.error(err?.stack || err);
  process.exit(1);
});
