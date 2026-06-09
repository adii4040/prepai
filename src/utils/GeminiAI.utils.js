import { GoogleGenAI } from '@google/genai';
import { zodToJsonSchema } from "zod-to-json-schema";

class GEMINI_AI_SERVICE {
    constructor({
        modelName = 'gemini-2.5-flash',
        config = {},
        userPrompt = '',
        systemPrompt = '',
        zodJsonSchema
    } = {}) {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not configured');
        }

        this.client = new GoogleGenAI({ apiKey });
        this.modelName = modelName;
        this.config = config;
        this.userPrompt = userPrompt;
        this.systemPrompt = systemPrompt;
        this.zodJsonSchema = zodJsonSchema;
    }

    async generateText() {
        try {
            console.log('AI GENERATION STARTING...')
            const requestConfig = {
                ...this.config,
                ...(this.systemPrompt && { systemInstruction: this.systemPrompt }),
            };

            if (this.zodJsonSchema) {
                requestConfig.responseFormat = {
                    text: {
                        mimeType: "application/json",
                        schema: zodToJsonSchema(this.zodJsonSchema) // Passed safely exactly like the docs
                    }
                };
            }

            const response = await this.client.models.generateContent({
                model: this.modelName,
                contents: this.userPrompt,
                config: requestConfig
            });

            if (!response.text) {
                throw new Error("No textual content returned from Gemini API.");
            }

            console.log('AI GENERATION COMPLETED!!')
            const jsonRaw = JSON.parse(response.text);

            if (this.zodJsonSchema) {
                console.log('VALIDATING AI RESPONSE WITH ZOD SCHEMA...')
                return this.zodJsonSchema.parse(jsonRaw);
            }

            return jsonRaw;
        } catch (error) {
            console.log('Error in AI generation: ', error)
            throw error;
        }
    }
}

export { GEMINI_AI_SERVICE };