

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from './ui/Card';
import { Patient } from '../types';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';

const PatientList: React.FC = () => {
  const { user } = useAuth();
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const data = await supabaseService.getAllPatients();
      // Sort by name by default
      data.sort((a, b) => a.name.localeCompare(b.name));
      setAllPatients(data);
    } catch (error) {
      console.error("Failed to fetch patients", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleStatusChange = async (patientId: string, newStatus: Patient['rcpStatus']) => {
    const patientToUpdate = allPatients.find(p => p.id === patientId);
    if (patientToUpdate) {
        const updatedPatient = { ...patientToUpdate, rcpStatus: newStatus };
        await supabaseService.updatePatient(updatedPatient);
        fetchPatients(); // Re-fetch to show updated data
    }
  };

  const getStatusBadge = (status: Patient['rcpStatus']) => {
      const styles = {
          pending: 'bg-yellow-100 text-yellow-800',
          selected: 'bg-blue-100 text-blue-800',
          discussed: 'bg-green-100 text-green-800',
      };
      const text = {
          pending: 'En attente',
          selected: 'Sélectionné',
          discussed: 'Discuté',
      };
      return <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status]}`}>{text[status]}</span>;
  }

  const patientsToDisplay = useMemo(() => {
    let filteredList = allPatients;
    // RLS in Supabase already filters for doctors, but this provides an instant client-side filter if needed
    if (user?.role === 'doctor') {
      filteredList = allPatients.filter(p => p.submittedById === user.id);
    }
    
    if (filter) {
        filteredList = filteredList.filter(p => 
            p.name.toLowerCase().includes(filter.toLowerCase()) ||
            p.hospitalId.toLowerCase().includes(filter.toLowerCase())
        );
    }
    
    return filteredList;
  }, [allPatients, user, filter]);


  if (isLoading) {
    return <div>Chargement de la liste des patients...</div>;
  }
  
  if (!user) {
    return <div>Utilisateur non trouvé.</div>;
  }

  return (
    <Card>
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">
          {user.role === 'admin' ? 'Tous les Dossiers Patients' : 'Mes Dossiers Patients'}
        </h1>
         <div className="w-full md:w-1/3">
            <input 
                type="text" 
                placeholder="Rechercher par nom ou ID..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full"
            />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
              {user.role === 'admin' && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Médecin Soumetteur</th>}
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stade</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut RCP</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {patientsToDisplay.map((patient) => (
              <tr key={patient.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center ring-1 ring-slate-300">
                        <svg className="h-6 w-6 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                      <div className="text-sm text-gray-500">{patient.hospitalId}</div>
                    </div>
                  </div>
                </td>
                {user.role === 'admin' && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {patient.submittedByName}
                    </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {patient.tnm.stage}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.role === 'admin' ? (
                     <select
                        value={patient.rcpStatus}
                        onChange={(e) => handleStatusChange(patient.id, e.target.value as Patient['rcpStatus'])}
                        className="text-xs rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                     >
                        <option value="pending">En attente</option>
                        <option value="selected">Sélectionné</option>
                        <option value="discussed">Discuté</option>
                     </select>
                  ) : (
                    getStatusBadge(patient.rcpStatus)
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link to={`/patients/${patient.id}`} className="text-blue-600 hover:text-blue-900">
                    Détails
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {patientsToDisplay.length === 0 && <p className="text-center text-gray-500 py-8">Aucun dossier trouvé.</p>}
      </div>
    </Card>
  );
};

export default PatientList;