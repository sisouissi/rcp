import React, { useState, useEffect } from 'react';
import { TnmDetails, T_INVASION_OPTIONS, T_NODULES_OPTIONS, M_TYPE_OPTIONS, TInvasion, TNodules, MType, N_INVOLVEMENT_OPTIONS, NInvolvement } from '../types';
import { Card } from './ui/Card';

// --- Fonctions de calcul TNM (9ème édition) ---
const calculateT = (size: number, invasions: TInvasion[], nodules: TNodules): string => {
    const hasT4Invasion = invasions.some(i => ["diaphragm", "mediastinum", "heart_great_vessels", "trachea_carina", "recurrent_laryngeal_nerve", "esophagus_vertebral_body"].includes(i));
    if (size > 7 || nodules === 'different_ipsi_lobe' || hasT4Invasion) {
        return 'T4';
    }

    const hasT3Invasion = invasions.some(i => ["chest_wall", "phrenic_nerve", "parietal_pericardium"].includes(i));
    if ((size > 5 && size <= 7) || nodules === 'same_lobe' || hasT3Invasion) {
        return 'T3';
    }

    const hasT2Invasion = invasions.some(i => ["main_bronchus", "visceral_pleura", "atelectasis"].includes(i));
    if ((size > 3 && size <= 5) || hasT2Invasion) {
        if (size > 4 && size <= 5) return 'T2b';
        // A tumor >3cm but <=4cm is T2a.
        // A tumor <=3cm with T2 invasion is T2, and by convention falls into the lowest sub-category (T2a).
        return 'T2a';
    }
    
    if (size > 0 && size <= 3) {
        if (size > 2 && size <= 3) return 'T1c';
        if (size > 1 && size <= 2) return 'T1b';
        if (size <= 1) return 'T1a';
    }

    if (size === 0) return 'TX'; // Cannot be assessed without more info for T0/Tis
    
    return 'TX';
};


const calculateN = (involvement: NInvolvement[], isMultipleN2Stations?: boolean): string => {
  if (involvement.includes('n3')) return 'N3';
  if (involvement.includes('n2')) {
      return isMultipleN2Stations ? 'N2b' : 'N2a';
  }
  if (involvement.includes('n1')) return 'N1';
  return 'N0';
};

const calculateM = (metaType: MType): string => {
  switch (metaType) {
    case 'm0': return 'M0';
    case 'm1a': return 'M1a';
    case 'm1b': return 'M1b';
    case 'm1c1': return 'M1c1';
    case 'm1c2': return 'M1c2';
    default: return 'MX';
  }
};

const calculateStage = (t: string, n: string, m: string): string => {
    // Stage IV
    if (m === 'M1c1' || m === 'M1c2') return 'IVB';
    if (m === 'M1a' || m === 'M1b') return 'IVA';

    if (m === 'M0') {
        const tBase = t.substring(0, 2);

        switch (n) {
            case 'N0':
                if (t === 'T1a') return 'IA1';
                if (t === 'T1b') return 'IA2';
                if (t === 'T1c') return 'IA3';
                if (t === 'T2a') return 'IB';
                if (t === 'T2b') return 'IIA';
                if (tBase === 'T3') return 'IIB';
                if (tBase === 'T4') return 'IIIA';
                break;
            case 'N1':
                if (t.startsWith('T1') || t.startsWith('T2')) return 'IIB';
                if (tBase === 'T3' || tBase === 'T4') return 'IIIA';
                break;
            case 'N2a':
                return 'IIIA';
            case 'N2b':
                 if (t.startsWith('T1')) return 'IIIA';
                 if (t.startsWith('T2') || tBase === 'T3' || tBase === 'T4') return 'IIIB';
                 break;
            case 'N3':
                if (t.startsWith('T1') || t.startsWith('T2')) return 'IIIB';
                if (tBase === 'T3' || tBase === 'T4') return 'IIIC';
                break;
        }
    }
    return 'Inconnu';
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div className="border-b border-slate-200 last:border-b-0">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center py-4 text-left">
                <h4 className="text-md font-semibold text-slate-700">{title}</h4>
                <svg className={`w-5 h-5 text-slate-500 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isOpen && <div className="pb-4 space-y-4">{children}</div>}
        </div>
    );
};

interface TnmClassifierProps {
  tnmDetails: TnmDetails;
  onTnmChange: (newTnm: TnmDetails) => void;
}

export const TnmClassifier: React.FC<TnmClassifierProps> = ({ tnmDetails, onTnmChange }) => {
  
  useEffect(() => {
    const t = calculateT(tnmDetails.size, tnmDetails.invasions, tnmDetails.nodules);
    const n = calculateN(tnmDetails.n_involvement, tnmDetails.isMultipleN2Stations);
    const m = calculateM(tnmDetails.metaType);
    const stage = calculateStage(t, n, m);

    if (t !== tnmDetails.t || n !== tnmDetails.n || m !== tnmDetails.m || stage !== tnmDetails.stage) {
      onTnmChange({ ...tnmDetails, t, n, m, stage });
    }
  }, [tnmDetails, onTnmChange]);


  const handleFieldChange = <K extends keyof TnmDetails>(field: K, value: TnmDetails[K]) => {
    onTnmChange({ ...tnmDetails, [field]: value });
  };
  
  const handleArrayChange = (field: 'invasions' | 'n_involvement', value: string, checked: boolean) => {
    const currentValues = tnmDetails[field] as string[];
    const newValues = checked ? [...currentValues, value] : currentValues.filter(v => v !== value);
    onTnmChange({ ...tnmDetails, [field]: newValues });
  };

  return (
    <Card title="Classification TNM (AJCC 9e éd.)" className="h-full">
      <div className="space-y-1">
        <Section title="T (Tumeur)">
           <div className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700">Taille tumorale (cm)</label>
                  <input type="number" step="0.1" value={tnmDetails.size} onChange={e => handleFieldChange('size', parseFloat(e.target.value) || 0)} />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700">Critères d'invasion</label>
                  <div className="mt-2 space-y-2">
                     {Object.entries(T_INVASION_OPTIONS).map(([key, label]) => (
                        <label key={key} className="flex items-center">
                           <input type="checkbox" checked={tnmDetails.invasions.includes(key as TInvasion)} onChange={e => handleArrayChange('invasions', key, e.target.checked)} className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"/>
                           <span className="ml-3 text-sm text-slate-600">{label}</span>
                        </label>
                     ))}
                  </div>
               </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Nodules tumoraux</label>
                  <div className="mt-2 space-y-2">
                     {Object.entries(T_NODULES_OPTIONS).map(([key, label]) => (
                        <label key={key} className="flex items-center">
                           <input type="radio" name="nodules" checked={tnmDetails.nodules === key} onChange={() => handleFieldChange('nodules', key as TNodules)} className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"/>
                           <span className="ml-3 text-sm text-slate-600">{label}</span>
                        </label>
                     ))}
                  </div>
               </div>
            </div>
        </Section>
        
        <Section title="N (Ganglions)">
           <label className="block text-sm font-medium text-slate-700">Niveau d'atteinte ganglionnaire</label>
           <div className="mt-2 space-y-2">
              {Object.entries(N_INVOLVEMENT_OPTIONS).map(([key, label]) => (
                 <label key={key} className="flex items-center">
                    <input type="checkbox" checked={tnmDetails.n_involvement.includes(key as NInvolvement)} onChange={e => handleArrayChange('n_involvement', key, e.target.checked)} className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"/>
                    <span className="ml-3 text-sm text-slate-600">{label}</span>
                 </label>
              ))}
           </div>
           {tnmDetails.n_involvement.includes('n2') && (
            <div className="mt-4 pl-5 pt-3 border-t border-slate-200">
                <label className="flex items-center">
                    <input 
                        type="checkbox" 
                        checked={!!tnmDetails.isMultipleN2Stations} 
                        onChange={e => handleFieldChange('isMultipleN2Stations', e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-3 text-sm text-slate-600">Atteinte de plusieurs stations N2 (critère N2b)</span>
                </label>
            </div>
           )}
        </Section>
        
        <Section title="M (Métastases)">
           <label className="block text-sm font-medium text-slate-700">Métastases à distance</label>
           <div className="mt-2 space-y-2">
              {Object.entries(M_TYPE_OPTIONS).map(([key, label]) => (
                 <label key={key} className="flex items-center">
                    <input type="radio" name="metaType" checked={tnmDetails.metaType === key} onChange={() => handleFieldChange('metaType', key as MType)} className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"/>
                    <span className="ml-3 text-sm text-slate-600">{label}</span>
                 </label>
              ))}
           </div>
        </Section>

        <div className="pt-4">
          <h4 className="text-sm font-medium text-slate-500">Stade Calculé</h4>
          <p className="text-4xl font-bold text-blue-600 mt-1" aria-live="polite">
            {tnmDetails.stage}
          </p>
          <p className="text-sm text-slate-500" aria-live="polite">
            {tnmDetails.t} {tnmDetails.n} {tnmDetails.m}
          </p>
        </div>
      </div>
    </Card>
  );
};