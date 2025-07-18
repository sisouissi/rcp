import React, { useState } from 'react';
import { Patient, RcpDecision } from '../types';
import { generateLetterToGP } from '../services/geminiService';
import { Card } from './ui/Card';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


interface LetterGeneratorProps {
  patient: Patient;
}

const LetterGenerator: React.FC<LetterGeneratorProps> = ({ patient }) => {
  const [generatedLetter, setGeneratedLetter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDecision, setSelectedDecision] = useState<RcpDecision | null>(patient.rcpHistory[0] || null);

  const handleGenerateLetter = async () => {
    if (!selectedDecision) {
        setError('Veuillez sélectionner une décision RCP.');
        return;
    }
    setIsLoading(true);
    setError('');
    try {
      const letter = await generateLetterToGP(patient, selectedDecision);
      setGeneratedLetter(letter);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(`Erreur lors de la génération: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDecisionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const decisionDate = event.target.value;
    const decision = patient.rcpHistory.find(d => d.date === decisionDate) || null;
    setSelectedDecision(decision);
  };

  return (
    <Card title="Génération de Courrier pour le Médecin Traitant" className="mt-6">
      <div className="space-y-4">
        <div>
            <label htmlFor="rcp-decision" className="block text-sm font-medium text-gray-700">
                Sélectionner la décision RCP de référence
            </label>
            <select
                id="rcp-decision"
                name="rcp-decision"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                onChange={handleDecisionChange}
                value={selectedDecision?.date || ''}
            >
                {patient.rcpHistory.map((d: RcpDecision) => (
                    <option key={d.date} value={d.date}>RCP du {new Date(d.date).toLocaleDateString('fr-FR')} - {d.decision.substring(0, 50)}...</option>
                ))}
            </select>
        </div>
        <button
          onClick={handleGenerateLetter}
          disabled={isLoading || !selectedDecision}
          className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Génération en cours...
            </>
          ) : 'Générer le courrier'}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {generatedLetter && (
          <div className="mt-4">
            <h4 className="text-md font-semibold text-gray-800">Aperçu du Courrier :</h4>
            <div
              className="prose max-w-none mt-2 p-4 border border-slate-300 rounded-md bg-slate-50 h-96 overflow-y-auto"
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedLetter}</ReactMarkdown>
            </div>
             <button
                onClick={() => navigator.clipboard.writeText(generatedLetter)}
                className="mt-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                Copier le texte (Markdown)
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default LetterGenerator;