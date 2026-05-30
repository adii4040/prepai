import z from "zod";
import { GEMINI_AI_SERVICE } from "../utils/GeminiAI.utils.js";
import { buildMarketQuery, searchMarketExpectations } from "./market_analysis.service.js";

const jdExtractionSchema = z.object({
    role: z.string(),
    domain: z.array(z.string()),
    responsibilities: z.array(z.string()),
    technologies: z.array(z.string()),
    expectations: z.array(z.string())
})

const jdExtractionSystemPrompt = `
You are a precise and efficient information extraction engine designed to analyze Job Descriptions and extract key signals relevant for candidate evaluation and interview preparation.

Your task is to extract the following information from the provided Job Description and return it as a raw valid JSON object. No markdown, no backticks, no explanation — only the JSON.

Extract exactly these keys:

- "role": string — The specific job title or role being described.
- "domain": string[] — The industry or field(s) relevant to the role (e.g. ["Software Development", "FinTech"]).
- "responsibilities": string[] — Each main duty or responsibility as a separate string in the array.
- "technologies": string[] — Every specific technology, tool, framework, language, or platform mentioned or implied in the JD. Each as a separate string.
- "expectations": string[] — Each performance expectation, deliverable, or outcome the candidate is expected to meet, as a separate string.

Output ONLY the raw JSON object matching this exact structure:
{
  "role": "...",
  "domain": ["...", "..."],
  "responsibilities": ["...", "..."],
  "technologies": ["...", "..."],
  "expectations": ["...", "..."]
}

STRICT CONSTRAINTS:
- Output ONLY raw, valid JSON. Zero conversational text, zero markdown, zero backticks.
- Every value that is an array MUST be a proper JSON array of individual strings — never a single comma-joined string.
- Do NOT merge multiple items into one string. Each responsibility, technology, and expectation must be its own array element.
- Do NOT add any keys beyond the five defined above. Do not rename or nest them.
- Do NOT infer or hallucinate technologies or responsibilities not present or strongly implied in the JD.
- If a field has no extractable data, return an empty array [] — never omit the key.
- Be exhaustive for "technologies" — capture every tool, language, framework, library, platform, or service mentioned anywhere in the JD.
`


export async function getMarketInsights(jobDescription) {
    console.log('EXTRACTING MARKET INSIGHTS FROM THE JOB DESCRIPTION...')
    let extractedResponse;
    try {
        const ai = new GEMINI_AI_SERVICE({
            userPrompt: jobDescription,
            systemPrompt: jdExtractionSystemPrompt,
            config: { temperature: 0.7 },
            zodJsonSchema: jdExtractionSchema
        })

        extractedResponse = await ai.generateText()
    } catch (error) {
        throw new Error('Failed to extract market insights: ' + error.message)
    }

    const marketQuery = buildMarketQuery(extractedResponse.role, extractedResponse.technologies, extractedResponse.domain, extractedResponse.expectations)
    console.log('BUILT MARKET QUERY!!')
    const marketInsights = await searchMarketExpectations(marketQuery, extractedResponse.technologies, extractedResponse.expectations)
    return {
        extractedResponse,
        marketInsights
    }
}


