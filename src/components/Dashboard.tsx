import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Patient } from '../types';
import { supabaseService } from '../services/supabaseService';
import { settingsService } from '../services/settingsService';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextRcpDate, setNextRcpDate] = useState('À définir');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const date = settingsService.getNextRcpDate();
        if (date) {
          const [year, month, day] = date.split('-');
          setNextRcpDate(`${day}/${month}/${year}`);
        } else {
          setNextRcpDate('À définir');
        }

        const patientData = await supabaseService.getAllPatients();
        setPatients(patientData);

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (isLoading) {
      return <div>Chargement du tableau de bord...</div>;
  }
  
  if (!user) {
      return <div>Utilisateur non trouvé.</div>;
  }

  const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
    <Card className="flex items-center p-4">
      <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
        <p className="mt-1 text-3xl font-semibold text-gray-900">{value}</p>
      </div>
    </Card>
  );

  const getLatestRcpDate = (p: Patient) => {
    if (!p.rcpHistory || p.rcpHistory.length === 0) return 0;
    // Assuming history is sorted descending, which it should be.
    return new Date(p.rcpHistory[0].date).getTime();
  };

  const AdminDashboard = () => {
     const stageData = [
      { name: 'Stade I', count: patients.filter(p => p.tnm.stage.startsWith('I')).length },
      { name: 'Stade II', count: patients.filter(p => p.tnm.stage.startsWith('II')).length },
      { name: 'Stade III', count: patients.filter(p => p.tnm.stage.startsWith('III')).length },
      { name: 'Stade IV', count: patients.filter(p => p.tnm.stage.startsWith('IV')).length },
    ];
    const recentPatients = [...patients].sort((a,b) => getLatestRcpDate(b) - getLatestRcpDate(a)).slice(0, 5);
    
    return (
        <>
            <p className="text-slate-600">Bienvenue, {user.name}. Vous pouvez accéder à tous les dossiers.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                <StatCard title="Total Patients" value={patients.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.273-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.273.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
                <StatCard title="Prochaine RCP" value={nextRcpDate} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
                <StatCard title="Dossiers pour RCP" value={patients.filter(p => p.rcpStatus === 'selected').length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2">
                    <Card title="Répartition des patients par stade">
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={stageData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis allowDecimals={false}/>
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="count" fill="#3b82f6" name="Nombre de patients" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
                <div>
                    <Card title="Dossiers Récents">
                        <ul className="divide-y divide-gray-200">
                            {recentPatients.map(patient => (
                                <li key={patient.id} className="py-3">
                                    <Link to={`/patients/${patient.id}`} className="flex items-center space-x-4 group">
                                         <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center ring-1 ring-slate-300">
                                            <svg className="h-6 w-6 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">{patient.name}</p>
                                            <p className="text-sm text-gray-500 truncate">Soumis par: {patient.submittedByName}</p>
                                        </div>
                                        <div>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                Voir
                                            </span>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>
        </>
    );
  };
  
  const DoctorDashboard = () => {
    const myPatients = patients.filter(p => p.submittedById === user.id);
    const rcpSelectedPatients = myPatients.filter(p => p.rcpStatus === 'selected');
    const recentSubmissions = myPatients.sort((a,b) => getLatestRcpDate(b) - getLatestRcpDate(a)).slice(0, 5);

    return (
        <>
            <p className="text-slate-600">Bienvenue, {user.name}. Vous pouvez accéder aux dossiers que vous avez soumis.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                <StatCard title="Mes Dossiers Soumis" value={myPatients.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} />
                <StatCard title="Sélectionnés pour RCP" value={rcpSelectedPatients.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
                <StatCard title="Prochaine RCP" value={nextRcpDate} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} />
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div className="lg:col-span-2">
                    <Card title="Notifications">
                         {rcpSelectedPatients.length > 0 ? (
                            <ul className="divide-y divide-gray-200">
                                {rcpSelectedPatients.map(patient => (
                                    <li key={patient.id} className="py-3">
                                        <Link to={`/patients/${patient.id}`} className="flex items-center space-x-4 group">
                                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">Le dossier de <span className="font-bold">{patient.name}</span> a été retenu pour la prochaine réunion RCP.</p>
                                                <p className="text-sm text-gray-500 truncate">Stade {patient.tnm.stage}</p>
                                            </div>
                                            <div>
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Nouveau
                                                </span>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-slate-500 text-center py-4">Aucune nouvelle notification.</p>
                        )}
                    </Card>
                </div>
                 <div>
                    <Card title="Mes Soumissions Récentes">
                         <ul className="divide-y divide-gray-200">
                            {recentSubmissions.map(patient => (
                                <li key={patient.id} className="py-3">
                                    <Link to={`/patients/${patient.id}`} className="flex items-center space-x-4 group">
                                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center ring-1 ring-slate-300">
                                            <svg className="h-6 w-6 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">{patient.name}</p>
                                            <p className="text-sm text-gray-500 truncate">Stade {patient.tnm.stage}</p>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </Card>
                </div>
            </div>
        </>
    );
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Tableau de Bord</h1>
      {user.role === 'admin' ? <AdminDashboard /> : <DoctorDashboard />}
    </div>
  );
};

export default Dashboard;