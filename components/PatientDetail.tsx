

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TnmClassifier } from './TnmClassifier';
import LetterGenerator from './LetterGenerator';
import { Card } from './ui/Card';
import { Patient, TnmDetails, SYMPTOM_OPTIONS, EvidenceCategory } from '../types';
import CaseSummaryGenerator from './CaseSummaryGenerator';
import AiAssistant from './AiAssistant';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';

const EvidenceBadge: React.FC<{ category?: EvidenceCategory }> = ({ category }) => {
    if (!category) return null;

    const categoryStyles: { [key in EvidenceCategory]: { bg: string; text: string; } } = {
        '1': { bg: 'bg-green-100', text: 'text-green-800' },
        '2A': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
        '2B': { bg: 'bg-orange-100', text: 'text-orange-800' },
        '3': { bg: 'bg-red-100', text: 'text-red-800' },
    };

    const style = categoryStyles[category] || { bg: 'bg-gray-100', text: 'text-gray-800' };

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
            NCCN Cat. {category}
        </span>
    );
};

const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const fetchPatient = async () => {
      if (!id) return;
      try {
        const data = await supabaseService.getPatient(id);
        setPatient(data);
      } catch (error) {
        console.error("Failed to fetch patient", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatient();
  }, [id]);

  const handleTnmChange = async (newTnm: TnmDetails) => {
    if (patient) {
        const updatedPatient = { ...patient, tnm: newTnm };
        setPatient(updatedPatient);
        await supabaseService.updatePatient(updatedPatient);
    }
  };
  
  const InfoField = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-slate-600">{label}</dt>
      <dd className="mt-1 text-sm text-slate-900 sm:mt-0 sm:col-span-2">{value || <span className="text-slate-400">Non renseigné</span>}</dd>
    </div>
  );

  const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <Card title={title} className={className}>
      <dl className="divide-y divide-slate-200">{children}</dl>
    </Card>
  );

  if (isLoading) {
    return <div>Chargement des détails du patient...</div>;
  }

  if (!patient || !user) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-bold text-slate-700">Patient non trouvé</h2>
        <p className="text-slate-500 mt-2">Le patient avec l'ID {id} n'a pas pu être trouvé ou vous n'avez pas les droits pour le voir.</p>
      </div>
    );
  }

  const getSmokingHistory = () => {
    const { smokingStatus, smokingPacksPerYear, smokingCessationDate } = patient.lifeHabits;
    if (smokingPacksPerYear === 0) return smokingStatus;

    let history = `${smokingStatus} (${smokingPacksPerYear} PA)`;
    if (smokingCessationDate) {
        history += `, sevré depuis ${new Date(smokingCessationDate).getFullYear()}`;
    }
    return history;
  }
  
  const getStatusBadge = (status: Patient['rcpStatus']) => {
      const styles = {
          pending: 'bg-yellow-100 text-yellow-800',
          selected: 'bg-blue-100 text-blue-800',
          discussed: 'bg-green-100 text-green-800',
      };
      const text = {
          pending: 'En attente de sélection',
          selected: 'Sélectionné pour RCP',
          discussed: 'Discuté en RCP',
      };
      return <span className={`px-4 py-2 text-sm font-semibold rounded-full ${styles[status]}`}>{text[status]}</span>;
  }

  const tabContent = {
    summary: (
      <div className="space-y-6">
        <Section title="Informations Générales">
             <InfoField label="Nom complet" value={patient.name} />
             <InfoField label="Date de naissance" value={patient.dob} />
             <InfoField label="Genre" value={patient.gender} />
             <InfoField label="ID Hôpital" value={patient.hospitalId} />
             {user.role === 'admin' && <InfoField label="Soumis par" value={patient.submittedByName} />}
             <InfoField label="Médecin traitant" value={`${patient.gp.name} (RPPS: ${patient.gp.rpps})`} />
             <InfoField label="Médecin référent" value={`${patient.referringDoctor.name} (${patient.referringDoctor.specialty})`} />
        </Section>
        <Section title="Synthèse Clinique Clé">
             <InfoField label="Performance Status" value={patient.clinicalInfo.exam.performanceStatus} />
             <InfoField label="Stade TNM" value={`${patient.tnm.stage} (${patient.tnm.t} ${patient.tnm.n} ${patient.tnm.m})`} />
             <InfoField label="Type Histologique" value={patient.pathologyData.histologicalType} />
             <InfoField label="Statut PD-L1" value={patient.pathologyData.molecularBiology.pdl1} />
             <InfoField label="Mutation EGFR" value={patient.pathologyData.molecularBiology.egfr} />
        </Section>
        <Section title="Question à la RCP & Suivi">
            <InfoField label="Question à la RCP" value={<p className="text-slate-800 italic">"{patient.rcpQuestion}"</p>} />
            <InfoField label="Éléments manquants" value={<p className="text-slate-800">{patient.missingInformation}</p>} />
        </Section>
      </div>
    ),
    clinicalAnamnesis: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
                <Section title="Anamnèse">
                    <InfoField label="Antécédents médicaux" value={<p className="whitespace-pre-wrap">{patient.anamnesis.medicalHistory}</p>} />
                    <InfoField label="Antécédents chirurgicaux" value={<p className="whitespace-pre-wrap">{patient.anamnesis.surgicalHistory}</p>} />
                    <InfoField label="Antécédents oncologiques" value={<p className="whitespace-pre-wrap">{patient.anamnesis.oncologicalHistory}</p>} />
                    <InfoField label="Antécédents familiaux" value={<p className="whitespace-pre-wrap">{patient.anamnesis.familyHistory}</p>} />
                </Section>
                 <Section title="Habitudes de vie & Expositions">
                    <InfoField label="Tabagisme" value={getSmokingHistory()} />
                    <InfoField label="Alcool" value={patient.lifeHabits.alcohol} />
                    <InfoField label="Profession & Expositions" value={patient.socioProfessional.profession + ' - ' + patient.socioProfessional.exposures} />
                </Section>
                 <Section title="Évaluation Gériatrique">
                    <InfoField label="Dépistage Onco-Gériatrique" value={patient.geriatricAssessment.oncoGeriatricScreening} />
                    <InfoField label="Évaluation Cognitive" value={<p className="whitespace-pre-wrap">{patient.geriatricAssessment.cognitiveAssessment}</p>} />
                    <InfoField label="Statut d'Autonomie" value={<p className="whitespace-pre-wrap">{patient.geriatricAssessment.autonomyStatus}</p>} />
                </Section>
            </div>
            <div className="space-y-6">
                <Section title="Clinique Actuelle">
                    <InfoField label="Circonstances découverte" value={patient.clinicalInfo.discoveryCircumstances} />
                    <InfoField label="Symptômes" value={patient.clinicalInfo.symptoms.map(s => SYMPTOM_OPTIONS[s]).join(', ')} />
                     <InfoField label="Détails symptômes" value={<p className="whitespace-pre-wrap">{patient.clinicalInfo.symptomsDetails}</p>} />
                    <InfoField label="Examen Physique" value={<p className="whitespace-pre-wrap">{patient.clinicalInfo.exam.physicalExamDetails}</p>} />
                    <InfoField label="Poids / Taille / IMC" value={`${patient.clinicalInfo.exam.weightKg} kg / ${patient.clinicalInfo.exam.heightCm} cm (${(patient.clinicalInfo.exam.weightKg / ((patient.clinicalInfo.exam.heightCm/100)**2)).toFixed(1)} kg/m²)`} />
                </Section>
            </div>
        </div>
    ),
    biologyImaging: (
      <div className="space-y-6">
        <Section title="Imagerie">
          <InfoField label="Scanner Thoracique" value={<p className="whitespace-pre-wrap">{patient.paraclinicalData.imaging.thoracicScanner}</p>} />
          <InfoField label="TEP-TDM" value={<p className="whitespace-pre-wrap">{patient.paraclinicalData.imaging.tepTdm}</p>} />
          <InfoField label="IRM Cérébrale" value={<p className="whitespace-pre-wrap">{patient.paraclinicalData.imaging.cerebralMri}</p>} />
           <InfoField label="Autres Imageries" value={<p className="whitespace-pre-wrap">{patient.paraclinicalData.imaging.otherImaging}</p>} />
        </Section>
        <Section title="Biologie & Explorations Fonctionnelles">
          <InfoField label="Biologie Standard" value={<p className="whitespace-pre-wrap">{patient.paraclinicalData.standardBiology}</p>} />
          <InfoField label="Marqueurs Tumoraux" value={<p className="whitespace-pre-wrap">{patient.paraclinicalData.tumorMarkers}</p>} />
          <InfoField label="Fonction Respiratoire" value={<p className="whitespace-pre-wrap">{patient.paraclinicalData.functionalExplorations.efr}</p>} />
          <InfoField label="Fonction Cardiaque" value={<p className="whitespace-pre-wrap">{patient.paraclinicalData.functionalExplorations.cardiacEvaluation}</p>} />
        </Section>
      </div>
    ),
    anapathTnm: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <Section title="Anatomopathologie">
                    <InfoField label="Site de la biopsie" value={patient.pathologyData.biopsySite} />
                    <InfoField label="Méthode" value={patient.pathologyData.biopsyMethod} />
                    <InfoField label="Type histologique" value={patient.pathologyData.histologicalType} />
                    <InfoField label="Grade" value={patient.pathologyData.grading} />
                    <InfoField label="Immunohistochimie" value={<p className="whitespace-pre-wrap">{patient.pathologyData.immunohistochemistry}</p>} />
                </Section>
                 <Section title="Biologie Moléculaire">
                    <InfoField label="EGFR" value={patient.pathologyData.molecularBiology.egfr} />
                    <InfoField label="ALK" value={patient.pathologyData.molecularBiology.alk} />
                    <InfoField label="ROS1" value={patient.pathologyData.molecularBiology.ros1} />
                    <InfoField label="BRAF" value={patient.pathologyData.molecularBiology.braf} />
                    <InfoField label="KRAS" value={patient.pathologyData.molecularBiology.kras} />
                    <InfoField label="PD-L1" value={patient.pathologyData.molecularBiology.pdl1} />
                    <InfoField label="RET" value={patient.pathologyData.molecularBiology.ret} />
                    <InfoField label="MET" value={patient.pathologyData.molecularBiology.met} />
                    <InfoField label="NTRK" value={patient.pathologyData.molecularBiology.ntrk} />
                    <InfoField label="NRG1" value={patient.pathologyData.molecularBiology.nrg1} />
                    <InfoField label="Autres" value={patient.pathologyData.molecularBiology.other} />
                </Section>
            </div>
             <div className="lg:col-span-1">
                <TnmClassifier tnmDetails={patient.tnm} onTnmChange={handleTnmChange} />
            </div>
        </div>
    ),
    rcp: (
        <div className="space-y-6">
            <Card title="Historique des décisions RCP">
                <div className="flow-root">
                    <ul className="-mb-8">
                        {patient.rcpHistory.map((decision, decisionIdx) => (
                            <li key={decision.date}>
                                <div className="relative pb-8">
                                    {decisionIdx !== patient.rcpHistory.length - 1 ? (
                                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                                    ) : null}
                                    <div className="relative flex space-x-4">
                                        <div>
                                            <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                            <div>
                                                <p className="text-sm text-slate-500">
                                                    Décision du <time dateTime={decision.date}>{decision.date}</time>
                                                </p>
                                                <p className="font-semibold text-slate-900">{decision.decision}</p>
                                                <div className="mt-2 text-sm text-slate-700 space-y-2">
                                                    <div>
                                                        <span className="font-medium text-slate-600">Traitement :</span>
                                                        <p className="pl-2">{decision.treatments}</p>
                                                    </div>
                                                     <div>
                                                        <span className="font-medium text-slate-600">Argumentaire :</span>
                                                        <p className="pl-2">{decision.summary}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right text-sm whitespace-nowrap text-slate-500">
                                                <EvidenceBadge category={decision.evidenceCategory} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </Card>
            <LetterGenerator patient={patient} />
        </div>
    )
  };


  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">{patient.name}</h1>
                <p className="text-md text-slate-500">Stade {patient.tnm.stage} - {patient.pathologyData.histologicalType}</p>
            </div>
            <div className="flex items-center space-x-2">
                {getStatusBadge(patient.rcpStatus)}
                <CaseSummaryGenerator patient={patient} />
                <AiAssistant patient={patient} />
            </div>
        </div>
      
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          <button onClick={() => setActiveTab('summary')} className={`flex-shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'summary' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Synthèse</button>
          <button onClick={() => setActiveTab('clinicalAnamnesis')} className={`flex-shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'clinicalAnamnesis' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Clinique & Anamnèse</button>
          <button onClick={() => setActiveTab('biologyImaging')} className={`flex-shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'biologyImaging' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Bilans & Imagerie</button>
          <button onClick={() => setActiveTab('anapathTnm')} className={`flex-shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'anapathTnm' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Anapath & TNM</button>
          <button onClick={() => setActiveTab('rcp')} className={`flex-shrink-0 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'rcp' ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Historique RCP</button>
        </nav>
      </div>

      <div className="mt-6">
        {tabContent[activeTab as keyof typeof tabContent]}
      </div>
    </div>
  );
};

export default PatientDetail;