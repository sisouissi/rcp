

import React, { useEffect, useState } from 'react';
import { Card } from './ui/Card';
import { settingsService } from '../services/settingsService';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [rcpDate, setRcpDate] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

  useEffect(() => {
    const currentDate = settingsService.getNextRcpDate();
    setRcpDate(currentDate);
  }, []);
  
  const handleSaveSettings = () => {
    settingsService.setNextRcpDate(rcpDate);
    setSettingsSuccess("Paramètres enregistrés avec succès.");
    setTimeout(() => setSettingsSuccess(null), 3000);
  };
  
  if (user?.role !== 'admin') {
      return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Paramètres</h1>
             <Card title="Accès non autorisé">
                <p>Vous devez être administrateur pour accéder à cette page.</p>
             </Card>
        </div>
      );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Paramètres</h1>
      
      <Card title="Paramètres de l'application">
        <div className="space-y-6">
          {settingsSuccess && <div className="p-3 bg-green-100 text-green-700 rounded-md">{settingsSuccess}</div>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <h3 className="text-lg font-medium text-slate-900">Prochaine date de RCP</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Cette date sera affichée sur le tableau de bord.
                </p>
                <div className="mt-2">
                  <input
                    type="date"
                    id="rcp-date"
                    value={rcpDate}
                    onChange={(e) => setRcpDate(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              </div>
          </div>
          
           <div className="pt-4 border-t border-slate-200 flex justify-end">
               <button
                onClick={handleSaveSettings}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Enregistrer les paramètres
              </button>
           </div>
        </div>
      </Card>
      
       <Card title="Gestion des Données">
        <div className="space-y-2">
            <h3 className="text-lg font-medium text-slate-900">Sauvegarde des données</h3>
            <p className="mt-1 text-sm text-slate-600">
              La gestion des données (sauvegarde, restauration) est maintenant gérée directement depuis votre console de projet Supabase pour une sécurité et une fiabilité accrues.
            </p>
             <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700">
                Aller au tableau de bord Supabase
             </a>
        </div>
      </Card>
    </div>
  );
};

export default Settings;