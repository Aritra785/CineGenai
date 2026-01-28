
import { GoogleGenAI, Type } from "@google/genai";

export async function generateStoryline(
  storySummary: string,
  sceneCount: number,
  globalStyle: string
): Promise<string[]> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Break down the following story into exactly ${sceneCount} distinct, sequential visual scenes for a video storyboard.
  Story: ${storySummary}
  Global Style: ${globalStyle}
  
  Format the response as a JSON array of strings, where each string is a highly descriptive visual prompt for an image generator. 
  Each description should focus on characters, actions, and environment while maintaining consistency.
  Only return the JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text || "[]";
    const scenes = JSON.parse(text);
    return scenes.slice(0, sceneCount);
  } catch (error) {
    console.error("Storyline Generation Error:", error);
    throw error;
  }
}

export async function generateSceneImage(
  prompt: string, 
  globalStyle: string,
  aspectRatio: "16:9" | "9:16" = "16:9"
): Promise<string> {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing.");

  const ai = new GoogleGenAI({ apiKey });
  
  const finalPrompt = `Cinematic, ${globalStyle}. Visual description: ${prompt}. High quality, detailed, 8k, consistent aesthetic.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: finalPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio
        }
      }
    });

    if (!response.candidates?.[0]?.content?.parts) {
       throw new Error("No response generated.");
    }

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("Image part not found.");
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
}
