import { GoogleGenerativeAI } from '@google/generative-ai';

// Model constants
const MODEL_FLASH = 'gemini-2.0-flash';
const MODEL_PRO = 'gemini-2.0-pro';

// Initialize Gemini API
const getAI = () => {
  // Try multiple sources for the API key
  const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || 
                 process.env?.VITE_GEMINI_API_KEY ||
                 window.__VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('VITE_GEMINI_API_KEY not found in:');
    console.error('  import.meta.env:', import.meta.env);
    console.error('  process.env:', process.env);
    throw new Error('Gemini API key not configured. Set VITE_GEMINI_API_KEY in .env and restart dev server.');
  }
  
  // Trim whitespace and validate
  const trimmedKey = apiKey.trim();
  if (trimmedKey.length < 20) {
    console.error('API key appears invalid (too short):', trimmedKey);
    throw new Error(`Invalid API key format. Length: ${trimmedKey.length}`);
  }
  
  console.log('Using Gemini API key:', trimmedKey.substring(0, 10) + '...');
  return new GoogleGenerativeAI({ apiKey: trimmedKey });
};

// Rate limit callback
let onRateLimitReached = () => {};
export const setRateLimitCallback = (cb) => {
  onRateLimitReached = cb;
};

// Retry logic with rate limiting
async function executeWithRetry(fn, signal, maxRetries = 3, initialDelay = 8000) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    if (signal?.aborted) throw new Error('Abort');
    try {
      return await fn(signal);
    } catch (error) {
      lastError = error;
      if (error.message?.includes('429') || error.status === 429) {
        onRateLimitReached(60);
        throw error;
      }
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

// System constraints
const SYSTEM_CONSTRAINTS = `
STRICT SYSTEM RULES FOR STUDYHUB:
1. DOCUMENT GROUNDING: Your knowledge is strictly and exclusively limited to the provided document. Answer ONLY using the uploaded document. Do not use external knowledge, internet data, or general context.
2. TOPIC EXTRACTION: List only the topics explicitly found in the document. Do not add, infer, or invent additional topics. Topics must reflect clear structural elements (headings, key sections) within the text.
3. QUIZ GENERATION: Questions must reflect core ideas and subject matter from the document only. Do not ask about authorship, publishing history, or background unrelated to the learning content.
4. NO MARKDOWN: Never use symbols like #, *, _, -, or bullet points with symbols.
5. NO HTML: NEVER use <b>, <i>, <strong>, or any other HTML tags.
6. NO ASTERISKS: Never use asterisks for bolding, lists, or emphasis.
7. CLEAN TEXT: Output must be clean, professional plain text with short, well-spaced paragraphs.
8. CITATIONS: All answers must include page references (e.g., [Page X]) when applicable.
9. PODCAST RULES: Hosts must explain only selected topics from the document. Do not discuss authorship or background. Use "Host 1" and "Host 2" for names.
`;

const cleanJsonResponse = (text) => {
  if (!text) return "";
  const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  return jsonMatch ? jsonMatch[0] : text.replace(/```json\n?|```/g, "").trim();
};

// Helpers copied/adapted from TypeScript studyhub service
const cleanBase64 = (data) => {
  if (!data) return '';
  const parts = data.split(',');
  return parts.length > 1 ? parts[1] : parts[0];
};

const getMimeType = (file) => {
  if (!file) return 'text/plain';
  return file.type === 'application/pdf' ? 'application/pdf' : 'text/plain';
};

const parseJsonResponse = (text) => {
  if (!text) return null;
  let cleaned = String(text).replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const start = cleaned.indexOf('[');
    const startBrace = cleaned.indexOf('{');
    const end = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
    const startIndex = (start !== -1 && (startBrace === -1 || start < startBrace)) ? start : startBrace;
    if (startIndex !== -1 && end !== -1 && end > startIndex) {
      try {
        return JSON.parse(cleaned.substring(startIndex, end + 1));
      } catch (inner) {}
    }
  }
  return null;
};

const getAccentInstruction = (accent) => {
  switch (accent) {
    case 'NG': return "using a natural Nigerian English style, with clear Nigerian rhythm and local nuances.";
    case 'UK': return "using a natural British English (UK) style with appropriate British vocabulary.";
    case 'US': return "using a standard American English (US) style.";
    default: return "using a clear neutral English style.";
  }
};

const getToneInstruction = (tone) => {
  switch ((tone || '').toUpperCase()) {
    case 'FUNNY': return "Be highly entertaining and witty. Use educational jokes and keep the energy high.";
    case 'PROFESSIONAL': return "Be formal, objective, and precise. Use professional academic terminology.";
    case 'TEACHER': return "Be encouraging and pedagogical. Explain complex ideas with simple analogies.";
    case 'FRIEND': return "Be casual and supportive. Talk like a friendly study buddy.";
    default: return "Be clear and helpful.";
  }
};

// Return trimmed API key string
const getApiKey = () => {
  const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || process.env?.VITE_GEMINI_API_KEY || window.__VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('VITE_GEMINI_API_KEY not configured');
  return apiKey.trim();
};

const extractTextFromResponse = (json) => {
  if (!json) return '';
  // Try several common shapes
  try {
    if (json.candidates && json.candidates.length) {
      const c = json.candidates[0];
      if (c.output && c.output.length) {
        // new-style
        return c.output.map(o => (o.content || []).map(p => p.text || '').join('')).join('\n');
      }
      if (c.content && c.content.parts) {
        return c.content.parts.map(p => p.text || '').join('\n');
      }
    }
    if (json.response && typeof json.response === 'object') {
      if (json.response.outputText) return json.response.outputText;
      if (json.response?.text) return json.response.text;
    }
    // fallback: join any text fields
    const asString = JSON.stringify(json);
    return asString;
  } catch (e) {
    return JSON.stringify(json);
  }
};

const callGenerate = async (modelName, body, signal) => {
  const apiKey = getApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(text || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  const json = await res.json();
  return json;
};



/**
 * Generate topics from document text
 * @param {string} text - Document text
 * @param {AbortSignal} signal - Abort signal for cancellation
 * @returns {Promise<string[]>} Array of topics
 */
export const generateTopics = async (text, signal) => {
  if (!text || text.trim().length === 0) {
    return ['Overview', 'Key Concepts', 'Practice', 'Summary', 'Review'];
  }
  
  try {
    const body = {
      contents: [{
        parts: [{
          text: `Extract 5-7 distinct, specific study topics from this document. Return ONLY a JSON array of strings with short topic names (2-4 words each).\n\nText (first 2000 chars):\n${text.substring(0,2000)}...\n\nFormat: ["Topic 1", "Topic 2", "Topic 3", ...]`
        }]
      }]
    };

    const json = await callGenerate(MODEL_PRO, body, signal);
    const textOut = extractTextFromResponse(json);
    const topics = parseJsonResponse(textOut) || parseJsonResponse(json?.candidates?.[0]?.content?.parts?.map(p=>p.text).join('\n'));
    if (Array.isArray(topics)) return topics.slice(0,7);
    return ['Overview', 'Key Concepts', 'Practice', 'Summary', 'Review'];
  } catch (error) {
    console.error('Error generating topics:', error);
    return ['Overview', 'Key Concepts', 'Practice', 'Summary', 'Review'];
  }
};

/**
 * Initialize chat session with document context
 * @param {string} docText - Document text
 * @param {string[]} topics - Document topics
 * @param {string} tone - Chat tone
 * @returns {Promise<Object>} Chat session object with sendMessage method
 */
export const initializeChatWithContext = async (docText, topics, tone = 'TEACHER') => {
  try {
    // Return a lightweight chat-like object that uses REST calls under the hood
    const systemInstruction = `${SYSTEM_CONSTRAINTS}
DOCUMENT CONTEXT: The student has provided a study document about: ${Array.isArray(topics) ? topics.join(', ') : topics}
Behavior rules: 1) Answer only from document 2) If unknown, state it cannot be answered.
TONE: ${getToneInstruction(tone)}
DOCUMENT TEXT (reference): ${docText.substring(0, 4000)}`;

    const chat = {
      sendMessage: async ({ message } = {}) => {
        // message is an array of parts; map to contents
        const parts = [];
        if (Array.isArray(message)) {
          for (const m of message) {
            if (m.inlineData) {
              parts.push({ inlineData: m.inlineData });
            }
            if (m.text) parts.push({ text: m.text });
          }
        }
        const body = { contents: [{ parts }] };
        const json = await callGenerate(MODEL_PRO, body);
        const textOut = extractTextFromResponse(json);
        return { text: textOut, raw: json };
      }
    };

    return chat;
  } catch (error) {
    console.error('Error initializing chat:', error);
    throw error;
  }
};

/**
 * Speak text using text-to-speech
 * @param {string} text - Text to speak
 * @param {string} accent - Voice accent (en-US, en-GB, etc.)
 * @returns {Promise<string>} Audio URL or base64
 */
export const speakText = async (text, accent = 'en-US') => {
  try {
    // Use browser's Web Speech API
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice based on accent
      const voices = speechSynthesis.getVoices();
      const voiceMap = {
        'en-US': 'en-US',
        'en-GB': 'en-GB',
        'en-AU': 'en-AU'
      };
      
      const lang = voiceMap[accent] || 'en-US';
      const voice = voices.find(v => v.lang.includes(lang));
      if (voice) utterance.voice = voice;
      
      utterance.onend = () => resolve('spoken');
      utterance.onerror = (e) => reject(e);
      
      speechSynthesis.speak(utterance);
    });
  } catch (error) {
    console.error('Error speaking text:', error);
    throw error;
  }
};

/**
 * Generate quiz questions for a topic
 * @param {string} docText - Document text
 * @param {string} topic - Topic to quiz on
 * @param {number} count - Number of questions
 * @param {AbortSignal} signal - Abort signal
 * @returns {Promise<Array>} Array of quiz questions
 */
export const generateQuiz = async (docText, topic, count = 5, signal) => {
  if (!docText) return [];
  
  try {
    const body = {
      contents: [{
        parts: [{ text: `Generate ${count} multiple choice quiz questions about "${topic}".\n\nIMPORTANT - Return ONLY valid JSON array with this exact format:\n[ { \"id\": \"1\", \"text\": \"Question text here?\", \"options\": [\"A\",\"B\",\"C\",\"D\"], \"correctAnswerIndex\": 0, \"explanation\": \"Why\" } ]\n\nDocument text to base questions on:\n${docText.substring(0,3000)}...\n\nRules: Questions must be answerable from the document. Return ONLY the JSON array.` }]
      }]
    };

    const json = await callGenerate(MODEL_PRO, body, signal);
    const textOut = extractTextFromResponse(json);
    const questions = parseJsonResponse(textOut) || parseJsonResponse(json?.candidates?.[0]?.content?.parts?.map(p=>p.text).join('\n'));
    return Array.isArray(questions) ? questions : [];
  } catch (error) {
    console.error('Error generating quiz:', error);
    return [];
  }
};

/**
 * Get AI feedback on quiz performance
 * @param {string} docText - Document text
 * @param {Array} questions - Quiz questions
 * @param {Array} results - User's answers
 * @param {AbortSignal} signal - Abort signal
 * @returns {Promise<Object>} Feedback object
 */
export const getQuizFeedback = async (docText, questions, results, signal) => {
  if (!docText || !results) {
    return {
      performanceSummary: 'Assessment complete.',
      strengths: 'Keep practicing.',
      weaknesses: 'Review fundamentals.',
      nextSteps: 'Try again for better results.'
    };
  }
  
  try {
    const resultsData = results.map((r, idx) => ({ question: questions[idx]?.text, correct: r.isCorrect }));
    const body = {
      contents: [{ parts: [{ text: `Analyze these quiz results and provide constructive feedback in exactly this JSON format:\n\nQuiz Results:\n${JSON.stringify(resultsData, null, 2)}\n\nReturn ONLY this valid JSON:{ \"performanceSummary\": \"...\", \"strengths\": \"...\", \"weaknesses\": \"...\", \"nextSteps\": \"...\" }` }] }]
    };

    const json = await callGenerate(MODEL_PRO, body, signal);
    const textOut = extractTextFromResponse(json);
    const feedback = parseJsonResponse(textOut);
    return feedback || { performanceSummary: 'Assessment complete.', strengths: 'Good effort on the quiz.', weaknesses: 'Review challenging concepts.', nextSteps: 'Try another quiz to reinforce learning.' };
  } catch (error) {
    console.error('Error getting feedback:', error);
    return {
      performanceSummary: 'Quiz assessment complete.',
      strengths: 'You engaged with the material.',
      weaknesses: 'Some areas need reinforcement.',
      nextSteps: 'Review the material and try again.'
    };
  }
};

/**
 * Generate podcast content from document
 * @param {string} docText - Document text
 * @param {Object} settings - Podcast settings
 * @param {AbortSignal} signal - Abort signal
 * @returns {Promise<Object>} Podcast data with segments
 */
export const generatePodcastContent = async (docText, settings = {}, signal) => {
  if (!docText) return { audio: '', segments: [] };
  
  try {
    const { tone = 'TEACHER', durationMinutes = 5, selectedTopics = [] } = settings;
    const topicContext = selectedTopics.length > 0 ? `Focus on these topics: ${selectedTopics.join(', ')}.` : 'Cover the main points from the document.';
    const body = {
      contents: [{ parts: [{ text: `Create a podcast script from this document.\n\n${topicContext}\nTone: ${getToneInstruction(tone)}\nTarget duration: ${durationMinutes} minutes\n\nReturn ONLY valid JSON:{ \"title\": \"Podcast Title\", \"segments\": [ { \"startTime\": 0, \"duration\": 30, \"topic\": \"Topic\", \"speaker\": \"Narrator\", \"text\": \"...\" } ] }\n\nDocument:\n${docText.substring(0,3000)}...` }] }]
    };

    const json = await callGenerate(MODEL_PRO, body, signal);
    const textOut = extractTextFromResponse(json);
    const podcastData = parseJsonResponse(textOut) || {};
    return { audio: '', segments: podcastData.segments || [], title: podcastData.title || 'Study Podcast' };
  } catch (error) {
    console.error('Error generating podcast:', error);
    return { audio: '', segments: [], title: 'Study Podcast' };
  }
};

/**
 * Analyze document and extract summary
 * @param {string} docText - Document text
 * @param {AbortSignal} signal - Abort signal
 * @returns {Promise<Object>} Analysis with summary and key points
 */
export const analyzeDocument = async (docText, signal) => {
  if (!docText) {
    return { summary: '', keyPoints: [], topics: [] };
  }
  
  try {
    const body = {
      contents: [{ parts: [{ text: `Analyze this document and provide:\n1. A concise 2-3 sentence summary\n2. 5 key points\n3. 5-7 study topics\n\nReturn ONLY valid JSON:{ \"summary\": \"...\", \"keyPoints\": [\"p1\"], \"topics\": [\"t1\"] }\n\nDocument (first 3000 chars):\n${docText.substring(0,3000)}...` }] }]
    };
    const json = await callGenerate(MODEL_PRO, body, signal);
    const textOut = extractTextFromResponse(json);
    const analysis = parseJsonResponse(textOut);
    return analysis || { summary: 'Document analysis in progress...', keyPoints: [], topics: [] };
  } catch (error) {
    console.error('Error analyzing document:', error);
    return {
      summary: 'Document loaded successfully. Ask questions to learn more.',
      keyPoints: [],
      topics: []
    };
  }
};

export const askTutor = async (docText, chatHistory, question, tone = 'Teacher', signal) => {
  return executeWithRetry(async () => {
    try {
      console.log('[askTutor] Preparing request...');
      const system = `${SYSTEM_CONSTRAINTS}\nYou are the UniSpace AI Tutor. Mode: ${tone}. Answer ONLY using the provided document. If a question cannot be answered using the document, state: \"This question cannot be answered using the document you uploaded. Please ask a question based on the document.\" Document Content: ${docText.substring(0,25000)}`;

      // Build contents from history
      const contents = [];
      for (const m of chatHistory || []) {
        contents.push({ parts: [{ text: m.text }] });
      }
      // Add the user question
      contents.push({ parts: [{ text: question }] });

      const body = { model: MODEL_FLASH, systemInstruction: system, contents };
      console.log('[askTutor] Sending REST request...');
      const json = await callGenerate(MODEL_FLASH, { contents }, signal);
      const textOut = extractTextFromResponse(json);
      console.log('[askTutor] Response received');
      return textOut;
    } catch (error) {
      console.error('[askTutor] Error details:', { message: error.message, status: error.status, errorCode: error.code, fullError: error });
      throw error;
    }
  }, signal);
};

/**
 * Analyze quiz performance (TypeScript version compatibility)
 */
export const analyzeQuizPerformance = async (topicTitle, questions, userAnswers, signal) => {
  return executeWithRetry(async () => {
    const results = questions.map((q, i) => ({ question: q.question, correct: q.correctAnswer === userAnswers[i], userAnswer: q.options[userAnswers[i]] || 'None', correctAnswer: q.options[q.correctAnswer] }));
    const body = { contents: [{ parts: [{ text: `Analyze these quiz results on "${topicTitle}" and provide constructive feedback.\n\nQuiz Results:\n${JSON.stringify(results, null, 2)}\n\nReturn ONLY valid JSON in this exact format:{ \"performanceSummary\": \"...\", \"strengths\": \"...\", \"weaknesses\": \"...\", \"nextSteps\": \"...\" }` }] }] };
    const json = await callGenerate(MODEL_FLASH, body, signal);
    const textOut = extractTextFromResponse(json);
    const parsed = parseJsonResponse(textOut) || {};
    return { performanceSummary: parsed.performanceSummary || 'Quiz completed.', strengths: parsed.strengths || 'Good effort.', weaknesses: parsed.weaknesses || 'Review content.', nextSteps: parsed.nextSteps || 'Keep practicing.' };
  }, signal);
};

// Debug helper: verify API key by calling list models endpoint
export const verifyApiKey = async () => {
  try {
    const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || process.env?.VITE_GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    console.log('[verifyApiKey] Fetching models list from:', url.substring(0, 80) + '...');
    const res = await fetch(url, { method: 'GET' });
    const text = await res.text();
    console.log('[verifyApiKey] status:', res.status, 'body:', text.substring(0, 1000));
    return { status: res.status, body: text };
  } catch (error) {
    console.error('[verifyApiKey] Error verifying API key:', error);
    throw error;
  }
};

// Expose helper in browser for quick diagnostics
if (typeof window !== 'undefined') {
  window.__verifyGeminiApiKey = verifyApiKey;
}

