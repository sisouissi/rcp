

import React, { useEffect, useState } from 'react';
import { Card } from './ui/Card';
import { settingsService } from '../services/settingsService';
import { useAuth } from '../contexts/AuthContext';
import { supabaseService } from '../services/supabaseService';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [rcpDate, setRcpDate] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ successCount: number; errorCount: number; errors: any[] } | null>(null);


  useEffect(() => {
    const currentDate = settingsService.getNextRcpDate();
    setRcpDate(currentDate);
  }, []);
  
  const handleSaveSettings = () => {
    settingsService.setNextRcpDate(rcpDate);
    setSettingsSuccess("Paramètres enregistrés avec succès.");
    setTimeout(() => setSettingsSuccess(null), 3000);
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        setImportFile(e.target.files[0]);
        setImportResult(null); // Reset result when new file is selected
    }
  };

  const handleImport = async () => {
    if (!importFile || !user) return;

    setIsImporting(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const content = event.target?.result as string;
            const data = JSON.parse(content);
            if (!Array.isArray(data)) {
                throw new Error("Le fichier JSON doit contenir un tableau de patients.");
            }
            const result = await supabaseService.importPatients(data, user.id);
            setImportResult(result);
        } catch (e) {
            const error = e instanceof Error ? e.message : "Erreur lors de la lecture ou de l'analyse du fichier.";
            setImportResult({ successCount: 0, errorCount: 0, errors: [{ record: 'Fichier', error }] });
        } finally {
            setIsImporting(false);
            // Reset file input
            const fileInput = document.getElementById('import-file-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            setImportFile(null);
        }
    };
    reader.readAsText(importFile);
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
      
      <Card title="Importer des données">
        <div className="space-y-4">
            <div>
                <h3 className="text-lg font-medium text-slate-900">Importer des dossiers patients</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Téléversez un fichier JSON contenant un tableau de patients. Le système tentera de mapper les champs automatiquement.
                </p>
            </div>
            <div className="flex items-center space-x-4">
              <input 
                id="import-file-input"
                type="file" 
                accept=".json" 
                onChange={handleFileSelect} 
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button
                onClick={handleImport}
                disabled={!importFile || isImporting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                {isImporting ? 'Importation...' : 'Lancer l\'importation'}
              </button>
            </div>

            {isImporting && (
                <div className="flex items-center justify-center py-4">
                    <svg className="animate-spin h-5 w-5 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Traitement du fichier, veuillez patienter...</span>
                </div>
            )}
            
            {importResult && (
              <div className="mt-4 p-4 border rounded-md">
                <h4 className="font-semibold">Résultat de l'importation :</h4>
                <p className="text-green-600">{importResult.successCount} dossier(s) importé(s) avec succès.</p>
                <p className="text-red-600">{importResult.errorCount} dossier(s) en erreur.</p>
                {importResult.errors && importResult.errors.length > 0 && (
                   <div className="mt-2">
                     <h5 className="font-semibold text-sm">Détails des erreurs :</h5>
                     <ul className="text-sm list-disc list-inside max-h-40 overflow-y-auto bg-slate-50 p-2 rounded">
                        {importResult.errors.map((e, index) => (
                           <li key={index}><strong>Dossier {e.record}:</strong> {e.error}</li>
                        ))}
                     </ul>
                   </div>
                )}
              </div>
            )}
        </div>
      </Card>
    </div>
  );
};

export default Settings;