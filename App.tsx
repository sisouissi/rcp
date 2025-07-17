

import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import PatientList from './components/PatientList';
import PatientDetail from './components/PatientDetail';
import AddPatient from './components/AddPatient';
import Settings from './components/Settings';
import Login from './components/Login';
import { navLinks } from './constants';
import { useAuth } from './contexts/AuthContext';


const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        <polyline points="16 17 21 12 16 7"></polyline>
        <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
);

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


const App: React.FC = () => {
    const { user, signOut, isLoading } = useAuth();
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-slate-100">
                 <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                <p className="ml-4 text-slate-600">Chargement de l'application...</p>
            </div>
        );
    }

    if (!user) {
        return <Login />;
    }

    const navLinkClasses = "flex items-center px-4 py-2.5 text-base font-medium rounded-lg transition-colors";
    const activeClasses = "bg-blue-600 text-white";
    const inactiveClasses = "text-slate-200 hover:bg-slate-700 hover:text-white";

    const sidebarContent = (
         <div className="flex flex-col flex-grow">
            <div className="flex items-center flex-shrink-0 px-4 h-16 border-b border-slate-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z" /></svg>
                <span className="ml-3 text-white text-xl font-semibold">RCP Onco</span>
            </div>
            <div className="flex-1 mt-6">
                <nav className="flex-1 px-2 space-y-1">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.label}
                            to={link.to}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) => `${navLinkClasses} ${isActive ? activeClasses : inactiveClasses}`}
                        >
                            {link.icon}
                            <span className="ml-3">{link.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>
            <div className="flex-shrink-0 p-4 border-t border-slate-700">
                <div className="flex items-center">
                    <div>
                        <p className="text-sm font-semibold text-white">{user.name}</p>
                        <p className="text-xs font-medium text-slate-400">{user.role === 'admin' ? 'Administrateur' : 'Médecin'}</p>
                    </div>
                    <button onClick={signOut} title="Se déconnecter" className="ml-auto text-slate-300 hover:text-white p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white">
                       <LogoutIcon />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <Router>
            <div className="flex h-screen bg-slate-100">
                {/* Static sidebar for desktop */}
                <div className="hidden lg:flex lg:flex-shrink-0">
                    <div className="flex flex-col w-64 bg-slate-800">
                        {sidebarContent}
                    </div>
                </div>

                {/* Mobile menu */}
                <div className={`fixed inset-0 flex z-40 lg:hidden ${isSidebarOpen ? '' : 'hidden'}`} role="dialog" aria-modal="true">
                    {/* Off-canvas menu overlay */}
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-75" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
                    {/* Off-canvas menu */}
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-800">
                        <div className="absolute top-0 right-0 -mr-12 pt-2">
                             <button type="button" className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white" onClick={() => setSidebarOpen(false)}>
                                <span className="sr-only">Close sidebar</span>
                                <CloseIcon />
                            </button>
                        </div>
                        {sidebarContent}
                    </div>
                    <div className="flex-shrink-0 w-14" aria-hidden="true"></div>
                </div>

                <div className="flex flex-col w-0 flex-1 overflow-hidden">
                     {/* Mobile top bar */}
                    <div className="lg:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-slate-100 border-b border-slate-200">
                         <button onClick={() => setSidebarOpen(true)} className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500">
                            <span className="sr-only">Open sidebar</span>
                            <MenuIcon />
                        </button>
                    </div>
                    <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
                        <div className="py-6 px-4 sm:px-6 lg:px-8">
                            <Routes>
                                <Route path="/" element={<Navigate replace to="/dashboard" />} />
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/patients" element={<PatientList />} />
                                <Route path="/patients/:id" element={<PatientDetail />} />
                                <Route path="/add-patient" element={<AddPatient />} />
                                <Route path="/settings" element={<Settings />} />
                            </Routes>
                        </div>
                    </main>
                </div>
            </div>
        </Router>
    );
};

export default App;