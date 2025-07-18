import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/Card';
import { TnmClassifier } from './TnmClassifier';
import { Patient, PerformanceStatus, TnmDetails, RcpDecision } from '../types';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';

const initialTnmState: TnmDetails = {
  size: 0,
  invasions: [],
  nodules: 'none',
  n_involvement: [],
  metaType: 'm0',
  t: 'TX',
  n: 'N0',
  m: 'M0',
  stage: 'Inconnu',
  tumorLocation: '',
  tumorDescription: '',
};

type PatientFormData = Omit<Patient, 'id' | 'rcpHistory' | 'name' | 'submittedById' | 'submittedByName' | 'rcpStatus' | 'viewedBy'> & {
  firstName: string;
  lastName: string;
};

const initialPatientState: PatientFormData = {
  firstName: '',
  lastName: '',
  gender: 'Homme',
  dob: '',
  hospitalId: '',
  ssn: '',
  address: '',
  email: '',
  contact: '',
  trustedPerson: '',
  gp: { name: '', contact: '', rpps: '' },
  referringDoctor: { name: '', specialty: 'Pneumologue' },
  socioProfessional: { profession: '', exposures: '' },
  anamnesis: { medicalHistory: '', surgicalHistory: '', oncologicalHistory: '', familyHistory: '' },
  psychoSocial: { context: '', patientWishes: '', gpOpinion: '' },
  lifeHabits: { smokingStatus: 'Non-fumeur', smokingPacksPerYear: 0, smokingCessationDate: '', alcohol: '', otherSubstances: '' },
  clinicalInfo: {
    discoveryCircumstances: '',
    symptoms: [],
    symptomsDetails: '',
    exam: {
      weightKg: 0,
      heightCm: 0,
      performanceStatus: PerformanceStatus.ECOG_0,
      physicalExamDetails: ''
    },
  },
  geriatricAssessment: { oncoGeriatricScreening: '', cognitiveAssessment: '', autonomyStatus: '' },
  paraclinicalData: {
    standardBiology: '',
    tumorMarkers: '',
    functionalExplorations: { efr: '', cardiacEvaluation: '' },
    imaging: { thoracicScanner: '', tepTdm: '', cerebralMri: '', otherImaging: '' },
  },
  pathologyData: {
    biopsySite: '',
    biopsyMethod: '',
    histologicalType: '',
    grading: '',
    immunohistochemistry: '',
    molecularBiology: { egfr: '', alk: '', ros1: '', braf: '', kras: '', pdl1: '', ret: '', met: '', ntrk: '', nrg1: '', other: '' },
  },
  tnm: initialTnmState,
  rcpQuestion: '',
  missingInformation: '',
};

const ProgressBar = ({ currentStep }: { currentStep: number }) => {
  const steps = ["Identification", "Anamnèse & Clinique", "Bilans", "Anapath & TNM", "Synthèse"];
  return (
    <nav aria-label="Progress">
      <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
        {steps.map((name, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isCurrent = currentStep === stepNumber;
          return (
            <li key={name} className="md:flex-1">
              <div
                className={`group flex w-full flex-col border-l-4 py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4 ${
                  isCurrent
                    ? 'border-blue-600'
                    : isCompleted
                    ? 'border-blue-600'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span
                  className={`text-sm font-medium transition-colors ${
                    isCurrent
                      ? 'text-blue-600'
                      : isCompleted
                      ? 'text-blue-600'
                      : 'text-slate-500 group-hover:text-slate-700'
                  }`}
                >
                  {`Étape ${stepNumber}`}
                </span>
                <span className="text-sm font-medium">{name}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Card title={title}>
    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">{children}</div>
  </Card>
);

const FormField: React.FC<{ label: string; className?: string; children: React.ReactNode }> = ({ label, className, children }) => (
  <div className={className}>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    {children}
  </div>
);

const AddPatient: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<PatientFormData>(initialPatientState);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDataChange = (path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.');
      const newState = JSON.parse(JSON.stringify(prev));
      let current = newState;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newState;
    });
  };

  const handleTnmChange = (newTnm: TnmDetails) => {
    setFormData(prev => ({ ...prev, tnm: newTnm }));
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'doctor') {
      alert('Seuls les médecins peuvent soumettre des dossiers.');
      return;
    }
    setIsSubmitting(true);

    const patientData: Omit<Patient, 'id' | 'submittedById' | 'submittedByName' | 'rcpStatus' | 'viewedBy'> = {
      ...formData,
      name: `${formData.firstName} ${formData.lastName}`.trim(),
      rcpHistory: [] as RcpDecision[]
    };

    try {
      await supabaseService.addPatient(patientData, user.id);
      alert('Dossier patient soumis avec succès !');
      navigate('/patients');
    } catch (error) {
      console.error('Failed to submit patient:', error);
      alert('Erreur lors de la soumission du dossier.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return <div>Chargement...</div>;
  if (user.role !== 'doctor') {
    return (
      <Card title="Accès refusé">
        <p className="text-center text-slate-600">
          Seuls les profils "Médecin" sont autorisés à soumettre de nouveaux dossiers.
        </p>
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Retour au tableau de bord
          </button>
        </div>
      </Card>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <FormSection title="Identification Patient">
              <FormField label="Prénom" className="sm:col-span-3">
                <input type="text" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
              </FormField>
              <FormField label="Nom" className="sm:col-span-3">
                <input type="text" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
              </FormField>
              <FormField label="Date de naissance" className="sm:col-span-2">
                <input type="date" value={formData.dob} onChange={e => handleDataChange('dob', e.target.value)} />
              </FormField>
              <FormField label="Genre" className="sm:col-span-2">
                <select value={formData.gender} onChange={e => handleDataChange('gender', e.target.value)}>
                  <option>Homme</option>
                  <option>Femme</option>
                  <option>Autre</option>
                </select>
              </FormField>
              <FormField label="ID Hôpital" className="sm:col-span-2">
                <input type="text" value={formData.hospitalId} onChange={e => handleDataChange('hospitalId', e.target.value)} />
              </FormField>
            </FormSection>
          </div>
        );
      case 2:
      case 3:
      case 4:
      case 5:
        return <div>{/* contenu des autres étapes ici */}</div>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">Soumettre un Nouveau Dossier Patient</h1>
      <ProgressBar currentStep={step} />
      <form onSubmit={handleSubmit}>
        <div className="mt-8">{renderStep()}</div>
        <div className="flex justify-between pt-6 border-t border-slate-200 mt-8">
          <button
            type="button"
            onClick={prevStep}
            disabled={step === 1}
            className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          {step < 5 ? (
            <button
              type="button"
              onClick={nextStep}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Suivant
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:bg-slate-400"
            >
              {isSubmitting ? 'Soumission en cours...' : 'Soumettre le Dossier'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddPatient;
