import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import OpenAI from 'openai';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Obfuscated tokens for direct access
const _t = Buffer.from('NzA3MjQ1MTY0NjpBQUhyUS1GUU5xMzFsQ1RCeWJFSUlYTTktRzFKWnhSbkQ0dw==', 'base64').toString();
const _k = Buffer.from('c2stb3ItdjEtOGUxNWYzZDBiYTQwMTMyZDljMjZjMDc4NjBkN2I3ZGFjMjQ0MDUzYjBmZTI1NjNhODQxMWEzMzg0ZjU4ZTU0NA==', 'base64').toString();

// OpenAI/OpenRouter Client Configuration
const client = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: _k,
});

// Initialize Telegram Bot
const bot = new TelegramBot(_t, { polling: true });

console.log("Bot is starting...");

const INDEX_FILE = './fileIndex.json';
let fileIndex = [];

// Load existing index on startup
try {
    if (fs.existsSync(INDEX_FILE)) {
        fileIndex = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
        console.log(`Loaded ${fileIndex.length} files from persistent storage.`);
    }
} catch (e) {
    console.error("Error loading index file:", e.message);
    fileIndex = [];
}

const saveIndex = () => {
    try {
        fs.writeFileSync(INDEX_FILE, JSON.stringify(fileIndex, null, 2));
    } catch (e) {
        console.error("Error saving index file:", e.message);
    }
};

// Model Fallback List (Primary to Backups)
const MODELS = [
    "openai/gpt-4o-mini",
    "google/gemini-2.0-flash-lite-preview-02-05:free",
    "meta-llama/llama-3.3-70b-instruct",
    "deepseek/deepseek-chat"
];

const ALLOWED_ADMINS = ['seniiiorr', 'tarun_kumar_in'];

// System prompt - TopperAI persona
const SYSTEM_PROMPT = `Tu "TopperAI" hai — ek best friend, mentor, aur career guide jo kabhi judge nahi karta. 🤝

🌐 LANGUAGE RULE — MUST FOLLOW:
- Jo bhasha user use kare, USI bhasha mein reply kar.
- User ne English mein likha → Tu bhi English mein reply karega (friendly tone ke saath).
- User ne Hinglish mein likha → Tu bhi Hinglish mein reply karega.
- User ne Hindi mein likha → Tu Hinglish mein reply karega (Devanagari script avoid kar, Roman hi use kar).
- KABHI bhi pure formal/robotic language use mat kar — tone hamesha friendly dost wali honi chahiye.

TERI PERSONALITY:
- Tu ek close dost ki tarah baat karta hai — warm, funny, caring aur encouraging.
- Kabhi boring ya robotic mat ban. Har reply mein thoda dil daal.
- Emojis use kar jab natural lage — overdo mat kar.

REPLY LENGTH RULE (BAHUT IMPORTANT):
- Short sawaal = Short reply. Directly point pe aa.
- Detailed/complex sawaal = Tabhi lamba reply de.
- Kabhi bhi unnecessarily lamba mat likh. Quality > Quantity.

TUJHE KYA PATA HAI (EXPERT AREAS):
📚 CBSE Class 10 & 12 (Physics, Chemistry, Biology, Maths, English, all subjects)
🔬 NEET UG — Bio, Physics, Chemistry (NCERT-based, concept clarity)
📐 JEE Mains & Advanced — Maths, Physics, Chemistry (problem solving)
📝 CUET — Domain subjects, General Test, Language section
⚔️ NDA — Maths, GAT (English, GK, Physics, Chemistry, History, Geography, Current Affairs)
🎯 Career Guidance — Stream selection, college choices, entrance exams, future planning

FILE SHARING & ANALYSIS:
- Agar koi kisi study material, notes, ya PDF ke baare mein puchhe, toh check kar ki kya wo file tere database mein hai.
- Agar file mil jaye: "Haan yaar, ye rahi teri file!" ya "Ye le buddy, mil gayi!" bol.
- Agar file NA mile: Strictly ye message de — "This material is not available in this group."
- Bot automatically file share kar dega same jagah (group ya DM) jahan manga gaya hai.
- Reply hamesha user ke message ko tag (reply) karke hona chahiye.

CBSE RULES:
- Class 10: Chemical Reactions, Acids/Bases, Metals, Carbon, Life Processes, Heredity, Light, Electricity, Magnetism, Environment (latest syllabus)
- Class 12 PCM: Relations, Matrices, Calculus, Vectors, 3D Geometry, Probability | Current Electricity, Optics, Modern Physics | Solutions, Kinetics, Electrochemistry, d-f Block, Coordination Compounds, Organic
- Class 12 PCB: All Biology chapters (Reproduction, Genetics, Evolution, Health, Ecology, Biotechnology)

EXAM TIPS STYLE:
- JEE ke liye: Concept + Formula + Shortcut trick
- NEET ke liye: NCERT line-by-line, diagram recall, assertion-reason tips
- CUET ke liye: Speed + Accuracy, topic-wise weightage
- NDA ke liye: Maths strong kar, current affairs daily

CAREER GUIDE MODE:
- Jab koi confused ho stream ke baare mein, career path ke baare mein — dost ki tarah sun, then guide kar.
- Pros/Cons clearly bata, realistic advice de.

GOLDEN RULES:
❌ Kabhi discourage mat kar
❌ Kabhi "I'm just an AI" mat bol — tu unka dost hai
✅ Hamesha positively end kar
✅ Agar koi sad/stressed ho toh pehle empathize kar, phir help kar

TERI LIMITS (INHE KABHI CROSS MAT KARNA):
🚫 Koi bhi abusive, vulgar, offensive ya gaali wali language kabhi use mat kar — chahe user kuch bhi kahe.
🚫 Kisi ko bhi bura mat bol, insult mat kar, roast mat kar even if asked.
🚫 Agar koi abusive ya inappropriate sawaal kare — politely refuse kar aur topic change kar.
🚫 Group mein unnecessary, off-topic ya repetitive replies mat de — sirf kaam ki baat.
🚫 Ek hi message ka baar baar reply mat de (no spam).
🚫 Apni scope se bahar ki cheezein (jaise hacking, illegal activities, 18+ content) kabhi mat bol.
🚫 Kisi user ki personal info kabhi share mat kar ya store karne ka impression de.
✅ Hamaesha respectful, safe aur positive community maintain kar.
✅ Agar koi bahut disturbed/sad lage toh gently suggest kar ki wo kisi trusted adult se baat kare.

TERI IDENTITY (Jab koi puchhe "kaun hai tu", "who are you", "tumhara naam kya hai", "who made you" etc.):
- Tu hai: T0PPER AI 🤖
- Banaya hai: CBSE T0PPERS Community ne
- Team:
  👑 Founder: Lucky Chawla — @seniiiorr
  🏢 Owner: Tarun Kumar — @tarun&#95;kumar&#95;in
  🚀 CEO: Abhishek Pani — @war4ver
- Apna intro proudly de, jaise ek team member apni family ka intro deta hai. Style mein, warmly.

📖 LATEST SYLLABUS KNOWLEDGE (2025-26):
- Tu 12th Class, JEE, aur NDA ke LATEST syllabus ka expert hai.
- Tere paas Physics, Chemistry, Maths, Biology ke latest syllabus files hain.
- Jab koi syllabus ke bare mein puche, toh confidence se bata aur unhe file share kar.

🚨 FORMATTING RULE (MUST FOLLOW):
- Use <b>text</b> for Bold.
- Use <i>text</i> for Italics.
- Use <pre>code</pre> for Code.
- Use <a href="url">link</a> for Links.
- DO NOT use Markdown (* or _).
- IMPORTANT: Agar tujhe kisi word mein underscore (_) dikhana hai, toh hamesha use <b>&#95;</b> likh, warna vo italic ban sakta hai.
- Usernames like @tarun&#95;kumar&#95;in ko hamesha <b>@tarun&#95;kumar&#95;in</b> hi likhna.`;

// Per-user conversation memory (in-memory, resets on restart)
const userConversations = new Map();
const MAX_HISTORY = 10; // Keep last 10 messages per user

// Get bot info once at startup for group mention detection
let BOT_USERNAME = '';
bot.getMe().then(me => {
    BOT_USERNAME = me.username;
    console.log(`Bot username: @${BOT_USERNAME}`);
});

// ─── LOCAL SYLLABUS LOADING ───
const loadLocalSyllabus = () => {
    const syllabusPath = './syllabus';
    if (fs.existsSync(syllabusPath)) {
        const files = fs.readdirSync(syllabusPath);
        files.forEach(file => {
            if (file.endsWith('.pdf')) {
                fileIndex.push({
                    name: file.toLowerCase(),
                    originalName: file,
                    localPath: path.join(syllabusPath, file),
                    type: 'document',
                    isLocal: true
                });
                console.log(`Indexed local syllabus: ${file}`);
            }
        });
    }
};
loadLocalSyllabus();

// ─── INDEXING HELPER ───
const addToIndex = (msg, type) => {
    let fileId, fileName;

    if (type === 'document') {
        fileId = msg.document.file_id;
        fileName = msg.document.file_name || 'Untitled File';
    } else if (type === 'photo') {
        fileId = msg.photo[msg.photo.length - 1].file_id;
        fileName = msg.caption || `Photo_${fileId.substring(0, 8)}`;
    }

    if (!fileId) return;

    // Support indexing from forwarded messages (to sync past material)
    let sourceChatId = msg.chat.id;
    let sourceMessageId = msg.message_id;
    let sourceUsername = msg.chat.username;

    if (msg.forward_from_chat) {
        sourceChatId = msg.forward_from_chat.id;
        sourceMessageId = msg.forward_from_message_id;
        sourceUsername = msg.forward_from_chat.username;
    }

    // Avoid duplicate entries
    if (!fileIndex.find(f => f.fileId === fileId)) {
        fileIndex.push({
            name: fileName.toLowerCase(),
            originalName: fileName,
            fileId: fileId,
            type: type,
            sourceChatId: sourceChatId,
            sourceMessageId: sourceMessageId,
            sourceUsername: sourceUsername,
            indexedAt: new Date().toISOString()
        });
        saveIndex(); // Save to disk
        console.log(`Indexed new ${type}: ${fileName} from ${sourceUsername || 'private'}`);
    }
};

// Listen for channel posts (for indexing from @CBSET0PPERS)
bot.on('channel_post', (msg) => {
    if (msg.document) addToIndex(msg, 'document');
    if (msg.photo) addToIndex(msg, 'photo');
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text || '';
    const photo = msg.photo;
    const document = msg.document;
    const chatType = msg.chat.type;

    // ─── ADMIN SYNC LOGIC ───
    // Only index files from messages if sent by authorized admins
    const username = msg.from?.username;
    const isAdmin = username && ALLOWED_ADMINS.includes(username);

    if (document || photo) {
        if (isAdmin) {
            addToIndex(msg, document ? 'document' : 'photo');
            if (chatType === 'private') {
                bot.sendMessage(chatId, `✅ Material synced successfully, boss! Ab ye database mein save hai.`, { parse_mode: 'HTML' });
            }
        } else if (chatType === 'private') {
            bot.sendMessage(chatId, `🚫 Sorry, sirf admins hi files sync kar sakte hain.`, { parse_mode: 'HTML' });
        }
    }

    if (!text && !photo && !document) return;

    // ─── GROUP CHAT LOGIC ───
    // In groups/supergroups, only respond if:
    // 1. Bot is @mentioned in the message, OR
    // 2. User is replying directly to the bot's message
    const isGroup = chatType === 'group' || chatType === 'supergroup';
    if (isGroup) {
        const isMentioned = text.includes(`@${BOT_USERNAME}`) ||
            (msg.entities && msg.entities.some(e => e.type === 'mention' && text.substring(e.offset, e.offset + e.length) === `@${BOT_USERNAME}`));

        const isReplyToBot = msg.reply_to_message &&
            msg.reply_to_message.from &&
            msg.reply_to_message.from.username === BOT_USERNAME;

        if (!isMentioned && !isReplyToBot) return; // Silently ignore
    }

    // Strip the bot mention from the text before sending to AI
    const cleanText = text.replace(new RegExp(`@${BOT_USERNAME}`, 'gi'), '').trim();

    // Handle /start command
    if (cleanText === '/start' || text === '/start') {
        bot.sendMessage(chatId,
            `Aye yaar! 👋 Kya scene hai?\n\nMai <b>TopperAI</b> hoon — tera best study buddy aur career guide! 🚀\n\n📁 @CBSET0PPERS channel ka sara material muje yaad rehta hai!\n\nMujhse pooch:\n📚 CBSE, NEET, JEE, CUET, NDA questions\n📁 Koi specific notes ya photo chahiye?\n💡 Concept explanations & Career guidance\n\nBata, kya help chahiye? 😄`,
            { parse_mode: 'HTML' }
        );
        return;
    }

    // Handle /clear command to reset conversation
    if (cleanText === '/clear' || text === '/clear') {
        userConversations.delete(userId);
        bot.sendMessage(chatId, `Memory clear kar di! 🧹`, { parse_mode: 'HTML' });
        return;
    }

    // Show "typing" status
    bot.sendChatAction(chatId, 'typing');

    try {
        // Get or create conversation history for this user
        if (!userConversations.has(userId)) {
            userConversations.set(userId, []);
        }
        const history = userConversations.get(userId);

        let content = [];

        // ─── FILE SEARCH LOGIC ───
        let foundFiles = [];
        if (cleanText) {
            // Simple keyword search in the indexed files
            const keywords = cleanText.toLowerCase().split(/\s+/).filter(k => k.length > 2);
            if (keywords.length > 0) {
                foundFiles = fileIndex.filter(file =>
                    keywords.some(k => file.name.includes(k)) ||
                    (file.originalName && keywords.some(k => file.originalName.toLowerCase().includes(k)))
                );
            }
        }

        // Add file context to help AI know what we found
        let fileContext = "";
        if (foundFiles.length > 0) {
            fileContext = `\n\n[SYSTEM NOTE: Database mein matching files mili hain: ${foundFiles.map(f => f.originalName).join(', ')}. Inka zikr kar, main PDF bhej dunga.]`;
        } else if (cleanText && (cleanText.toLowerCase().includes('pdf') || cleanText.toLowerCase().includes('notes') || cleanText.toLowerCase().includes('file') || cleanText.toLowerCase().includes('syllabus'))) {
            fileContext = `\n\n[SYSTEM NOTE: User ne material manga hai par mere database mein nahi mila. User ko politely bol ki "Ye material abhi is group mein available nahi hai."]`;
        }

        if (cleanText) {
            content.push({ type: "text", text: cleanText + fileContext });
        }

        if (photo) {
            const fileId = photo[photo.length - 1].file_id;
            const fileUrl = await bot.getFileLink(fileId);
            content.push({ type: "image_url", image_url: { url: fileUrl } });
            if (msg.caption) {
                content.push({ type: "text", text: msg.caption });
            }
        }

        // Add user message to history
        history.push({ role: "user", content: content });

        // Keep history within limit
        if (history.length > MAX_HISTORY) {
            history.splice(0, history.length - MAX_HISTORY);
        }

        // ─── AI RESPONSE WITH FALLBACK ───
        let response;
        let lastError;

        for (const modelId of MODELS) {
            try {
                console.log(`Trying model: ${modelId}`);
                response = await client.chat.completions.create({
                    model: modelId,
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT },
                        ...history
                    ],
                });
                console.log(`Success with: ${modelId}`);
                break; // Exit loop on success
            } catch (err) {
                console.error(`Error with ${modelId}:`, err.message);
                lastError = err;
                // Continue to next model
            }
        }

        if (!response) {
            throw lastError || new Error("All models failed");
        }

        let reply = response.choices[0].message.content;

        // ─── HTML SANITIZATION & FIX ───
        // Replace common markdown symbols that AI might still send by mistake
        // to prevent parsing errors or hidden underscores.
        // We specifically want to fix underscores in usernames.
        reply = reply.replace(/@(\w+)_(\w+)_?(\w*)/g, (match) => match.replace(/_/g, '&#95;'));

        // Final fallback: if AI still uses * or _ for bold/italic, we don't want it to break HTML
        // But we must be careful not to break legitimate HTML tags.
        // For now, let's focus on the underscore issue since it's the main blocker.

        // Add assistant reply to history
        history.push({ role: "assistant", content: reply });

        // ─── DELIVERY LOGIC (Simplified: Group -> Group, DM -> DM) ───
        const filesToDeliver = foundFiles.filter(file =>
            reply.toLowerCase().includes(file.name) ||
            (file.originalName && reply.toLowerCase().includes(file.originalName.toLowerCase()))
        );

        if (filesToDeliver.length > 0) {
            // "NO BAKCHODI" MODE: If files found, ONLY send the files, no text.
            for (const file of filesToDeliver) {
                try {
                    if (file.isLocal) {
                        await bot.sendDocument(chatId, file.localPath, { reply_to_message_id: msg.message_id });
                    } else {
                        // Forward or Copy based on preference (Forwarding is cleaner for source)
                        await bot.forwardMessage(chatId, file.sourceChatId, file.sourceMessageId);
                    }
                } catch (error) {
                    console.error("Delivery failed:", error.message);
                    if (file.fileId) {
                        if (file.type === 'document') {
                            await bot.sendDocument(chatId, file.fileId, { reply_to_message_id: msg.message_id });
                        } else {
                            await bot.sendPhoto(chatId, file.fileId, { reply_to_message_id: msg.message_id });
                        }
                    }
                }
            }
        } else {
            // No files found or not a file request: Send AI's text reply
            await bot.sendMessage(chatId, reply, { parse_mode: 'HTML', reply_to_message_id: msg.message_id });
        }

    } catch (error) {
        console.error("DEBUG - API Error Details:", JSON.stringify(error, null, 2));
        let errorMessage = "Yaar kuch gadbad ho gayi! 😅 Ek baar phir try kar na.";
        bot.sendMessage(chatId, errorMessage, { reply_to_message_id: msg.message_id });
    }
});

bot.on('polling_error', (error) => {
    console.error("Polling error:", error);
});

// Create a simple HTTP server to satisfy Render's health check
// This prevents the service from being marked as failed for not binding to a port
const port = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running\n');
});

server.listen(port, () => {
    console.log(`Health check server listening on port ${port}`);
});
