import { supabase } from './supabaseClient';
import { Patient, PsychoSocialData } from '../types';
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
        return Object.keys(obj).reduce((acc: Record<string, any>, key: string) => {
            const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
            acc[camelKey] = toCamelCase(obj[key]);
            return acc;
        }, {});
    }
    return obj;
};

// Helper to convert camelCase from app to snake_case for Supabase
const toSnakeCase = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(v => toSnakeCase(v));
    } else if (obj !== null && typeof obj === 'object') {
        return Object.keys(obj).reduce((acc: Record<string, any>, key: string) => {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            acc[snakeKey] = toSnakeCase(obj[key]);
            return acc;
        }, {});
    }
    return obj;
};

const getAllPatients = async (): Promise<Patient[]> => {
    if (isDemoMode) {
        return Promise.resolve(JSON.parse(JSON.stringify(demoPatients)));
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
        return Promise.resolve(patient ? JSON.parse(JSON.stringify(patient)) : undefined);
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
            psychoSocial: patient.psychoSocial || { context: '', patientWishes: '', gpOpinion: '' },
        };
        demoPatients.unshift(newPatient); // Add to start of array
        return Promise.resolve(newPatient);
    }
    
    const patientForDb = {
      ...toSnakeCase(patient),
      submitted_by_id: userId,
      rcp_status: 'pending'
    };

    const { data, error } = await supabase
        .from('patients')
        .insert([patientForDb as any])
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
            demoPatients[index] = JSON.parse(JSON.stringify(patient));
        }
        return Promise.resolve(patient);
    }

    const patientForDb = toSnakeCase(patient);
    delete patientForDb.submitted_by_name;
    // The patient object may contain a 'submittedBy' from the join, which is not a real column.
    delete patientForDb.submitted_by;
    delete patientForDb.id;

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


export const supabaseService = {
    getAllPatients,
    getPatient,
    addPatient,
    updatePatient,
};