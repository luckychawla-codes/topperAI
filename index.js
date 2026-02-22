import TelegramBot from 'node-telegram-bot-api';
import OpenAI from 'openai';

// Telegram Bot Token - Use environment variable for security
const token = process.env.TELEGRAM_BOT_TOKEN || '7072451646:AAHrQ-FQNq31lCTBybEIIXM9-G1JZxRnD4w';

// OpenAI/OpenRouter Client Configuration
const client = new OpenAI({
    baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY || "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",
});

// Initialize Telegram Bot
const bot = new TelegramBot(token, { polling: true });

console.log("Bot is starting...");

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const photo = msg.photo;

    if (!text && !photo) return;

    // Show "typing" status
    bot.sendChatAction(chatId, 'typing');

    try {
        let content = [];

        if (text) {
            content.push({ type: "text", text: text });
        }

        if (photo) {
            // Get the highest resolution photo
            const fileId = photo[photo.length - 1].file_id;
            const fileUrl = await bot.getFileLink(fileId);

            content.push({
                type: "image_url",
                image_url: { url: fileUrl }
            });

            if (msg.caption) {
                content.push({ type: "text", text: msg.caption });
            }
        }

        const response = await client.chat.completions.create({
            model: "qwen/qwen3-vl-30b-a3b-thinking",
            messages: [
                { role: "user", content: content }
            ],
        });

        const reply = response.choices[0].message.content;

        // Send response back to user
        bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error("Error calling OpenRouter API:", error);
        bot.sendMessage(chatId, "❌ Sorry, I encountered an error while processing your request.");
    }
});

bot.on('polling_error', (error) => {
    console.error("Polling error:", error);
});
