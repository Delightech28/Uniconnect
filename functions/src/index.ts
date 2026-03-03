import { onRequest } from "firebase-functions/v2/https";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as logger from "firebase-functions/logger";

export const streamGemini = onRequest(
  {
    secrets: ["GEMINI_API_KEY"],
    cors: true,
  },
  async (req, res) => {
    try {
      const { contentsParts, systemInstruction } = req.body;

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        res.status(500).send("API Key missing in environment secrets.");
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction,
      });

      const result = await model.generateContentStream({
        contents: [{ role: "user", parts: contentsParts }],
      });

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Transfer-Encoding", "chunked");

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          res.write(chunkText);
        }
      }

      res.end();
    } catch (error: any) {
      logger.error("Gemini Stream Error:", error);
      res.status(500).send(error.message || "Internal Server Error");
    }
  },
);

export const unidocStandardAPI = onRequest(
  { secrets: ["GEMINI_API_KEY"], cors: true },
  async (req, res): Promise<void> => {
    try {
      const { prompt } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        res.status(500).send("Missing API Key");
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      res.json({
        candidates: [{ content: { parts: [{ text: responseText }] } }],
      });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  },
);
