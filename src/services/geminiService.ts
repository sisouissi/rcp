// src/services/geminiService.ts

import { GoogleGenAI } from '@google/genai';

// Définition des types pour les suggestions et les requêtes AI
import type { AiSuggestion, AiQueryType } from '../types';

// Récupération de la clé API depuis les variables d'environnement
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Création de l'instance de l'API ou définition null si la clé est manquante
let ai: GoogleGenAI | null;
if (GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
} else {
  console.warn(`
    *****************************************************************
    * WARNING: Gemini API Key is not configured.                    *
    * All AI-powered features will be disabled.                     *
    * Please configure the GEMINI_API_KEY environment variable.     *
    *****************************************************************
  `);
}

// Fonction pour générer du contenu
export async function generateContent(prompt: string): Promise<string> {
  if (!ai) {
    throw new Error('Gemini API is not configured.');
  }

  try {
    const response = await ai.generateContent({
     model: "gemini-2.5-flash",
     contents: prompt,
   });

    // Vérification si la réponse contient du texte
    if (response && response.text) {
      return response.text;
    } else {
      throw new Error('Unexpected response from the API.');
    }
  } catch (error) {
    console.error('Error generating content:', error);

    if (error instanceof Error && error.message.includes('API key not valid')) {
      throw new Error('La clé API Gemini est invalide. Veuillez vérifier sa configuration.');
    }

    return 'Une erreur est survenue lors de la génération du contenu.';
  }
}
