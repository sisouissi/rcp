import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Patient } from '../types';
import { supabaseService } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';

type Status = Patient['rcpStatus'];

const PatientCard: React.FC<{ patient: Patient; isDraggable: boolean }> = ({ patient, isDraggable }) => (
  <div
    draggable={isDraggable}
    onDragStart={(e) => {
      if (isDraggable) {
        e.dataTransfer.setData('patientId', patient.id);
        e.dataTransfer.effectAllowed = 'move';
      }
    }}
    className={`bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed'}`}
  >
    <Link to={`/patients/${patient.id}`} className="group">
        <p className="font-semibold text-slate-800 group-hover:text-blue-600">{patient.name}</p>
        <p className="text-sm text-slate-500">{patient.hospitalId}</p>
        <div className="mt-2 flex justify-between items-center">
        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            {patient.tnm.stage}
        </span>
        <p className="text-xs text-slate-400">Soumis par: {patient.submittedByName}</p>
        </div>
    </Link>
  </div>
);

const RcpColumn: React.FC<{
  title: string;
  status: Status;
  patients: Patient[];
  onDrop: (patientId: string, status: Status) => void;
  canDrop: boolean;
}> = ({ title, status, patients, onDrop, canDrop }) => {
  const [isOver, setIsOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (canDrop) {
      e.preventDefault();
      setIsOver(true);
    }
  };

  const handleDragLeave = () => setIsOver(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (canDrop) {
      const patientId = e.dataTransfer.getData('patientId');
      onDrop(patientId, status);
      setIsOver(false);
    }
  };

  const statusStyles = {
    pending: { bg: 'bg-yellow-50', border: 'border-yellow-400' },
    selected: { bg: 'bg-blue-50', border: 'border-blue-400' },
    discussed: { bg: 'bg-green-50', border: 'border-green-400' },
  };

  const { bg, border } = statusStyles[status];

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 min-w-[300px] rounded-lg p-4 ${bg} border-2 border-dashed ${isOver && canDrop ? border : 'border-transparent'} transition-colors`}
    >
      <h2 className="text-lg font-bold text-slate-700 mb-4 px-2">{title} ({patients.length})</h2>
      <div className="space-y-3 h-full overflow-y-auto pr-2">
        {patients.length > 0 ? (
          patients.map(p => (
            <PatientCard key={p.id} patient={p} isDraggable={status !== 'discussed' && canDrop} />
          ))
        ) : (
          <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
            {canDrop ? "Glissez-déposez un dossier ici" : "Aucun dossier"}
          </div>
        )}
      </div>
    </div>
  );
};

const RcpBoard: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPatients = async () => {
    setIsLoading(true);
    try {
      const data = await supabaseService.getAllPatients();
      setPatients(data);
    } catch (error) {
      console.error("Failed to fetch patients", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handlePatientStatusUpdate = async (patientId: string, newStatus: Status) => {
    const patientToUpdate = patients.find(p => p.id === patientId);
    if (patientToUpdate && patientToUpdate.rcpStatus !== newStatus) {
      // Optimistic update
      setPatients(prev => prev.map(p => p.id === patientId ? { ...p, rcpStatus: newStatus } : p));
      
      try {
        await supabaseService.updatePatient({ ...patientToUpdate, rcpStatus: newStatus });
      } catch (error) {
        console.error("Failed to update patient status", error);
        // Rollback on error
        setPatients(prev => prev.map(p => p.id === patientId ? { ...p, rcpStatus: patientToUpdate.rcpStatus } : p));
      }
    }
  };

  const filteredPatients = useMemo(() => ({
    pending: patients.filter(p => p.rcpStatus === 'pending').sort((a,b) => a.name.localeCompare(b.name)),
    selected: patients.filter(p => p.rcpStatus === 'selected').sort((a,b) => a.name.localeCompare(b.name)),
    discussed: patients.filter(p => p.rcpStatus === 'discussed').sort((a, b) => {
        // Sort by the most recent decision date, descending.
        // Assumes rcpHistory is sorted descending, which it is from PatientDetail.
        const dateA = a.rcpHistory[0]?.date ? new Date(a.rcpHistory[0].date).getTime() : 0;
        const dateB = b.rcpHistory[0]?.date ? new Date(b.rcpHistory[0].date).getTime() : 0;
        if (dateB !== dateA) return dateB - dateA;
        return a.name.localeCompare(b.name); // Fallback to name sort
    }),
  }), [patients]);

  if (isLoading) {
    return <div>Chargement de la salle de RCP...</div>;
  }
  
  if (!user) {
    return <div>Utilisateur non trouvé.</div>;
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Salle de RCP</h1>
      {!isAdmin && <p className="text-slate-600">Vue en lecture seule. Seuls les administrateurs peuvent organiser les dossiers.</p>}
      
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
        <RcpColumn
          title="À Discuter"
          status="pending"
          patients={filteredPatients.pending}
          onDrop={handlePatientStatusUpdate}
          canDrop={isAdmin}
        />
        <RcpColumn
          title="Sélectionnés pour RCP"
          status="selected"
          patients={filteredPatients.selected}
          onDrop={handlePatientStatusUpdate}
          canDrop={isAdmin}
        />
        <RcpColumn
          title="Discutés"
          status="discussed"
          patients={filteredPatients.discussed}
          onDrop={handlePatientStatusUpdate}
          canDrop={false} // Can't drop into 'discussed' by design
        />
      </div>
    </div>
  );
};

export default RcpBoard;