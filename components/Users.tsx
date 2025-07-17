import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabaseService } from '../services/supabaseService';
import { Profile } from '../types';
import { Card } from './ui/Card';
import { Modal } from './ui/Modal';

const Users: React.FC = () => {
    const { user } = useAuth();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const [isInviteModalOpen, setInviteModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [editFormData, setEditFormData] = useState({ fullName: '', specialty: '', role: 'doctor' });
    const [inviteFormData, setInviteFormData] = useState({ email: '', role: 'doctor' });
    
    const fetchProfiles = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await supabaseService.getAllProfiles();
            // Fetch emails separately for demo mode convenience
            if (process.env.SUPABASE_URL === "https://placeholder.supabase.co") {
                const { mockUsers } = await import('../data/mockData');
                data.forEach(p => {
                    const mock = mockUsers.find(m => m.id === p.id);
                    if(mock) p.email = mock.email;
                });
            }
            setProfiles(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur lors de la récupération des profils.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user?.role === 'admin') {
            fetchProfiles();
        }
    }, [user, fetchProfiles]);

    const openEditModal = (profile: Profile) => {
        setSelectedUser(profile);
        setEditFormData({ fullName: profile.full_name, specialty: profile.specialty || '', role: profile.role });
        setEditModalOpen(true);
    };

    const openDeleteModal = (profile: Profile) => {
        setSelectedUser(profile);
        setDeleteModalOpen(true);
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await supabaseService.inviteUser(inviteFormData.email, inviteFormData.role as 'admin' | 'doctor');
            alert("Invitation envoyée avec succès !");
            setInviteModalOpen(false);
            fetchProfiles(); // Refresh list
        } catch (err) {
            alert(err instanceof Error ? err.message : "Erreur lors de l'invitation.");
        }
    };
    
    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        try {
            await supabaseService.updateUserProfile(selectedUser.id, {
                full_name: editFormData.fullName,
                specialty: editFormData.specialty,
                role: editFormData.role as 'admin' | 'doctor',
            });
            setEditModalOpen(false);
            fetchProfiles();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Erreur lors de la mise à jour.");
        }
    };

    const handleDelete = async () => {
        if (!selectedUser) return;
        try {
            await supabaseService.deleteUser(selectedUser.id);
            setDeleteModalOpen(false);
            fetchProfiles();
        } catch (err) {
             alert(err instanceof Error ? err.message : "Erreur lors de la suppression.");
        }
    };

    if (user?.role !== 'admin') {
        return (
             <Card title="Accès non autorisé">
                <p>Vous devez être administrateur pour accéder à cette page.</p>
             </Card>
        );
    }

    if (isLoading) return <div>Chargement des utilisateurs...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800">Gestion des Utilisateurs</h1>
                <button
                    onClick={() => setInviteModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                    Inviter un utilisateur
                </button>
            </div>

            <Card>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom / Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spécialité</th>
                            <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {profiles.map(p => (
                            <tr key={p.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{p.full_name}</div>
                                    <div className="text-sm text-gray-500">{p.email || 'Email non disponible'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                        {p.role === 'admin' ? 'Administrateur' : 'Médecin'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.specialty || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                    <button onClick={() => openEditModal(p)} className="text-blue-600 hover:text-blue-900">Modifier</button>
                                    <button onClick={() => openDeleteModal(p)} className="text-red-600 hover:text-red-900">Supprimer</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>

            <Modal isOpen={isInviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Inviter un nouvel utilisateur">
                <form onSubmit={handleInvite} className="space-y-4">
                    <div>
                        <label htmlFor="invite-email" className="block text-sm font-medium text-slate-700">Adresse e-mail</label>
                        <input type="email" id="invite-email" value={inviteFormData.email} onChange={e => setInviteFormData({...inviteFormData, email: e.target.value})} required />
                    </div>
                    <div>
                        <label htmlFor="invite-role" className="block text-sm font-medium text-slate-700">Rôle</label>
                        <select id="invite-role" value={inviteFormData.role} onChange={e => setInviteFormData({...inviteFormData, role: e.target.value})}>
                            <option value="doctor">Médecin</option>
                            <option value="admin">Administrateur</option>
                        </select>
                    </div>
                    <div className="pt-4 flex justify-end">
                        <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">Envoyer l'invitation</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isEditModalOpen} onClose={() => setEditModalOpen(false)} title={`Modifier ${selectedUser?.full_name}`}>
                <form onSubmit={handleEdit} className="space-y-4">
                    <div>
                        <label htmlFor="edit-name" className="block text-sm font-medium text-slate-700">Nom complet</label>
                        <input type="text" id="edit-name" value={editFormData.fullName} onChange={e => setEditFormData({...editFormData, fullName: e.target.value})} required />
                    </div>
                     <div>
                        <label htmlFor="edit-specialty" className="block text-sm font-medium text-slate-700">Spécialité</label>
                        <input type="text" id="edit-specialty" value={editFormData.specialty} onChange={e => setEditFormData({...editFormData, specialty: e.target.value})} />
                    </div>
                    <div>
                        <label htmlFor="edit-role" className="block text-sm font-medium text-slate-700">Rôle</label>
                        <select id="edit-role" value={editFormData.role} onChange={e => setEditFormData({...editFormData, role: e.target.value})}>
                            <option value="doctor">Médecin</option>
                            <option value="admin">Administrateur</option>
                        </select>
                    </div>
                    <div className="pt-4 flex justify-end">
                        <button type="submit" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">Enregistrer</button>
                    </div>
                </form>
            </Modal>
            
            <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title={`Supprimer ${selectedUser?.full_name}`}>
                <p>Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible et supprimera son accès à l'application.</p>
                 <div className="pt-6 flex justify-end space-x-3">
                    <button type="button" onClick={() => setDeleteModalOpen(false)} className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">Annuler</button>
                    <button type="button" onClick={handleDelete} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700">Confirmer la suppression</button>
                </div>
            </Modal>
        </div>
    );
};

export default Users;