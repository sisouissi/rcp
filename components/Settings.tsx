import React, { useEffect, useState } from 'react';
import { Card } from './ui/Card';
import { settingsService } from '../services/settingsService';
import { useAuth } from '../contexts/AuthContext';
import { supabaseService } from '../services/supabaseService';
import { authService } from '../services/authService';
import * as XLSX from 'xlsx';

const Settings: React.FC = () => {
  const { user, refreshUser } = useAuth();

  // State for user profile section
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileSpecialty, setProfileSpecialty] = useState(user?.specialty || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // State for password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // State for admin settings
  const [rcpDate, setRcpDate] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);
  
  // State for import
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ successCount: number; errorCount: number; errors: any[] } | null>(null);


  useEffect(() => {
    if(user?.role === 'admin') {
      const currentDate = settingsService.getNextRcpDate();
      setRcpDate(currentDate);
    }
    setProfileName(user?.name || '');
    setProfileSpecialty(user?.specialty || '');
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setProfileError('');
    setProfileSuccess('');
    try {
        await supabaseService.updateUserProfile(user.id, { full_name: profileName, specialty: profileSpecialty, role: user.role });
        await refreshUser();
        setProfileSuccess("Profil mis à jour avec succès.");
    } catch (err) {
        setProfileError(err instanceof Error ? err.message : "Erreur lors de la mise à jour du profil.");
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (newPassword.length < 6) {
        setPasswordError("Le mot de passe doit contenir au moins 6 caractères.");
        return;
    }
    if (newPassword !== confirmPassword) {
        setPasswordError("Les mots de passe ne correspondent pas.");
        return;
    }
    try {
        await authService.updateUserPassword(newPassword);
        setPasswordSuccess("Mot de passe mis à jour avec succès.");
        setNewPassword('');
        setConfirmPassword('');
    } catch (err) {
        setPasswordError(err instanceof Error ? err.message : "Erreur lors de la mise à jour du mot de passe.");
    }
  };
  
  const handleSaveRcpDate = () => {
    settingsService.setNextRcpDate(rcpDate);
    setSettingsSuccess("Date de RCP enregistrée avec succès.");
    setTimeout(() => setSettingsSuccess(null), 3000);
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        setImportFile(e.target.files[0]);
        setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!importFile || !user) return;
    setIsImporting(true);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const fileContent = event.target?.result;
            if (!fileContent) throw new Error("Impossible de lire le fichier.");
            
            let data: any[];
            if (importFile.name.endsWith('.json')) {
                data = JSON.parse(fileContent as string);
            } else if (importFile.name.endsWith('.xlsx') || importFile.name.endsWith('.xls')) {
                 const workbook = XLSX.read(fileContent, { type: 'array' });
                 const sheetName = workbook.SheetNames[0];
                 const worksheet = workbook.Sheets[sheetName];
                 data = XLSX.utils.sheet_to_json(worksheet);
            } else {
                throw new Error("Format de fichier non supporté. Veuillez utiliser JSON ou Excel (.xlsx).");
            }

            const result = await supabaseService.importPatients(data, user.id);
            setImportResult(result);
        } catch (e) {
            const error = e instanceof Error ? e.message : "Erreur lors de l'analyse du fichier.";
            setImportResult({ successCount: 0, errorCount: 0, errors: [{ record: 'Fichier', error }] });
        } finally {
            setIsImporting(false);
        }
    };
    reader.readAsArrayBuffer(importFile);
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Paramètres</h1>
      
      <Card title="Mon Compte">
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <h3 className="text-lg font-medium text-slate-900 border-b border-slate-200 pb-2">Informations du profil</h3>
          {profileSuccess && <div className="p-3 bg-green-100 text-green-700 rounded-md">{profileSuccess}</div>}
          {profileError && <div className="p-3 bg-red-100 text-red-700 rounded-md">{profileError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profileName" className="block text-sm font-medium text-slate-700">Nom complet</label>
              <input type="text" id="profileName" value={profileName} onChange={e => setProfileName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="profileSpecialty" className="block text-sm font-medium text-slate-700">Spécialité</label>
              <input type="text" id="profileSpecialty" value={profileSpecialty} onChange={e => setProfileSpecialty(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">Mettre à jour le profil</button>
          </div>
        </form>

        <form onSubmit={handlePasswordChange} className="space-y-4 pt-6 mt-6 border-t border-slate-200">
          <h3 className="text-lg font-medium text-slate-900 border-b border-slate-200 pb-2">Changer le mot de passe</h3>
          {passwordSuccess && <div className="p-3 bg-green-100 text-green-700 rounded-md">{passwordSuccess}</div>}
          {passwordError && <div className="p-3 bg-red-100 text-red-700 rounded-md">{passwordError}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700">Nouveau mot de passe</label>
              <input type="password" id="newPassword" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">Confirmer le mot de passe</label>
              <input type="password" id="confirmPassword" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
          </div>
           <div className="flex justify-end">
            <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">Changer le mot de passe</button>
          </div>
        </form>
      </Card>
      
      {user?.role === 'admin' && (
        <div className="space-y-8">
          <h2 className="text-2xl font-semibold text-gray-700 border-b pb-2">Administration</h2>
          <Card title="Paramètres de l'application">
            <div className="space-y-4">
              {settingsSuccess && <div className="p-3 bg-green-100 text-green-700 rounded-md">{settingsSuccess}</div>}
              <div>
                  <label htmlFor="rcp-date" className="block text-sm font-medium text-slate-700">Prochaine date de RCP</label>
                  <p className="mt-1 text-xs text-slate-600">Cette date sera affichée sur le tableau de bord.</p>
                  <input type="date" id="rcp-date" value={rcpDate} onChange={(e) => setRcpDate(e.target.value)} className="mt-1 max-w-xs" />
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-end">
                  <button onClick={handleSaveRcpDate} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">Enregistrer</button>
              </div>
            </div>
          </Card>
          
          <Card title="Importer des données">
            <div className="space-y-4">
                <p className="text-sm text-slate-600">Téléversez un fichier Excel (.xlsx) ou JSON pour importer des dossiers patients en masse.</p>
                <div className="flex items-center space-x-4">
                  <input type="file" accept=".json, .xlsx, .xls" onChange={handleFileSelect} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  <button onClick={handleImport} disabled={!importFile || isImporting} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:bg-slate-400">
                    {isImporting ? 'Importation...' : 'Importer'}
                  </button>
                </div>
                {importResult && (
                  <div className="mt-4 p-4 border rounded-md bg-slate-50">
                    <h4 className="font-semibold">Résultat de l'importation :</h4>
                    <p className="text-green-600">{importResult.successCount} dossier(s) importé(s) avec succès.</p>
                    <p className="text-red-600">{importResult.errorCount} dossier(s) en erreur.</p>
                    {importResult.errors.length > 0 && (
                      <details className="mt-2 text-sm">
                        <summary className="cursor-pointer font-medium text-slate-600">Voir les détails des erreurs</summary>
                        <ul className="list-disc list-inside max-h-40 overflow-y-auto bg-white p-2 rounded mt-1">
                            {importResult.errors.map((e, index) => <li key={index}><strong>Dossier {e.record}:</strong> {e.error}</li>)}
                        </ul>
                      </details>
                    )}
                  </div>
                )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Settings;