import axios from "axios"
import { GEMINI_AI_SERVICE } from "../utils/GeminiAI.utils.js"
import z from "zod"


function extractTechKeywords(content, jdTechnologies) {
    return jdTechnologies.filter(keyword =>
        content.toLowerCase().includes(keyword.toLowerCase())
    )
}

function extractExpectationKeywords(content, jdExpectations) {
    return jdExpectations.filter(keyword =>
        content.toLowerCase().includes(keyword.toLowerCase())
    )
}

export function buildMarketQuery(role, technologies, domain, expectations) {

    const domainStr = domain.join(", ")
    const techStr = technologies.slice(0, 5).join(", ")

    const shortExpectations = expectations
        .slice(0, 2)
        .map(e => e.split(".")[0].trim())  
        .join(", ")

    const query = `Market trends and best practices for ${role} in ${domainStr} using ${techStr}. Key expectations: ${shortExpectations}`
        .replace(/\s+/g, " ")
        .trim()

    if (query.length > 400) {
        return query.substring(0, query.lastIndexOf(" ", 400))
    }

    return query
}

export async function searchMarketExpectations(query, jdTechnologies = [], jdExpectations = []) {
    if (!query?.trim()) throw new Error('Search query cannot be empty')
    
    console.log('SEARCHING MARKET EXPECTATIONS WITH QUERY...')

    try {
        const response = await axios.post("https://api.tavily.com/search", {
            api_key: process.env.TAVILY_API_KEY,
            query,
            topic: "general",
            search_depth: "advanced",
            max_results: 3,
            include_answer: true,
            include_raw_content: false
        })

        const data = response.data

        const synthesized = await synthesizeMarketInsights({
            tavilyAnswer: data.answer,
            tavilyContents: data.results.map(r => r.content),
            jdTechnologies,
            jdExpectations
        })

        return synthesized

    } catch (error) {
        console.error("Tavily Search Error:", error.response?.data || error.message)
        return { error: "Failed to fetch market intelligence." }
    }
}
const marketInsightSchema = z.object({
    summary: z.string().describe("2-3 sentence market summary specific to this role and tech stack."),
    trendingTechnologies: z.array(z.string()).describe("Technologies gaining traction in the market for this role."),
    industryExpectations: z.array(z.string()).describe("What companies actually expect from candidates in this role today."),
    marketGaps: z.array(z.string()).describe("Skills or practices the market values that are commonly missing in candidates."),
    salaryContext: z.string().describe("Brief salary or demand context for this role if available, otherwise an empty string.")
})

const marketInsightSystemPrompt = `
You are a principal talent market analyst and industry intelligence expert.

You will receive raw web content collected from multiple sources about a specific professional role, its domain, and its core competencies. Your job is to distill this noise into clean, actionable market intelligence tailored precisely to the nature of the role provided.

Extract and return the following:

- "summary": A 2-3 sentence high-level market overview specific to the role and its core domain. Focus on market demand, hiring trends, and current industry direction. Avoid generic advice and ensure the summary prioritizes the core, primary functions of the role over secondary or auxiliary requirements.
- "trendingTechnologies": Each item must be a concise technology, framework, tool, or core methodology name only (e.g., "TypeScript", "Figma", "Six Sigma", "SPSS") — no descriptions or context phrases.
- "industryExpectations": What companies and hiring managers actually expect from candidates in this role today — balancing primary responsibilities and secondary requirements. Each expectation as a separate string.
- "marketGaps": Specific core competencies, skills, tools, or mindsets the market values highly but candidates commonly lack relative to the primary focus of the role. Each as a separate string.
- "salaryContext": A single string with brief salary range or demand context for this role if the content contains it. If no salary or demand data is present, return an empty string "".

Output ONLY the raw JSON object matching this exact structure:
{
  "summary": "...",
  "trendingTechnologies": ["...", "..."],
  "industryExpectations": ["...", "..."],
  "marketGaps": ["...", "..."],
  "salaryContext": "..."
}

STRICT CONSTRAINTS:
- Output ONLY raw, valid JSON. Zero markdown, zero backticks, zero explanation outside the JSON.
- Every array value MUST be a proper JSON array of individual strings — never a single comma-joined string.
- Do NOT merge multiple items into one string. Each technology/tool, expectation, and gap must be its own array element.
- Do NOT add any keys beyond the five defined above. Do not rename or nest them.
- Do NOT include generic professional advice, tutorial descriptions, or course content — extract real market signals only.
- Do NOT hallucinate salary figures. Only include salary context if explicitly present in the provided content.
- If a field has no extractable data, return an empty array [] for arrays or "" for strings — never omit the key.
- Ignore discussion threads, course syllabi, and tutorial content — focus on hiring trends, job market signals, and industry expectations only.
`

async function synthesizeMarketInsights({ tavilyAnswer, tavilyContents, jdTechnologies, jdExpectations }) {
    
    console.log('SYNTHESIZING MARKET INSIGHTS USING AI...')

    const rawContext = [tavilyAnswer, ...tavilyContents].filter(Boolean).join("\n\n")
    const ai = new GEMINI_AI_SERVICE({
        systemPrompt: marketInsightSystemPrompt,
        userPrompt: `
The following raw web content was collected for a role requiring these technologies: ${jdTechnologies.join(", ")}.

RAW CONTENT:
${rawContext}

Extract real market intelligence from the content above. Ignore tutorials, course descriptions, and generic advice.
        `,
        config: { temperature: 0.3 },
        zodJsonSchema: marketInsightSchema
    })

    return await ai.generateText()
}