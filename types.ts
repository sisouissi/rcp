

export enum PerformanceStatus {
  ECOG_0 = "ECOG 0: Fully active",
  ECOG_1 = "ECOG 1: Restricted in strenuous activity",
  ECOG_2 = "ECOG 2: Ambulatory but unable to work",
  ECOG_3 = "ECOG 3: Limited self-care, confined to bed >50%",
  ECOG_4 = "ECOG 4: Completely disabled, cannot carry on self-care",
  ECOG_5 = "ECOG 5: Dead",
}

export interface User {
  id: string; // from auth.users
  email?: string; // from auth.users
  role: 'admin' | 'doctor'; // from profiles table
  name: string; // from profiles table (full_name)
  specialty: string; // from profiles table
}

export interface GeneralPractitioner {
  name: string;
  contact: string;
  rpps: string;
}

export interface ReferringDoctor {
    name: string;
    specialty: string;
}

export const T_INVASION_OPTIONS = {
  main_bronchus: "Envahissement d'une bronche souche",
  visceral_pleura: "Envahissement de la plèvre viscérale",
  atelectasis: "Atélectasie ou pneumonie obstructive",
  chest_wall: "Paroi thoracique (incluant tumeur du sommet)",
  phrenic_nerve: "Nerf phrénique",
  parietal_pericardium: "Péricarde pariétal",
  diaphragm: "Diaphragme",
  mediastinum: "Médiastin",
  heart_great_vessels: "Cœur ou gros vaisseaux",
  trachea_carina: "Trachée ou carène",
  recurrent_laryngeal_nerve: "Nerf récurrent",
  esophagus_vertebral_body: "Œsophage ou corps vertébral",
} as const;
export type TInvasion = keyof typeof T_INVASION_OPTIONS;

export const T_NODULES_OPTIONS = {
  none: "Aucun",
  same_lobe: "Nodule(s) tumoral(aux) distinct(s) dans le même lobe",
  different_ipsi_lobe: "Nodule(s) dans un lobe homolatéral différent",
} as const;
export type TNodules = keyof typeof T_NODULES_OPTIONS;

export const N_INVOLVEMENT_OPTIONS = {
  n1: "Atteinte N1 : Ggl péri-bronchiques / hilaires homolatéraux",
  n2: "Atteinte N2 : Ggl médiastinaux homolatéraux / sous-carénaires",
  n3: "Atteinte N3 : Ggl controlatéraux / sus-claviculaires / scalènes",
} as const;
export type NInvolvement = keyof typeof N_INVOLVEMENT_OPTIONS;


export const M_TYPE_OPTIONS = {
  m0: "M0 : Pas de métastase à distance",
  m1a: "M1a : Nodule controlatéral, nodules pleuraux/péricardiques, ou épanchement malin",
  m1b: "M1b : Une seule métastase extra-thoracique dans un seul organe",
  m1c1: "M1c1 : Plusieurs métastases extra-thoraciques dans un seul organe",
  m1c2: "M1c2 : Plusieurs métastases extra-thoraciques dans plusieurs organes",
} as const;
export type MType = keyof typeof M_TYPE_OPTIONS;

export const SYMPTOM_OPTIONS = {
  dyspnea: "Dyspnée",
  cough: "Toux",
  hemoptysis: "Hémoptysie",
  chest_pain: "Douleur thoracique",
  asthenia: "Asthénie",
  weight_loss: "Perte de poids",
  fever: "Fièvre",
  dysphonia: "Dysphonie",
  svc_syndrome: "Syndrome cave supérieur",
  other: "Autre",
} as const;
export type SymptomKey = keyof typeof SYMPTOM_OPTIONS;

export type EvidenceCategory = '1' | '2A' | '2B' | '3';

export interface TnmDetails {
  // Inputs
  size: number; // in cm
  invasions: TInvasion[];
  nodules: TNodules;
  n_involvement: NInvolvement[];
  isMultipleN2Stations?: boolean;
  metaType: MType;
  tumorLocation?: string;
  tumorDescription?: string;

  // Calculated
  t: string;
  n: string;
  m: string;
  stage: string;
}

// Sub-structures for the full patient record
export interface SocioProfessionalData {
    profession: string;
    exposures: string;
}

export interface Anamnesis {
    medicalHistory: string;
    surgicalHistory: string;
    oncologicalHistory: string;
    familyHistory: string;
}

export interface LifeHabits {
    smokingStatus: string; 
    smokingPacksPerYear: number;
    smokingCessationDate?: string;
    alcohol: string;
    otherSubstances: string;
}

export interface GeriatricAssessment {
    oncoGeriatricScreening: string;
    cognitiveAssessment: string;
    autonomyStatus: string;
}

export interface ClinicalInfo {
    discoveryCircumstances: string;
    symptoms: SymptomKey[];
    symptomsDetails: string;
    exam: {
        weightKg: number;
        heightCm: number;
        performanceStatus: PerformanceStatus;
        physicalExamDetails: string;
    };
}

export interface ParaclinicalData {
    standardBiology: string; 
    tumorMarkers: string;
    functionalExplorations: {
        efr: string;
        cardiacEvaluation: string;
    };
    imaging: {
        thoracicScanner: string; 
        tepTdm: string;
        cerebralMri: string;
        otherImaging: string;
    };
}

export interface PathologyData {
    biopsySite: string;
    biopsyMethod: string;
    histologicalType: string;
    grading: string;
    immunohistochemistry: string;
    molecularBiology: {
        egfr: string;
        alk: string;
        ros1: string;
        braf: string;
        kras: string;
        pdl1: string;
        ret: string;
        met: string;
        ntrk: string;
        nrg1: string;
        other: string;
    };
}


export interface Patient {
  id: string; // uuid from Supabase
  name: string;
  gender: 'Homme' | 'Femme' | 'Autre';
  dob: string; // YYYY-MM-DD
  hospitalId: string;
  ssn: string;
  address: string;
  email: string;
  contact: string;
  trustedPerson: string;
  gp: GeneralPractitioner;
  referringDoctor: ReferringDoctor;
  
  socioProfessional: SocioProfessionalData;
  anamnesis: Anamnesis;
  lifeHabits: LifeHabits;
  clinicalInfo: ClinicalInfo;
  geriatricAssessment: GeriatricAssessment;
  paraclinicalData: ParaclinicalData;
  pathologyData: PathologyData;
  
  tnm: TnmDetails;

  rcpQuestion?: string;
  missingInformation: string;
  rcpHistory: RcpDecision[];
  
  // Populated by Supabase service
  submittedById: string; // uuid
  submittedByName: string; // from joined profiles table
  rcpStatus: 'pending' | 'selected' | 'discussed';
  viewedBy?: string[]; // Array of user IDs who have seen the latest status
}

export interface RcpDecision {
  date: string;
  decision: string;
  treatments: string;
  summary: string;
  evidenceCategory?: EvidenceCategory;
}

export interface MdtSummary {
  presentation: string;
  keyFindings: string[];
  proposedQuestion: string;
}

export interface AiSuggestion {
  title: string;
  recommendation: string;
  justification: string;
  nccnReference: string;
}

export type AiQueryType = 'missingData' | 'suggestExam' | 'proposePlan';