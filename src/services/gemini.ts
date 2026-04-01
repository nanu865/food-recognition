import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface FoodAnalysis {
  name: string;
  confidence: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  healthScore: number; // 1-10
  description: string;
  ingredients: string[];
  funFact: string;
}

export async function analyzeFoodImage(base64Image: string): Promise<FoodAnalysis> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: "Analyze this food image. Identify the main food item and provide its nutritional breakdown. Be as accurate as possible based on visual cues. Return the data in the specified JSON format.",
          },
          {
            inlineData: {
              data: base64Image.split(",")[1] || base64Image,
              mimeType: "image/jpeg",
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Common name of the food" },
          confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1" },
          calories: { type: Type.NUMBER, description: "Estimated calories per serving" },
          protein: { type: Type.NUMBER, description: "Estimated protein in grams" },
          carbs: { type: Type.NUMBER, description: "Estimated carbs in grams" },
          fat: { type: Type.NUMBER, description: "Estimated fat in grams" },
          healthScore: { type: Type.NUMBER, description: "Healthiness score from 1 to 10" },
          description: { type: Type.STRING, description: "Brief description of the dish" },
          ingredients: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Visible or likely ingredients"
          },
          funFact: { type: Type.STRING, description: "An interesting fact about this food" },
        },
        required: ["name", "confidence", "calories", "protein", "carbs", "fat", "healthScore", "description", "ingredients", "funFact"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as FoodAnalysis;
}
