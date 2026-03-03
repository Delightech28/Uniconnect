import { UploadedFile, ResultMode } from "../types";

// Helper to prepare files for the backend
const fileToPart = (file: UploadedFile) => {
  // Ensure we handle potential base64 prefix
  const base64Data = file.data.includes(',') ? file.data.split(',')[1] : file.data;
  return {
    inlineData: {
      data: base64Data,
      mimeType: file.type
    }
  };
};

export async function* generateContentStream(
  filesA: UploadedFile[],
  filesB: UploadedFile[],
  mode: ResultMode,
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  

  const partsA = filesA.map(fileToPart);
  const partsB = filesB.map(fileToPart);


  let systemInstruction = "CRITICAL FORMATTING RULE: NEVER use hashtags (#). For headers, use hierarchical numbering (1.0, 1.1). Use double asterisks (e.g., **important text**) to BOLD key points, names, titles, years, specific events, and critical terms.";

  if (mode === ResultMode.SOLVE) {
    systemInstruction += ` You are an Intelligent Exam Solver. Solve questions based on the provided material with maximum detail and deep academic reasoning. BOLD all key terms, years, names, and specific answers.`;
  } else if (mode === ResultMode.REVIEW) {
    systemInstruction += ` You are a FlashCard Doc Generator (FlashDoc). Your goal is to provide EXHAUSTIVE coverage... Focus: Rapid recall. BOLD every key term.`;
  } else if (mode === ResultMode.SUMMARY) {
    systemInstruction += ` You are an Expert Academic Simplifier. Breakdown every topic in extreme detail... BOLD key concepts.`;
  }

  // Construct the prompt parts
  let contentsParts: any[] = [];
  if (mode === ResultMode.SUMMARY || mode === ResultMode.REVIEW) {
    const modePrompt = mode === ResultMode.SUMMARY 
      ? "Provide an extremely long and detailed summary." 
      : "Provide an EXHAUSTIVE FlashDoc: Generate hundreds of small Q&A pairs. BOLD all key info.";
    contentsParts = [
      { text: `--- SOURCE MATERIAL ---` },
      ...partsA,
      { text: `Analyze this material and generate a ${mode} mode response. ${modePrompt} NO hashtags. Use ** for bolding.` }
    ];
  } else {
    contentsParts = [
      { text: "--- COURSE MATERIAL ---" },
      ...partsA,
      { text: "--- PAST QUESTIONS ---" },
      ...partsB,
      { text: "Solve all questions in depth. BOLD key years, names, and concepts. NO hashtags." }
    ];
  }

  try {

    const STREAM_FUNCTION_URL = "https://us-central1-unispace-73480.cloudfunctions.net/streamGemini";

    const response = await fetch(STREAM_FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentsParts, systemInstruction }),
      signal 
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloud Function Error: ${errorText}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error("Failed to initialize stream reader.");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunkText = decoder.decode(value, { stream: true });
      if (chunkText) {
        yield chunkText;
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') return;
    console.error("Gemini Stream Error:", error);
    throw new Error(error.message || "Failed to generate content.");
  }
}