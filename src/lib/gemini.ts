import { GoogleGenAI } from "@google/genai";

/**
 * Creates a new GoogleGenAI instance with the API key from the environment.
 */
export const createAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not defined");
  }
  return new GoogleGenAI({ apiKey });
};
