

import { supabase } from './supabaseClient';
import { Patient, TnmDetails, TInvasion, TNodules, MType, NInvolvement, PerformanceStatus } from '../types';
import { mockPatients, mockUsers } from '../data/mockData';

const supabaseUrl = process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const isDemoMode = supabaseUrl === "https://placeholder.supabase.co";

// In-memory store for demo mode
let demoPatients: Patient[] = JSON.parse(JSON.stringify(mockPatients));

// Helper to convert snake_case from Supabase to camelCase for the app
const toCamelCase = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(v => toCamelCase(v));
    } else if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
            acc[camelKey] = toCamelCase(obj[key]);
            return acc;
        }, {} as any);
    }
    return obj;
};

// Helper to convert camelCase from app to snake_case for Supabase
const toSnakeCase = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(v => toSnakeCase(v));
    } else if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc, key) => {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            acc[snakeKey] = toSnakeCase(obj[key]);
            return acc;
        }, {} as any);
    }
    return obj;
};

// --- TNM Calculation Logic (adapted from TnmClassifier) ---
const calculateT = (size: number, invasions: TInvasion[], nodules: TNodules): string => {
    const hasT4Invasion = invasions.some(i => ["diaphragm", "mediastinum", "heart_great_vessels", "trachea_carina", "recurrent_laryngeal_nerve", "esophagus_vertebral_body"].includes(i));
    if (size > 7 || nodules === 'different_ipsi_lobe' || hasT4Invasion) return 'T4';
    const hasT3Invasion = invasions.some(i => ["chest_wall", "phrenic_nerve", "parietal_pericardium"].includes(i));
    if ((size > 5 && size <= 7) || nodules === 'same_lobe' || hasT3Invasion) return 'T3';
    const hasT2Invasion = invasions.some(i => ["main_bronchus", "visceral_pleura", "atelectasis"].includes(i));
    if ((size > 3 && size <= 5) || hasT2Invasion) return size > 4 ? 'T2b' : 'T2a';
    if (size > 0 && size <= 3) {
        if (size > 2) return 'T1c';
        if (size > 1) return 'T1b';
        return 'T1a';
    }
    return 'TX';
};
const calculateN = (involvement: NInvolvement[], isMultipleN2Stations?: boolean): string => {
  if (involvement.includes('n3')) return 'N3';
  if (involvement.includes('n2')) return isMultipleN2Stations ? 'N2b' : 'N2a';
  if (involvement.includes('n1')) return 'N1';
  return 'N0';
};
const calculateM = (metaType: MType): string => metaType === 'm0' ? 'M0' : metaType.startsWith('m1c') ? 'M1c' : metaType.startsWith('m1') ? metaType.slice(0,3).toUpperCase() : 'MX';
const calculateStage = (t: string, n: string, m: string): string => {
    if (m === 'M1c') return 'IVB';
    if (m === 'M1a' || m === 'M1b') return 'IVA';
    if (m === 'M0') {
        if (n === 'N0') {
            if (t === 'T1a') return 'IA1'; if (t === 'T1b') return 'IA2'; if (t === 'T1c') return 'IA3';
            if (t === 'T2a') return 'IB'; if (t === 'T2b') return 'IIA'; if (t === 'T3') return 'IIB'; if (t === 'T4') return 'IIIA';
        } else if (n === 'N1') {
            if (t.startsWith('T1') || t.startsWith('T2')) return 'IIB'; if (t === 'T3') return 'IIIA'; if (t === 'T4') return 'IIIA';
        } else if (n === 'N2a') {
            return 'IIIA';
        } else if (n === 'N2b') {
            if (t.startsWith('T1') || t.startsWith('T2')) return 'IIIB'; if (t.startsWith('T3') || t.startsWith('T4')) return 'IIIB';
        } else if (n === 'N3') {
            if (t.startsWith('T1') || t.startsWith('T2')) return 'IIIB'; if (t.startsWith('T3') || t.startsWith('T4')) return 'IIIC';
        }
    }
    return 'Inconnu';
};
// --- End of TNM Logic ---


const _transformAndValidatePatient = (rawData: any, importerId: string): { patientForDb: any | null, error: any | null } => {
    try {
        if (!rawData.name && (!rawData.firstName || !rawData.lastName)) {
            return { patientForDb: null, error: { error: `Le nom ou prénom/nom est manquant.` } };
        }
        
        const rawTnm: Partial<TnmDetails> = rawData.tnm || {};
        const tnmSize = rawTnm.size || rawData.tnmSize || 0;
        const tnmInvasions = rawTnm.invasions || rawData.tnmInvasions || [];
        const tnmNodules = rawTnm.nodules || rawData.tnmNodules || 'none';
        const tnmNInvolvement = rawTnm.n_involvement || rawData.tnmNInvolvement || [];
        const tnmIsMultipleN2 = rawTnm.isMultipleN2Stations || rawData.isMultipleN2Stations || false;
        const tnmMetaType = rawTnm.metaType || rawData.tnmMetaType || 'm0';

        const t = calculateT(tnmSize, tnmInvasions, tnmNodules);
        const n = calculateN(tnmNInvolvement, tnmIsMultipleN2);
        const m = calculateM(tnmMetaType);
        const stage = calculateStage(t, n, m);

        const patient: Omit<Patient, 'id'> = {
            name: rawData.name || `${rawData.firstName} ${rawData.lastName}`.trim(),
            gender: rawData.gender || 'Autre',
            dob: rawData.dob || '1900-01-01',
            hospitalId: rawData.hospitalId || '',
            ssn: rawData.ssn || '',
            address: rawData.address || '',
            email: rawData.email || '',
            contact: rawData.contact || '',
            trustedPerson: rawData.trustedPerson || '',
            gp: { name: rawData.gp?.name || rawData.gpName || '', contact: rawData.gp?.contact || rawData.gpContact || '', rpps: rawData.gp?.rpps || rawData.gpRpps || '' },
            referringDoctor: { name: rawData.referringDoctor?.name || rawData.referringDoctorName || '', specialty: rawData.referringDoctor?.specialty || rawData.referringDoctorSpecialty || '' },
            socioProfessional: { profession: rawData.socioProfessional?.profession || rawData.profession || '', exposures: rawData.socioProfessional?.exposures || rawData.exposures || '' },
            anamnesis: { medicalHistory: rawData.anamnesis?.medicalHistory || rawData.medicalHistory || '', surgicalHistory: rawData.anamnesis?.surgicalHistory || rawData.surgicalHistory || '', oncologicalHistory: rawData.anamnesis?.oncologicalHistory || rawData.oncologicalHistory || '', familyHistory: rawData.anamnesis?.familyHistory || rawData.familyHistory || '' },
            lifeHabits: { smokingStatus: rawData.lifeHabits?.smokingStatus || rawData.smokingStatus || 'Non-fumeur', smokingPacksPerYear: rawData.lifeHabits?.smokingPacksPerYear || rawData.smokingPacksPerYear || 0, smokingCessationDate: rawData.lifeHabits?.smokingCessationDate || rawData.smokingCessationDate, alcohol: rawData.lifeHabits?.alcohol || rawData.alcohol || '', otherSubstances: rawData.lifeHabits?.otherSubstances || rawData.otherSubstances || '' },
            clinicalInfo: {
                discoveryCircumstances: rawData.clinicalInfo?.discoveryCircumstances || rawData.discoveryCircumstances || '',
                symptoms: rawData.clinicalInfo?.symptoms || rawData.symptoms || [],
                symptomsDetails: rawData.clinicalInfo?.symptomsDetails || rawData.symptomsDetails || '',
                exam: { weightKg: rawData.clinicalInfo?.exam?.weightKg || rawData.weightKg || 0, heightCm: rawData.clinicalInfo?.exam?.heightCm || rawData.heightCm || 0, performanceStatus: rawData.clinicalInfo?.exam?.performanceStatus || rawData.performanceStatus || PerformanceStatus.ECOG_0, physicalExamDetails: rawData.clinicalInfo?.exam?.physicalExamDetails || rawData.physicalExamDetails || '' },
            },
            geriatricAssessment: { oncoGeriatricScreening: rawData.geriatricAssessment?.oncoGeriatricScreening || '', cognitiveAssessment: rawData.geriatricAssessment?.cognitiveAssessment || '', autonomyStatus: rawData.geriatricAssessment?.autonomyStatus || '' },
            paraclinicalData: {
                standardBiology: rawData.paraclinicalData?.standardBiology || '', tumorMarkers: rawData.paraclinicalData?.tumorMarkers || '',
                functionalExplorations: { efr: rawData.paraclinicalData?.functionalExplorations?.efr || '', cardiacEvaluation: rawData.paraclinicalData?.functionalExplorations?.cardiacEvaluation || '' },
                imaging: { thoracicScanner: rawData.paraclinicalData?.imaging?.thoracicScanner || '', tepTdm: rawData.paraclinicalData?.imaging?.tepTdm || '', cerebralMri: rawData.paraclinicalData?.imaging?.cerebralMri || '', otherImaging: rawData.paraclinicalData?.imaging?.otherImaging || '' },
            },
            pathologyData: {
                biopsySite: rawData.pathologyData?.biopsySite || '', biopsyMethod: rawData.pathologyData?.biopsyMethod || '', histologicalType: rawData.pathologyData?.histologicalType || '', grading: rawData.pathologyData?.grading || '', immunohistochemistry: rawData.pathologyData?.immunohistochemistry || '',
                molecularBiology: { egfr: rawData.pathologyData?.molecularBiology?.egfr || '', alk: rawData.pathologyData?.molecularBiology?.alk || '', ros1: rawData.pathologyData?.molecularBiology?.ros1 || '', braf: rawData.pathologyData?.molecularBiology?.braf || '', kras: rawData.pathologyData?.molecularBiology?.kras || '', pdl1: rawData.pathologyData?.molecularBiology?.pdl1 || '', ret: rawData.pathologyData?.molecularBiology?.ret || '', met: rawData.pathologyData?.molecularBiology?.met || '', ntrk: rawData.pathologyData?.molecularBiology?.ntrk || '', nrg1: rawData.pathologyData?.molecularBiology?.nrg1 || '', other: rawData.pathologyData?.molecularBiology?.other || '' },
            },
            tnm: {
                size: tnmSize, invasions: tnmInvasions, nodules: tnmNodules, n_involvement: tnmNInvolvement, isMultipleN2Stations: tnmIsMultipleN2, metaType: tnmMetaType,
                tumorLocation: rawTnm.tumorLocation || '', tumorDescription: rawTnm.tumorDescription || '',
                t, n, m, stage
            },
            rcpQuestion: rawData.rcpQuestion || '',
            missingInformation: rawData.missingInformation || '',
            rcpHistory: rawData.rcpHistory || [],
            submittedById: importerId,
            rcpStatus: 'pending',
            submittedByName: '', // Will be resolved by view join
            viewedBy: []
        };
        return { patientForDb: toSnakeCase(patient), error: null };
    } catch(e) {
        return { patientForDb: null, error: { error: e instanceof Error ? e.message : 'Erreur de transformation inconnue.'} };
    }
};


const getAllPatients = async (): Promise<Patient[]> => {
    if (isDemoMode) {
        return Promise.resolve(demoPatients);
    }

    const { data, error } = await supabase
        .from('patients')
        .select(`*, submittedBy:submitted_by_id (full_name)`);

    if (error) {
        console.error("Error fetching patients:", error);
        throw error;
    }

    return data.map((p: any) => {
        const patientData = toCamelCase(p);
        return {
            ...patientData,
            submittedByName: patientData.submittedBy?.fullName || 'Inconnu'
        } as Patient;
    });
};

const getPatient = async (id: string): Promise<Patient | undefined> => {
     if (isDemoMode) {
        const patient = demoPatients.find(p => p.id === id);
        return Promise.resolve(patient);
    }

    const { data, error } = await supabase
        .from('patients')
        .select(`*, submittedBy:submitted_by_id (full_name)`)
        .eq('id', id)
        .single();

    if (error) {
        console.error(`Error fetching patient ${id}:`, error);
        if (error.code === 'PGRST116') return undefined; // "The result contains 0 rows"
        throw error;
    }
    
    if (!data) return undefined;
    
    const patientData = toCamelCase(data);
    return {
        ...patientData,
        submittedByName: patientData.submittedBy?.fullName || 'Inconnu'
    } as Patient;
};

const addPatient = async (patient: Omit<Patient, 'id' | 'submittedById' | 'submittedByName' | 'rcpStatus' | 'viewedBy'>, userId: string): Promise<Patient> => {
     if (isDemoMode) {
        const submitter = mockUsers.find(u => u.id === userId);
        if (!submitter) throw new Error("Demo user not found");

        const newPatient: Patient = {
            ...patient,
            id: `pat-${Date.now()}`,
            submittedById: userId,
            submittedByName: submitter.name,
            rcpStatus: 'pending',
            viewedBy: [],
        };
        demoPatients.unshift(newPatient); // Add to start of array
        return Promise.resolve(newPatient);
    }
    
    const patientForDb = {
      ...toSnakeCase(patient),
      submitted_by_id: userId,
      rcp_status: 'pending'
    };
    
    delete patientForDb.id;
    delete patientForDb.submitted_by_name;

    const { data, error } = await supabase
        .from('patients')
        .insert(patientForDb)
        .select()
        .single();

    if (error) {
        console.error("Error adding patient:", error);
        throw error;
    }
    return toCamelCase(data) as Patient;
};

const updatePatient = async (patient: Patient): Promise<Patient> => {
    if (isDemoMode) {
        const index = demoPatients.findIndex(p => p.id === patient.id);
        if (index !== -1) {
            demoPatients[index] = patient;
        }
        return Promise.resolve(patient);
    }

    const patientForDb = toSnakeCase(patient);
    delete patientForDb.submitted_by_name; 

    const { data, error } = await supabase
        .from('patients')
        .update(patientForDb)
        .eq('id', patient.id)
        .select()
        .single();

    if (error) {
        console.error("Error updating patient:", error);
        throw error;
    }
    return toCamelCase(data) as Patient;
};

const importPatients = async (rawPatients: any[], importerId: string): Promise<{ successCount: number; errorCount: number; errors: any[] }> => {
    const results = rawPatients.map((raw, index) => {
        const { patientForDb, error } = _transformAndValidatePatient(raw, importerId);
        return { patientForDb, error: error ? { record: index + 1, ...error } : null };
    });

    const validPatientsForDb = results.filter(r => r.patientForDb).map(r => r.patientForDb);
    const importErrors = results.filter(r => r.error).map(r => r.error);

    if (isDemoMode) {
        const transformedDemoPatients = validPatientsForDb.map(p => toCamelCase(p)).map((p: Patient) => ({...p, id: `pat-imported-${Date.now()}-${Math.random()}`}));
        demoPatients.unshift(...transformedDemoPatients);
        return { successCount: validPatientsForDb.length, errorCount: importErrors.length, errors: importErrors };
    }

    if (validPatientsForDb.length === 0) {
        return { successCount: 0, errorCount: importErrors.length, errors: importErrors };
    }
    
    const { error: insertError } = await supabase
        .from('patients')
        .insert(validPatientsForDb);

    if (insertError) {
        console.error("Supabase bulk insert error:", insertError);
        importErrors.push({ record: 'Global', error: `Erreur Supabase: ${insertError.message}` });
        return { successCount: 0, errorCount: rawPatients.length, errors: importErrors };
    }

    return { successCount: validPatientsForDb.length, errorCount: importErrors.length, errors: importErrors };
};


export const supabaseService = {
    getAllPatients,
    getPatient,
    addPatient,
    updatePatient,
    importPatients,
};