import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from './ui/Card';
import { TnmClassifier } from './TnmClassifier';
import { Patient, PerformanceStatus, TnmDetails, RcpDecision, PsychoSocialData, SYMPTOM_OPTIONS, SymptomKey } from '../types';
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

const initialPsychoSocialState: PsychoSocialData = {
    context: '',
    patientWishes: '',
    gpOpinion: '',
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
  psychoSocial: initialPsychoSocialState,
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

const ProgressBar = ({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) => {
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
                             <div className={`group flex w-full flex-col border-l-4 py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4 ${isCurrent ? 'border-blue-600' : isCompleted ? 'border-blue-600' : 'border-slate-200 hover:border-slate-300'}`}>
                                <span className={`text-sm font-medium transition-colors ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'}`}>{`Étape ${stepNumber}`}</span>
                                <span className="text-sm font-medium">{name}</span>
                            </div>
                        </li>
                    )
                })}
            </ol>
        </nav>
    );
};

const FormSection: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
    <Card title={title}>
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {children}
        </div>
    </Card>
);

const FormField: React.FC<{label: string, className?: string, children: React.ReactNode}> = ({label, className, children}) => (
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
        const new_state = JSON.parse(JSON.stringify(prev)); // Deep copy
        let current = new_state;
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        return new_state;
      });
    };
    
    const handleTnmChange = (newTnm: TnmDetails) => {
        setFormData(prev => ({...prev, tnm: newTnm}));
    };

    const handleSymptomChange = (symptom: SymptomKey, checked: boolean) => {
      const currentSymptoms = formData.clinicalInfo.symptoms;
      const newSymptoms = checked
        ? [...currentSymptoms, symptom]
        : currentSymptoms.filter(s => s !== symptom);
      handleDataChange('clinicalInfo.symptoms', newSymptoms);
    };

    const nextStep = () => setStep(prev => Math.min(prev + 1, 5));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || user.role !== 'doctor') {
            alert("Seuls les médecins peuvent soumettre des dossiers.");
            return;
        }
        setIsSubmitting(true);

        const { firstName, lastName, ...restOfFormData } = formData;
        const patientData: Omit<Patient, 'id' | 'submittedById' | 'submittedByName' | 'rcpStatus' | 'viewedBy'> = {
            ...restOfFormData,
            name: `${firstName} ${lastName}`.trim(),
            rcpHistory: [] as RcpDecision[]
        };

        try {
            await supabaseService.addPatient(patientData, user.id);
            alert("Dossier patient soumis avec succès !");
            navigate('/patients');
        } catch (error) {
            console.error("Failed to submit patient:", error);
            alert("Erreur lors de la soumission du dossier. Veuillez vérifier la console et réessayer.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) {
        return <div>Chargement...</div>;
    }

    if (user.role !== 'doctor') {
        return (
            <Card title="Accès refusé">
                <p className="text-center text-slate-600">Seuls les profils "Médecin" sont autorisés à soumettre de nouveaux dossiers.</p>
                <div className="mt-6 text-center">
                    <button onClick={() => navigate('/dashboard')} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        Retour au tableau de bord
                    </button>
                </div>
            </Card>
        )
    }

    const renderStep = () => {
        switch (step) {
            case 1: return (
                <div className="space-y-6">
                    <FormSection title="Identification Patient">
                        <FormField label="Prénom" className="sm:col-span-3"><input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} /></FormField>
                        <FormField label="Nom" className="sm:col-span-3"><input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} /></FormField>
                        <FormField label="Date de naissance" className="sm:col-span-2"><input type="date" value={formData.dob} onChange={e => handleDataChange('dob', e.target.value)} /></FormField>
                        <FormField label="Genre" className="sm:col-span-2"><select value={formData.gender} onChange={e => handleDataChange('gender', e.target.value as 'Homme' | 'Femme' | 'Autre')}><option>Homme</option><option>Femme</option><option>Autre</option></select></FormField>
                        <FormField label="ID Hôpital" className="sm:col-span-2"><input type="text" value={formData.hospitalId} onChange={e => handleDataChange('hospitalId', e.target.value)} /></FormField>
                        <FormField label="N° Sécu Sociale" className="sm:col-span-3"><input type="text" value={formData.ssn} onChange={e => handleDataChange('ssn', e.target.value)} /></FormField>
                        <FormField label="Email" className="sm:col-span-3"><input type="email" value={formData.email} onChange={e => handleDataChange('email', e.target.value)} /></FormField>
                        <FormField label="Adresse" className="sm:col-span-6"><textarea rows={2} value={formData.address} onChange={e => handleDataChange('address', e.target.value)} /></FormField>
                    </FormSection>
                    <FormSection title="Coordonnées & Référents">
                        <FormField label="Personne de confiance" className="sm:col-span-3"><input type="text" value={formData.trustedPerson} onChange={e => handleDataChange('trustedPerson', e.target.value)} /></FormField>
                        <FormField label="Contact patient" className="sm:col-span-3"><input type="text" value={formData.contact} onChange={e => handleDataChange('contact', e.target.value)} /></FormField>
                        <FormField label="Nom du MT" className="sm:col-span-2"><input type="text" value={formData.gp.name} onChange={e => handleDataChange('gp.name', e.target.value)} /></FormField>
                        <FormField label="Contact MT" className="sm:col-span-2"><input type="text" value={formData.gp.contact} onChange={e => handleDataChange('gp.contact', e.target.value)} /></FormField>
                        <FormField label="RPPS MT" className="sm:col-span-2"><input type="text" value={formData.gp.rpps} onChange={e => handleDataChange('gp.rpps', e.target.value)} /></FormField>
                        <FormField label="Nom du Médecin Référent" className="sm:col-span-3"><input type="text" value={formData.referringDoctor.name} onChange={e => handleDataChange('referringDoctor.name', e.target.value)} /></FormField>
                        <FormField label="Spécialité du Référent" className="sm:col-span-3"><input type="text" value={formData.referringDoctor.specialty} onChange={e => handleDataChange('referringDoctor.specialty', e.target.value)} /></FormField>
                    </FormSection>
                </div>
            );
            case 2: return (
                 <div className="space-y-6">
                    <FormSection title="Anamnèse & Habitudes de vie">
                        <FormField label="Antécédents médicaux" className="sm:col-span-6"><textarea rows={3} value={formData.anamnesis.medicalHistory} onChange={e => handleDataChange('anamnesis.medicalHistory', e.target.value)} /></FormField>
                        <FormField label="Antécédents chirurgicaux" className="sm:col-span-3"><textarea rows={2} value={formData.anamnesis.surgicalHistory} onChange={e => handleDataChange('anamnesis.surgicalHistory', e.target.value)} /></FormField>
                        <FormField label="Antécédents oncologiques" className="sm:col-span-3"><textarea rows={2} value={formData.anamnesis.oncologicalHistory} onChange={e => handleDataChange('anamnesis.oncologicalHistory', e.target.value)} /></FormField>
                        <FormField label="Statut tabagique" className="sm:col-span-2"><select value={formData.lifeHabits.smokingStatus} onChange={e => handleDataChange('lifeHabits.smokingStatus', e.target.value)}><option>Non-fumeur</option><option>Ancien fumeur</option><option>Fumeur actuel</option></select></FormField>
                        <FormField label="Paquets-années" className="sm:col-span-2"><input type="number" value={formData.lifeHabits.smokingPacksPerYear} onChange={e => handleDataChange('lifeHabits.smokingPacksPerYear', parseFloat(e.target.value) || 0)} /></FormField>
                        <FormField label="Date d'arrêt (si ex-fumeur)" className="sm:col-span-2"><input type="date" value={formData.lifeHabits.smokingCessationDate} onChange={e => handleDataChange('lifeHabits.smokingCessationDate', e.target.value)} /></FormField>
                    </FormSection>
                     <FormSection title="Contexte Psycho-Social & Avis Médical">
                        <FormField label="Contexte psycho-social et familial" className="sm:col-span-6"><textarea rows={2} value={formData.psychoSocial.context} onChange={e => handleDataChange('psychoSocial.context', e.target.value)} placeholder="Situation familiale, professionnelle, environnement..."/></FormField>
                        <FormField label="Souhaits du patient" className="sm:col-span-3"><textarea rows={2} value={formData.psychoSocial.patientWishes} onChange={e => handleDataChange('psychoSocial.patientWishes', e.target.value)} placeholder="Volontés, craintes, objectifs..."/></FormField>
                        <FormField label="Avis du médecin traitant (si recueilli)" className="sm:col-span-3"><textarea rows={2} value={formData.psychoSocial.gpOpinion} onChange={e => handleDataChange('psychoSocial.gpOpinion', e.target.value)} placeholder="Résumé de l'échange avec le MT..." /></FormField>
                    </FormSection>
                    <FormSection title="Examen Clinique">
                        <FormField label="Poids (kg)" className="sm:col-span-2"><input type="number" value={formData.clinicalInfo.exam.weightKg} onChange={e => handleDataChange('clinicalInfo.exam.weightKg', parseFloat(e.target.value) || 0)} /></FormField>
                        <FormField label="Taille (cm)" className="sm:col-span-2"><input type="number" value={formData.clinicalInfo.exam.heightCm} onChange={e => handleDataChange('clinicalInfo.exam.heightCm', parseFloat(e.target.value) || 0)} /></FormField>
                        <FormField label="Performance Status" className="sm:col-span-2"><select value={formData.clinicalInfo.exam.performanceStatus} onChange={e => handleDataChange('clinicalInfo.exam.performanceStatus', e.target.value)}>{Object.values(PerformanceStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></FormField>
                        <FormField label="Symptômes" className="sm:col-span-6">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                          {Object.entries(SYMPTOM_OPTIONS).map(([key, label]) => (
                            <label key={key} className="flex items-center">
                              <input type="checkbox" checked={formData.clinicalInfo.symptoms.includes(key as SymptomKey)} onChange={e => handleSymptomChange(key as SymptomKey, e.target.checked)} className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"/>
                              <span className="ml-2 text-sm text-slate-600">{label}</span>
                            </label>
                          ))}
                          </div>
                        </FormField>
                        <FormField label="Détails des symptômes & examen physique" className="sm:col-span-6"><textarea rows={3} value={formData.clinicalInfo.exam.physicalExamDetails} onChange={e => handleDataChange('clinicalInfo.exam.physicalExamDetails', e.target.value)} /></FormField>
                    </FormSection>
                </div>
            );
            case 3: return (
                <div className="space-y-6">
                    <FormSection title="Imagerie (Comptes-rendus)">
                        <FormField label="Scanner Thoracique" className="sm:col-span-6"><textarea rows={3} value={formData.paraclinicalData.imaging.thoracicScanner} onChange={e => handleDataChange('paraclinicalData.imaging.thoracicScanner', e.target.value)} /></FormField>
                        <FormField label="TEP-TDM" className="sm:col-span-3"><textarea rows={2} value={formData.paraclinicalData.imaging.tepTdm} onChange={e => handleDataChange('paraclinicalData.imaging.tepTdm', e.target.value)} /></FormField>
                        <FormField label="IRM Cérébrale" className="sm:col-span-3"><textarea rows={2} value={formData.paraclinicalData.imaging.cerebralMri} onChange={e => handleDataChange('paraclinicalData.imaging.cerebralMri', e.target.value)} /></FormField>
                    </FormSection>
                    <FormSection title="Biologie & Explorations">
                        <FormField label="Biologie standard (synthèse)" className="sm:col-span-6"><textarea rows={2} value={formData.paraclinicalData.standardBiology} onChange={e => handleDataChange('paraclinicalData.standardBiology', e.target.value)} /></FormField>
                        <FormField label="Fonction respiratoire (EFR)" className="sm:col-span-3"><textarea rows={2} value={formData.paraclinicalData.functionalExplorations.efr} onChange={e => handleDataChange('paraclinicalData.functionalExplorations.efr', e.target.value)} /></FormField>
                        <FormField label="Fonction cardiaque" className="sm:col-span-3"><textarea rows={2} value={formData.paraclinicalData.functionalExplorations.cardiacEvaluation} onChange={e => handleDataChange('paraclinicalData.functionalExplorations.cardiacEvaluation', e.target.value)} /></FormField>
                    </FormSection>
                     <FormSection title="Évaluation Gériatrique (si pertinent)">
                        <FormField label="Dépistage Onco-Gériatrique" className="sm:col-span-6"><input type="text" value={formData.geriatricAssessment.oncoGeriatricScreening} onChange={e => handleDataChange('geriatricAssessment.oncoGeriatricScreening', e.target.value)} placeholder="Ex: G8 pathologique (score de 12)" /></FormField>
                        <FormField label="Évaluation Cognitive" className="sm:col-span-3"><textarea rows={2} value={formData.geriatricAssessment.cognitiveAssessment} onChange={e => handleDataChange('geriatricAssessment.cognitiveAssessment', e.target.value)} placeholder="Ex: MMSE à 28/30, test de l'horloge normal" /></FormField>
                        <FormField label="Statut d'autonomie" className="sm:col-span-3"><textarea rows={2} value={formData.geriatricAssessment.autonomyStatus} onChange={e => handleDataChange('geriatricAssessment.autonomyStatus', e.target.value)} placeholder="Ex: ADL 6/6, IADL 3/4 (difficulté transports)"/></FormField>
                    </FormSection>
                </div>
            );
            case 4: return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <FormSection title="Anatomopathologie">
                           <FormField label="Site de biopsie" className="sm:col-span-3"><input type="text" value={formData.pathologyData.biopsySite} onChange={e => handleDataChange('pathologyData.biopsySite', e.target.value)} /></FormField>
                           <FormField label="Méthode de prélèvement" className="sm:col-span-3"><input type="text" value={formData.pathologyData.biopsyMethod} onChange={e => handleDataChange('pathologyData.biopsyMethod', e.target.value)} /></FormField>
                           <FormField label="Type histologique" className="sm:col-span-4"><input type="text" value={formData.pathologyData.histologicalType} onChange={e => handleDataChange('pathologyData.histologicalType', e.target.value)} /></FormField>
                           <FormField label="Grade" className="sm:col-span-2"><input type="text" value={formData.pathologyData.grading} onChange={e => handleDataChange('pathologyData.grading', e.target.value)} /></FormField>
                           <FormField label="Immunohistochimie" className="sm:col-span-6"><textarea rows={2} value={formData.pathologyData.immunohistochemistry} onChange={e => handleDataChange('pathologyData.immunohistochemistry', e.target.value)} /></FormField>
                        </FormSection>
                        <FormSection title="Biologie Moléculaire">
                            <FormField label="PD-L1 (%)" className="sm:col-span-2"><input type="text" value={formData.pathologyData.molecularBiology.pdl1} onChange={e => handleDataChange('pathologyData.molecularBiology.pdl1', e.target.value)} /></FormField>
                            <FormField label="EGFR" className="sm:col-span-2"><input type="text" value={formData.pathologyData.molecularBiology.egfr} onChange={e => handleDataChange('pathologyData.molecularBiology.egfr', e.target.value)} /></FormField>
                            <FormField label="ALK" className="sm:col-span-2"><input type="text" value={formData.pathologyData.molecularBiology.alk} onChange={e => handleDataChange('pathologyData.molecularBiology.alk', e.target.value)} /></FormField>
                            <FormField label="ROS1" className="sm:col-span-2"><input type="text" value={formData.pathologyData.molecularBiology.ros1} onChange={e => handleDataChange('pathologyData.molecularBiology.ros1', e.target.value)} /></FormField>
                            <FormField label="BRAF" className="sm:col-span-2"><input type="text" value={formData.pathologyData.molecularBiology.braf} onChange={e => handleDataChange('pathologyData.molecularBiology.braf', e.target.value)} /></FormField>
                            <FormField label="KRAS" className="sm:col-span-2"><input type="text" value={formData.pathologyData.molecularBiology.kras} onChange={e => handleDataChange('pathologyData.molecularBiology.kras', e.target.value)} /></FormField>
                            <FormField label="RET" className="sm:col-span-2"><input type="text" value={formData.pathologyData.molecularBiology.ret} onChange={e => handleDataChange('pathologyData.molecularBiology.ret', e.target.value)} /></FormField>
                            <FormField label="MET" className="sm:col-span-2"><input type="text" value={formData.pathologyData.molecularBiology.met} onChange={e => handleDataChange('pathologyData.molecularBiology.met', e.target.value)} /></FormField>
                            <FormField label="NTRK" className="sm:col-span-2"><input type="text" value={formData.pathologyData.molecularBiology.ntrk} onChange={e => handleDataChange('pathologyData.molecularBiology.ntrk', e.target.value)} /></FormField>
                            <FormField label="NRG1" className="sm:col-span-2"><input type="text" value={formData.pathologyData.molecularBiology.nrg1} onChange={e => handleDataChange('pathologyData.molecularBiology.nrg1', e.target.value)} /></FormField>
                            <FormField label="Autres" className="sm:col-span-4"><input type="text" value={formData.pathologyData.molecularBiology.other} onChange={e => handleDataChange('pathologyData.molecularBiology.other', e.target.value)} /></FormField>
                        </FormSection>
                    </div>
                    <div><TnmClassifier tnmDetails={formData.tnm} onTnmChange={handleTnmChange} /></div>
                </div>
            );
            case 5: return (
                <Card title="Étape 5: Révision et Soumission">
                    <div className="space-y-6">
                        <p className="text-sm text-slate-600">Veuillez vérifier toutes les informations avant de soumettre le dossier à la RCP.</p>
                        <div className="text-sm p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <p><b>Patient:</b> {formData.firstName} {formData.lastName}</p>
                            <p><b>Diagnostic:</b> {formData.pathologyData.histologicalType}</p>
                            <p><b>Stade Calculé:</b> {formData.tnm.stage} ({formData.tnm.t} {formData.tnm.n} {formData.tnm.m})</p>
                        </div>
                        <FormField label="Question posée à la RCP">
                            <textarea rows={4} value={formData.rcpQuestion} onChange={e => handleDataChange('rcpQuestion', e.target.value)} placeholder="Ex: Validation de la stratégie thérapeutique de 1ère ligne..."/>
                        </FormField>
                        <FormField label="Éléments manquants ou examens en attente">
                            <textarea rows={2} value={formData.missingInformation} onChange={e => handleDataChange('missingInformation', e.target.value)} placeholder="Ex: En attente des résultats de la scintigraphie osseuse."/>
                        </FormField>
                    </div>
                </Card>
            );
            default: return null;
        }
    };
    
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-800">Soumettre un Nouveau Dossier Patient</h1>
            <ProgressBar currentStep={step} totalSteps={5} />
            <form onSubmit={handleSubmit}>
                <div className="mt-8">
                    {renderStep()}
                </div>
                <div className="flex justify-between pt-6 border-t border-slate-200 mt-8">
                    <button type="button" onClick={prevStep} disabled={step === 1} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        Précédent
                    </button>
                    {step < 5 ? (
                        <button type="button" onClick={nextStep} className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            Suivant
                        </button>
                    ) : (
                        <button type="submit" disabled={isSubmitting} className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-slate-400">
                            {isSubmitting ? 'Soumission en cours...' : 'Soumettre le Dossier'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default AddPatient;