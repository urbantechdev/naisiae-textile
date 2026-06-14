export interface PriceSuggestion {
  suggestedPrice: number;
  marketRange: {
    min: number;
    max: number;
  };
  reasoning: string;
}

export async function suggestCompetitivePrice(productName: string, category: string): Promise<PriceSuggestion> {
  try {
    const response = await fetch('/api/ai/pricing-suggestion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productName, category }),
    });

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();
    return data as PriceSuggestion;
  } catch (error) {
    console.error("Pricing suggestion client call failed:", error);
    throw new Error("Could not fetch pricing suggestion from server. Please try again.");
  }
}
