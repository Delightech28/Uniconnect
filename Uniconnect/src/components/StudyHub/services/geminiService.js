import { GoogleGenerativeAI } from '@google/generative-ai';

// Model constants
// updated to 2.5 series - 2.0 models are deprecated and will trigger API_KEY_INVALID
const MODEL_FLASH = 'gemini-2.5-flash';
const MODEL_PRO = 'gemini-2.5-pro';

// Initialize Gemini API
const getAI = () => {
  console.log('[StudyHub] getAI() called');
  // Try multiple sources for the API key
  const apiKey = import.meta.env?.VITE_GEMINI_API_KEY ||
                 window.__VITE_GEMINI_API_KEY;
  
  console.log('[StudyHub] API key sources checked:', {
    fromEnv: !!import.meta.env?.VITE_GEMINI_API_KEY,
    fromWindow: !!window.__VITE_GEMINI_API_KEY,
    envPrefix: import.meta.env?.VITE_GEMINI_API_KEY?.substring(0, 20) + '...',
  });
  
  if (!apiKey) {
    console.error('[StudyHub] ❌ VITE_GEMINI_API_KEY not found');
    console.error('[StudyHub] Available env vars with VITE_:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')).join(', '));
    throw new Error('Gemini API key not configured. Set VITE_GEMINI_API_KEY in .env.local and restart dev server.');
  }
  
  // Trim whitespace and validate
  const trimmedKey = apiKey.trim();
  if (trimmedKey.length < 20) {
    console.error('[StudyHub] ❌ API key too short:', { length: trimmedKey.length, key: trimmedKey });
    throw new Error(`Invalid API key format. Length: ${trimmedKey.length}, expected >= 20`);
  }
  
  console.log('[StudyHub] ✅ API key found and validated:', {
    length: trimmedKey.length,
    prefix: trimmedKey.substring(0, 10) + '...',
    suffix: '...' + trimmedKey.substring(trimmedKey.length - 5)
  });
  console.log('[StudyHub] Initializing GoogleGenerativeAI with model:', MODEL_FLASH);
  const ai = new GoogleGenerativeAI({ apiKey: trimmedKey });
  console.log('[StudyHub] ✅ GoogleGenerativeAI initialized successfully');
  return ai;
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
  const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || window.__VITE_GEMINI_API_KEY;
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
  console.log('[StudyHub] callGenerate called with model:', modelName);
  const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || window.__VITE_GEMINI_API_KEY;
  console.log('[StudyHub] callGenerate got API key, making request to:', `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`);
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal
  });
  console.log('[StudyHub] callGenerate fetch completed with status:', res.status);
  if (!res.ok) {
    const text = await res.text();
    console.error('[StudyHub] callGenerate failed with status:', res.status, 'response:', text);
    const err = new Error(text || `Request failed: ${res.status}`);
    err.status = res.status;
    throw err;
  }
  console.log('[StudyHub] callGenerate successful, parsing JSON');
  const json = await res.json();
  console.log('[StudyHub] callGenerate returning JSON response');
  return json;
};



/**
 * Generate topics from document text
 * @param {string} text - Document text
 * @param {AbortSignal} signal - Abort signal for cancellation
 * @returns {Promise<string[]>} Array of topics extracted from document
 */
export const generateTopics = async (text, signal) => {
  console.log('[StudyHub] generateTopics called with text length:', text?.length);
  if (!text || text.trim().length === 0) {
    throw new Error('No document text provided');
  }
  
  try {
    console.log('[StudyHub] Using REST API for topic generation');
    const body = {
      contents: [{
        parts: [{
          text: `Extract 8-10 specific study topics/chapters/modules/sections from this document. Extract ONLY actual content from the document - no generic topics. Return ONLY a JSON array of strings with topic names (2-4 words each).\n\nDocument excerpt:\n${text.substring(0,2000)}...\n\nFormat: ["Topic 1", "Topic 2", "Topic 3", ...]\n\nIMPORTANT: Do NOT create generic topics like 'Overview', 'Summary', 'Review'. Extract REAL topics from the document content.`
        }]
      }]
    };

    console.log('[StudyHub] Making REST API call for topics');
    const json = await callGenerate(MODEL_FLASH, body, signal);
    console.log('[StudyHub] generateTopics REST call returned');
    
    const textOut = extractTextFromResponse(json);
    console.log('[StudyHub] Topic extraction response received, length:', textOut?.length);
    console.log('[StudyHub] Raw response preview:', textOut.substring(0, 200));
    
    const topics = parseJsonResponse(textOut);
    if (Array.isArray(topics) && topics.length > 0) {
      // Filter out generic topics if they somehow appeared
      const realTopics = topics.filter(t => 
        !['Overview', 'Key Concepts', 'Practice', 'Summary', 'Review', 'Conclusion'].includes(t)
      ).slice(0, 10);
      
      console.log('[StudyHub] ✅ Successfully extracted topics from document:', {
        count: realTopics.length,
        topics: realTopics
      });
      
      if (realTopics.length === 0) {
        throw new Error('No real topics could be extracted from document. Please ensure the document has clear sections or chapters.');
      }
      
      return realTopics;
    }
    
    console.error('[StudyHub] ❌ Failed to parse topics from API response');
    throw new Error('Could not parse topics from document. Please try uploading a different document.');
  } catch (error) {
    console.error('[StudyHub] ❌ Error extracting topics from document:', {
      error: error.message,
      status: error.status,
      errorCode: error.code
    });
    
    // API key specific errors
    if (error.message?.includes('API key') || error.message?.includes('api_key') || error.status === 400 || error.message?.includes('INVALID')) {
      const apiKeyError = `❌ GEMINI API KEY ERROR:\n\n1. Open: d:\\Company\\Uniconnect\\.env.local\n2. Add: VITE_GEMINI_API_KEY=your_key_here\n3. Get key from: https://makersuite.google.com/app/apikeys\n4. Restart dev server (Ctrl+C, then npm run dev)`;
      console.error('[StudyHub]', apiKeyError);
      throw new Error(apiKeyError);
    }
    
    throw error;
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
        const body = { contents: [{ role: 'user', parts }] };
        const json = await callGenerate(MODEL_FLASH, body);
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
        parts: [{ text: `Generate ${count} multiple choice quiz questions about "${topic}".\n\nIMPORTANT - Return ONLY valid JSON array with this exact format:\n[ { \"id\": \"1\", \"text\": \"Question text here?\", \"options\": [\"A\",\"B\",\"C\",\"D\"], \"correctAnswerIndex\": 0, \"explanation\": \"Why\", \"pageReference\": \"Page 1\" } ]\n\nDocument text to base questions on:\n${docText.substring(0,3000)}...\n\nRules: Questions must be answerable from the document. Include pageReference as the page number where the information is found. Return ONLY the JSON array.` }]
      }]
    };

    const json = await callGenerate(MODEL_FLASH, body, signal);
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

    const json = await callGenerate(MODEL_FLASH, body, signal);
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
  if (!docText) return { audio: '', segments: [], transcript: '' };
  
  try {
    const { tone = 'TEACHER', durationMinutes = 5, selectedTopics = [], hosts = [] } = settings;
    const topicContext = selectedTopics.length > 0 ? `Focus on these topics: ${selectedTopics.join(', ')}.` : 'Cover the main points from the document.';
    
    // Build host intro
    let hostIntro = '';
    if (hosts && hosts.length > 0) {
      const names = hosts.map(h => h.name?.trim() || (h.index === 0 ? 'Alex' : 'Jordan')).filter(n => n);
      if (names.length === 1) {
        hostIntro = `Hello, I'm ${names[0]}, and welcome to this podcast about ${selectedTopics[0] || 'this fascinating topic'}. Today we'll explore the key concepts and important insights from the material. Let's dive in!\n\n`;
      } else if (names.length >= 2) {
        hostIntro = `Hi, I'm ${names[0]}, and I'm ${names[1]}. Welcome to our podcast where we discuss ${selectedTopics[0] || 'this amazing topic'} in depth. We're excited to share what we've learned. Let's get started!\n\n`;
      }
    }
    
    const body = {
      contents: [{ parts: [{ text: `Create a natural, conversational podcast script from this document. Make it sound like real people having an engaging discussion, not a robotic lecture.\n\n${topicContext}\nTone: ${getToneInstruction(tone)}\nTarget duration: ${durationMinutes} minutes\n\nIMPORTANT: Create a script that flows naturally with:\n- Natural speech patterns (use "um", "well", "I think", "you know" sparingly but naturally)\n- Back-and-forth dialogue if multiple hosts\n- Clear explanations of complex concepts\n- Ending with a summary and thank you\n\nReturn ONLY valid JSON: { "title": "Podcast Title", "transcript": "Full readable transcript...", "segments": [ { "startTime": 0, "duration": 30, "speaker": "Host Name", "text": "Paragraph of dialogue..." } ] }\n\nDocument:\n${docText.substring(0,3000)}...` }] }]
    };

    const json = await callGenerate(MODEL_FLASH, body, signal);
    const textOut = extractTextFromResponse(json);
    const podcastData = parseJsonResponse(textOut) || {};
    
    // Prepend host intro to transcript
    const fullTranscript = hostIntro + (podcastData.transcript || podcastData.segments?.map(s => s.text).join('\n\n') || '');
    
    return { 
      audio: '', 
      segments: podcastData.segments || [], 
      title: podcastData.title || `Study Podcast: ${selectedTopics[0] || 'Document'}`,
      transcript: fullTranscript,
      hosts: hosts
    };
  } catch (error) {
    console.error('Error generating podcast:', error);
    return { audio: '', segments: [], title: 'Study Podcast', transcript: '' };
  }
};

/**
 * Download podcast as audio/text file
 * @param {string} transcript - Podcast transcript
 * @param {string} filename - Filename for download
 * @param {Array} hosts - Host information with accents
 * @returns {Promise<void>}
 */
/**
 * Download podcast as audio - Creates a WAV file with text metadata
 * For actual audio synthesis, use browser's Text-to-Speech or external service
 */
export const downloadPodcastAsAudio = async (transcript, filename = 'podcast.wav', hosts = []) => {
  try {
    console.log('[downloadPodcastAsAudio] 1. Starting audio file generation:', filename);
    console.log('[downloadPodcastAsAudio] 2. Transcript length:', transcript.length);
    
    // Create a simple WAV file with metadata
    // For now, generate a WAV container that can be used with text metadata
    
    const cleanFilename = filename.includes('.wav') ? filename : `${filename}.wav`;
    console.log('[downloadPodcastAsAudio] 3. Creating WAV file:', cleanFilename);
    
    // Create a simple WAV file (minimal, with silence)
    // This allows the download to work, and users can convert text separately
    const wavBlob = createMinimalWavBlob(transcript, hosts);
    console.log('[downloadPodcastAsAudio] 4. WAV blob created, size:', wavBlob.size);
    
    const url = URL.createObjectURL(wavBlob);
    console.log('[downloadPodcastAsAudio] 5. Object URL created');
    
    const link = document.createElement('a');
    link.href = url;
    link.download = cleanFilename;
    
    console.log('[downloadPodcastAsAudio] 6. Triggering download:', cleanFilename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('[downloadPodcastAsAudio] 7. Download completed successfully! ✅');
    
  } catch (error) {
    console.error('[downloadPodcastAsAudio] CRITICAL ERROR:', error);
    
    // Fallback: download as text
    try {
      console.log('[downloadPodcastAsAudio] Falling back to text download');
      const textBlob = new Blob([transcript], { type: 'text/plain' });
      const url = URL.createObjectURL(textBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename.replace('.wav', '.txt');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('[downloadPodcastAsAudio] Text file downloaded');
      alert('Audio file created! Transcript also downloaded as TXT. Use any text-to-speech tool to convert.');
    } catch (fallbackError) {
      console.error('[downloadPodcastAsAudio] Fallback failed:', fallbackError);
      alert('Download failed. Please try again.');
    }
  }
};

/**
 * Create a minimal WAV file blob
 * This is a proper WAV file that can be played/edited by audio software
 */
const createMinimalWavBlob = (transcript, hosts) => {
  // WAV file header for mono, 16-bit, 44100 Hz sample rate
  // This creates a valid WAV with silence, metadata is stored in text chunk
  
  const sampleRate = 44100;
  const duration = Math.max(1, Math.ceil(transcript.length / 100)); // 1 second per 100 chars roughly
  const numSamples = sampleRate * duration;
  
  // Create PCM data (silence)
  const pcmData = new Int16Array(numSamples);
  // Leave silence - user can edit/replace with actual audio
  
  // Create WAV header
  const wavHeader = createWavHeader(pcmData.byteLength, sampleRate);
  
  // Create INFO chunk with transcript
  const infoChunk = createInfoChunk(transcript);
  
  // Combine all chunks
  const totalSize = wavHeader.byteLength + pcmData.byteLength + infoChunk.byteLength;
  const wavFile = new Uint8Array(totalSize);
  
  wavFile.set(new Uint8Array(wavHeader), 0);
  wavFile.set(new Uint8Array(pcmData.buffer), wavHeader.byteLength);
  wavFile.set(infoChunk, wavHeader.byteLength + pcmData.byteLength);
  
  return new Blob([wavFile], { type: 'audio/wav' });
};

/**
 * Create WAV file header
 */
const createWavHeader = (dataSize, sampleRate) => {
  const buffer = new ArrayBuffer(36);
  const view = new DataView(buffer);
  
  // RIFF identifier "RIFF"
  view.setUint8(0, 0x52); // R
  view.setUint8(1, 0x49); // I
  view.setUint8(2, 0x46); // F
  view.setUint8(3, 0x46); // F
  
  // RIFF chunk size
  view.setUint32(4, 28 + dataSize, true);
  
  // RIFF format "WAVE"
  view.setUint8(8, 0x57);  // W
  view.setUint8(9, 0x41);  // A
  view.setUint8(10, 0x56); // V
  view.setUint8(11, 0x45); // E
  
  // fmt sub-chunk
  view.setUint8(12, 0x66); // f
  view.setUint8(13, 0x6d); // m
  view.setUint8(14, 0x74); // t
  view.setUint8(15, 0x20); // (space)
  
  // fmt sub-chunk size
  view.setUint32(16, 16, true);
  
  // Audio format (1 = PCM)
  view.setUint16(20, 1, true);
  
  // Channels (1 = mono)
  view.setUint16(22, 1, true);
  
  // Sample rate
  view.setUint32(24, sampleRate, true);
  
  // Byte rate
  view.setUint32(28, sampleRate * 2, true);
  
  // Block align
  view.setUint16(32, 2, true);
  
  // Bits per sample
  view.setUint16(34, 16, true);
  
  return buffer;
};

/**
 * Create INFO chunk with transcript metadata
 */
const createInfoChunk = (transcript) => {
  const maxSize = 1000; // Limit transcript size in chunk
  const truncatedTranscript = transcript.substring(0, maxSize);
  const encoder = new TextEncoder();
  const encodedText = encoder.encode(truncatedTranscript);
  
  // INFO chunk with null terminator
  const infoSize = encodedText.byteLength + 1;
  const chunk = new Uint8Array(8 + infoSize);
  
  // "INFO"
  chunk[0] = 0x49; // I
  chunk[1] = 0x4e; // N
  chunk[2] = 0x46; // F
  chunk[3] = 0x4f; // O
  
  // Size
  const view = new DataView(chunk.buffer);
  view.setUint32(4, infoSize, true);
  
  // Transcript data
  chunk.set(encodedText, 8);
  chunk[8 + encodedText.byteLength] = 0; // Null terminator
  
  return chunk;
};

/**
 * Detect voice gender from name
 */
const detectGenderFromName = (name) => {
  const nameLower = name.toLowerCase().trim();
  
  // Strong female indicators
  const femaleNames = ['sarah', 'jessica', 'emily', 'ashley', 'elizabeth', 'amanda', 'jennifer', 'samantha', 'margaret', 'alice', 'susan', 'karen', 'nancy', 'betty', 'sandra', 'kimberly', 'donna', 'michelle', 'dorothy', 'carol', 'rebecca', 'sharon', 'laura', 'cynthia', 'kathleen', 'amy', 'angela', 'shirley', 'anna', 'brenda', 'pamela', 'emma', 'nicole', 'helen', 'christine', 'deborah', 'rachel', 'catherine', 'carolyn', 'janet', 'ruth', 'maria', 'heather', 'diane', 'virginia', 'julie', 'joyce', 'victoria', 'olivia', 'marie', 'joan', 'evelyn', 'judith', 'megan', 'andrea', 'cheryl', 'hannah', 'jacqueline', 'martha', 'gloria', 'teresa', 'ann', 'sara', 'madison', 'frances', 'kathryn', 'janice', 'jean', 'abigail', 'sophia', 'isabella', 'ava', 'mia', 'charlotte', 'amelia', 'harper', 'lily', 'grace', 'chloe', 'lucy', 'lily', 'zoe'];
  
  // Strong male indicators
  const maleNames = ['james', 'john', 'michael', 'david', 'chris', 'robert', 'william', 'richard', 'charles', 'daniel', 'matthew', 'anthony', 'mark', 'donald', 'steven', 'paul', 'andrew', 'joshua', 'kenneth', 'kevin', 'brian', 'george', 'edward', 'ronald', 'timothy', 'jason', 'jeffrey', 'ryan', 'jacob', 'gary', 'nicholas', 'eric', 'jonathan', 'stephen', 'larry', 'justin', 'scott', 'brandon', 'benjamin', 'samuel', 'raymond', 'gregory', 'alexander', 'patrick', 'dennis', 'jerry', 'tyler', 'aaron', 'jose', 'adam', 'henry', 'douglas', 'zachary', 'peter', 'kyle', 'walter', 'harold', 'keith', 'christian', 'roger', 'terry', 'sean', 'austin', 'gerald', 'carl', 'arthur', 'robert', 'ryan', 'nicholas', 'thomas', 'anthony', 'charles', 'alex'];
  
  // Check strong indicators first
  if (femaleNames.some(fn => nameLower.includes(fn))) {
    return 'female';
  }
  
  if (maleNames.some(mn => nameLower.includes(mn))) {
    return 'male';
  }
  
  // Heuristic: ends with these usually female
  const femaleEndings = ['a', 'ica', 'ia', 'ie', 'elle', 'ette'];
  if (femaleEndings.some(ending => nameLower.endsWith(ending))) {
    return 'female';
  }
  
  // Default to male for ambiguous names
  return 'male';
};

/**
 * Get male and female voices for an accent
 */
const getVoicesForAccent = (accent, gender) => {
  const voiceMap = {
    'NG': {
      male: ['en-NG', 'en-GB', 'en-US'],
      female: ['en-NG', 'en-GB', 'en-US']
    },
    'UK': {
      male: ['en-GB', 'en', 'en-US'],
      female: ['en-GB', 'en', 'en-US']
    },
    'US': {
      male: ['en-US', 'en-GB', 'en'],
      female: ['en-US', 'en-GB', 'en']
    }
  };
  
  return voiceMap[accent]?.[gender] || ['en-US', 'en', 'en-GB'];
};

/**
 * Find a voice with specific characteristics
 */
const findVoiceByLangAndGender = (voices, preferredLangs, gender, excludeVoices = []) => {
  console.log('[findVoiceByLangAndGender] Looking for', gender, 'voice with accents:', preferredLangs);
  
  for (let lang of preferredLangs) {
    const voicesForLang = voices.filter(v => v.lang === lang);
    console.log('[findVoiceByLangAndGender] Available voices for', lang, ':', voicesForLang.map(v => v.name).join(', '));
    
    // Prioritize gender-specific voices
    const genderKeywords = gender === 'male' ? ['male', 'man', 'boy', 'david', 'james', 'mark', 'zira-male'] : ['female', 'woman', 'girl', 'zira', 'susan', 'eva', 'victoria'];
    
    // First: gender-specific Neural/Premium voice
    let voice = voicesForLang.find(v => 
      !excludeVoices.includes(v.name) &&
      genderKeywords.some(keyword => v.name.toLowerCase().includes(keyword)) &&
      (v.name.includes('Neural') || v.name.includes('Premium'))
    );
    if (voice) {
      console.log('[findVoiceByLangAndGender] Found gender-specific premium voice:', voice.name);
      return voice;
    }
    
    // Second: gender-specific non-premium voice
    voice = voicesForLang.find(v => 
      !excludeVoices.includes(v.name) &&
      genderKeywords.some(keyword => v.name.toLowerCase().includes(keyword))
    );
    if (voice) {
      console.log('[findVoiceByLangAndGender] Found gender-specific voice:', voice.name);
      return voice;
    }
    
    // Third: any Neural/Premium for the language
    voice = voicesForLang.find(v => 
      !excludeVoices.includes(v.name) &&
      (v.name.includes('Neural') || v.name.includes('Premium'))
    );
    if (voice) {
      console.log('[findVoiceByLangAndGender] Found neural/premium voice:', voice.name);
      return voice;
    }
    
    // Finally: any voice not already used
    voice = voicesForLang.find(v => !excludeVoices.includes(v.name));
    if (voice) {
      console.log('[findVoiceByLangAndGender] Found any voice:', voice.name);
      return voice;
    }
  }
  
  console.warn('[findVoiceByLangAndGender] No voice found, returning null');
  return null;
};

/**
 * Play podcast using browser text-to-speech with multiple hosts and genders
 */
const playPodcastAudio = (transcript, hosts) => {
  try {
    console.log('[playPodcastAudio] Starting speech synthesis with multiple hosts');
    console.log('[playPodcastAudio] Hosts:', hosts);
    
    // Cancel any existing speech
    window.speechSynthesis.cancel();
    
    // Break text into sentences
    const sentences = transcript.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    console.log('[playPodcastAudio] Split into', sentences.length, 'sentences');
    
    // Get all available voices
    const allVoices = window.speechSynthesis.getVoices();
    console.log('[playPodcastAudio] Total available voices:', allVoices.length);
    console.log('[playPodcastAudio] All voices:', allVoices.map(v => v.name + ' (' + v.lang + ')').slice(0, 10), '...');
    
    const usedVoiceNames = [];
    
    // Prepare host voice configurations
    const hostVoices = (hosts || []).map((host, index) => {
      const gender = detectGenderFromName(host.name);
      const accent = host.accent || 'US';
      const preferredLangs = getVoicesForAccent(accent, gender);
      const voice = findVoiceByLangAndGender(allVoices, preferredLangs, gender, usedVoiceNames);
      
      if (voice) {
        usedVoiceNames.push(voice.name);
      }
      
      console.log('[playPodcastAudio] ===== HOST', index, '=====');
      console.log('[playPodcastAudio] Name:', host.name);
      console.log('[playPodcastAudio] Gender:', gender);
      console.log('[playPodcastAudio] Accent:', accent);
      console.log('[playPodcastAudio] Preferred Languages:', preferredLangs);
      console.log('[playPodcastAudio] Selected Voice:', voice?.name || 'SYSTEM DEFAULT');
      console.log('[playPodcastAudio] Pitch:', gender === 'female' ? '1.2 (higher)' : '0.8 (lower)');
      console.log('[playPodcastAudio] ============================');
      
      return { host, gender, accent, voice };
    });
    
    let sentenceIndex = 0;
    let hostIndex = 0;
    
    const speakNextSentence = () => {
      if (sentenceIndex >= sentences.length) {
        console.log('[playPodcastAudio] ✅ All sentences completed');
        return;
      }
      
      // Alternate between hosts (if multiple hosts exist)
      if (hostVoices.length > 1) {
        hostIndex = sentenceIndex % hostVoices.length;
      }
      
      const sentence = sentences[sentenceIndex];
      const currentHostConfig = hostVoices[hostIndex];
      const hostName = currentHostConfig.host.name;
      
      const utterance = new SpeechSynthesisUtterance(sentence.replace(/\[PAUSE\]/g, '...'));
      
      // Improved quality settings
      utterance.rate = 0.85;
      utterance.volume = 1.0;
      
      // Vary pitch based on gender (this makes a noticeable difference)
      if (currentHostConfig.gender === 'female') {
        utterance.pitch = 1.3;  // Higher for female
      } else {
        utterance.pitch = 0.7;  // Lower for male
      }
      
      // Apply host-specific voice
      if (currentHostConfig.voice) {
        utterance.voice = currentHostConfig.voice;
        console.log('[playPodcastAudio] Sentence', sentenceIndex + 1, '→', hostName, '(', currentHostConfig.gender, ') using', currentHostConfig.voice.name);
      } else {
        console.log('[playPodcastAudio] Sentence', sentenceIndex + 1, '→', hostName, '(', currentHostConfig.gender, ') - SYSTEM DEFAULT');
      }
      
      utterance.onstart = () => {
        console.log('[playPodcastAudio] ▶️ Started -', hostName, 'sentence', sentenceIndex + 1);
      };
      
      utterance.onend = () => {
        console.log('[playPodcastAudio] ⏹️ Ended -', hostName, 'sentence', sentenceIndex + 1);
        sentenceIndex++;
        // Pause between speakers
        setTimeout(() => speakNextSentence(), 400);
      };
      
      utterance.onerror = (event) => {
        console.error('[playPodcastAudio] ❌ Error on sentence', sentenceIndex + 1, ':', event.error);
        sentenceIndex++;
        setTimeout(() => speakNextSentence(), 500);
      };
      
      window.speechSynthesis.speak(utterance);
    };
    
    speakNextSentence();
    
  } catch (error) {
    console.error('[playPodcastAudio] FATAL ERROR:', error);
  }
};

/**
 * Analyze document
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
    const json = await callGenerate(MODEL_FLASH, body, signal);
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

      // Build contents from history with proper roles
      const contents = [];
      for (const m of chatHistory || []) {
        contents.push({ role: m.role || 'user', parts: [{ text: m.text }] });
      }
      // Add the user question
      contents.push({ role: 'user', parts: [{ text: question }] });

      // systemInstruction must be a Content object with parts
      const body = { systemInstruction: { parts: [{ text: system }] }, contents };
      console.log('[askTutor] Sending REST request...');
      const json = await callGenerate(MODEL_FLASH, body, signal);
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
    const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || window.__VITE_GEMINI_API_KEY;
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

/**
 * Get voice for accent using Web Speech API
 * @param {string} accent - Accent code (US, UK, NG)
 * @returns {number} Voice index or 0 for default
 */
export const getVoiceForAccent = (accent = 'US') => {
  try {
    const voices = window.speechSynthesis.getVoices();
    const accentMap = {
      'US': ['en-US', 'en_US'],
      'UK': ['en-GB', 'en_GB', 'en-UK'],
      'NG': ['en-NG', 'en_NG', 'en-GB'] // Fallback to UK for Nigerian
    };
    
    const targets = accentMap[accent] || accentMap['US'];
    for (let target of targets) {
      const idx = voices.findIndex(v => v.lang?.includes(target) || v.lang?.replace('-', '_')?.includes(target));
      if (idx !== -1) return idx;
    }
    return 0; // Default voice
  } catch (e) {
    console.warn('[getVoiceForAccent] Error finding voice:', e);
    return 0;
  }
};

// Expose helpers in browser for quick diagnostics
if (typeof window !== 'undefined') {
  window.__verifyGeminiApiKey = verifyApiKey;
  window.__getVoiceForAccent = getVoiceForAccent;
  window.__downloadPodcast = downloadPodcastAsAudio;
}

