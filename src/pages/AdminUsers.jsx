import React, { useState, useEffect } from 'react';
import { User, Shield, Briefcase, Plus, X, Lock, Trash2, Edit, CheckCircle, Ban, Search } from 'lucide-react';
import { API_LOCAL, db } from '../services/db';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [staffList, setStaffList] = useState([]); // Store Staff for dropdown
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ id: null, name: '', email: '', password: '', role: 'operator', staffId: null });
    const [session, setSession] = useState({});
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const sess = JSON.parse(localStorage.getItem('gymar_session') || '{}');
        setSession(sess);
        fetchUsers(sess.gymId);
        loadStaff(); // Load staff for the dropdown
    }, []);

    const loadStaff = async () => {
        try {
            await db.init();
            const instructors = await db.instructors.getAll();
            if (Array.isArray(instructors)) {
                setStaffList(instructors);
            }
        } catch (e) {
            console.error("Error loading staff:", e);
        }
    };

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Equipa do Ginásio</h2>
                    <p className="text-gray-400 text-sm">Gerir acessos de Gerentes e Operadores.</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Buscar utilizador..."
                            className="w-full md:w-64 bg-slate-900 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => { setFormData({ id: null, name: '', email: '', password: '', role: 'operator' }); setShowModal(true); }}
                        className="btn btn-primary whitespace-nowrap flex items-center gap-2"
                    >
                        <Plus size={18} /> Novo Utilizador
                    </button>
                </div>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg mb-6 flex items-start gap-3">
                <Briefcase size={20} className="text-blue-400 mt-1 flex-shrink-0" />
                <div>
                    <h3 className="text-blue-400 font-bold text-sm mb-1">Aviso Importante</h3>
                    <p className="text-gray-300 text-xs">
                        Esta secção serve apenas para gerir <strong>Logins de Acesso</strong>.<br />
                        Para Salários e Contratos, vá para <a href="/instructors" className="text-blue-400 font-bold hover:underline">Equipa & Salários</a>.
                    </p>
                </div>
            </div>

            <div className="w-full overflow-hidden border border-slate-700 rounded-lg bg-slate-800 shadow-xl">
                <table className="w-full table-fixed border-collapse">
                    <thead className="bg-slate-900 text-gray-200 text-xs uppercase font-bold border-b border-slate-600">
                        <tr>
                            <th className="p-4 text-left" style={{ width: '35%' }}>Nome / Staff</th>
                            <th className="p-4 text-left" style={{ width: '30%' }}>Email (Login)</th>
                            <th className="p-4 text-center" style={{ width: '15%' }}>Cargo</th>
                            <th className="p-4 text-center" style={{ width: '20%' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {loading ? (
                            <tr><td colSpan="4" className="p-8 text-center text-gray-400">A carregar...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan="4" className="p-8 text-center text-gray-400">Nenhum utilizador encontrado.</td></tr>
                        ) : filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-700/50 transition-colors">
                                <td className="p-4 align-middle overflow-hidden">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 min-w-[2.5rem] rounded-full bg-slate-600 flex items-center justify-center text-white font-bold">
                                            {u.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="truncate">
                                            <div className="font-bold text-white text-sm truncate">{u.name}</div>
                                            {u.staffId && <div className="text-xs text-blue-300">Staff Vinculado</div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 align-middle text-sm text-gray-300 truncate font-mono" title={u.email}>
                                    {u.email}
                                </td>
                                <td className="p-4 align-middle text-center">
                                    {getRoleBadge(u.role)}
                                </td>
                                <td className="p-4 align-middle text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => openEdit(u)}
                                            className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded shadow-md transition-all"
                                            title="Editar"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        {u.role !== 'gym_admin' && (
                                            <button
                                                onClick={() => {
                                                    if (window.confirm(`Tem a certeza que deseja remover o acesso de "${u.name}"?\nIsso NÃO apaga o funcionário da base de dados, apenas o login.`)) {
                                                        handleDelete(u.id);
                                                    }
                                                }}
                                                className="bg-red-600 hover:bg-red-500 text-white p-2 rounded shadow-md transition-all"
                                                title="Eliminar Login"
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
                                    <label className="block text-slate-400 text-xs font-bold uppercase mb-1 ml-1">Membro do Staff</label>
                                    <select
                                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium appearance-none cursor-pointer"
                                        value={formData.staffId || ''}
                                        onChange={(e) => {
                                            const selectedId = e.target.value;
                                            const staff = staffList.find(s => s.id === selectedId);
                                            if (staff) {
                                                setFormData({
                                                    ...formData,
                                                    staffId: staff.id,
                                                    name: staff.name,
                                                    // Auto-generate email based on name if not present
                                                    email: staff.email || `${staff.name.toLowerCase().split(' ')[0]}@hefelgym.com`
                                                });
                                            } else {
                                                // Caso seja 'manual' ou vazio
                                                setFormData({ ...formData, staffId: '', name: '' });
                                            }
                                        }}
                                        disabled={!!formData.id} // Disable if editing existing user (optional, but safer)
                                    >
                                        <option value="">Selecione um funcionário...</option>
                                        {staffList.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.type === 'manager' ? 'Gerência' : 'Staff'})</option>
                                        ))}
                                    </select>
                                    {/* Fallback Display Name if editing or manually set */}
                                    {formData.name && <p className="text-xs text-blue-400 mt-1 ml-1">Selecionado: {formData.name}</p>}
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
