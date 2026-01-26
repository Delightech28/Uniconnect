import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const getAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.REACT_APP_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }
  return new GoogleGenerativeAI({ apiKey });
};

const parseJsonResponse = (text) => {
  if (!text) throw new Error("Empty response from AI");
  
  let cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
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
    throw new Error("Invalid AI JSON format.");
  }
};

const getToneInstruction = (tone) => {
  switch (tone) {
    case 'FUNNY': return "Be highly entertaining and witty. Use educational jokes and keep the energy high.";
    case 'PROFESSIONAL': return "Be formal, objective, and precise. Use professional academic terminology.";
    case 'TEACHER': return "Be encouraging and pedagogical. Explain complex ideas with simple analogies.";
    case 'FRIEND': return "Be casual and supportive. Talk like a friendly study buddy.";
    default: return "Be encouraging and pedagogical. Explain complex ideas with simple analogies.";
  }
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
    const model = getAI().getGenerativeModel({ model: 'gemini-pro' });
    
    const response = await model.generateContent({
      contents: [{
        parts: [{
          text: `Extract 5-7 distinct, specific study topics from this document. Return ONLY a JSON array of strings with short topic names (2-4 words each).
          
          Text (first 2000 chars):
          ${text.substring(0, 2000)}...
          
          Format: ["Topic 1", "Topic 2", "Topic 3", ...]`
        }]
      }]
    });

    const responseText = response.response.text();
    const topics = parseJsonResponse(responseText);
    
    if (Array.isArray(topics)) {
      return topics.slice(0, 7);
    }
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
    const model = getAI().getGenerativeModel({
      model: 'gemini-pro',
      systemInstruction: `You are the UniConnect AI Study Tutor. You help students learn from their documents.
      
DOCUMENT CONTEXT: The student has provided a study document about: ${Array.isArray(topics) ? topics.join(', ') : topics}

BEHAVIOR RULES:
1. ONLY answer questions based on the provided document content
2. If something isn't in the document, say "I don't have information about that in your document"
3. Be ${getToneInstruction(tone).toLowerCase()}
4. Explain complex concepts with examples from the document
5. Ask follow-up questions to deepen understanding
6. End responses by asking if they need clarification

FORMATTING:
- Use clear, readable text
- Use bullet points (-) for lists
- Use bold for emphasis
- Keep responses concise but thorough`
    });

    // Start chat with context
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: `Please help me study this document about: ${Array.isArray(topics) ? topics.join(', ') : topics}. Here's the content:\n\n${docText.substring(0, 3000)}...` }]
        },
        {
          role: 'model',
          parts: [{ text: `Hello! I've reviewed your study material on ${Array.isArray(topics) ? topics.join(', ') : topics}. I'm ready to help you learn! What would you like to explore first?` }]
        }
      ]
    });

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
    const model = getAI().getGenerativeModel({ model: 'gemini-pro' });
    
    const response = await model.generateContent({
      contents: [{
        parts: [{
          text: `Generate ${count} multiple choice quiz questions about "${topic}".

IMPORTANT - Return ONLY valid JSON array with this exact format:
[
  {
    "id": "1",
    "text": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0,
    "explanation": "Why option A is correct based on the document"
  }
]

Document text to base questions on:
${docText.substring(0, 3000)}...

RULES:
- Questions must be answerable from the document
- Options should be plausible distractors
- Include clear explanations
- Return ONLY the JSON array, no other text`
        }]
      }]
    });

    const responseText = response.response.text();
    const questions = parseJsonResponse(responseText);
    
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
      strengths: [],
      weaknesses: [],
      focusArea: 'Keep practicing',
      summary: 'Keep up the good work!'
    };
  }
  
  try {
    const model = getAI().getGenerativeModel({ model: 'gemini-pro' });
    
    const resultsData = results.map((r, idx) => ({
      question: questions[idx]?.text,
      correct: r.isCorrect
    }));

    const response = await model.generateContent({
      contents: [{
        parts: [{
          text: `Analyze these quiz results and provide constructive feedback.

Quiz Results:
${JSON.stringify(resultsData, null, 2)}

Return ONLY valid JSON in this format:
{
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "focusArea": "Main area to improve",
  "summary": "Overall feedback (2-3 sentences)"
}

Be encouraging and specific.`
        }]
      }]
    });

    const responseText = response.response.text();
    const feedback = parseJsonResponse(responseText);
    
    return feedback || {
      strengths: ['Engagement'],
      weaknesses: ['Review basics'],
      focusArea: 'Core concepts',
      summary: 'Great effort! Review the fundamentals.'
    };
  } catch (error) {
    console.error('Error getting feedback:', error);
    return {
      strengths: [],
      weaknesses: [],
      focusArea: 'Keep practicing',
      summary: 'Keep up the good work!'
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
    const model = getAI().getGenerativeModel({ model: 'gemini-pro' });
    const { tone = 'TEACHER', durationMinutes = 5, selectedTopics = [] } = settings;
    
    const topicContext = selectedTopics.length > 0 
      ? `Focus on these topics: ${selectedTopics.join(', ')}.`
      : 'Cover the main points from the document.';

    const response = await model.generateContent({
      contents: [{
        parts: [{
          text: `Create a podcast script from this document.

${topicContext}
Tone: ${getToneInstruction(tone)}
Target duration: ${durationMinutes} minutes (${durationMinutes * 150} words approximately)

Return ONLY valid JSON:
{
  "title": "Podcast Title",
  "segments": [
    {
      "startTime": 0,
      "duration": 30,
      "topic": "Topic name",
      "speaker": "Narrator",
      "text": "Segment text..."
    }
  ]
}

Document:
${docText.substring(0, 3000)}...`
        }]
      }]
    });

    const responseText = response.response.text();
    const podcastData = parseJsonResponse(responseText);
    
    return {
      audio: '',
      segments: podcastData.segments || [],
      title: podcastData.title || 'Study Podcast'
    };
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
    const model = getAI().getGenerativeModel({ model: 'gemini-pro' });
    
    const response = await model.generateContent({
      contents: [{
        parts: [{
          text: `Analyze this document and provide:
1. A concise 2-3 sentence summary
2. 5 key points
3. 5-7 study topics

Return ONLY valid JSON:
{
  "summary": "...",
  "keyPoints": ["point1", "point2", ...],
  "topics": ["topic1", "topic2", ...]
}

Document (first 3000 characters):
${docText.substring(0, 3000)}...`
        }]
      }]
    });

    const responseText = response.response.text();
    const analysis = parseJsonResponse(responseText);
    
    return analysis || {
      summary: 'Document analysis in progress...',
      keyPoints: [],
      topics: []
    };
  } catch (error) {
    console.error('Error analyzing document:', error);
    return {
      summary: 'Document loaded successfully. Ask questions to learn more.',
      keyPoints: [],
      topics: []
    };
  }
};
