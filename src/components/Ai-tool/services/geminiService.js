import { GoogleGenAI } from "@google/genai";
import { ResultMode } from "../types";

const fileToPart = (file) => {
  return {
    inlineData: {
      data: file.data.split(',')[1],
      mimeType: file.type
    }
  };
};

export async function* generateContentStream(filesA, filesB, mode, signal) {
  
  if (!import.meta.env.VITE_UNIDOC_API_KEY && !import.meta.env.VITE_GEMINI_API_KEY) {
    throw new Error("API Key not detected. Ensure 'VITE_UNIDOC_API_KEY' or 'VITE_GEMINI_API_KEY' is configured in your .env file.");
  }

  const apiKey = import.meta.env.VITE_UNIDOC_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey });
  const model = 'gemini-pro';

  const partsA = filesA.map(fileToPart);
  const partsB = filesB.map(fileToPart);

  let systemInstruction = `CRITICAL FORMATTING RULES:
1. NEVER use hashtags (#).
2. Use hierarchical numbering for subheadings (1.0, 1.1, 2.0).
3. Start major sections with 'TOPIC: [Name]'.
4. BOLDing: Use double asterisks (**text**) for important terms, names, and dates.
5. HIGHLIGHTING: Use double equals (==text==) for CRITICAL INFORMATION that requires immediate user attention.
6. DETAIL LEVEL: Provide EXHAUSTIVE, high-density content. Avoid brevity. If summarizing, provide deep definitions, background context, and detailed examples for every point.`;

  if (mode === ResultMode.SOLVE) {
    systemInstruction += `\nROLE: Expert Academic Solver. Provide deep reasoning and step-by-step logic. HIGHLIGHT (==text==) the definitive final answer for every question.`;
  } else if (mode === ResultMode.REVIEW) {
    systemInstruction += `\nROLE: Comprehensive Study Pack Creator. BOLD terms and HIGHLIGHT crucial formulas or key recall points.`;
  } else if (mode === ResultMode.SUMMARY) {
    systemInstruction += `\nROLE: High-Detail Academic Simplifier. Expand significantly on every concept found. Use HIGHLIGHTS for the most essential 'must-know' takeaways.`;
  }

  let contentsParts = [];
  if (mode === ResultMode.SUMMARY || mode === ResultMode.REVIEW) {
    contentsParts = [
      { text: `--- SOURCE MATERIAL ---` },
      ...partsA,
      { text: `Perform a deep ${mode} analysis with MAXIMUM detail. Ensure every key concept is explained thoroughly. Use ==highlights== for critical info.` }
    ];
  } else {
    contentsParts = [
      { text: "--- COURSE MATERIAL ---" },
      ...partsA,
      { text: "--- PAST QUESTIONS ---" },
      ...partsB,
      { text: "Solve with academic rigor. Ensure high-detail explanations. Use ==highlights== for final answers and **bold** for key names/dates." }
    ];
  }

  try {
    const responseStream = await ai.models.generateContentStream({
      model: model,
      contents: [{ role: 'user', parts: contentsParts }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1,
      }
    }, { signal });

    for await (const chunk of responseStream) {
      if (signal?.aborted) break;
      const text = chunk.text;
      if (text) yield text;
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate content.");
  }
}

/**
 * Log UniDoc request to Firebase for analytics
 * @param {Object} db - Firestore database instance
 * @param {Object} data - Request data to log
 * @returns {Promise<string>} Document ID
 */
export const logUnidocRequest = async (db, data) => {
  try {
    const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
    const docRef = await addDoc(collection(db, 'unidoc_requests'), {
      ...data,
      createdAt: serverTimestamp(),
      status: 'completed'
    });
    return docRef.id;
  } catch (error) {
    console.error('Firebase logging error:', error);
    // Non-fatal; just log to console
  }
};
