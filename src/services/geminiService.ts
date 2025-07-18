import { GoogleGenAI, Type } from "@google/genai";
import { Patient, RcpDecision, MdtSummary, AiSuggestion, AiQueryType } from "../types";

const API_KEY = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn(
    `
    *****************************************************************
    * WARNING: Gemini API Key is not configured.                    *
    * All AI-powered features will be disabled.                     *
    * Please configure the GEMINI_API_KEY environment variable.     *
    *****************************************************************
    `
  );
}

const checkAi = () => {
    if (!ai) {
        throw new Error("Fonctionnalité IA désactivée: La clé API Gemini n'est pas configurée.");
    }
    return ai;
}

export const generateCaseSummaryForMdt = async (patient: Patient): Promise<MdtSummary> => {
  const ai = checkAi();

  const prompt = `
    Basé sur le dossier complet du patient suivant, génère une synthèse concise pour une présentation en Réunion de Concertation Pluridisciplinaire (RCP) d'oncologie thoracique.

    **Dossier Patient:**
    - Nom: ${patient.name}
    - Âge: ${new Date().getFullYear() - new Date(patient.dob).getFullYear()} ans
    - Sexe: ${patient.gender}
    - Antécédents Clés: ${patient.anamnesis.medicalHistory}
    - Tabagisme: ${patient.lifeHabits.smokingStatus}
    - Performance Status: ${patient.clinicalInfo.exam.performanceStatus}
    - Circonstances de découverte: ${patient.clinicalInfo.discoveryCircumstances}
    - Symptômes: ${patient.clinicalInfo.symptomsDetails}
    - Imagerie principale (Scanner): ${patient.paraclinicalData.imaging.thoracicScanner}
    - Imagerie principale (TEP-TDM): ${patient.paraclinicalData.imaging.tepTdm}
    - Histologie: ${patient.pathologyData.histologicalType}, Grade ${patient.pathologyData.grading}
    - Biologie Moléculaire: PD-L1: ${patient.pathologyData.molecularBiology.pdl1}, EGFR: ${patient.pathologyData.molecularBiology.egfr}, ALK: ${patient.pathologyData.molecularBiology.alk}, KRAS: ${patient.pathologyData.molecularBiology.kras}
    - Stade TNM: ${patient.tnm.stage} (${patient.tnm.t} ${patient.tnm.n} ${patient.tnm.m})
    - Question initialement posée: ${patient.rcpQuestion || "Non spécifiée"}

    La sortie doit être un objet JSON. Ne renvoie rien d'autre que l'objet JSON.
  `;
  
  const mdtSummarySchema = {
    type: Type.OBJECT,
    properties: {
      presentation: {
        type: Type.STRING,
        description: "Synthèse de la présentation clinique du patient en 2-3 phrases."
      },
      keyFindings: {
        type: Type.ARRAY,
        description: "Liste de 3 à 5 points clés (résultats histologiques, moléculaires, radiologiques et stadification).",
        items: {
            type: Type.STRING
        }
      },
      proposedQuestion: {
        type: Type.STRING,
        description: "Reformulation ou suggestion d'une question claire et précise pour la RCP."
      }
    },
    required: ["presentation", "keyFindings", "proposedQuestion"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: mdtSummarySchema,
      },
    });

const jsonText = (response.text ?? '').trim();
return JSON.parse(jsonText) as MdtSummary;
  } catch (error) {
    console.error("Error generating MDT summary:", error);
    if (error instanceof Error && error.message.includes("API key not valid")) {
        throw new Error("La clé API Gemini est invalide. Veuillez vérifier sa configuration.");
    }
    throw new Error("Une erreur est survenue lors de la génération de la synthèse. Veuillez vérifier la console.");
  }
};


export const generateLetterToGP = async (patient: Patient, rcpDecision: RcpDecision): Promise<string> => {
  const ai = checkAi();

  const prompt = `
Vous êtes un oncologue thoracique expert. Votre tâche est de rédiger un courrier en **Markdown** pour un médecin traitant, synthétisant la décision d'une Réunion de Concertation Pluridisciplinaire (RCP).

Le ton doit être formel, clair et confraternel. La sortie doit être uniquement le texte de la lettre au format Markdown.

---

**Informations à utiliser :**

*   **Patient :** ${patient.name} (Né(e) le ${patient.dob})
*   **Médecin traitant :** Dr. ${patient.gp.name}
*   **Données cliniques clés :**
    *   **Diagnostic :** ${patient.pathologyData.histologicalType}, ${patient.pathologyData.grading}.
    *   **Stade :** ${patient.tnm.stage} (${patient.tnm.t} ${patient.tnm.n} ${patient.tnm.m}).
    *   **Performance Status :** ${patient.clinicalInfo.exam.performanceStatus}.
    *   **Antécédents notables :** ${patient.anamnesis.medicalHistory}.
    *   **Tabagisme :** ${patient.lifeHabits.smokingStatus}.
*   **Biologie Moléculaire :**
    *   PD-L1: ${patient.pathologyData.molecularBiology.pdl1}
    *   EGFR: ${patient.pathologyData.molecularBiology.egfr}
    *   ALK: ${patient.pathologyData.molecularBiology.alk}
*   **Décision de la RCP :**
    *   **Date :** ${rcpDecision.date}
    *   **Question posée :** ${patient.rcpQuestion || 'Non spécifiée'}
    *   **Décision :** ${rcpDecision.decision}
    *   **Argumentaire :** ${rcpDecision.summary}

---

**Structure et instructions de rédaction :**

Utilisez des titres de niveau 2 (commençant par '## ') pour les sections principales.

## Objet
Rédigez un objet clair, par exemple : "Concerne : RCP d'Oncologie Thoracique pour votre patient(e), ${patient.name}"

## (Formule d'appel)
Utilisez "Cher Confrère," ou "Chère Confrère,".

## Introduction
Mentionnez que le dossier du patient a été discuté en RCP.

## Synthèse du Dossier Clinique
Résumez les points cliniques clés listés ci-dessus en utilisant des listes à puces.

## Décision de la RCP du ${rcpDecision.date}
Présentez clairement la question, la décision prise et son rationnel. Utilisez des sous-titres de niveau 3 (###) et du texte en gras si nécessaire pour la clarté.

## Plan de Soins et Suivi
Détaillez les actions à venir (prochain rendez-vous, examens, etc.) et le suivi à long terme. Mentionnez que vous restez à sa disposition pour toute question.

## (Formule de politesse)
Terminez par une formule comme "Avec nos salutations confraternelles,".

## (Signature)
Signez en tant que "Le Comité RCP d'Oncologie Thoracique".

---
Générez uniquement la lettre en Markdown. Ne pas inclure les titres de section qui sont entre parenthèses dans la structure ci-dessus.
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
});
return response.text ?? '';
} catch (error) {
    console.error("Error generating letter:", error);
    if (error instanceof Error && error.message.includes("API key not valid")) {
        throw new Error("La clé API Gemini est invalide. Veuillez vérifier sa configuration.");
    }
    return "Une erreur est survenue lors de la génération du courrier. Veuillez vérifier la console pour plus de détails.";
  }
};


const formatPatientDataForPrompt = (patient: Patient): string => {
  return `
- **Identification:** ${patient.name}, ${new Date().getFullYear() - new Date(patient.dob).getFullYear()} ans, ${patient.gender}.
- **Performance Status:** ${patient.clinicalInfo.exam.performanceStatus}.
- **Antécédents Clés:** Médicaux: ${patient.anamnesis.medicalHistory || 'N/A'}. Oncologiques: ${patient.anamnesis.oncologicalHistory || 'N/A'}.
- **Tabagisme:** ${patient.lifeHabits.smokingStatus} (${patient.lifeHabits.smokingPacksPerYear} PA).
- **Clinique:** Découverte: ${patient.clinicalInfo.discoveryCircumstances}. Symptômes: ${patient.clinicalInfo.symptomsDetails}.
- **Imagerie Clé:** Scanner: ${patient.paraclinicalData.imaging.thoracicScanner}. TEP-TDM: ${patient.paraclinicalData.imaging.tepTdm}. IRM Cérébrale: ${patient.paraclinicalData.imaging.cerebralMri}.
- **Anapath:** Type: ${patient.pathologyData.histologicalType}. Grade: ${patient.pathologyData.grading}.
- **Biologie Moléculaire:** PD-L1: ${patient.pathologyData.molecularBiology.pdl1 || 'N/A'}, EGFR: ${patient.pathologyData.molecularBiology.egfr || 'N/A'}, ALK: ${patient.pathologyData.molecularBiology.alk || 'N/A'}, KRAS: ${patient.pathologyData.molecularBiology.kras || 'N/A'}.
- **Stade TNM:** ${patient.tnm.stage} (${patient.tnm.t} ${patient.tnm.n} ${patient.tnm.m}).
- **Informations Manquantes (déclarées):** ${patient.missingInformation || 'Aucune'}.
- **Question à la RCP (déclarée):** ${patient.rcpQuestion || 'Aucune'}.
  `;
};

export const getAiAssistantResponse = async (patient: Patient, queryType: AiQueryType): Promise<AiSuggestion[]> => {
  const ai = checkAi();

  const patientSummary = formatPatientDataForPrompt(patient);
  let userQuery = '';

  switch (queryType) {
    case 'missingData':
      userQuery = "En te basant sur le dossier du patient et les recommandations NCCN pour le bilan d'extension et le traitement, identifie les données cruciales qui semblent manquantes pour une prise de décision éclairée. Ignore les données déjà listées comme manquantes.";
      break;
    case 'suggestExam':
      userQuery = "En te basant sur le dossier du patient, son stade et les recommandations NCCN, suggère 1 ou 2 examens complémentaires les plus pertinents à réaliser pour affiner la stratégie thérapeutique. Justifie chaque suggestion.";
      break;
    case 'proposePlan':
      userQuery = "En te basant sur toutes les données disponibles dans le dossier du patient, propose une ou plusieurs options de conduite à tenir ou de stratégie thérapeutique, en attendant la décision finale de la RCP. Chaque proposition doit être justifiée par les données du patient et les recommandations NCCN.";
      break;
  }
  
  const prompt = `
    **Contexte Patient:**
    ${patientSummary}

    **Requête:**
    ${userQuery}
    
    Fournis une réponse structurée et concise.
  `;

  const suggestionSchema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Titre de la suggestion (ex: Examen manquant, Proposition de traitement).' },
      recommendation: { type: Type.STRING, description: 'La recommandation spécifique ou le point de donnée manquant.' },
      justification: { type: Type.STRING, description: 'La justification de la recommandation, expliquant son importance clinique.' },
      nccnReference: { type: Type.STRING, description: 'Une référence à la page des directives NCCN (ex: "NSCL-5", "NSCL-B 2 of 6") si applicable, sinon "N/A".' }
    },
    required: ["title", "recommendation", "justification"]
  };

  const responseSchema = {
    type: Type.ARRAY,
    items: suggestionSchema
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Tu es un assistant expert en oncologie thoracique. Tes réponses doivent être rigoureusement basées sur les directives NCCN pour le cancer du poumon non à petites cellules (Non-Small Cell Lung Cancer, version 7.2025). Sois concis et pertinent. La sortie doit être uniquement un objet JSON.",
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

const jsonText = (response.text ?? '').trim();
    return JSON.parse(jsonText) as AiSuggestion[];
  } catch (error) {
    console.error("Error with AI Assistant:", error);
    if (error instanceof Error && error.message.includes("API key not valid")) {
        throw new Error("La clé API Gemini est invalide. Veuillez vérifier sa configuration.");
    }
    throw new Error("Une erreur est survenue lors de l'interrogation de l'assistant IA. Veuillez vérifier la console.");
  }
};
