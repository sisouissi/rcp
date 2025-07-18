import React, { useState } from 'react';
import { Modal } from './ui/Modal';

interface RcpDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (decision: RcpDecision) => void;
  patientName: string;
}

const initialDecisionState: Omit<RcpDecision, 'date'> = {
  decision: '',
  treatments: '',
  summary: '',
  pps: '',
  participants: '',
  evidenceCategory: '1',
};

const FormField: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
    <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        {children}
    </div>
);

const RcpDecisionModal: React.FC<RcpDecisionModalProps> = ({ isOpen, onClose, onSave, patientName }) => {
  const [decision, setDecision] = useState(initialDecisionState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof typeof decision, value: string) => {
    setDecision(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const fullDecision: RcpDecision = {
      ...decision,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    };
    onSave(fullDecision);
    setIsSubmitting(false);
    setDecision(initialDecisionState); // Reset form
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Nouvelle Décision RCP pour ${patientName}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormField label="Participants à la RCP">
          <input
            type="text"
            value={decision.participants}
            onChange={(e) => handleChange('participants', e.target.value)}
            placeholder="Ex: Dr. Moreau, Dr. Martin (séparés par des virgules)"
            required
          />
        </FormField>
        <FormField label="Proposition Thérapeutique">
          <textarea
            rows={2}
            value={decision.decision}
            onChange={(e) => handleChange('decision', e.target.value)}
            placeholder="Ex: Chimiothérapie néo-adjuvante suivie d'une chirurgie"
            required
          />
        </FormField>
         <FormField label="Argumentaire de la décision">
          <textarea
            rows={3}
            value={decision.summary}
            onChange={(e) => handleChange('summary', e.target.value)}
            placeholder="Ex: Patient jeune, OMS 0, maladie localisée mais volumineuse justifiant une approche néo-adjuvante..."
            required
          />
        </FormField>
         <FormField label="Programme Personnalisé de Soins (PPS) et suivi">
          <textarea
            rows={3}
            value={decision.pps}
            onChange={(e) => handleChange('pps', e.target.value)}
            placeholder="Ex: 4 cycles de Cisplatine-Pemetrexed, puis réévaluation par scanner. Consultation d'annonce infirmière à prévoir."
            required
          />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
            <FormField label="Traitements / Modalités">
                <input
                    type="text"
                    value={decision.treatments}
                    onChange={(e) => handleChange('treatments', e.target.value)}
                    placeholder="Ex: Pembrolizumab, Lobectomie..."
                />
            </FormField>
            <FormField label="Catégorie de preuve (NCCN)">
                <select
                    value={decision.evidenceCategory}
                    onChange={(e) => handleChange('evidenceCategory', e.target.value)}
                    className="w-full"
                >
                    <option value="1">Catégorie 1</option>
                    <option value="2A">Catégorie 2A</option>
                    <option value="2B">Catégorie 2B</option>
                    <option value="3">Catégorie 3</option>
                </select>
            </FormField>
        </div>
        
        <div className="pt-5">
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400"
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer la Décision'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default RcpDecisionModal;
