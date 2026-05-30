import { GEMINI_AI_SERVICE } from '../utils/GeminiAI.utils.js'
import { z } from 'zod'

export const resumeAIAnalysisResSchema = z.object({

    analysisTitle: z.string()
        .describe("A concise, engaging title summarizing the analysis outcome, what skill or job title this analysis is focused on, and the overall impression (e.g., 'Strong Match for Frontend Role with Minor Gaps', 'Backend Developer Fit')."),

    matchScore: z.number()
        .min(0)
        .max(100)
        .describe("The matching percentage calculated by analyzing both the resume and self-description against the Job Description AND current market expectations."),

    needsImprovement: z.enum(["extensive", "moderate", "minimal", "none"])
        .describe(`Indicates the volume of improvement needed based on the match score and skill gaps identified.
        - "extensive": Major critical gaps exist. Candidate is missing core required skills. Match score typically below 50.
        - "moderate": Several important gaps exist. Candidate has the basics but needs meaningful upskilling. Match score typically 50-70.
        - "minimal": Minor gaps only. Candidate is a strong fit with a few nice-to-have skills missing. Match score typically 71-89.
        - "none": Candidate is an exceptional match. All required and preferred skills are present. Match score typically 90+.`),

    marketSnapshot: z.object({
        summary: z.string()
            .describe("2-3 sentence market overview for this role based on real industry data."),
        trendingTechnologies: z.array(z.string())
            .describe("Technologies currently gaining traction for this role in the market."),
        industryExpectations: z.array(z.string())
            .describe("What companies actually expect from candidates in this role today."),
        marketGaps: z.array(z.string())
            .describe("Skills the market values highly but candidates commonly lack.")
    }).describe("Real market intelligence snapshot for this role, sourced from current industry data."),

    skillGaps: z.array(
        z.object({
            skillName: z.string()
                .describe("The name of the missing or underrepresented tech/soft skill."),
            severity: z.enum(["high", "medium", "low"])
                .describe("High: Critical for the role. Medium: Strongly preferred. Low: Nice-to-have/Bonus."),
            context: z.string()
                .describe("Brief explanation of why this gap matters based on the JD requirements."),
            marketValidated: z.boolean()
                .describe("True if this gap is also confirmed as a common industry gap by real market intelligence, not just missing from the JD.")
        })
    ).describe("Array of identified skill gaps between the user's profile and the Job Description, cross-referenced with market intelligence."),

    preparationPlan: z.object({
        timelineType: z.enum(["custom_date", "two_week_standard"])
            .describe("Identifies if this plan was tailored to a specific interview date or fell back to a default 2-week daily structure."),
        daysRemaining: z.number()
            .describe("Total number of days generated in the plan layout."),
        dailySchedule: z.array(
            z.object({
                dayNumber: z.number()
                    .describe("The sequential chronological day number."),
                focusTopic: z.string()
                    .describe("The core topic or skill bucket to focus on today."),
                marketRelevance: z.string()
                    .describe("One sentence on why this topic matters in today's market based on current industry trends."),
                actionItems: z.array(z.string())
                    .describe("Specific, highly actionable tasks or reading exercises for this day.")
            })
        ).describe("A day-by-day roadmap tailored dynamically based on the available timeline and market trends.")
    }),

    topTechnicalQuestions: z.array(
        z.object({
            id: z.number(),
            type: z.literal("technical"),
            question: z.string()
                .describe("The explicit interview question tailored directly to this JD."),
            intent: z.string()
                .describe("What the interviewer is actually evaluating or looking for with this question."),
            suggestedTalkingPoints: z.array(z.string())
                .describe("Key bullets or concepts the candidate should include in their response framework.")
        })
    ).length(5).describe("Exactly 5 custom technical interview questions curated based on the JD and market trends."),

    topBehavioralQuestions: z.array(
        z.object({
            id: z.number(),
            type: z.literal("behavioral"),
            question: z.string()
                .describe("The explicit interview question tailored directly to this JD."),
            intent: z.string()
                .describe("What the interviewer is actually evaluating or looking for with this question."),
            suggestedTalkingPoints: z.array(z.string())
                .describe("Key bullets or concepts the candidate should include in their response framework.")
        })
    ).length(5).describe("Exactly 5 custom behavioral interview questions curated based on the JD.")

})

const resumeAIAnalysisSystemPrompt = `You are an expert career coach and technical recruiter AI with access to real-time market intelligence. Your absolute mandate is to analyze a candidate's profile against a targeted Job Description (JD), cross-reference it with provided market intelligence, and return a valid JSON object matching the requested schema layout perfectly.

You will evaluate these inputs:
1. RESUME TEXT — Extracted text from the candidate's CV.
2. SELF-DESCRIPTION — The candidate's personal summary statement.
3. JOB DESCRIPTION (JD) — The target role requirements.
4. REAL MARKET INTELLIGENCE — Live industry data including trending technologies, actual hiring expectations, and common candidate gaps sourced from the current market.
5. TIMELINE PARAMETERS — Dictates whether to build a custom-day plan or fall back to a 14-day roadmap.

CRITICAL JSON STRUCTURAL LAYOUT RULES:
You must map your evaluation strictly to these keys. Do not invent parent wrappers or alter data types.

- 'analysisTitle': A concise, engaging title summarizing the analysis outcome, what skill or job title this analysis is focused on, and the overall impression (e.g., "Strong Match for Frontend Role with Minor Gaps", "Backend Developer Fit").

- 'matchScore': A single integer from 0 to 100 representing the alignment of the candidate's profile against BOTH the JD requirements AND the real market expectations. Do not inflate this score — be brutally objective.

- 'needsImprovement': Must be exactly one of these four strings based on the candidate's match score and identified gaps:
    * "extensive" — Major critical gaps. Missing core required skills. Match score typically below 50.
    * "moderate" — Several important gaps. Has the basics but needs meaningful upskilling. Match score typically 50–70.
    * "minimal" — Minor gaps only. Strong fit with a few nice-to-have skills missing. Match score typically 71–89.
    * "none" — Exceptional match. All required and preferred skills present. Match score typically 90+.

- 'marketSnapshot': MUST be a parent OBJECT containing exactly these four keys — populate this directly and faithfully from the provided REAL MARKET INTELLIGENCE input, do not fabricate or alter the data:
    * 'summary': string (2-3 sentence market overview for this role based on the provided market intelligence)
    * 'trendingTechnologies': array of strings (technologies currently gaining traction for this role, taken from market intelligence)
    * 'industryExpectations': array of strings (what companies actually expect from candidates today, taken from market intelligence)
    * 'marketGaps': array of strings (skills the market values but candidates commonly lack, taken from market intelligence)

- 'skillGaps': MUST be an array of OBJECTS. Each object must contain exactly four keys:
    * 'skillName': string (the technology/skill that is missing or underrepresented)
    * 'severity': string (must be exactly "high", "medium", or "low" — use market intelligence to elevate severity if the gap is also a confirmed market gap)
    * 'context': string (1-sentence explanation of why it matters, referencing both JD requirements and market expectations where relevant)
    * 'marketValidated': boolean (set to true ONLY if this gap is also confirmed as a common industry gap by the provided market intelligence data, otherwise false)

- 'preparationPlan': MUST be a parent OBJECT containing exactly these three keys:
    * 'timelineType': string (must be exactly "custom_date" or "two_week_standard")
    * 'daysRemaining': integer (total days in the generated schedule)
    * 'dailySchedule': an array of OBJECTS. Each object must contain exactly these four keys:
        + 'dayNumber': integer (sequential)
        + 'focusTopic': string (include target calendar date and estimated hours, e.g., "Day 1 | Topic: Express Routing (3 Hours)") — prioritize high-severity and market-validated gaps in early days
        + 'marketRelevance': string (1 sentence explaining why this topic matters in today's market based on the provided market intelligence)
        + 'actionItems': array of strings (2-4 specific, highly actionable tasks or exercises for this day)

- 'topTechnicalQuestions': MUST be an array of EXACTLY 5 OBJECTS. Questions must be tailored to the JD AND reflect trending technologies and expectations from the market intelligence. Each object must contain:
    * 'id': integer (sequential 1 to 5)
    * 'type': string (must be exactly "technical")
    * 'question': string (prefix difficulty here, e.g., "[HARD - TECHNICAL] ...")
    * 'intent': string (what the interviewer is evaluating)
    * 'suggestedTalkingPoints': array of strings (key response bullets the candidate should cover)

- 'topBehavioralQuestions': MUST be an array of EXACTLY 5 OBJECTS. Each object must contain:
    * 'id': integer (sequential 1 to 5)
    * 'type': string (must be exactly "behavioral")
    * 'question': string (prefix difficulty here, e.g., "[MEDIUM - BEHAVIORAL] ...")
    * 'intent': string (what the interviewer is evaluating)
    * 'suggestedTalkingPoints': array of strings (key response bullets the candidate should cover)

STRICT CONSTRAINTS:
- Be highly objective and direct. Do not inflate the 'matchScore' to be encouraging — accuracy matters more.
- Cross-reference every skill gap against the provided market intelligence. If a gap appears in both the JD and the market data, set 'marketValidated' to true and elevate its severity accordingly.
- The 'marketSnapshot' must be populated faithfully from the provided REAL MARKET INTELLIGENCE — do not fabricate, summarize differently, or omit any of its fields.
- Preparation plan days must be ordered strategically: high-severity and market-validated gaps first, medium gaps in the middle, polish and mock interview prep at the end.
- Every array value MUST be a proper JSON array of individual strings — never a single comma-joined string.
- Do NOT add any keys beyond those defined above. Do not rename, nest, or restructure them.
- Output ONLY raw, valid JSON. No conversational text, no markdown backticks (\`\`\`json).`



export const resumeAiAnalysisService = async ({ jobDescription, resumeText, selfDescription, timelinePromptContext, marketInsights }) => {

    const userPrompt = `
=== TARGET JOB DESCRIPTION ===
${jobDescription}

=== CANDIDATE EXTRACTED RESUME ===
${resumeText}

=== CANDIDATE SELF-DESCRIPTION ===
${selfDescription || "No self-description provided."}

=== REAL MARKET INTELLIGENCE ===
${JSON.stringify(marketInsights, null, 2)}

=== TIMELINE PARAMETERS ===
${timelinePromptContext}

Use the market intelligence above to cross-reference skill gaps (set marketValidated: true if confirmed by market data), enrich the preparation plan with market relevance context, and populate the marketSnapshot field directly from the provided market data.
`

    console.log('INVOKING RESUME AI ANALYSIS SERVICE...')
    try {
        const ai = new GEMINI_AI_SERVICE({
            userPrompt: userPrompt,
            systemPrompt: resumeAIAnalysisSystemPrompt,
            config: { temperature: 0.3 },
            zodJsonSchema: resumeAIAnalysisResSchema
        })

        const response = await ai.generateText()

        return response
    } catch (error) {

        throw new Error('Failed to analyze resume: ' + error.message)
    }
}