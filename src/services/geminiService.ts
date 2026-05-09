import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface GeneratedProduct {
  name: string;
  description: string;
  category: string;
  subCategory: string;
  priceSuggestion: number;
  tags: string[];
}

export async function generateProductDetails(base64Image: string, mimeType: string): Promise<GeneratedProduct> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
            {
              text: `Analyze this image of a textile/apparel product and generate professional product details. 
              The response must be in JSON format matching the schema provided.
              Categories available: 'School Uniforms', 'College Wear', 'Corporate Wear', 'Sports Kits', 'Healthcare', 'Hospitality', 'Branding & Print'.
              Sub-categories for School Uniforms include: 'Sweater', 'Blazer', 'Shirt', 'Blouse', 'Trouser', 'Skirt', 'Shorts', 'Tie', 'Socks', 'Tracksuit', 'T-Shirt', 'P.E Kit', 'Lab Coat', 'Dust Coat'.
              Provide a competitive price suggestion in Kenyan Shillings (KSH).`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Professional product name" },
            description: { type: Type.STRING, description: "Detailed marketing description" },
            category: { type: Type.STRING, description: "Main category from the provided list" },
            subCategory: { type: Type.STRING, description: "Sub-category if applicable" },
            priceSuggestion: { type: Type.NUMBER, description: "Suggested price in KSH" },
            tags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Relevant keywords for search"
            },
          },
          required: ["name", "description", "category", "priceSuggestion", "tags"],
        },
      },
    });

    const result = JSON.parse(response.text);
    return result as GeneratedProduct;
  } catch (error) {
    console.error("Gemini AI generation error:", error);
    throw new Error("Failed to generate product details with AI");
  }
}
