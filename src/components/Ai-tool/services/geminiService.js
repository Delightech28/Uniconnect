import { ResultMode } from "../types";

// Helper to prepare files for the backend
const fileToPart = (file) => {
  const base64Data = file.data.includes(",")
    ? file.data.split(",")[1]
    : file.data;
  return {
    inlineData: {
      data: base64Data,
      mimeType: file.type,
    },
  };
};

export async function* generateContentStream(text, question, mode, signal) {
  // Prepare the system instruction
  const systemInstruction = `CRITICAL ACADEMIC INSTRUCTIONS:
1. FULL DOCUMENT ANALYSIS: Comprehensively analyze all text, explanations, diagrams, drawings, formulas, equations, and calculations.
2. VISUAL DATA INTERPRETATION (DEEP ANALYSIS): If the document contains visuals (diagrams, charts, graphs, or drawings):
   - Infer and explain exactly what they represent in clear, technical language.
   - Provide a step-by-step explanation of how to interpret the visual data.
   - For mathematical or scientific charts, explain axes, units, symbols, and trends shown.
3. CALCULATIONS & FORMULAS: If calculations or formulas are present, explain:
   - What the calculation is intended to solve.
   - How it works (provide a step-by-step verbal walkthrough of the logic).
   - The physical or mathematical meaning of the final result.
4. BOLD FORMATTING RULES (STRICT ADHERENCE):
   - Bold all **Topic Headings** and **Section Titles**.
   - Bold **Key Terms**, **Important Phrases**, and **Critical Insights**.
   - DEFINITION FORMAT: Bold the term BEFORE a colon (:) or semicolon (;). DO NOT bold the explanation that follows.
     Example: "**Newton's First Law**: An object at rest stays at rest..."
5. CLARITY & EMPHASIS: Use bold only for clarity. Highlight assumptions and conclusions. NO italics or decorative styling.
6. STRUCTURE: Use hierarchical numbering (1.0, 1.1). Write in full, flowing academic paragraphs. Complete sentences line-by-line. Let text wrap naturally unless starting a new sub-topic.
7. NO ASTERISKS: Do not use asterisks (*) for lists. Use numbers (1., 2.). Only use double asterisks (**) for the required bolding.`;

  try {
    const FUNCTION_URL =
      "https://us-central1-unispacee-cee.cloudfunctions.net/streamGeminiWithText";

    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, question, systemInstruction }),
      signal,
    });

    if (!response.ok) {
      const errorDetail = await response.text();
      throw new Error(`Server Error: ${response.status} - ${errorDetail}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error("Response body is null");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunkText = decoder.decode(value, { stream: true });
      if (chunkText) {
        yield chunkText;
      }
    }
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("Stream aborted by user");
      return;
    }
    console.error("Cloud Function Error:", error);
    throw new Error(error.message || "Failed to generate content.");
  }
}

export const logUnidocRequest = async (db, data) => {
  try {
    await db.collection("unidocRequests").add({
      ...data,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to log request:", error);
  }
};
