import React, { useState, useEffect } from 'react';
import { User, Shield, Briefcase, Plus, X, Lock, Trash2, Edit, CheckCircle, Ban, Search } from 'lucide-react';
import { API_LOCAL } from '../services/db';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ id: null, name: '', email: '', password: '', role: 'operator' });
    const [session, setSession] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const sess = JSON.parse(localStorage.getItem('gymar_session') || '{}');
        setSession(sess);
        fetchUsers(sess.gymId);
    }, []);

    const fetchUsers = async (gymId) => {
        try {
            // Se estivermos em modo local puro (sem backend node), podemos usar localStorage como fallback
            // Mas seguindo o padrão existente, vamos tentar o fetch.
            // Ajustamos para usar a URL dinâmica definida no db.js ou window.location
            const baseUrl = API_LOCAL || 'http://localhost:3001/api';
            const targetUrl = gymId ? `${baseUrl}/system-users?gymId=${gymId}` : `${baseUrl}/system-users`;

            const res = await fetch(targetUrl).catch(() => null);
            if (res && res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                // Fallback demo data se falhar conexão
                console.warn("Falha ao carregar utilizadores do servidor, usando dados locais/demo.");
                // Opcional: Ler de localStorage se implementado
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const baseUrl = API_LOCAL || 'http://localhost:3001/api';
            const method = formData.id ? 'PUT' : 'POST';
            const url = formData.id ? `${baseUrl}/system-users/${formData.id}` : `${baseUrl}/system-users`;

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, gymId: session.gymId })
            });

            if (res.ok) {
                alert(formData.id ? 'Utilizador atualizado!' : 'Utilizador criado!');
                setShowModal(false);
                setFormData({ id: null, name: '', email: '', password: '', role: 'operator' });
                fetchUsers(session.gymId);
            } else {
                const errData = await res.json().catch(() => ({}));
                alert('Erro: ' + (errData.error || 'Falha na operação'));
            }
        } catch (error) {
            alert('Erro de conexão.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Tem a certeza que deseja eliminar este utilizador?")) return;
        try {
            const baseUrl = API_LOCAL || 'http://localhost:3001/api';
            const res = await fetch(`${baseUrl}/system-users/${id}`, { method: 'DELETE' });
            if (res.ok) fetchUsers(session.gymId);
        } catch (e) { alert("Erro ao eliminar."); }
    };

    const openEdit = (user) => {
        setFormData({ ...user, password: '' }); // Limpar senha para não mostrar hash
        setShowModal(true);
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role) => {
        switch (role) {
            case 'gym_admin':
                return <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)] flex items-center gap-1"><Shield size={12} /> ADMIN</span>;
            case 'manager':
                return <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20 flex items-center gap-1"><Briefcase size={12} /> GERENTE</span>;
            default:
                return <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-1"><User size={12} /> OPERADOR</span>;
        }
    };

    return (
        <div className="users-page animate-fade-in p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Equipa do Ginásio</h2>
                    <p className="text-gray-400">Gerir acessos de Gerentes e Operadores do Sistema.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar utilizador..."
                            className="bg-slate-900/50 border border-slate-700 text-gray-200 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-64 pl-10 p-2.5 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => { setFormData({ id: null, name: '', email: '', password: '', role: 'operator' }); setShowModal(true); }}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} /> Novo Utilizador
                    </button>
                </div>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-xl mb-8 flex items-start gap-3 backdrop-blur-sm">
                <Briefcase size={20} className="text-blue-400 mt-1 flex-shrink-0" />
                <div>
                    <h3 className="text-blue-400 font-bold text-sm mb-1">Aviso Importante</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">
                        Esta secção é, apenas para gerir quem pode <strong className="text-white">aceder ao sistema</strong> (Fazer Login).<br />
                        Se procura pela <strong>Folha de Salários</strong> ou gestão de contratos de staff, aceda ao menu
                        <a href="/instructors" className="text-blue-400 font-bold ml-1 hover:underline hover:text-blue-300 transition-colors">Equipa & Salários</a>.
                    </p>
                </div>
            </div>

            <div className="card table-card overflow-hidden border border-slate-700/50 shadow-2xl rounded-xl custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-800/80 text-gray-400 text-xs uppercase sticky top-0 backdrop-blur-md z-10">
                        <tr>
                            <th className="p-4 font-bold tracking-wider">Nome / Utilizador</th>
                            <th className="p-4 font-bold tracking-wider">Email (Login)</th>
                            <th className="p-4 font-bold tracking-wider text-center">Cargo</th>
                            <th className="p-4 font-bold tracking-wider text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                        {loading ? (
                            <tr><td colSpan="4" className="p-8 text-center text-gray-500">A carregar equipa...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan="4" className="p-8 text-center text-gray-500 italic">Nenhum utilizador encontrado.</td></tr>
                        ) : filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-800/30 transition-colors group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-lg ${u.role === 'gym_admin' ? 'bg-gradient-to-br from-red-500/20 to-pink-600/20 text-red-200 border-red-500/30' : 'bg-gradient-to-br from-slate-700 to-slate-800 text-slate-300 border-slate-600'}`}>
                                            <span className="font-bold text-sm">{u.name?.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-white text-sm">{u.name}</p>
                                            <p className="text-xs text-slate-500">ID: {u.id?.toString().substring(0, 8)}...</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-gray-300 font-mono">{u.email}</td>
                                <td className="p-4 text-center">{getRoleBadge(u.role)}</td>
                                <td className="p-4">
                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openEdit(u)}
                                            className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        {u.role !== 'gym_admin' && (
                                            <button
                                                onClick={() => handleDelete(u.id)}
                                                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL CRIAR / EDITAR */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl relative">
                        <div className="absolute inset-0 bg-blue-500/5 rounded-2xl pointer-events-none"></div>
                        <div className="flex justify-between items-center mb-6 relative z-10">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {formData.id ? <Edit size={20} className="text-blue-400" /> : <Plus size={20} className="text-blue-400" />}
                                {formData.id ? 'Editar Utilizador' : 'Novo Membro'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4 relative z-10">
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-4">
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold uppercase mb-1 ml-1">Nome Completo</label>
                                    <input className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                                        required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ex: João Silva" />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold uppercase mb-1 ml-1">Email (Login)</label>
                                    <input type="email" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm"
                                        required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="usuario@hefelgym.com" />
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold uppercase mb-1 ml-1 flex justify-between">
                                        Senha
                                        {formData.id && <span className="text-[10px] text-yellow-500/80 font-normal normal-case">(Deixe em branco para manter)</span>}
                                    </label>
                                    <div className="relative">
                                        <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm pl-10"
                                            required={!formData.id}
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="••••••••" />
                                        <Lock size={14} className="absolute left-3 top-3 text-slate-500" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-slate-400 text-xs font-bold uppercase mb-1 ml-1">Função / Cargo</label>
                                    <select className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
                                        value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                        <option value="operator">Operador (Apenas Vendas/Pagamentos)</option>
                                        <option value="manager">Gerente (Acesso Total Local)</option>
                                        <option value="gym_admin">Administrador (Gestão Total)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-lg font-bold border border-slate-700 transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-lg font-bold shadow-lg shadow-blue-900/20 flex justify-center items-center gap-2 transition-all transform hover:scale-[1.02]">
                                    <CheckCircle size={18} /> {formData.id ? 'Salvar Alterações' : 'Criar Conta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
