#!/usr/bin/env node
/**
 * Generates a canonical CONCEPT DICTIONARY for CompTIA Security+ SY0-701.
 * STRICT ATOMIC RULES: ONE concept = ONE bullet. No merging. Quality over quantity.
 *
 * Input: SECPLUS_COMPLETE_STUDY_DATA.json
 * Output: src/data/concept_dictionary.json
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const INPUT = path.join(ROOT, 'SECPLUS_COMPLETE_STUDY_DATA.json')
const OUTPUT = path.join(ROOT, 'src', 'data', 'concept_dictionary.json')

function toKebab(str) {
  return str
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function toTitleCase(str) {
  const acronyms = ['IoT', 'XSS', 'SQL', 'DNS', 'IP', 'VPN', 'API', 'MFA', 'PKI', 'AAA', 'CIA', 'NIST', 'SCAP', 'TOCTOU', 'TPM', 'DLP', 'FIM', 'IAM', 'NGFW', 'NAT', 'SAST', 'BIA', 'AD', 'SLA', 'IOC']
  let result = str.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  for (const ac of acronyms) {
    result = result.replace(new RegExp(`\\b${ac}\\b`, 'gi'), ac)
  }
  return result
}

function getCurated(termKey) {
  const key = termKey.replace(/-/g, ' ')
  return CURATED_DEFINITIONS[key] || CURATED_DEFINITIONS[termKey]
}

function mustSkip(text) {
  const t = (text || '').trim()
  if (!t || t.length < 30) return true
  if (/^(example|examples|types|overview|continued|and much more)\b/i.test(t)) return true
  if (/^(this may|there's a|get ready|time to)\b/i.test(t)) return true
  if (t.endsWith(':')) return true
  if (/^\?/.test(t)) return true
  return false
}

function isList(text) {
  const parts = text.split(/,\s*/)
  if (parts.length >= 3) {
    const avgLen = parts.reduce((s, p) => s + p.trim().length, 0) / parts.length
    if (avgLen < 30) return true
  }
  return false
}

function hasVerb(text) {
  return /\b(is|are|was|were|have|has|had|do|does|did|can|could|will|would|may|might|must|prevent|ensures?|protects?|allows?|denies?|provides?|requires?|means?|refers?|describes?|includes?|covers?|applies?|implements?|manages?|determines?|validates?|identifies?|monitors?|blocks?|captures?|exchanges?|binds?|mimics?)\b/i.test(text)
}

function isFragment(text) {
  const words = text.split(/\s+/).length
  return (words <= 5 && !hasVerb(text)) || words <= 2
}

function isCompleteDefinition(text) {
  if (mustSkip(text)) return false
  if (isList(text)) return false
  if (isFragment(text)) return false
  if (!hasVerb(text)) return false
  if (text.length < 40) return false
  if (/^(they|we|there)\s+/i.test(text.trim())) return false
  if (/\s+[A-Z][a-z]+\s*$/.test(text) && !text.trim().endsWith('.')) return false
  return true
}

function isValidTerm(text) {
  const t = text.trim()
  if (!t || t.length < 2 || t.length > 50) return false
  if (/^(most|some|many|where|what|how|that|this|these|those|we|they|there|someone|everyone|nothing|no system)\b/i.test(t)) return false
  if (/^(the|a|an)\s+\w+$/.test(t)) return false
  if (/^the\s+(database|vulnerabilities|attackers|good|bad)\b/i.test(t)) return false
  if (/^once\s/i.test(t)) return false
  if (/^ensure\s/i.test(t)) return false
  if (/^manages\s/i.test(t)) return false
  if (/^automatically\s/i.test(t)) return false
  if (/^no\s/i.test(t)) return false
  if (t.split(/\s+/).length > 6) return false
  if (/^(attackers|other|stronger)\s/i.test(t)) return false
  const wordCount = t.split(/\s+/).length
  if (wordCount === 1 && /^[a-z]/.test(t)) return false
  return true
}

const CURATED_DEFINITIONS = {
  'confidentiality': 'Confidentiality is the principle of preventing disclosure of information to unauthorized individuals or systems.',
  'integrity': 'Integrity ensures that data and messages cannot be modified without detection.',
  'availability': 'Availability ensures that systems and networks remain operational when needed.',
  'cia triad': 'The CIA triad comprises the three fundamental principles of security: Confidentiality, Integrity, and Availability.',
  'the-cia-triad': 'The CIA triad comprises the three fundamental principles of security: Confidentiality, Integrity, and Availability.',
  'non-repudiation': 'Non-repudiation is the assurance that a party cannot deny having sent or received a message or performed an action.',
  'aaa': 'AAA (Authentication, Authorization, and Accounting) is the framework for controlling access to network resources.',
  'authentication': 'Authentication is the process of verifying the identity of a user or system.',
  'authorization': 'Authorization determines what an authenticated user or system is permitted to do.',
  'accounting': 'Accounting involves tracking and logging user activities for audit and compliance purposes.',
  'zero trust': 'Zero trust is a security model that assumes no implicit trust; every device, process, and person must be verified regardless of network location.',
  'security controls': 'Security controls are safeguards or countermeasures designed to prevent, detect, or mitigate security risks to assets.',
  'technical controls': 'Technical controls are security measures implemented through hardware or software, such as firewalls, antivirus, and operating system settings.',
  'gap analysis': 'Gap analysis is an assessment that compares an organization\'s current security posture with its desired state to identify gaps requiring remediation.',
  'honeypot': 'A honeypot is a decoy system designed to attract and detect attackers.',
  'honeypots': 'Honeypots are decoy systems designed to attract and detect attackers.',
  'honeynet': 'A honeynet is a network of honeypots that mimics a real network to observe attacker behavior.',
  'out-of-band key exchange': 'Out-of-band key exchange involves exchanging encryption keys through a channel separate from the primary data channel, such as telephone, courier, or in-person.',
  'in-band key exchange': 'In-band key exchange involves exchanging encryption keys over the same network as the data, protected by additional encryption.',
  'tpm': 'A Trusted Platform Module (TPM) is hardware that provides secure cryptographic functions including key storage and attestation.',
  'pki': 'Public Key Infrastructure (PKI) is the framework of policies and technologies for managing digital certificates and public-key encryption.',
  'attack vector': 'An attack vector is a path or method used by an attacker to gain access to or infect a target system.',
  'phishing': 'Phishing is a social engineering attack delivered by email or text that uses spoofing to trick users into revealing credentials or installing malware.',
  'business email compromise': 'Business email compromise is an attack that exploits trust in email by spoofing sender addresses to initiate unauthorized transfers or disclose information.',
  'watering hole attack': 'A watering hole attack is when adversaries compromise a website frequented by a target group to infect visitors with malware.',
  'memory injection': 'Memory injection is a technique where malware injects code into the memory space of a legitimate process to evade detection.',
  'buffer overflow': 'A buffer overflow is a vulnerability where excess data overwrites adjacent memory, potentially allowing arbitrary code execution.',
  'race condition': 'A race condition occurs when concurrent operations produce unintended results based on unpredictable ordering.',
  'toctou': 'Time-of-check to time-of-use (TOCTOU) is an attack that exploits the delay between validating a resource and using it.',
  'sql injection': 'SQL injection is an attack that inserts malicious SQL statements into application input to manipulate or access a database.',
  'cross-site scripting': 'Cross-site scripting (XSS) is a web vulnerability where an attacker injects client-side scripts into pages viewed by other users.',
  'xss': 'Cross-site scripting (XSS) is a web vulnerability where an attacker injects malicious scripts into web pages viewed by other users.',
  'zero-day vulnerability': 'A zero-day vulnerability is a security flaw unknown to the vendor that attackers may exploit before a fix exists.',
  'virus': 'A virus is malware that reproduces by infecting files or propagating over a network, typically requiring user action to execute.',
  'worm': 'A worm is self-replicating malware that spreads across networks without user action.',
  'spyware': 'Spyware is malware that monitors user activity such as keystrokes and browsing for theft or fraud.',
  'ransomware': 'Ransomware is malware that encrypts or blocks access to data until a ransom is paid.',
  'keylogger': 'A keylogger is malware or hardware that captures keystrokes and sends them to an attacker.',
  'denial of service': 'Denial of service is an attack intended to make a system or resource unavailable to legitimate users.',
  'dns poisoning': 'DNS poisoning is an attack that corrupts DNS data to redirect users to malicious sites.',
  'domain hijacking': 'Domain hijacking is unauthorized access to domain registration that allows an attacker to control where traffic is directed.',
  'on-path attack': 'An on-path attack occurs when an attacker intercepts or redirects traffic between two parties (formerly known as man-in-the-middle).',
  'arp poisoning': 'ARP poisoning is an on-path attack on a local network that corrupts ARP tables to redirect traffic.',
  'replay attack': 'A replay attack captures valid network traffic and retransmits it to gain unauthorized access.',
  'brute force': 'Brute force is an attack that tries many possible credentials or keys until the correct one is found.',
  'dictionary attack': 'A dictionary attack is a password attack that uses a list of common words or previously breached passwords.',
  'rainbow table': 'A rainbow table is a precomputed table of password hashes used to quickly reverse hashed passwords.',
  'indicators of compromise': 'Indicators of compromise (IOC) are evidence that a system has been compromised.',
  'segmentation': 'Segmentation is the practice of dividing a network into segments to limit lateral movement and contain breaches.',
  'hardening': 'Hardening is the process of reducing attack surface by disabling unnecessary services, applying patches, and configuring systems securely.',
  'patch tuesday': 'Patch Tuesday is Microsoft\'s monthly release of security updates, typically on the second Tuesday of each month.',
  'vulnerability scanning': 'Vulnerability scanning is an automated assessment that identifies weaknesses without attempting exploitation.',
  'penetration testing': 'Penetration testing is a simulated attack that actively exploits vulnerabilities to assess security posture.',
  'rules of engagement': 'Rules of engagement are a document defining scope, methods, and constraints for a penetration test.',
  'input validation': 'Input validation is the practice of checking and sanitizing user input to prevent injection and malformed data from causing vulnerabilities.',
  'scap': 'Security Content Automation Protocol (SCAP) is a NIST standard that enables tools to identify and act on shared security and vulnerability criteria.',
  'sast': 'Static Application Security Testing (SAST) analyzes source code for vulnerabilities without executing the application.',
  'firewall': 'A firewall is a network device that filters traffic by port, protocol, or application to enforce security policy.',
  'ngfw': 'A next-generation firewall (NGFW) operates at Layer 7 with application awareness, intrusion prevention, and advanced filtering.',
  'nat': 'Network Address Translation (NAT) maps internal IP addresses to external addresses and can hide internal network topology.',
  'dlp': 'Data Loss Prevention (DLP) is technology that identifies, monitors, and blocks sensitive data from leaving the organization.',
  'content filtering': 'Content filtering controls access to data based on content type, URL, or category such as web or email filtering.',
  'active directory': 'Active Directory is a Microsoft directory service that centralizes authentication, authorization, and resource management for Windows networks.',
  'group policy': 'Group Policy is a Windows mechanism to centrally configure and enforce settings for users and computers.',
  'fim': 'File Integrity Monitoring (FIM) detects unauthorized changes to critical operating system and application files.',
  'iam': 'Identity and Access Management (IAM) ensures the right users have appropriate access to resources at the right time.',
  'password entropy': 'Password entropy is a measure of unpredictability in a password, increased by length and character variety.',
  'tabletop exercise': 'A tabletop exercise is a discussion-based exercise where stakeholders walk through response scenarios without executing systems.',
  'risk appetite': 'Risk appetite is the level of risk an organization is willing to accept in pursuit of its objectives.',
  'business impact analysis': 'A business impact analysis assesses the potential effects of disruption to critical business functions.',
  'mfa': 'Multi-factor authentication (MFA) requires two or more verification methods from different categories (something you know, have, or are).',
  'resiliency': 'Resiliency is the ability of a system to maintain or rapidly recover functionality after disruption.',
  'redundancy': 'Redundancy is the duplication of critical components to ensure availability if one fails.',
  'saas': 'Software as a Service (SaaS) is a cloud model where applications are hosted and delivered over the internet.',
  'paas': 'Platform as a Service (PaaS) is a cloud model that provides a development environment without managing underlying infrastructure.',
  'iaas': 'Infrastructure as a Service (IaaS) is a cloud model that provides virtualized compute, storage, and networking.',
  'jump server': 'A jump server is a hardened host that provides controlled access to a secure network zone.',
  'vpn': 'A Virtual Private Network (VPN) creates an encrypted tunnel over a public network for secure remote access.',
  'data at rest': 'Data at rest is data stored on media such as disk or backup, requiring protection such as encryption.',
  'data in transit': 'Data in transit is data moving across a network, requiring protection such as TLS encryption.',
  'data in use': 'Data in use is data being actively processed in memory by an application.',
  'firmware': 'Firmware is software embedded in hardware that controls device operation and can be a vulnerability vector if not updated.',
  'supply chain attack': 'A supply chain attack compromises a product by attacking vendors, updates, or the distribution channel.',
  'rooting': 'Rooting is the Android equivalent of jailbreaking; removing manufacturer restrictions to gain root access and creating security risks.',
  'jailbreaking': 'Jailbreaking is bypassing iOS restrictions to install unauthorized software, which creates security risks.',
  'physical security': 'Physical security comprises measures to protect facilities, assets, and personnel from physical threats.',
  'change management': 'Change management is the process for controlling and documenting changes to systems and infrastructure.',
  'obfuscation': 'Obfuscation is the practice of making code or data difficult to understand to hinder reverse engineering.',
  'digital signature': 'A digital signature provides cryptographic proof of authenticity and integrity for digital data.',
  'hashing': 'Hashing is a one-way function that produces a fixed-length digest from input data.',
  'blockchain': 'Blockchain is a distributed ledger technology that uses cryptographic chaining of blocks.',
  'certificate': 'A digital certificate is a document that binds a public key to an identity.',
  'impersonation': 'Impersonation is pretending to be someone else to gain unauthorized access.',
  'privilege escalation': 'Privilege escalation is the process of gaining higher access rights than originally intended.',
  'key-exchange': 'Key exchange is the process of securely sharing encryption keys across an insecure medium, using out-of-band or in-band methods.',
  'cloud-based security': 'Cloud-based security refers to security controls and services delivered from the cloud, often centralized and managed by the provider.',
  'cloud based security': 'Cloud-based security refers to security controls and services delivered from the cloud, often centralized and managed by the provider.',
  'sla': 'A Service Level Agreement (SLA) defines guaranteed uptime, performance, and support terms between a provider and customer.',
  'hardening guides': 'Hardening guides are documentation that specify secure configuration steps for specific software or platforms.',
  'hardening checklists': 'Hardening checklists are manufacturer-provided lists of configuration steps to secure a system.',
}

function buildConceptDictionary(data) {
  const byTermKey = new Map()
  const stats = { totalBullets: 0, skippedQuality: 0, ruleA: 0, ruleB: 0, curated: 0 }

  for (const domain of data.domains) {
    const domainNum = domain.domain_num
    const domainDisplay = `${domainNum}.0`

    for (const section of domain.sections) {
      const sectionNum = section.section_num
      const sectionName = section.name.replace(/\s*\(continued\)\s*/gi, '').trim()
      const bullets = section.bullets || []

      const sectionTermKey = toKebab(sectionName)
      if (sectionTermKey) {
        const curated = getCurated(sectionTermKey)
        if (curated && !byTermKey.has(sectionTermKey)) {
          byTermKey.set(sectionTermKey, {
            conceptId: sectionTermKey,
            term: toTitleCase(sectionName),
            definition: curated,
            domain: domainDisplay,
            section: sectionNum,
            notes: '',
            source: { type: 'pdf', confidence: 'high' },
          })
          stats.curated++
        }
      }

      for (const bullet of bullets) {
        stats.totalBullets++
        const t = (bullet || '').trim()
        if (!t || t.length < 30) {
          stats.skippedQuality++
          continue
        }

        const dashMatch = t.match(/^(.+?)\s+[-–—]\s+(.+)$/s)
        if (dashMatch) {
          const term = dashMatch[1].trim()
          const definition = dashMatch[2].trim()
          if (!isValidTerm(term) || !isCompleteDefinition(definition)) {
            stats.skippedQuality++
            continue
          }
          const termKey = toKebab(term)
          const curatedDef = getCurated(termKey)
          const finalDef = curatedDef || definition
          if (termKey && !byTermKey.has(termKey)) {
            byTermKey.set(termKey, {
              conceptId: termKey,
              term: toTitleCase(term),
              definition: finalDef,
              domain: domainDisplay,
              section: sectionNum,
              notes: '',
              source: { type: 'pdf', confidence: 'high' },
            })
            stats.ruleA++
          }
          continue
        }

        const isMatch = t.match(/^(.+?)\s+(?:is|are)\s+(.+)$/i)
        if (isMatch) {
          const subject = isMatch[1].trim()
          const predicate = isMatch[2].trim()
          if (predicate.length < 25) {
            stats.skippedQuality++
            continue
          }
          if (/^(cascading|something else)/i.test(predicate)) {
            stats.skippedQuality++
            continue
          }
          if (!isValidTerm(subject)) {
            stats.skippedQuality++
            continue
          }
          if (/[a-z][A-Z]|[A-Z][a-z]{2,}[A-Z]/.test(t)) {
            stats.skippedQuality++
            continue
          }
          if (!isCompleteDefinition(t)) {
            stats.skippedQuality++
            continue
          }
          const termKey = toKebab(subject)
          const curatedDef = getCurated(termKey)
          const definition = curatedDef || t
          if (termKey && !byTermKey.has(termKey)) {
            byTermKey.set(termKey, {
              conceptId: termKey,
              term: toTitleCase(subject),
              definition,
              domain: domainDisplay,
              section: sectionNum,
              notes: '',
              source: { type: 'pdf', confidence: curatedDef ? 'high' : (t.length > 60 ? 'high' : 'medium') },
            })
            stats.ruleB++
          }
          continue
        }

        stats.skippedQuality++
      }
    }
  }

  const concepts = Array.from(byTermKey.values())
  concepts.sort((a, b) => {
    const d = a.domain.localeCompare(b.domain)
    if (d !== 0) return d
    return a.section.localeCompare(b.section)
  })

  return { concepts, stats }
}

function main() {
  const raw = fs.readFileSync(INPUT, 'utf-8')
  const data = JSON.parse(raw)
  const { concepts, stats } = buildConceptDictionary(data)

  const byDomain = {}
  for (const c of concepts) {
    const d = c.domain.split('.')[0]
    byDomain[d] = (byDomain[d] || 0) + 1
  }

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true })
  fs.writeFileSync(OUTPUT, JSON.stringify(concepts, null, 2), 'utf-8')

  console.log('\n=== Concept Dictionary Generated (STRICT ATOMIC) ===\n')
  console.log('Total concepts generated:', concepts.length)
  console.log('Total bullets processed:', stats.totalBullets)
  console.log('Skipped (quality rules):', stats.skippedQuality)
  console.log('\nExtraction breakdown:')
  console.log('  - Curated (section match):', stats.curated)
  console.log('  - Rule A (Term - definition):', stats.ruleA)
  console.log('  - Rule B (X is/are Y):', stats.ruleB)
  console.log('\nConcepts per domain:')
  Object.entries(byDomain).sort().forEach(([d, n]) => console.log(`  Domain ${d}: ${n}`))
  console.log('\nOutput:', OUTPUT)
}

main()
