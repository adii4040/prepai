import { GEMINI_AI_SERVICE } from '../utils/GeminiAI.utils.js'
import { z } from 'zod'

export const resumeAIAnalysisResSchema = z.object({
    analysisTitle: z.string()
        .describe("A concise, engaging title summarizing the analysis outcome, what skill or job title this analysis is focused on, and the overall impression (e.g., 'Strong Match for Frontend Role with Minor Gaps', 'Backend Developer Fit')."),
    matchScore: z.number()
        .min(0)
        .max(100)
        .describe("The matching percentage calculated by analyzing both the resume and self-description against the Job Description."),

    needsImprovement: z.enum(["great", "less"])
        .describe("Indicates the volume of improvement needed. Choose 'great' if major gaps exist or 'less' if the candidate is already a solid match."),

    skillGaps: z.array(
        z.object({
            skillName: z.string().describe("The name of the missing or underrepresented tech/soft skill."),
            severity: z.enum(["high", "medium", "low"])
                .describe("High: Critical for the role. Medium: Strongly preferred. Low: Nice-to-have/Bonus."),
            context: z.string().describe("Brief explanation of why this gap matters based on the JD requirements.")
        })
    ).describe("Array of identified skill gaps between the user's profile and the Job Description."),

    preparationPlan: z.object({
        timelineType: z.enum(["custom_date", "two_week_standard"])
            .describe("Identifies if this plan was tailored to a specific interview date or fell back to a default 2-week daily structure."),
        daysRemaining: z.number().describe("Total number of days generated in the plan layout."),
        dailySchedule: z.array(
            z.object({
                dayNumber: z.number().describe("The sequential chronological day number."),
                focusTopic: z.string().describe("The core topic or skill bucket to attack today."),
                actionItems: z.array(z.string()).describe("Specific, highly actionable tasks or reading exercises for this day.")
            })
        ).describe("A day-by-day roadmap tailored dynamically based on the available timeline.")
    }),

    topTechnicalQuestions: z.array(
        z.object({
            id: z.number(),
            type: z.literal("technical"), // Lock this specific schema to technical
            question: z.string().describe("The explicit interview question tailored directly to this JD."),
            intent: z.string().describe("What the interviewer is actually evaluating or looking for with this question."),
            suggestedTalkingPoints: z.array(z.string()).describe("Key bullets or concepts the candidate should include in their response framework.")
        })
    ).length(5).describe("Exactly 5 custom technical interview questions curated based on the JD."),

    topBehavioralQuestions: z.array(
        z.object({
            id: z.number(),
            type: z.literal("behavioral"), // Lock this specific schema to behavioral
            question: z.string().describe("The explicit interview question tailored directly to this JD."),
            intent: z.string().describe("What the interviewer is actually evaluating or looking for with this question."),
            suggestedTalkingPoints: z.array(z.string()).describe("Key bullets or concepts the candidate should include in their response framework.")
        })
    ).length(5).describe("Exactly 5 custom behavioral interview questions curated based on the JD.")
});

const resumeAIAnalysisSystemPrompt = `You are an expert career coach and technical recruiter AI. Your absolute mandate is to analyze a candidate's profile against a targeted Job Description (JD) and return a valid JSON object matching the requested schema layout perfectly.

You will evaluate these inputs:
1. RESUME TEXT — Extracted text from the candidate's CV.
2. SELF-DESCRIPTION — The candidate's personal summary statement.
3. JOB DESCRIPTION (JD) — The target role requirements.
4. TIMELINE PARAMETERS — Dictates whether to build a custom-day plan or fall back to a 14-day roadmap.

CRITICAL JSON STRUCTURAL LAYOUT RULES:
You must map your evaluation strictly to these keys. Do not invent parent wrappers or alter data types.

- 'analysisTitle': A concise, engaging title summarizing the analysis outcome, what skill or job title this analysis is focused on, and the overall impression (e.g., "Strong Match for Frontend Role with Minor Gaps", "Backend Developer Fit").
- 'matchScore': A single integer from 0 to 100 representing the alignment.
- 'needsImprovement': Must be exactly the string "great" if there are major gaps, or "less" if they are a strong fit.
- 'skillGaps': MUST be an array of OBJECTS. Each object must contain exactly three keys:
    * 'skillName': string (the technology/skill)
    * 'severity': string (must be exactly "high", "medium", or "low")
    * 'context': string (1-sentence explanation of why it matters for this JD)
- 'preparationPlan': MUST be a parent OBJECT containing exactly these three keys:
    * 'timelineType': string (must be exactly "custom_date" or "two_week_standard")
    * 'daysRemaining': integer (total days in the generated schedule)
    * 'dailySchedule': an array of OBJECTS. Each object must contain:
        + 'dayNumber': integer (sequential)
        + 'focusTopic': string (include target calendar date text and estimated hours here, e.g., "Day 1 | Topic: Express Routing (3 Hours)")
        + 'actionItems': array of strings (2-4 specific tasks)
- 'topTechnicalQuestions': MUST be an array of EXACTLY 5 OBJECTS. Each object must contain:
    * 'id': integer (sequential starting at 1 to 5)
    * 'type': string (must be exactly "technical")
    * 'question': string (prefix difficulty here, e.g., "[HARD - TECHNICAL] ...")
    * 'intent': string (what the interviewer is evaluating)
    * 'suggestedTalkingPoints': array of strings (key response bullets)

- 'topBehavioralQuestions': MUST be an array of EXACTLY 5 OBJECTS. Each object must contain:
    * 'id': integer (sequential starting at 1 to 5)
    * 'type': string (must be exactly "behavioral")
    * 'question': string (prefix difficulty here, e.g., "[MEDIUM - BEHAVIORAL] ...")
    * 'intent': string (what the interviewer is evaluating)
    * 'suggestedTalkingPoints': array of strings (key response bullets)

Strict Constraints:
- Be highly objective and direct. Do not inflate the 'matchScore'.
- Output ONLY raw, valid JSON. No conversational text, no markdown backticks (\`\`\`json).`;


export const resumeAiAnalysisService = async ({ jobDescription, resumeText, selfDescription, timelinePromptContext }) => {

    const userPrompt = `Here are the operational assets for calculation:
    === TARGET JOB DESCRIPTION ===
    ${jobDescription}
    === CANDIDATE EXTRACTED RESUME ===
    ${resumeText}
    === CANDIDATE SELF-DESCRIPTION ===
    ${selfDescription || "No self-description provided."}
    === TIMELINE PARAMETERS ===
    ${timelinePromptContext}
    Analyze the data footprints above and compile the profile synthesis directly into the required JSON Schema layout.`

    console.log('INVOKING THE AI SERVICE WITH THE PROMPT...')
    try {
        const ai = new GEMINI_AI_SERVICE({
            modelName: 'gemini-2.5-flash',
            userPrompt: userPrompt,
            systemPrompt: resumeAIAnalysisSystemPrompt,
            config: { temperature: 0.7 },
            zodJsonSchema: resumeAIAnalysisResSchema
        })

        const response = await ai.generateText()

        return response
    } catch (error) {

        throw new Error('Failed to analyze resume: ' + error.message)
    }
}