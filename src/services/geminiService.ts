export interface GeneratedProduct {
  name: string;
  description: string;
  category: string;
  subCategory: string;
  priceSuggestion: number;
  tags: string[];
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

export async function generateProductDetails(base64Image: string, mimeType: string): Promise<GeneratedProduct> {
  try {
    const response = await fetch('/api/ai/generate-product-details', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Image, mimeType })
    });

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();
    return {
      name: data.name || "AI Generated Product",
      description: data.description || "",
      category: data.category || "School Uniforms",
      subCategory: data.subCategory || "",
      priceSuggestion: data.priceSuggestion || 0,
      tags: data.tags || []
    };
  } catch (error) {
    console.error("Gemini AI generation client call failed:", error);
    throw error;
  }
}

export async function generateDescriptionOnly(name: string, category: string, tags: string[]): Promise<string> {
  try {
    const response = await fetch('/api/ai/generate-description-only', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, tags })
    });

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();
    return data.text || "Failed to generate description";
  } catch (error) {
    console.error("Gemini AI description generation client call failed:", error);
    throw new Error("Failed to generate description with AI");
  }
}

export async function generateProductDataFromText(name: string, category: string): Promise<GeneratedProduct> {
  try {
    const response = await fetch('/api/ai/generate-product-data-from-text', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category })
    });

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();
    return {
      name,
      description: data.description || "",
      category,
      subCategory: data.subCategory || "",
      priceSuggestion: data.priceSuggestion || 1200,
      tags: data.tags || [category.toLowerCase()]
    };
  } catch (error) {
    console.error("Gemini AI product text generation client call failed:", error);
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

export async function analyzeBatch(products: any[]): Promise<BatchAnalysisResult> {
  try {
    const response = await fetch('/api/ai/analyze-batch', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products })
    });

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();
    return data as BatchAnalysisResult;
  } catch (error) {
    console.error("Gemini batch analysis client call failed:", error);
    throw new Error("AI analysis service unavailable");
  }
}
