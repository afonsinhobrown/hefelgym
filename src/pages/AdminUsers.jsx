import React, { useState, useEffect } from 'react';
import { User, Shield, Briefcase, Plus, X, Lock } from 'lucide-react';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'operator' });
    const [session, setSession] = useState({});

    useEffect(() => {
        const sess = JSON.parse(localStorage.getItem('gymar_session') || '{}');
        setSession(sess);
        fetchUsers(sess.gymId);
    }, []);

    const fetchUsers = async (gymId) => {
        try {
            if (!gymId) return;
            const res = await fetch(`http://localhost:3001/api/system-users?gymId=${gymId}`);
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3001/api/system-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, gymId: session.gymId })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Utilizador criado com sucesso!');
                setShowModal(false);
                setFormData({ name: '', email: '', password: '', role: 'operator' });
                fetchUsers(session.gymId);
            } else {
                alert('Erro: ' + data.error);
            }
        } catch (error) {
            alert('Erro ao criar utilizador.');
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'gym_admin': return <span className="px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-bold border border-red-500/30">ADMIN</span>;
            case 'manager': return <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold border border-blue-500/30">GERENTE</span>;
            default: return <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold border border-green-500/30">OPERADOR</span>;
        }
    };

    return (
        <div className="animate-fade-in p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Equipa do Ginásio</h1>
                    <p className="text-gray-400">Gerir acessos de Gerentes e Operadores.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition-all"
                >
                    <Plus size={18} /> Novo Utilizador
                </button>
            </div>

            {loading ? <p className="text-gray-400">A carregar...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map((u) => (
                        <div key={u.id} className="bg-slate-800 border border-slate-700 p-5 rounded-xl flex items-center justify-between shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${u.role === 'gym_admin' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                                    {u.role === 'gym_admin' ? <Shield size={20} /> : <User size={20} />}
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">{u.name}</h3>
                                    <p className="text-xs text-gray-400">{u.email}</p>
                                </div>
                            </div>
                            {getRoleBadge(u.role)}
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL CRIAR UTILIZADOR */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                    <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">Novo Membro</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Nome Completo</label>
                                <input className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                                    required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Email (Login)</label>
                                <input type="email" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                                    required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Senha</label>
                                <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                                    required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-gray-400 text-sm mb-1">Função / Cargo</label>
                                <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white outline-none focus:border-blue-500"
                                    value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                    <option value="operator">Operador (Apenas Vendas/Pagamentos)</option>
                                    <option value="manager">Gerente (Acesso Total Local)</option>
                                </select>
                            </div>

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold mt-4 flex justify-center items-center gap-2">
                                <Plus size={18} /> Criar Conta
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
