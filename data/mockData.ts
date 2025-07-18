import { Patient, PerformanceStatus, User } from '../types';

export const mockUsers: User[] = [
  { id: 'admin-1', email: 'admin@demo.com', name: 'Dr. Émilie Moreau', role: 'admin', specialty: 'Oncologue Thoracique' },
  { id: 'doctor-1', email: 'doctor1@demo.com', name: 'Dr. Alain Martin', role: 'doctor', specialty: 'Médecin Généraliste' },
  { id: 'doctor-2', email: 'doctor2@demo.com', name: 'Dr. Sophie Dubois', role: 'doctor', specialty: 'Pneumologue' },
];

export const mockPatients: Patient[] = [
  {
    id: 'pat-001',
    name: 'Jean Dupont',
    gender: 'Homme',
    dob: '1965-03-15',
    hospitalId: 'HOSP-75001',
    ssn: '1 65 03 75 123 456',
    address: "123 Rue de la République, 75011 Paris",
    email: "jean.dupont@email.com",
    contact: '06 12 34 56 78',
    trustedPerson: 'Marie Dupont (Épouse)',
    gp: { name: 'Dr. Alain Martin', contact: '01 45 67 89 01', rpps: '10001234567' },
    referringDoctor: { name: 'Dr. Caroline Lefebvre', specialty: 'Pneumologue' },
    submittedById: 'doctor-1',
    submittedByName: 'Dr. Alain Martin',
    rcpStatus: 'pending',
    viewedBy: [],

    socioProfessional: {
      profession: "Comptable (retraité)",
      exposures: "Aucune exposition professionnelle à risque connue."
    },

    anamnesis: {
      medicalHistory: "Hypertension artérielle traitée par Amlodipine. Diabète de type 2 traité par Metformine. Insuffisance rénale chronique modérée (Clairance à 55 ml/min).",
      surgicalHistory: "Appendicectomie en 1985. Hernie inguinale en 2010.",
      oncologicalHistory: "Néant.",
      familyHistory: "Père décédé d'un infarctus du myocarde à 65 ans. Mère en bonne santé."
    },
    
    psychoSocial: {
        context: "Patient vivant avec son épouse, autonome. Anxieux face à la maladie.",
        patientWishes: "Souhaite un traitement curatif si possible, avec un maximum de préservation de sa qualité de vie.",
        gpOpinion: "Dr. Martin soutient la démarche et insiste sur la gestion de l'anxiété du patient."
    },

    lifeHabits: {
      smokingStatus: "Ancien fumeur",
      smokingPacksPerYear: 40,
      smokingCessationDate: "2019-01-01",
      alcohol: "Consommation occasionnelle (2-3 verres par semaine).",
      otherSubstances: "Néant."
    },

    clinicalInfo: {
      discoveryCircumstances: "Bilan pour toux persistante et dyspnée d'effort.",
      symptoms: ['cough', 'dyspnea'],
      symptomsDetails: "Toux sèche depuis 3 mois, dyspnée stade II NYHA.",
      exam: {
        weightKg: 78,
        heightCm: 175,
        performanceStatus: PerformanceStatus.ECOG_1,
        physicalExamDetails: "Murmure vésiculaire diminué à la base droite. Reste de l'examen sans particularité."
      },
    },

    geriatricAssessment: {
        oncoGeriatricScreening: 'Non réalisé (<70 ans)',
        cognitiveAssessment: 'Normal',
        autonomyStatus: 'Autonome (ADL 6/6, IADL 4/4)',
    },

    paraclinicalData: {
      standardBiology: "Hb 13.5 g/dL, Leucocytes 8.5 G/L, Plaquettes 250 G/L. Créatinine 110 µmol/L.",
      tumorMarkers: "ACE 5 ng/mL, Cyfra 21-1 4 ng/mL.",
      functionalExplorations: {
        efr: 'VEMS à 75% de la théorique, CVF normale. Pas de trouble ventilatoire restrictif ou obstructif significatif.',
        cardiacEvaluation: 'ECG normal. Échographie cardiaque : FEVG conservée à 60%. Pas d\'HTAP.',
      },
      imaging: {
        thoracicScanner: 'Masse lobaire supérieure droite de 4.5cm, spiculée, sans contact pariétal.',
        tepTdm: 'Hypermétabolisme intense de la masse LSD (SUVmax 12.4) et d\'un ganglion hilaire homolatéral (SUVmax 5.6).',
        cerebralMri: 'Pas de localisation secondaire suspecte.',
        otherImaging: "Échographie abdominale sans anomalie."
      },
    },

    pathologyData: {
      biopsyMethod: "Fibroscopie bronchique",
      biopsySite: 'Biopsie trans-bronchique de la masse LSD',
      histologicalType: 'Adénocarcinome non à petites cellules, type acinaire',
      grading: "Grade 2 : Modérément différencié",
      immunohistochemistry: 'TTF1+, Napsin A+, p40-.',
      molecularBiology: {
        egfr: "Mutation : délétion de l'exon 19",
        alk: "Négatif (IHC et FISH)",
        ros1: "Négatif (IHC et FISH)",
        braf: "Pas de mutation V600E",
        kras: "Non recherché",
        pdl1: "Expression 10% (TPS)",
        ret: "Non recherché",
        met: "Non recherché",
        ntrk: "Non recherché",
        nrg1: "Non recherché",
        other: "N/A"
      }
    },

    tnm: { 
      size: 4.5,
      invasions: [],
      nodules: 'none',
      n_involvement: ['n1'],
      metaType: 'm0',
      tumorLocation: 'Lobe Supérieur Droit',
      tumorDescription: 'Masse spiculée sans contact pariétal.',
      t: 'T2b', 
      n: 'N1', 
      m: 'M0', 
      stage: 'IIB' 
    },

    rcpHistory: [
      {
        date: '2024-07-15',
        participants: 'Dr. Moreau, Dr. Lefebvre, Dr. Valjean (Chirurgien), Dr. Curie (Radiothérapeute)',
        decision: 'Chirurgie première : Lobectomie supérieure droite par thoracoscopie.',
        treatments: 'Lobectomie supérieure droite par thoracoscopie.',
        summary: 'Patient opérable avec une maladie localisée et une mutation EGFR. La chirurgie curative est la meilleure option.',
        pps: 'Consultation pré-anesthésie, puis hospitalisation pour chirurgie. Suivi post-opératoire et discussion d\'un traitement adjuvant en fonction des résultats de la pièce opératoire.',
        evidenceCategory: '1',
      },
    ],
    rcpQuestion: 'Validation de l\'indication de lobectomie chirurgicale première pour ce patient ?',
    missingInformation: 'Scintigraphie osseuse non réalisée mais TEP peu suspect.'
  },
  {
    id: 'pat-002',
    name: 'Claire Bernard',
    gender: 'Femme',
    dob: '1958-11-20',
    hospitalId: 'HOSP-92001',
    ssn: '2 58 11 92 987 654',
    address: "45 Avenue Charles de Gaulle, 92200 Neuilly-sur-Seine",
    email: "claire.bernard@email.com",
    contact: '07 98 76 54 32',
    trustedPerson: 'Luc Bernard (Fils)',
    gp: { name: 'Dr. Sophie Dubois', contact: '01 44 33 22 11', rpps: '10007654321' },
    referringDoctor: { name: 'Dr. Jean Valois', specialty: 'Pneumologue' },
    submittedById: 'doctor-2',
    submittedByName: 'Dr. Sophie Dubois',
    rcpStatus: 'selected',
    viewedBy: [],
    socioProfessional: { profession: "Enseignante", exposures: "Néant" },
    anamnesis: { medicalHistory: "Aucun", surgicalHistory: "Aucun", oncologicalHistory: "Aucun", familyHistory: "Mère avec cancer du sein à 60 ans." },
    psychoSocial: {
        context: "Patiente vivant seule, son fils est très présent. Très angoissée par la situation.",
        patientWishes: "Privilégie le contrôle de la maladie et le maintien de son autonomie le plus longtemps possible.",
        gpOpinion: "Dr. Dubois confirme l'importance d'un soutien psychologique."
    },
    lifeHabits: { smokingStatus: "Non-fumeuse", smokingPacksPerYear: 0, alcohol: "Occasionnel", otherSubstances: "Néant" },
    clinicalInfo: {
      discoveryCircumstances: "Douleurs thoraciques et altération de l'état général.",
      symptoms: ['chest_pain', 'asthenia', 'weight_loss'],
      symptomsDetails: "Douleur basi-thoracique gauche, perte de 5kg en 2 mois.",
      exam: {
        weightKg: 62,
        heightCm: 165,
        performanceStatus: PerformanceStatus.ECOG_2,
        physicalExamDetails: "Syndrome de Pancoast-Tobias avec douleur de l'épaule gauche irradiant dans le bras."
      },
    },
    geriatricAssessment: {
        oncoGeriatricScreening: 'Non réalisé (<70 ans)',
        cognitiveAssessment: 'Normal',
        autonomyStatus: 'Partiellement dépendant (courses, ménage)',
    },
    paraclinicalData: {
      standardBiology: "Bilan standard normal.",
      tumorMarkers: "SCC élevé.",
      functionalExplorations: { efr: 'Syndrome obstructif modéré.', cardiacEvaluation: 'Fonction VG normale.' },
      imaging: {
        thoracicScanner: 'Masse de 6cm à l\'apex pulmonaire gauche avec envahissement de la paroi thoracique. Multiples nodules hépatiques et une lésion surrénalienne.',
        tepTdm: 'Fixation intense de la masse, des localisations secondaires hépatiques, surrénaliennes et osseuses (rachis dorsal).',
        cerebralMri: 'Une métastase cérébrale unique de 1.5cm frontale gauche.',
        otherImaging: "N/A"
      },
    },
    pathologyData: {
      biopsyMethod: "Biopsie hépatique",
      biopsySite: 'Biopsie hépatique sous échographie',
      histologicalType: 'Carcinome épidermoïde peu différencié',
      grading: "Grade 3",
      immunohistochemistry: 'p40+, CK5/6+',
      molecularBiology: {
        egfr: "Wild Type",
        alk: "Négatif",
        ros1: "Négatif",
        braf: "Négatif",
        kras: "Négatif",
        pdl1: "Expression > 50% (TPS)",
        ret: "Non recherché",
        met: "Non recherché",
        ntrk: "Non recherché",
        nrg1: "Non recherché",
        other: "N/A"
      }
    },
    tnm: { 
      size: 6,
      invasions: ['chest_wall'],
      nodules: 'none',
      n_involvement: ['n2'],
      isMultipleN2Stations: false,
      metaType: 'm1c2',
      tumorLocation: 'Apex pulmonaire gauche',
      tumorDescription: 'Masse de 6cm avec envahissement pariétal.',
      t: 'T3', 
      n: 'N2a', 
      m: 'M1c', 
      stage: 'IVB' 
    },
    rcpHistory: [
      {
        date: '2024-06-28',
        participants: 'Dr. Moreau, Dr. Dubois, Dr. Valois',
        decision: 'Traitement systémique par immunothérapie (Pembrolizumab) en première ligne. Radiothérapie stéréotaxique sur la métastase cérébrale.',
        treatments: 'Immunothérapie: Pembrolizumab. Radiothérapie stéréotaxique cérébrale.',
        summary: 'Maladie métastatique avec expression forte de PD-L1. Indication d\'une immunothérapie. Traitement local de la métastase cérébrale pour contrôle symptomatique.',
        pps: 'Début du Pembrolizumab en hôpital de jour. Consultation avec radiothérapeute pour planification de la radiothérapie cérébrale. Consultation de support psychologique proposée.',
        evidenceCategory: '1'
      },
    ],
    rcpQuestion: 'Confirmation de la stratégie thérapeutique de 1ère ligne par immunothérapie seule au vu du statut PD-L1 ?',
    missingInformation: 'Aucun'
  },
];