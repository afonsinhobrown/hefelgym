import React, { useState, useEffect } from 'react';
import { Building, Plus, MoreVertical, CheckCircle, XCircle } from 'lucide-react';

import { supabase } from '../services/supabase';

const AdminGyms = () => {
    const [gyms, setGyms] = useState([]); // Começa VAZIO (Realidade)
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGyms();
    }, []);

    const fetchGyms = async () => {
        if (!supabase) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase.from('tenants').select('*');
        if (data) setGyms(data);
        setLoading(false);
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Gestão de Ginásios</h1>
                    <p className="text-gray-400">Lista de todos os clientes do SaaS GYMAR.</p>
                </div>
                <button className="btn btn-primary flex items-center gap-2" onClick={() => alert("Funcionalidade de Criar Ginásio será ligada ao Supabase.")}>
                    <Plus size={18} /> Novo Ginásio
                </button>
            </div>

            <div className="bg-[#1e293b] border border-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-900/50 text-gray-400 text-sm uppercase tracking-wider">
                            <th className="p-4 font-medium">Nome</th>
                            <th className="p-4 font-medium">Email Admin</th>
                            <th className="p-4 font-medium">Plano</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {gyms.map(gym => (
                            <tr key={gym.id} className="hover:bg-gray-800/50 transition-colors">
                                <td className="p-4 text-white font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-blue-600/20 text-blue-500 flex items-center justify-center">
                                            <Building size={16} />
                                        </div>
                                        {gym.name}
                                    </div>
                                </td>
                                <td className="p-4 text-gray-300">{gym.email}</td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-xs">
                                        {gym.plan}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {gym.status === 'active' ? (
                                        <span className="flex items-center gap-1 text-green-400 text-sm"><CheckCircle size={14} /> Ativo</span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-red-400 text-sm"><XCircle size={14} /> Inativo</span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <button className="p-2 hover:bg-gray-700 rounded text-gray-400 hover:text-white">
                                        <MoreVertical size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminGyms;
