
import { GoogleGenAI, Type } from "@google/genai";
import { Role } from "../types";

const getAI = () => {
  if (!process.env.API_KEY) return null;
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateMissions = async (players: { name: string, role: Role }[]): Promise<Record<string, string>> => {
  const ai = getAI();
  if (!ai) {
    console.warn("API_KEY not found, using fallback missions.");
    const fallbacks: Record<string, string> = {};
    players.forEach(p => {
      if (p.role === Role.IMPOSTOR) fallbacks[p.name] = "Infiltre-se e não seja pego.";
      else if (p.role === Role.DETECTIVE) fallbacks[p.name] = "Observe todos de perto.";
      else fallbacks[p.name] = "Complete suas tarefas silenciosamente.";
    });
    return fallbacks;
  }

  const prompt = `
    Gere uma "Missão de Dedução Social" secreta para cada jogador neste jogo.
    Jogadores: ${JSON.stringify(players)}
    
    Diretrizes:
    - IMPOSTOR: Missões devem envolver sabotagem sutil ou manipulação (ex: "Faça duas pessoas discutirem sobre a cor da sala").
    - DETETIVE: Missões devem ser investigativas (ex: "Descubra quem foi a última pessoa a comer").
    - INOCENTE: Missões devem ser mundanas, mas suspeitas se flagradas (ex: "Toque no encosto de três cadeiras diferentes sem dizer o porquê").
    
    Retorne um objeto JSON onde a chave é o nome do jogador e o valor é sua missão curta (máximo 12 palavras).
    A RESPOSTA DEVE SER EM PORTUGUÊS.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          additionalProperties: { type: Type.STRING }
        }
      }
    });

    return JSON.parse(response.text() || "{}");
  } catch (error) {
    console.error("Failed to generate missions:", error);
    const fallbacks: Record<string, string> = {};
    players.forEach(p => {
      if (p.role === Role.IMPOSTOR) fallbacks[p.name] = "Infiltre-se e não seja pego.";
      else if (p.role === Role.DETECTIVE) fallbacks[p.name] = "Observe todos de perto.";
      else fallbacks[p.name] = "Complete suas tarefas silenciosamente.";
    });
    return fallbacks;
  }
};

export const generateEmergencyMessage = async (): Promise<string> => {
  const ai = getAI();
  if (!ai) return "REUNIÃO DE EMERGÊNCIA! Todos para a sala principal!";

  const prompt = `Gere um anúncio tenso e misterioso para uma reunião de emergência em um jogo de detetive. Máximo 15 palavras. EM PORTUGUÊS.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });
    return response.text() || "REUNIÃO DE EMERGÊNCIA! Um corpo foi encontrado ou um traidor foi avistado!";
  } catch {
    return "REUNIÃO DE EMERGÊNCIA! Todos para a sala principal!";
  }
};
