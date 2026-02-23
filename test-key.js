import OpenAI from 'openai';

const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: "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",
});

const models = [
    "google/gemini-flash-1.5",
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "openai/gpt-4o-mini",
    "mistralai/mistral-7b-instruct:free",
];

async function test() {
    for (const model of models) {
        try {
            const response = await client.chat.completions.create({
                model,
                messages: [{ role: "user", content: "hi" }],
                max_tokens: 10,
            });
            console.log(`✅ WORKS: ${model} => ${response.choices[0].message.content}`);
        } catch (e) {
            console.error(`❌ FAIL: ${model} => ${e.message}`);
        }
    }
}

test();
