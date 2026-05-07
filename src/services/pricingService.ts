import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export interface PriceSuggestion {
  suggestedPrice: number;
  marketRange: {
    min: number;
    max: number;
  };
  reasoning: string;
}

export async function suggestCompetitivePrice(productName: string, category: string): Promise<PriceSuggestion> {
  const prompt = `Suggest a competitive market price for a product in Kenya (KES) with the following details:
Product Name: ${productName}
Category: ${category}

Research the typical market prices for this type of textile/apparel product in Kenya (Nairobi/Kiambu region).
Provide a suggested price that is slightly more competitive (slightly lower but still profitable) than established players like major uniform suppliers.

Return the response in JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedPrice: {
              type: Type.NUMBER,
              description: "The recommended selling price in KES.",
            },
            marketRange: {
              type: Type.OBJECT,
              properties: {
                min: { type: Type.NUMBER, description: "Lower bound of market price." },
                max: { type: Type.NUMBER, description: "Upper bound of market price." }
              },
              required: ["min", "max"]
            },
            reasoning: {
              type: Type.STRING,
              description: "Brief explanation of why this price is competitive.",
            },
          },
          required: ["suggestedPrice", "marketRange", "reasoning"],
        },
      },
    });

    return JSON.parse(response.text.trim()) as PriceSuggestion;
  } catch (error) {
    console.error("Pricing suggestion failed:", error);
    throw new Error("Could not fetch pricing suggestion. Please try again.");
  }
}
