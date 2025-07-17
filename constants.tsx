import React from 'react';

export const DashboardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1"></rect>
        <rect width="7" height="5" x="14" y="3" rx="1"></rect>
        <rect width="7" height="9" x="14" y="12" rx="1"></rect>
        <rect width="7" height="5" x="3" y="16" rx="1"></rect>
    </svg>
);

export const PatientsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

export const AddPatientIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
        <polyline points="10 17 15 12 10 7"></polyline>
        <line x1="15" y1="12" x2="3" y2="12"></line>
    </svg>
);

export const SettingsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-4.44a2 2 0 0 0-2 2v.79a2 2 0 0 1-1.69.94L3.1 8.92a2 2 0 0 0-.22 3.42l3.48 2.01a2 2 0 0 1 0 3.3l-3.48 2.01a2 2 0 0 0 .22 3.42l.98.56a2 2 0 0 1 1.69.94v.79a2 2 0 0 0 2 2h4.44a2 2 0 0 0 2-2v-.79a2 2 0 0 1 1.69-.94l.98-.56a2 2 0 0 0 .22-3.42l-3.48-2.01a2 2 0 0 1 0-3.3l3.48-2.01a2 2 0 0 0-.22-3.42l-.98-.56a2 2 0 0 1-1.69-.94V4a2 2 0 0 0-2-2z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

export const navLinks = [
    { to: "/", label: "Tableau de Bord", icon: <DashboardIcon /> },
    { to: "/patients", label: "Liste des Patients", icon: <PatientsIcon /> },
    { to: "/add-patient", label: "Soumettre un Dossier", icon: <AddPatientIcon /> },
    { to: "/settings", label: "Paramètres", icon: <SettingsIcon /> },
];