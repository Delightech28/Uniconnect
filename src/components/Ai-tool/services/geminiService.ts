import { UploadedFile, ResultMode } from "../types";

// NO TRAILING SPACES - Copy paste this exactly
const STREAM_FUNCTION_URL = "https://streamgemini-e37xi73mhq-uc.a.run.app";
const UNIDOC_API_URL = "https://unidocstandardapi-e37xi73mhq-uc.a.run.app";

// Validate URL has no spaces
if (STREAM_FUNCTION_URL.includes(" ")) {
  console.error("FATAL: URL contains spaces!", STREAM_FUNCTION_URL);
}
if (UNIDOC_API_URL.includes(" ")) {
  console.error("FATAL: URL contains spaces!", UNIDOC_API_URL);
}

const fileToPart = (file: UploadedFile) => {
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

  // Debug log
  console.log("Fetching from:", STREAM_FUNCTION_URL);
  console.log("Payload size:", JSON.stringify({ contentsParts, systemInstruction }).length);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const fetchSignal = signal || controller.signal;

    const response = await fetch(STREAM_FUNCTION_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "text/plain"
      },
      body: JSON.stringify({ contentsParts, systemInstruction }),
      signal: fetchSignal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("HTTP Error:", response.status, errorText);
      throw new Error(`Server error ${response.status}: ${errorText}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunkText = decoder.decode(value, { stream: true });
      if (chunkText) {
        yield chunkText;
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log("Request aborted");
      return;
    }
    console.error("Fetch Error:", error);
    
    // Provide specific error messages
    if (error.message.includes('Failed to fetch')) {
      throw new Error("Network error: Check CORS configuration and URL. Ensure no spaces in URL.");
    }
    throw error;
  }
}

// Non-streaming version with fallback
export const callUnidocAPI = async (prompt: string) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(UNIDOC_API_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ prompt }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error("Request timeout");
    }
    if (error.message.includes('Failed to fetch')) {
      throw new Error("Network error: Cannot connect to API. Check CORS and URL.");
    }
    throw error;
  }
};