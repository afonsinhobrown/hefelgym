import React, { useState } from 'react';
import { Building, Users, Wallet, Activity, Plus, MoreVertical, Lock, Unlock, Server } from 'lucide-react';

const SuperAdminDashboard = () => {
    // Mock Data - Futuramente virá do Supabase
    const [gyms, setGyms] = useState([
        { id: 'hefel_gym_v1', name: 'Hefel Gym', owner: 'Admin Hefel', status: 'active', plan: 'Enterprise', users: 124, revenue: '5,000 MT' },
        { id: 'iron_pump', name: 'Iron Pump Gym', owner: 'Carlos Mac', status: 'pending', plan: 'Pro', users: 0, revenue: '0 MT' }
    ]);

    return (
        <div className="super-admin-dash animate-fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="kpi-card bg-blue-950/30 border border-blue-900/50 p-6 rounded-2xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-blue-400 text-sm font-medium mb-1">Ginásios Ativos</p>
                            <h3 className="text-3xl font-bold text-white">1</h3>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-lg">
                            <Building className="text-blue-400" size={24} />
                        </div>
                    </div>
                </div>
                <div className="kpi-card bg-emerald-950/30 border border-emerald-900/50 p-6 rounded-2xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-emerald-400 text-sm font-medium mb-1">Receita Recorrente (MRR)</p>
                            <h3 className="text-3xl font-bold text-white">5.000 MT</h3>
                        </div>
                        <div className="p-3 bg-emerald-500/10 rounded-lg">
                            <Wallet className="text-emerald-400" size={24} />
                        </div>
                    </div>
                </div>
                <div className="kpi-card bg-purple-950/30 border border-purple-900/50 p-6 rounded-2xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-purple-400 text-sm font-medium mb-1">Total Utentes (Global)</p>
                            <h3 className="text-3xl font-bold text-white">124</h3>
                        </div>
                        <div className="p-3 bg-purple-500/10 rounded-lg">
                            <Users className="text-purple-400" size={24} />
                        </div>
                    </div>
                </div>
                <div className="kpi-card bg-orange-950/30 border border-orange-900/50 p-6 rounded-2xl">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-orange-400 text-sm font-medium mb-1">Status Servidores</p>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online
                            </h3>
                        </div>
                        <div className="p-3 bg-orange-500/10 rounded-lg">
                            <Activity className="text-orange-400" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Gyms Table */}
            <div className="bg-[#1e293b] border border-gray-800 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-white">Clientes (Ginásios)</h2>
                        <p className="text-sm text-gray-400">Gerencie as licenças e acessos dos seus clientes.</p>
                    </div>
                    <button className="btn btn-primary flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium">
                        <Plus size={18} /> Novo Ginásio
                    </button>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-900/50 text-gray-400 text-sm uppercase tracking-wider">
                            <th className="p-4 font-medium">Ginásio</th>
                            <th className="p-4 font-medium">Dono</th>
                            <th className="p-4 font-medium">Plano</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium">Receita</th>
                            <th className="p-4 font-medium text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {gyms.map(gym => (
                            <tr key={gym.id} className="hover:bg-gray-800/50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center font-bold text-gray-300">
                                            {gym.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{gym.name}</p>
                                            <p className="text-xs text-gray-500">{gym.id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-gray-300">{gym.owner}</td>
                                <td className="p-4">
                                    <span className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md text-xs font-medium">
                                        {gym.plan}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${gym.status === 'active'
                                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                        }`}>
                                        {gym.status === 'active' ? 'Ativo' : 'Pendente'}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-300 font-mono">{gym.revenue}</td>
                                <td className="p-4 text-right">
                                    <button className="p-2 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors">
                                        <MoreVertical size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Server Config Teaser */}
            <div className="mt-8 bg-black/20 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Server size={20} className="text-gray-400" /> Infraestrutura
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 flex justify-between items-center">
                        <div>
                            <p className="text-gray-400 text-sm">Base de Dados (Supabase)</p>
                            <p className="text-green-400 font-medium text-sm mt-1">Conectado</p>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800 flex justify-between items-center">
                        <div>
                            <p className="text-gray-400 text-sm">Serviço WhatsApp (Bot)</p>
                            <p className="text-green-400 font-medium text-sm mt-1">Online (Porta 3001)</p>
                        </div>
                        <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
