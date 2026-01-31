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
        // Estilos inline para os badges
        const badgeStyle = { padding: '4px 12px', borderRadius: '9999px', fontSize: '12px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px', border: '1px solid transparent' };

        switch (role) {
            case 'gym_admin':
                return <span style={{ ...badgeStyle, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.2)' }}><Shield size={12} /> ADMIN</span>;
            case 'manager':
                return <span style={{ ...badgeStyle, backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.2)' }}><Briefcase size={12} /> GERENTE</span>;
            default:
                return <span style={{ ...badgeStyle, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#34d399', borderColor: 'rgba(16, 185, 129, 0.2)' }}><User size={12} /> OPERADOR</span>;
        }
    };

    // Estilos inline para garantir a visualização correta independentemente do Tailwind
    const styles = {
        container: { padding: '24px', color: 'white', fontFamily: 'system-ui, sans-serif' },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
        title: { fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', color: 'white' },
        subtitle: { color: '#94a3b8', margin: 0, fontSize: '14px' },
        card: { backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden', marginBottom: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
        infoBox: { backgroundColor: 'rgba(30, 58, 138, 0.2)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', gap: '12px' },
        table: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
        th: { backgroundColor: '#0f172a', padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', color: '#94a3b8', borderBottom: '1px solid #334155' },
        td: { padding: '16px', borderBottom: '1px solid #334155', verticalAlign: 'middle', color: '#e2e8f0' }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div>
                    <h2 style={styles.title}>Equipa do Ginásio</h2>
                    <p style={styles.subtitle}>Gerir acessos de Gerentes e Operadores.</p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
                        <input
                            type="text"
                            placeholder="Buscar utilizador..."
                            style={{
                                backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px',
                                padding: '8px 8px 8px 36px', color: 'white', outline: 'none', width: '250px'
                            }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => { setFormData({ id: null, name: '', email: '', password: '', role: 'operator' }); setShowModal(true); }}
                        style={{
                            backgroundColor: '#2563eb', color: 'white', padding: '8px 16px', borderRadius: '6px',
                            border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                        }}
                    >
                        <Plus size={18} /> Novo Utilizador
                    </button>
                </div>
            </div>

            <div style={styles.infoBox}>
                <Briefcase size={20} style={{ color: '#60a5fa', marginTop: '4px' }} />
                <div>
                    <h3 style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '14px', margin: '0 0 4px 0' }}>Aviso Importante</h3>
                    <p style={{ color: '#cbd5e1', fontSize: '13px', margin: 0, lineHeight: '1.5' }}>
                        Esta secção serve apenas para gerir <strong>Logins de Acesso</strong>.<br />
                        Para Salários e Contratos, vá para <span style={{ color: '#60a5fa', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => window.location.href = '/instructors'}>Equipa & Salários</span>.
                    </p>
                </div>
            </div>

            <div style={styles.card}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ ...styles.th, width: '35%' }}>Nome / Staff</th>
                            <th style={{ ...styles.th, width: '30%' }}>Email (Login)</th>
                            <th style={{ ...styles.th, width: '15%', textAlign: 'center' }}>Cargo</th>
                            <th style={{ ...styles.th, width: '20%', textAlign: 'center' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="4" style={{ ...styles.td, textAlign: 'center', color: '#64748b' }}>A carregar...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan="4" style={{ ...styles.td, textAlign: 'center', color: '#64748b' }}>Nenhum utilizador encontrado.</td></tr>
                        ) : filteredUsers.map((u) => (
                            <tr key={u.id} style={{ backgroundColor: 'transparent' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#334155'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <td style={{ ...styles.td }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                                            {u.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ overflow: 'hidden' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.name}</div>
                                            {u.staffId && <div style={{ fontSize: '10px', backgroundColor: '#1e3a8a', color: '#93c5fd', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '2px' }}>VINCULADO</div>}
                                        </div>
                                    </div>
                                </td>
                                <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '13px' }}>
                                    {u.email}
                                </td>
                                <td style={{ ...styles.td, textAlign: 'center' }}>
                                    {getRoleBadge(u.role)}
                                </td>
                                <td style={{ ...styles.td, textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                        <button
                                            onClick={() => openEdit(u)}
                                            style={{ padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: '#3b82f6', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
                                                style={{ padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: '#ef4444', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                    <div style={{ backgroundColor: '#0f172a', padding: '24px', borderRadius: '16px', width: '100%', maxWidth: '450px', border: '1px solid #334155', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {formData.id ? <Edit size={20} color="#60a5fa" /> : <Plus size={20} color="#60a5fa" />}
                                {formData.id ? 'Editar Utilizador' : 'Novo Membro'}
                            </h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Membro do Staff</label>
                                    <select
                                        style={{ width: '100%', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: 'white', outline: 'none' }}
                                        value={formData.staffId || ''}
                                        onChange={(e) => {
                                            const selectedId = e.target.value;
                                            const staff = staffList.find(s => String(s.id) === String(selectedId));
                                            if (staff) {
                                                setFormData({
                                                    ...formData,
                                                    staffId: staff.id,
                                                    name: staff.name,
                                                    email: staff.email || `${staff.name.toLowerCase().split(' ')[0]}@hefelgym.com`
                                                });
                                            } else {
                                                setFormData({ ...formData, staffId: '', name: '' });
                                            }
                                        }}
                                        disabled={!!formData.id}
                                    >
                                        <option value="">Selecione um funcionário...</option>
                                        {staffList.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.type === 'manager' ? 'Gerência' : 'Staff'})</option>
                                        ))}
                                    </select>
                                    {formData.name && <p style={{ fontSize: '12px', color: '#60a5fa', marginTop: '4px' }}>Selecionado: {formData.name}</p>}
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Email (Login)</label>
                                    <input type="email"
                                        style={{ width: '100%', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: 'white', outline: 'none', fontFamily: 'monospace' }}
                                        required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="usuario@hefelgym.com" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>
                                        Senha
                                        {formData.id && <span style={{ fontSize: '10px', color: '#eab308', fontWeight: 'normal', textTransform: 'none', marginLeft: '6px' }}>(Deixe em branco para manter)</span>}
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input type="text"
                                            style={{ width: '100%', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px', padding: '10px 10px 10px 36px', color: 'white', outline: 'none', fontFamily: 'monospace' }}
                                            required={!formData.id}
                                            value={formData.password}
                                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="••••••••" />
                                        <Lock size={14} style={{ position: 'absolute', left: '12px', top: '14px', color: '#64748b' }} />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Função / Cargo</label>
                                    <select
                                        style={{ width: '100%', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px', padding: '10px', color: 'white', outline: 'none' }}
                                        value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                        <option value="operator">Operador (Apenas Vendas/Pagamentos)</option>
                                        <option value="manager">Gerente (Acesso Total Local)</option>
                                        <option value="gym_admin">Administrador (Gestão Total)</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '8px', backgroundColor: '#334155', color: 'white', border: '1px solid #475569', fontWeight: 'bold', cursor: 'pointer' }}>
                                    Cancelar
                                </button>
                                <button type="submit" style={{ flex: 1, padding: '12px', borderRadius: '8px', backgroundColor: '#2563eb', color: 'white', border: 'none', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <CheckCircle size={18} /> {formData.id ? 'Salvar' : 'Criar Conta'}
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
