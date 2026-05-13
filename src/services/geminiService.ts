
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || (import.meta as any).env.VITE_GEMINI_API_KEY || "" });

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
      model: "gemini-3.1-flash-lite",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: `Analyze this image of a textile/apparel product and generate professional product details. 
            Categories MUST be one of: 'School Uniforms', 'College Wear', 'Corporate Wear', 'Sports Kits', 'Healthcare', 'Hospitality', 'Branding & Print'.
            Provide a competitive price suggestion in Kenyan Shillings (KSH).`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            subCategory: { type: Type.STRING },
            priceSuggestion: { type: Type.NUMBER },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["name", "description", "category", "priceSuggestion", "tags"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return {
      name: parsedData.name || "AI Generated Product",
      description: parsedData.description || "",
      category: parsedData.category || "School Uniforms",
      subCategory: parsedData.subCategory || "",
      priceSuggestion: parsedData.priceSuggestion || 0,
      tags: parsedData.tags || []
    };
  } catch (error) {
    console.error("Gemini AI generation error:", error);
    throw error;
  }
}

export async function generateDescriptionOnly(name: string, category: string, tags: string[]): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: `Create a professional, SEO-optimized marketing description for a product named "${name}" in the category "${category}". Tags: ${tags.join(', ')}. Keep it concise but persuasive.`,
    });
    
    return response.text || "Failed to generate description";
  } catch (error) {
    console.error("Gemini AI description generation error:", error);
    throw new Error("Failed to generate description with AI");
  }
}

export async function generateProductDataFromText(name: string, category: string): Promise<GeneratedProduct> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: `Generate product details for: ${name} (Category: ${category}). Provide description, subCategory, price suggestion in KSH, and relevant tags.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            subCategory: { type: Type.STRING },
            priceSuggestion: { type: Type.NUMBER },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["description", "priceSuggestion", "tags"],
        },
      },
    });
    
    const parsedData = JSON.parse(response.text || "{}");
    return {
      name,
      description: parsedData.description || "",
      category,
      subCategory: parsedData.subCategory || "",
      priceSuggestion: parsedData.priceSuggestion || 1200,
      tags: parsedData.tags || [category.toLowerCase()]
    };
  } catch (error) {
    return {
      name,
      description: `Premium ${category} solution: ${name}. Designed for durability and performance.`,
      category,
      subCategory: "",
      priceSuggestion: 1200,
      tags: [category.toLowerCase(), "custom", "premium"]
    };
  }
}

export interface BatchAnalysisResult {
  analyzedProducts: {
    originalName: string;
    suggestedName?: string;
    suggestedCategory: string;
    suggestedSubCategory?: string;
    suggestedTags?: string[];
    isIssueFound: boolean;
    issueDescription?: string;
  }[];
}

export async function analyzeBatch(products: any[]): Promise<BatchAnalysisResult> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: `Analyze these products for categorization consistency and name optimization: ${JSON.stringify(products.map(p => ({ n: p.name, c: p.category, sc: p.subCategory })))}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analyzedProducts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  originalName: { type: Type.STRING },
                  suggestedName: { type: Type.STRING },
                  suggestedCategory: { type: Type.STRING },
                  suggestedSubCategory: { type: Type.STRING },
                  suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  isIssueFound: { type: Type.BOOLEAN },
                  issueDescription: { type: Type.STRING }
                }
              }
            }
          }
        },
      },
    });
    
    return JSON.parse(response.text || '{"analyzedProducts": []}');
  } catch (error) {
    console.error("Gemini batch analysis error:", error);
    throw new Error("AI analysis service unavailable");
  }
}
