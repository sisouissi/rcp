import React, { useState } from 'react';
import { Patient, MdtSummary } from '../types';
import { generateCaseSummaryForMdt } from '../services/geminiService';
import { Modal } from './ui/Modal';

interface CaseSummaryGeneratorProps {
  patient: Patient;
}

const SummaryDisplay: React.FC<{ summary: MdtSummary }> = ({ summary }) => (
    <div className="space-y-4 text-slate-700">
        <div>
            <h3 className="font-semibold text-slate-800">Présentation Clinique</h3>
            <p className="mt-1">{summary.presentation}</p>
        </div>
        <div>
            <h3 className="font-semibold text-slate-800">Éléments Clés</h3>
            <ul className="mt-1 list-disc list-inside space-y-1">
                {summary.keyFindings.map((finding, index) => <li key={index}>{finding}</li>)}
            </ul>
        </div>
        <div>
            <h3 className="font-semibold text-slate-800">Question Proposée pour la RCP</h3>
            <p className="mt-1 italic">"{summary.proposedQuestion}"</p>
        </div>
    </div>
);

const CaseSummaryGenerator: React.FC<CaseSummaryGeneratorProps> = ({ patient }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summary, setSummary] = useState<MdtSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    setIsModalOpen(true);
    setIsLoading(true);
    setError('');
    setSummary(null);

    try {
      const result = await generateCaseSummaryForMdt(patient);
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopyToClipboard = () => {
    if (!summary) return;
    const textToCopy = `
Synthèse pour la RCP du patient ${patient.name}:

Présentation Clinique:
${summary.presentation}

Éléments Clés:
${summary.keyFindings.map(f => `- ${f}`).join('\n')}

Question Proposée:
"${summary.proposedQuestion}"
    `;
    navigator.clipboard.writeText(textToCopy.trim());
    alert('Synthèse copiée dans le presse-papiers !');
  };

  return (
    <>
      <button
        onClick={handleGenerate}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="-ml-1 mr-2 h-5 w-5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>
        Synthétiser le cas pour la RCP
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Synthèse IA pour la RCP">
        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="ml-4 text-slate-600">Génération de la synthèse en cours...</p>
          </div>
        )}
        {error && <p className="text-red-600 bg-red-50 p-4 rounded-md">Erreur: {error}</p>}
        {summary && (
          <div>
            <SummaryDisplay summary={summary} />
            <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end space-x-3">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Fermer
                </button>
                <button type="button" onClick={handleCopyToClipboard} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    Copier la synthèse
                </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default CaseSummaryGenerator;
