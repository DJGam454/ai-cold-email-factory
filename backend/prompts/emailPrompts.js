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

  return `You are an expert B2B cold email copywriter with 15+ years of experience in sales development and email outreach.

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
Generate EXACTLY ${count} unique, highly personalized cold outreach emails targeting decision-makers in the ${industry} industry. Each email should feel hand-written — NOT templated.

CRITICAL: Every email MUST be different from all others. Vary ALL of these dimensions randomly across the ${count} emails:

1. **SUBJECT LINE PATTERNS** (rotate through these 5 styles):
   - Question-based: "Can ${industry} afford to ignore [specific benefit]?"
   - Benefit-driven: "[Specific metric] improvement — guaranteed"
   - Curiosity gap: "What ${competitor_name} learned about [topic]"
   - Personalized: "Quick thought for [recipient_first_name] re: [their company]"
   - Urgency/Trigger: "[Current event/trend in ${industry}] — are you prepared?"

2. **OPENING HOOK STYLES** (rotate through these 5):
   - Industry statistic: "Did you know 78% of ${industry} leaders are [doing X]?"
   - Direct pain point: "Most ${industry} companies struggle with [specific problem] — we fix that."
   - Compliment/Reference: "I came across [their_company]'s work on [topic] — impressive results."
   - Question: "What if you could [desired_outcome] without [common_obstacle]?"
   - Story/Scenario: "A [similar_company] recently faced [challenge] — here's what they did."

3. **CTA TYPES** (rotate through these 5):
   - "Would you be open to a 15-minute call this week to explore how we've helped similar ${industry} companies?"
   - "I'd love to schedule a brief demo showing how [company_name] achieved [specific_result]."
   - "Are you available for a free 30-minute consultation on [specific_topic]?"
   - "I've put together a case study on [relevant_topic] — mind if I share it?"
   - "If this resonates, just reply and I'll send over a detailed proposal tailored to [their_company]."

4. **EMAIL BODY STRUCTURES** (rotate through these 5):
   - Problem → Agitate → Solution (pain-point focused)
   - Attention → Interest → Desire → Action (AIDA)
   - Short story → Parallel to their situation → Offer (storytelling)
   - Value proposition → Proof → Specific ask (value-first)
   - Social proof → Common challenge → How we solve it (proof-based)

5. **OTHER VARYING ELEMENTS**:
   - Recipient names: Use realistic diverse names (Sarah Chen, James Rodriguez, Priya Patel, etc.)
   - Recipient titles: Vary across "CEO", "VP of Engineering", "CTO", "Head of Product", "Director of Operations", "Chief Digital Officer"
   - Recipient companies: Use realistic company names (Horizon Health, Apex Logistics, Quantum Finance, etc.)
   - Email length: Mix of short (3-4 sentences), medium (5-6 sentences), and long (7-8 sentences)
   - Tone: Mix of formal, semi-formal, and direct conversational
   - Personalization references: Reference different aspects of the target industry in each email

RETURN FORMAT:
Return a valid JSON array of objects. Each object must have these exact keys:
- subject_line (string)
- opening_hook (string)
- cta_type (string - one of: "call", "demo", "consultation", "resource", "reply")
- cta_text (string)
- recipient_name (string)
- recipient_title (string)
- recipient_company (string)
- email_body (string - the FULL email body, starting with "Hi [name],")

IMPORTANT RULES:
- Return EXACTLY ${count} objects in the array
- No two emails should be identical in subject, opening, or structure
- Do NOT use placeholder text like [company_name] — use the actual data provided
- Make the emails feel authentic and human, not like a marketing template
- Use line breaks appropriately in email_body
- The response must be ONLY valid JSON — no markdown formatting, no code blocks
`;
}

module.exports = { buildEmailPrompt };
