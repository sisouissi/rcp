import React, { useState } from 'react';
import { Patient, AiQueryType, AiSuggestion } from '../types';
import { getAiAssistantResponse } from '../services/geminiService';
import { Modal } from './ui/Modal';

const AiAssistantIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="-ml-1 mr-2 h-5 w-5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="M5 3v4"></path><path d="M19 17v4"></path><path d="M3 5h4"></path><path d="M17 19h4"></path></svg>
);

const QueryButton: React.FC<{ onClick: () => void; text: string; description: string; disabled: boolean; }> = ({ onClick, text, description, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="text-left p-4 border border-slate-300 rounded-lg hover:bg-slate-100 hover:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full"
    >
        <p className="font-semibold text-blue-600">{text}</p>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
    </button>
);

const AiSuggestionDisplay: React.FC<{ suggestions: AiSuggestion[] }> = ({ suggestions }) => (
    <div className="space-y-4">
        {suggestions.map((s, i) => (
            <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <h4 className="font-semibold text-slate-800">{s.title}</h4>
                <p className="text-slate-700 mt-1">{s.recommendation}</p>
                <p className="text-sm text-slate-500 mt-2">
                    <span className="font-medium">Justification:</span> {s.justification}
                </p>
                {s.nccnReference && s.nccnReference !== "N/A" && (
                     <p className="text-xs text-slate-400 mt-2">Référence NCCN: {s.nccnReference}</p>
                )}
            </div>
        ))}
    </div>
);

interface AiAssistantProps {
  patient: Patient;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ patient }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [query, setQuery] = useState<AiQueryType | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [suggestions, setSuggestions] = useState<AiSuggestion[]>([]);
    
    const handleQuery = async (queryType: AiQueryType) => {
        setQuery(queryType);
        setIsLoading(true);
        setError('');
        setSuggestions([]);
        try {
            const result = await getAiAssistantResponse(patient, queryType);
            setSuggestions(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const openModal = () => {
        setIsModalOpen(true);
        setQuery(null);
        setSuggestions([]);
        setError('');
    };

    return (
        <>
            <button
                onClick={openModal}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500"
            >
                <AiAssistantIcon />
                Ask AI
            </button>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Assistant IA - NCCN Guidelines">
                <div className="space-y-4">
                    {!query ? (
                        <div className="grid grid-cols-1 gap-4">
                            <QueryButton onClick={() => handleQuery('proposePlan')} text="Proposer une conduite à tenir" description="Suggère une stratégie thérapeutique basée sur les données actuelles." disabled={isLoading} />
                            <QueryButton onClick={() => handleQuery('suggestExam')} text="Suggérer des examens" description="Propose des bilans complémentaires pertinents." disabled={isLoading} />
                            <QueryButton onClick={() => handleQuery('missingData')} text="Identifier les données manquantes" description="Analyse le dossier à la recherche d'informations critiques manquantes." disabled={isLoading} />
                        </div>
                    ) : (
                        <div>
                            {isLoading && (
                                <div className="flex items-center justify-center py-10">
                                    <svg className="animate-spin h-8 w-8 text-violet-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <p className="ml-4 text-slate-600">Analyse en cours...</p>
                                </div>
                            )}
                            {error && <p className="text-red-600 bg-red-50 p-4 rounded-md">Erreur: {error}</p>}
                            {suggestions.length > 0 && <AiSuggestionDisplay suggestions={suggestions} />}
                             <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between">
                                <button type="button" onClick={() => {setQuery(null); setSuggestions([]);}} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
                                    Retour
                                </button>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700">
                                    Fermer
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default AiAssistant;
