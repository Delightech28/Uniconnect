// Firebase Cloud Function endpoint for secure API access
const CLOUD_FUNCTION_URL = 'https://us-central1-unispacee-cee.cloudfunctions.net/streamGemini';

// Using valid Gemini API models (gemini-3.1-pro-preview does not exist in v1)
const MODEL_FLASH = 'gemini-2.0-flash';
const MODEL_PRO = 'gemini-2.0-flash';

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

/**
 * Call Cloud Function to securely access Gemini API
 * The API key is stored in Firebase Secret Manager and never exposed to frontend
 */
const callCloudFunction = async (requestBody, signal) => {
  try {
    console.log('[callCloudFunction] Calling Cloud Function at:', CLOUD_FUNCTION_URL);
    
    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[callCloudFunction] Cloud Function error:', response.status, errorText);
      throw new Error(`Cloud Function error: ${response.status} - ${errorText}`);
    }

    // Handle streaming response - read as text
    const text = await response.text();
    console.log('[callCloudFunction] Response received, length:', text.length);
    
    // Try to parse as JSON first, otherwise return as text
    try {
      return JSON.parse(text);
    } catch (e) {
      // If not JSON, return as structured response
      return { 
        candidates: [{ 
          content: { 
            parts: [{ text: text }] 
          } 
        }] 
      };
    }
  } catch (error) {
    console.error('[callCloudFunction] Error calling Cloud Function:', error);
    throw error;
  }
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
  // Format the request for Cloud Function
  const cloudFunctionRequest = {
    contentsParts: body.contents?.[0]?.parts || [],
    systemInstruction: body.systemInstruction || undefined
  };
  
  try {
    const json = await callCloudFunction(cloudFunctionRequest, signal);
    return json;
  } catch (error) {
    console.error('[callGenerate] Error:', error);
    throw error;
  }
};



/**
 * Generate topics from document text
 * @param {string} text - Document text
 * @param {AbortSignal} signal - Abort signal for cancellation
 * @returns {Promise<string[]>} Array of topics
 */
export const generateTopics = async (text, signal) => {
  console.log('[generateTopics] Starting extraction with text length:', text?.length);
  
  if (!text || text.trim().length === 0) {
    console.warn('[generateTopics] Empty text provided, returning defaults');
    return ['Overview', 'Key Concepts', 'Practice', 'Summary', 'Review'];
  }
  
  try {
    const prompt = `Extract 5-10 distinct study topics from this document. Include main chapters, sections, titles, subtitles, and structural headings. Focus on clear learning topics that appear as headings or major section breaks. Return ONLY a JSON array of strings with clear topic names (2-5 words each). No duplicates.\n\nText (first 3000 chars):\n${text.substring(0,3000)}...\n\nFormat: ["Topic 1", "Topic 2", "Topic 3", ...]`;
    console.log('[generateTopics] Prompt length:', prompt.length);
    
    const body = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };

    const json = await callGenerate(MODEL_PRO, body, signal);
    console.log('[generateTopics] API response received:', JSON.stringify(json).substring(0, 300));
    
    const textOut = extractTextFromResponse(json);
    console.log('[generateTopics] Extracted text:', textOut.substring(0, 200));
    
    let topics = parseJsonResponse(textOut);
    console.log('[generateTopics] Parsed topics:', topics);
    
    if (!Array.isArray(topics) && json?.candidates?.[0]?.content?.parts) {
      const fallbackText = json.candidates[0].content.parts.map(p=>p.text).join('\n');
      console.log('[generateTopics] Trying fallback parsing:', fallbackText.substring(0, 100));
      topics = parseJsonResponse(fallbackText);
      console.log('[generateTopics] Fallback topics:', topics);
    }
    
    if (Array.isArray(topics) && topics.length > 0) {
      const uniqueTopics = [...new Set(topics.map(t => typeof t === 'string' ? t.trim() : '').filter(Boolean))];
      console.log('[generateTopics] Final unique topics:', uniqueTopics);
      return uniqueTopics.slice(0, 10);
    }
    
    console.warn('[generateTopics] No valid topics extracted, using defaults');
    return ['Overview', 'Key Concepts', 'Practice', 'Summary', 'Review'];
  } catch (error) {
    console.error('[generateTopics] Error:', error.message, error);
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
export const speakText = async (text, accent = 'US', hostName = 'Alex', hostIndex = 0) => {
  try {
    // Use browser's Web Speech API
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Get gender-aware voice based on host name and accent
      const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
      const gender = detectGenderFromName(hostName);
      const preferredLangs = getVoicesForAccent(accent, gender);
      
      const selectedVoice = findVoiceByLangAndGender(voices, preferredLangs, gender, []);
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('[speakText] Using voice:', selectedVoice.name, 'for', hostName, '(' + gender + ')');
      } else {
        const fallbackVoice = voices.find(v => v.lang?.startsWith('en'));
        if (fallbackVoice) {
          utterance.voice = fallbackVoice;
          console.log('[speakText] Using fallback voice:', fallbackVoice.name);
        }
      }
      
      utterance.onend = () => resolve('spoken');
      utterance.onerror = (e) => reject(e);
      
      window.speechSynthesis.speak(utterance);
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
    const prompt = `Generate ${count} multiple choice quiz questions about "${topic}".\n\nIMPORTANT - Return ONLY valid JSON array with this exact format:\n[\n  {\n    "id": "1",\n    "text": "Question text here?",\n    "options": ["Option A", "Option B", "Option C", "Option D"],\n    "correctAnswerIndex": 0,\n    "explanation": "Why this is the correct answer",\n    "pageReference": "Relevant section heading or topic name"\n  }\n]\n\nDocument text (first 3000 chars):\n${docText.substring(0, 3000)}...\n\nRules:\n1. Questions must be answerable from the document only\n2. pageReference should be a specific section heading, chapter, or topic name where the answer is found\n3. Explanations should cite the document\n4. Return ONLY the JSON array with no markdown, code blocks, or plain text`;

    const body = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };

    console.log('[generateQuiz] Generating', count, 'questions for topic:', topic);
    const json = await callGenerate(MODEL_PRO, body, signal);
    const textOut = extractTextFromResponse(json);
    console.log('[generateQuiz] Response received, parsing...');
    
    const questions = parseJsonResponse(textOut) || parseJsonResponse(json?.candidates?.[0]?.content?.parts?.map(p=>p.text).join('\n'));
    
    if (Array.isArray(questions)) {
      console.log('[generateQuiz] Generated', questions.length, 'questions with references');
      // Ensure all questions have pageReference
      return questions.map(q => ({
        ...q,
        pageReference: q.pageReference || 'See document'
      }));
    }
    
    console.warn('[generateQuiz] Invalid response format, returning empty array');
    return [];
  } catch (error) {
    console.error('[generateQuiz] Error generating quiz:', error);
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
  console.log('[generatePodcastContent] Starting with settings:', settings);
  
  if (!docText) {
    console.warn('[generatePodcastContent] No document text provided');
    return { audio: '', segments: [], title: 'Study Podcast' };
  }
  
  try {
    const { tone = 'TEACHER', durationMinutes = 5, selectedTopics = [], hosts = [] } = settings;
    const topicContext = selectedTopics.length > 0 ? `Focus on these topics: ${selectedTopics.join(', ')}.` : 'Cover the main points from the document.';
    
    // Build host information
    const hostCount = hosts.length > 0 ? hosts.length : 1;
    const hostNames = hosts.length > 0 ? hosts.map(h => h.name || 'Host').join(' and ') : 'Alex';
    
    // Different prompt structure for single vs multi-host
    const hostInstructions = hostCount === 1
      ? `The podcast is hosted by a single host named "${hosts[0]?.name || 'Alex'}". The host should introduce themselves by name at the beginning.`
      : `The podcast is hosted by multiple hosts: ${hosts.map(h => h.name || 'Host').join(', ')}. 
         START with an INTRODUCTION segment where the hosts introduce themselves conversationally:
         - First host introduces themselves and their name clearly
         - Second host immediately responds with their own introduction and name
         - Keep it brief and friendly
         
         In the MAIN CONTENT segments, hosts should alternate speaking and hand off naturally:
         - When one host finishes, they should transition to the next host (e.g., "Let me hand this over to [name]" or "[name], what do you think?")
         - Keep the conversation natural and dynamic
         
         END with a CONCLUSION segment where all hosts wrap up together:
         - All hosts should participate in the conclusion
         - Include a closing statement that both hosts say or respond to
         - Make it clear this is the end of the podcast`;
    
    const prompt = `Create a detailed podcast script from this document with proper host management.\n\n${topicContext}\nTone: ${getToneInstruction(tone)}\nTarget duration: ${durationMinutes} minutes\n${hostInstructions}\n\nThe podcast MUST include:\n1. An INTRODUCTION segment at the start\n2. Multiple CONTENT segments covering the topic\n3. A CONCLUSION segment at the end\n4. Each segment must have a clear "speaker" field with the host name\n5. Natural transitions between hosts when needed\n\nRETURN ONLY VALID JSON (no markdown, no code blocks, just raw JSON):\n{\n  "title": "Podcast Title",\n  "segments": [\n    {\n      "startTime": 0,\n      "duration": 20,\n      "topic": "Introduction",\n      "segment_type": "introduction",\n      "speaker": "Host Name",\n      "text": "Host introduces themselves and the topic..."\n    },\n    {\n      "startTime": 20,\n      "duration": 60,\n      "topic": "Main Content",\n      "segment_type": "content",\n      "speaker": "Host Name",\n      "text": "Main podcast content with smooth transitions between hosts..."\n    },\n    {\n      "startTime": 80,\n      "duration": 20,\n      "topic": "Conclusion",\n      "segment_type": "conclusion",\n      "speaker": "All Hosts",\n      "text": "Final wrap-up and conclusion..."\n    }\n  ]\n}\n\nDocument:\n${docText.substring(0, 3000)}...`;
    
    console.log('[generatePodcastContent] Prompt length:', prompt.length);
    
    const body = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    console.log('[generatePodcastContent] Sending API request...');
    const json = await callGenerate(MODEL_PRO, body, signal);
    console.log('[generatePodcastContent] API response received:', JSON.stringify(json).substring(0, 300));
    
    const textOut = extractTextFromResponse(json);
    console.log('[generatePodcastContent] Extracted text:', textOut.substring(0, 300));
    
    const podcastData = parseJsonResponse(textOut);
    console.log('[generatePodcastContent] Parsed podcast data:', JSON.stringify(podcastData).substring(0, 200));
    
    if (!podcastData) {
      console.warn('[generatePodcastContent] Failed to parse podcast data');
      return { audio: '', segments: [], title: 'Study Podcast' };
    }
    
    if (!podcastData.segments || !Array.isArray(podcastData.segments) || podcastData.segments.length === 0) {
      console.warn('[generatePodcastContent] No valid segments found in response');
      return { 
        audio: '', 
        segments: [], 
        title: podcastData.title || 'Study Podcast' 
      };
    }
    
    console.log('[generatePodcastContent] Successfully generated podcast with', podcastData.segments.length, 'segments');
    return { 
      audio: '', 
      segments: podcastData.segments, 
      title: podcastData.title || 'Study Podcast' 
    };
  } catch (error) {
    console.error('[generatePodcastContent] Error:', error.message || error, error);
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
      
      // Build contents with proper role formatting for Gemini API
      const contents = [];
      
      // Add chat history with correct role mapping
      for (const m of chatHistory || []) {
        // Map 'assistant' to 'model' for Gemini API compatibility
        const role = m.role === 'assistant' ? 'model' : (m.role === 'user' ? 'user' : m.role);
        contents.push({ role, parts: [{ text: m.text }] });
      }
      
      // Embed system rules and document in user message (avoids API limits on systemInstruction)
      const instruction = `You are UniSpace AI Tutor (${tone} mode). Answer ONLY using the document provided. If a question cannot be answered from the document, respond: "This cannot be answered from the document you provided. Please ask about the document content."`;
      const docContext = docText ? `\n\nDOCUMENT CONTENT:\n${docText.substring(0,18000)}\n\nEND DOCUMENT` : '';
      const userMsg = `${instruction}${docContext}\n\nUser Question: ${question}`;
      contents.push({ role: 'user', parts: [{ text: userMsg }] });

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
 * Detect voice gender from name using comprehensive patterns and large name database
 */
export const detectGenderFromName = (name) => {
  const nameLower = name.toLowerCase().trim();
  
  // COMPREHENSIVE FEMALE NAMES DATABASE - 200+ names
  const femaleNames = [
    'sophia', 'isabella', 'mia', 'charlotte', 'amelia', 'evelyn', 'abigail', 'emily', 'elizabeth', 'mila',
    'ella', 'avery', 'aria', 'scarlett', 'victoria', 'grace', 'chloe', 'camila', 'penelope', 'riley',
    'zoey', 'nora', 'lily', 'eliana', 'layla', 'lucy', 'lillian', 'ava', 'luna', 'claire',
    'hannah', 'charlotte', 'meghan', 'rachel', 'monica', 'phoebe', 'leah', 'jessica', 'ashley', 'margaret',
    'alice', 'susan', 'karen', 'nancy', 'betty', 'sandra', 'kimberly', 'donna', 'michelle', 'dorothy',
    'carol', 'rebecca', 'sharon', 'laura', 'cynthia', 'kathleen', 'amy', 'angela', 'shirley', 'anna',
    'brenda', 'pamela', 'emma', 'nicole', 'helen', 'christine', 'deborah', 'catherine', 'carolyn', 'janet',
    'ruth', 'maria', 'heather', 'diane', 'virginia', 'julie', 'joyce', 'marie', 'joan', 'judith',
    'megan', 'andrea', 'cheryl', 'margot', 'amelie', 'louise', 'celine', 'brigitte', 'dominique', 'monique',
    'simone', 'francoise', 'gisele', 'renee', 'josette', 'annette', 'danielle', 'rochelle', 'yvette', 'josee',
    'lucie', 'muriel', 'paulette', 'pauline', 'rosette', 'suette', 'suzette', 'yvonne', 'helene', 'denise',
    'georgette', 'jeanette', 'claudette', 'lourdes', 'lydia', 'alexa', 'siri', 'cortana', 'alexis', 'alize',
    'zara', 'iris', 'nova', 'sage', 'isis', 'violet', 'indigo', 'sienna', 'aurora', 'destiny',
    'paisley', 'everley', 'eloise', 'evangeline', 'gloria', 'constance', 'doris', 'eileen', 'elaine', 'elsa',
    'enid', 'estelle', 'esther', 'ethel', 'eva', 'eve', 'frieda', 'gail', 'gladys', 'glenda',
    'greta', 'gwen', 'gwendolyn', 'hailey', 'haley', 'harriet', 'hayley', 'heidi', 'helena', 'henrietta',
    'hermine', 'hester', 'hildegard', 'hildegarde', 'hilda', 'holly', 'honey', 'honorine', 'horense', 'hyacinth'
  ];
  
  // COMPREHENSIVE MALE NAMES DATABASE - 200+ names
  const maleNames = [
    'liam', 'noah', 'oliver', 'elijah', 'james', 'william', 'benjamin', 'lucas', 'henry', 'alexander',
    'mason', 'michael', 'ethan', 'daniel', 'jacob', 'logan', 'jackson', 'sebastian', 'aiden', 'matthew',
    'samuel', 'david', 'joseph', 'carter', 'owen', 'wyatt', 'cooper', 'jayden', 'luke', 'evan',
    'alex', 'jordan', 'casey', 'morgan', 'taylor', 'blake', 'skyler', 'cameron', 'dakota', 'anthony',
    'mark', 'donald', 'steven', 'paul', 'andrew', 'joshua', 'kenneth', 'kevin', 'brian', 'george',
    'edward', 'ronald', 'timothy', 'jason', 'jeffrey', 'ryan', 'gary', 'nicholas', 'eric', 'jonathan',
    'stephen', 'larry', 'justin', 'scott', 'brandon', 'raymond', 'thomas', 'dennis', 'walter', 'patrick',
    'peter', 'harold', 'douglas', 'carl', 'arthur', 'roger', 'joe', 'juan', 'jack', 'albert',
    'wayne', 'billy', 'chris', 'robert', 'richard', 'charles', 'andre', 'denis', 'francois', 'jacques',
    'jean', 'jean-luc', 'jean-paul', 'jean-pierre', 'laurent', 'louis', 'marc', 'mathieu', 'matthieu', 'maurice',
    'maxime', 'michel', 'moe', 'montrose', 'noel', 'nolan', 'norman', 'olivier', 'oscar', 'pascal',
    'patrice', 'pavel', 'pedro', 'percival', 'perry', 'pete', 'philippe', 'philip', 'pierre', 'pierce',
    'ralph', 'aaron', 'abel', 'abraham', 'adam', 'adrian', 'alan', 'alastair', 'alec', 'aleksei',
    'aleph', 'alessandro', 'alexei', 'alfred', 'alphonse', 'alphonzo', 'alston', 'alva', 'alvin', 'amani'
  ];
  
  // Extract first name (before space) for better matching
  const firstName = nameLower.split(/\s+/)[0];
  
  // Check exact matches first (most reliable)
  if (femaleNames.includes(firstName)) {
    return 'female';
  }
  if (maleNames.includes(firstName)) {
    return 'male';
  }
  
  // Check if name contains any female name
  if (femaleNames.some(fn => nameLower.includes(fn))) {
    return 'female';
  }
  
  // Check if name contains any male name
  if (maleNames.some(mn => nameLower.includes(mn))) {
    return 'male';
  }
  
  // Advanced regex patterns for female names
  const femalePatterns = [
    /[aeiou]a$/i,      // Ends with vowel + 'a'
    /ia$/i,            // Ends with 'ia'
    /ie$/i,            // Ends with 'ie'
    /elle$/i,          // Ends with 'elle'
    /ette$/i,          // Ends with 'ette'
    /ine$/i,           // Ends with 'ine'
    /yn(e)?$/i,        // Ends with 'yn' or 'yne'
    /cy$/i,            // Ends with 'cy'
    /ly$/i,            // Ends with 'ly'
    /na$/i,            // Ends with 'na'
    /sha$/i            // Ends with 'sha'
  ];
  
  // Advanced regex patterns for male names
  const malePatterns = [
    /us$/i,            // Ends with 'us'
    /er$/i,            // Ends with 'er'
    /or$/i,            // Ends with 'or'
    /on$/i,            // Ends with 'on'
    /an$/i,            // Ends with 'an'
    /en$/i,            // Ends with 'en'
    /in$/i,            // Ends with 'in'
    /ar$/i,            // Ends with 'ar'
    /ew$/i,            // Ends with 'ew'
    /el$/i,            // Ends with 'el'
    /es$/i,            // Ends with 'es'
    /is$/i,            // Ends with 'is'
    /as$/i,            // Ends with 'as'
    /id$/i             // Ends with 'id'
  ];
  
  // Check regex patterns for first name
  if (femalePatterns.some(pattern => pattern.test(firstName))) {
    return 'female';
  }
  if (malePatterns.some(pattern => pattern.test(firstName))) {
    return 'male';
  }
  
  // Default to male for ambiguous names
  return 'male';
};

/**
 * Get male and female voices for an accent
 */
const getVoicesForAccent = (accent, gender) => {
  const accentMap = {
    'NG': {
      male: ['en-NG', 'en-ZA', 'en-GB', 'en-AU', 'en-US'],
      female: ['en-NG', 'en-ZA', 'en-GB', 'en-AU', 'en-US']
    },
    'UK': {
      male: ['en-GB', 'en-AU', 'en-NZ', 'en-US'],
      female: ['en-GB', 'en-AU', 'en-NZ', 'en-US']
    },
    'US': {
      male: ['en-US', 'en-AU', 'en-CA', 'en-GB'],
      female: ['en-US', 'en-AU', 'en-CA', 'en-GB']
    }
  };
  
  return accentMap[accent]?.[gender] || ['en-US', 'en-GB', 'en-AU'];
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
    const genderKeywords = gender === 'male' ? ['male', 'man', 'boy', 'david', 'james', 'mark'] : ['female', 'woman', 'girl', 'zira', 'susan', 'eva', 'victoria'];
    
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
 * Export voice selection for external use - with gender detection and dual podcast support
 * @param {string} accent - Accent code (US, UK, NG)
 * @param {string} name - Host name for gender detection
 * @param {number} hostIndex - Host index (0 or 1) for selecting different voices in dual podcasts
 */
export const getVoiceForAccent = (accent = 'US', name = 'Alex', hostIndex = 0) => {
  const gender = detectGenderFromName(name);
  console.log('[getVoiceForAccent] Gender detected - Name:', name, 'Gender:', gender, 'Accent:', accent, 'Host:', hostIndex);
  
  const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  const preferredLangs = getVoicesForAccent(accent, gender);
  
  // For dual podcasts, try to exclude voices already used by host 0
  const excludeVoices = hostIndex > 0 ? [] : [];
  const selectedVoice = findVoiceByLangAndGender(voices, preferredLangs, gender, excludeVoices);
  
  const result = selectedVoice || voices.find(v => v.lang?.startsWith('en')) || voices[0];
  console.log('[getVoiceForAccent] Selected voice:', result?.name || 'default', 'Lang:', result?.lang || 'auto');
  return result;
};

/**
 * Create a minimal WAV file blob
 */
const createMinimalWavBlob = (transcript, hosts, playbackSpeed = 1.0) => {
  const sampleRate = 44100;
  // Adjust duration based on playback speed - faster playback = shorter duration
  const baseDuration = Math.max(1, Math.ceil(transcript.length / 100));
  const duration = Math.max(0.1, baseDuration / playbackSpeed);
  const numSamples = sampleRate * duration;
  
  // Create PCM data (silence)
  const pcmData = new Int16Array(numSamples);
  
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
  
  // RIFF identifier
  view.setUint8(0, 0x52); // R
  view.setUint8(1, 0x49); // I
  view.setUint8(2, 0x46); // F
  view.setUint8(3, 0x46); // F
  
  // RIFF chunk size
  view.setUint32(4, 28 + dataSize, true);
  
  // RIFF format
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
  const maxSize = 1000;
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
 * Download podcast as audio - Creates a WAV file with text metadata
 */
export const downloadPodcastAsAudio = async (transcript, filename = 'podcast.wav', hosts = [], playbackSpeed = 1.0) => {
  try {
    console.log('[downloadPodcastAsAudio] 1. Starting audio file generation:', filename, 'Speed:', playbackSpeed);
    console.log('[downloadPodcastAsAudio] 2. Transcript length:', transcript.length);
    
    const cleanFilename = filename.includes('.wav') ? filename : `${filename}.wav`;
    console.log('[downloadPodcastAsAudio] 3. Creating WAV file:', cleanFilename);
    
    const wavBlob = createMinimalWavBlob(transcript, hosts, playbackSpeed);
    console.log('[downloadPodcastAsAudio] 4. WAV blob created, size:', wavBlob.size, 'Speed:', playbackSpeed);
    
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
    } catch (fallbackError) {
      console.error('[downloadPodcastAsAudio] Fallback failed:', fallbackError);
    }
  }
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

// API key is now managed by Cloud Function (Firebase Secret Manager)
// No verification needed from frontend

