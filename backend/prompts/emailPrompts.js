function buildEmailPrompt({
  companyName,
  companyDescription,
  services,
  caseStudies,
  pricingPlans,
  industry,
  count,
}) {
  const servicesText = services.map((s) => `- ${s.name}: ${s.description}`).join('\n');
  const caseStudiesText = caseStudies
    .map((cs) => `- ${cs.title}: ${cs.results}`)
    .join('\n');
  const pricingText = pricingPlans
    .map((p) => `- ${p.plan_name}: $${p.price} (Features: ${(p.features || []).join(', ')})`)
    .join('\n');

  return `You are an expert B2B cold email copywriter with 15+ years of experience and a deep understanding of email deliverability, personalization, and outreach psychology.

COMPANY PROFILE:
Name: ${companyName}
Description: ${companyDescription}

SERVICES OFFERED:
${servicesText}

CASE STUDIES / PROVEN RESULTS:
${caseStudiesText}

PRICING PLANS:
${pricingText}

TARGET INDUSTRY: ${industry}

YOUR TASK:
Generate EXACTLY ${count} unique, highly personalized cold outreach emails targeting decision-makers in the ${industry} industry. Each email must feel like a hand-written message from a real person — NOT a marketing template. The reader should not be able to tell these are AI-generated.

CRITICAL — Every email MUST be distinct. Vary ALL of these dimensions randomly across the ${count} emails:

1. **SUBJECT LINE PATTERNS** (rotate 5 styles, NEVER use the same pattern twice in a row):
   - Question-based: "Can ${industry} afford to ignore [specific benefit]?"
   - Benefit-driven: "[Specific metric] improvement — guaranteed"
   - Curiosity gap: "What [competitor_name] learned about [topic]"
   - Personalized: "Quick thought for [recipient_first_name] re: [their company]"
   - Urgency/Trigger: "[Current event/trend in ${industry}] — are you prepared?"

2. **OPENING HOOK STYLES** (rotate 5 styles):
   - Industry statistic: "Did you know 78% of ${industry} leaders are [doing X]?"
   - Direct pain point: "Most ${industry} companies struggle with [specific problem] — we fix that."
   - Compliment/Reference: "I came across [their_company]'s work on [topic] — impressive results."
   - Question: "What if you could [desired_outcome] without [common_obstacle]?"
   - Story/Scenario: "A [similar_company] recently faced [challenge] — here's what they did."

3. **CTA TYPES** (rotate 5, map cta_type accordingly):
   - call: "Would you be open to a 15-minute call this week to explore how we've helped similar ${industry} companies?"
   - demo: "I'd love to schedule a brief demo showing how ${companyName} achieved [specific_result]."
   - consultation: "Are you available for a free 30-minute consultation on [specific_topic]?"
   - resource: "I've put together a case study on [relevant_topic] — mind if I share it?"
   - reply: "If this resonates, just reply and I'll send over a detailed proposal tailored to [their_company]."

4. **EMAIL BODY STRUCTURES** (rotate 5):
   - Problem → Agitate → Solution (pain-point focused)
   - Attention → Interest → Desire → Action (AIDA)
   - Short story → Parallel to their situation → Offer (storytelling)
   - Value proposition → Proof → Specific ask (value-first)
   - Social proof → Common challenge → How we solve it (proof-based)

5. **OTHER VARYING ELEMENTS** (mix thoroughly):
   - Recipient names: Use realistic, culturally diverse names across industries (e.g. Marcus Vance for finance, Aisha Diop for banking, David Kim for fintech, Elena Rostova for credit unions, Sofia Alvarez for wealth management)
   - Recipient titles: Rotate across "CEO", "VP of Engineering", "CTO", "Head of Product", "Director of Operations", "Chief Digital Officer", "Chief Information Officer", "VP of Technology", "Head of Infrastructure", "Managing Director"
   - Recipient companies: Use realistic firm names that match the target industry (e.g. for banking: Horizon Trust Bank, Apex Securities, Beacon Credit Union, Sterling Capital, Vanguard Fintech)
   - Email length: Mix short (3-4 sentences, ~120 words), medium (5-6 sentences, ~180 words), and long (7-8 sentences, ~250 words)
   - Tone: Mix formal, semi-formal, and direct conversational — never robotic
   - Industry references: Reference DIFFERENT sub-topics within ${industry} in each email (e.g. compliance costs, legacy migration, customer experience, data security, operational efficiency)
   - Avoid repeating: Never use the same recipient name, company, subject pattern, or hook style across two consecutive emails

6. **EMAIL DELIVERABILITY RULES**:
   - Keep paragraphs short (2-3 sentences max per paragraph)
   - No ALL CAPS words
   - Maximum one exclamation mark per email (preferably zero)
   - Avoid spam trigger words: "free", "guaranteed", "act now", "limited time", "exclusive offer"
   - Personalize the greeting with the recipient's actual first name
   - Include a genuine reason for reaching out (reference their role, company size, or industry trend)

RETURN FORMAT:
Return a valid JSON array of exactly ${count} objects. Each object must have these exact keys:
- subject_line (string)
- opening_hook (string)
- cta_type (string — one of: "call", "demo", "consultation", "resource", "reply")
- cta_text (string)
- recipient_name (string)
- recipient_title (string)
- recipient_company (string)
- email_body (string — the FULL email body, starting with "Hi [first_name],")

IMPORTANT RULES:
- Return EXACTLY ${count} objects, no more, no less
- Every email must have a UNIQUE combination of recipient_name + recipient_company
- Never use placeholder text like [company_name] — substitute actual values from the data above
- Every email must reference at least ONE specific service, case study, or pricing plan from the data
- Use natural language with appropriate line breaks in email_body
- The response must contain ONLY the JSON array — NO markdown formatting, NO code fences (\`\`\`), NO extra text before or after
`;
}

module.exports = { buildEmailPrompt };
