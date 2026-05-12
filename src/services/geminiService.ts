
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
    const response = await fetch('/api/ai/generate-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Image, mimeType })
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "AI Generation failed");
    }
    return await response.json();
  } catch (error) {
    console.error("Gemini AI generation error:", error);
    throw error;
  }
}

export async function generateDescriptionOnly(name: string, category: string, tags: string[]): Promise<string> {
  try {
    const response = await fetch('/api/ai/generate-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, tags })
    });
    
    if (!response.ok) throw new Error("AI Description failed");
    const data = await response.json();
    return data.description.trim();
  } catch (error) {
    console.error("Gemini AI description generation error:", error);
    throw new Error("Failed to generate description with AI");
  }
}

export async function generateProductDataFromText(name: string, category: string): Promise<GeneratedProduct> {
  try {
    const response = await fetch('/api/ai/generate-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, isTextOnly: true })
    });
    
    if (!response.ok) throw new Error("AI Generation failed");
    return await response.json();
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
    const response = await fetch('/api/ai/analyze-batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products })
    });
    
    if (!response.ok) throw new Error("Batch analysis failed");
    return await response.json();
  } catch (error) {
    console.error("Gemini batch analysis error:", error);
    throw new Error("AI analysis service unavailable");
  }
}
