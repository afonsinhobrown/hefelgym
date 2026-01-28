import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Lock, Mail, ArrowRight, AlertTriangle } from 'lucide-react';
import { supabase } from '../services/supabase';
import { API_LOCAL } from '../services/db';

// Função auxiliar para criar hash simples (apenas demonstração visual de encriptação)
const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
};

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Register Modal State
    const [showRegisterModal, setShowRegisterModal] = useState(false);
    const [activeTab, setActiveTab] = useState('new_gym'); // 'new_gym' or 'existing_gym_user'
    const [gymsList, setGymsList] = useState([]);

    const [showServerConfig, setShowServerConfig] = useState(false);
    const [serverHistory, setServerHistory] = useState(() => {
        const saved = localStorage.getItem('server_history');
        return saved ? JSON.parse(saved) : ['10.214.174.159:3001', 'localhost:3001', '192.168.1.18:3001'];
    });

    const updateServer = (ip) => {
        if (!ip) return;
        localStorage.setItem('custom_server_url', `http://${ip}/api`);
        const newHistory = [ip, ...serverHistory.filter(h => h !== ip)].slice(0, 5);
        localStorage.setItem('server_history', JSON.stringify(newHistory));
        window.location.reload();
    };

    // Form Data generic
    const [regData, setRegData] = useState({
        gymName: '', gymAddress: '', gymNuit: '',
        adminName: '', adminEmail: '', adminPassword: '',
        cloneData: true,
        selectedGymId: '',
        newAdminRole: 'gym_admin'
    });

    // Fetch Gyms on Modal Open
    const fetchGyms = async () => {
        try {
            const res = await fetch(`${API_LOCAL}/admin/gyms`);
            const data = await res.json();
            setGymsList(data);
        } catch (e) {
            console.error("Erro ao buscar ginásios", e);
        }
    };

    const handleRegisterAction = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (activeTab === 'new_gym') {
                // Registrar NOVO Ginásio
                const res = await fetch(`${API_LOCAL}/admin/register-gym`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(regData)
                });
                const data = await res.json();
                if (res.ok) {
                    alert(`✅ Ginásio "${regData.gymName}" criado com sucesso!\nAdmin: ${regData.adminEmail}`);
                    setShowRegisterModal(false);
                    setRegData({ ...regData, gymName: '', gymAddress: '', gymNuit: '', adminName: '', adminEmail: '', adminPassword: '' });
                } else {
                    throw new Error(data.error);
                }
            } else {
                // Registrar User em Ginásio EXISTENTE
                if (!regData.selectedGymId) throw new Error("Selecione um ginásio");

                const res = await fetch(`${API_LOCAL}/system-users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: regData.adminName,
                        email: regData.adminEmail,
                        password: regData.adminPassword,
                        role: regData.newAdminRole,
                        gymId: regData.selectedGymId
                    })
                });
                const data = await res.json();
                if (res.ok) {
                    alert(`✅ Utilizador criado para o ginásio selecionado!`);
                    setShowRegisterModal(false);
                } else {
                    throw new Error(data.error);
                }
            }
        } catch (err) {
            alert('Erro: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. TENTATIVA CLOUD (SUPABASE AUTH)
            let { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            let session = null;
            let token = null;

            if (!authError && data.user) {
                // SUCESSO CLOUD
                token = data.session.access_token;
                session = {
                    user: data.user.email,
                    role: data.user.email.includes('super') ? 'super_admin' : 'gym_admin',
                    gymId: 'hefel_gym_v1',
                    token: token,
                    encryptedData: true
                };
            }
            else {
                // FALLBACK LOCAL: Tentar autenticar via API Local (SQLite)
                try {
                    const res = await fetch(`${API_LOCAL}/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password })
                    });

                    const localData = await res.json();

                    if (res.ok && localData.user) {
                        // SUCESSO LOCAL DB
                        if (localData.user.role === 'saas_registrar') {
                            setShowRegisterModal(true);
                            setLoading(false);
                            return;
                        }

                        token = 'lokal_jwt_' + simpleHash(email + Date.now());
                        session = {
                            user: localData.user.name || localData.user.email,
                            role: localData.user.role || 'gym_admin',
                            gymId: localData.user.gymId || 'hefel_gym_v1',
                            userId: localData.user.id,
                            token: token,
                            encryptedData: 'local_db_auth'
                        };
                    } else {
                        throw new Error('Falha na API Local');
                    }
                } catch (localErr) {
                    console.error("Local Auth Catch:", localErr);
                    // ULTIMO RECURSO
                    if ((email.trim() === 'admin@hefelgym.com' && password.trim() === 'admin') ||
                        (email.trim() === 'super@gymar.com' && password.trim() === 'super')) {

                        token = 'lokal_jwt_' + simpleHash(email + Date.now());
                        session = {
                            user: email.includes('super') ? 'Super Admin' : 'Admin Hefel',
                            role: email.includes('super') ? 'super_admin' : 'gym_admin',
                            gymId: 'hefel_gym_v1',
                            token: token,
                            encryptedData: 'simulated_aes_256'
                        };
                    } else {
                        throw new Error('Credenciais inválidas (Local e Cloud).');
                    }
                }
            }

            if (session) {
                localStorage.setItem('gymar_session', JSON.stringify(session));
                navigate('/app');
            }

        } catch (err) {
            setError(err.message || 'Erro ao autenticar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card animate-fade-in">
                <div className="text-center mb-8">
                    <div className="logo-box">
                        <Dumbbell size={32} color="#3b82f6" />
                    </div>
                    <h1 className="text-2xl font-bold mt-4 text-white">Bem-vindo ao GYMAR</h1>
                    <p className="text-gray-400 mt-2">Faça login para gerir o seu ginásio</p>
                </div>

                {error && (
                    <div className="error-alert">
                        <AlertTriangle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="form-group mb-4">
                        <label>Email ou Utilizador</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="text"
                                className="input-field"
                                placeholder="seu@email.com ou usuario"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group mb-6">
                        <label>Palavra-passe</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-login" disabled={loading}>
                        {loading ? 'A entrar...' : 'Entrar no Painel'} <ArrowRight size={18} />
                    </button>
                </form>

                <div className="footer-links">
                    <a href="#" onClick={(e) => { e.preventDefault(); alert('Para criar um novo ginásio, entre com a conta "register" ou contacte o suporte.'); }}>Criar Ginásio</a>
                </div>

                <div className="demo-credentials mt-8 p-4 bg-gray-800 rounded text-xs text-gray-400">
                    <p className="font-bold mb-1">Credenciais Demo:</p>
                    <p>Admin Ginásio: admin@hefelgym.com / admin</p>
                    <p>Super Admin: super@gymar.com / super</p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                    <button
                        onClick={() => setShowServerConfig(!showServerConfig)}
                        className="text-[10px] text-gray-400 hover:text-blue-400 flex items-center justify-center gap-1 mx-auto"
                    >
                        📡 {localStorage.getItem('custom_server_url')?.replace('http://', '').replace('/api', '') || '10.214.174.159:3001 (Padrão)'}
                    </button>

                    {showServerConfig && (
                        <div className="mt-3 p-3 bg-black/40 rounded-lg border border-gray-600 animate-fade-in">
                            <p className="text-[10px] text-gray-500 mb-2 uppercase font-bold tracking-wider">Redes Recentes</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {serverHistory.map(ip => (
                                    <button
                                        key={ip}
                                        onClick={() => updateServer(ip)}
                                        className="text-[10px] px-2 py-1 bg-gray-700 hover:bg-blue-900 rounded border border-gray-500 text-gray-300"
                                    >
                                        {ip}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => {
                                    const val = prompt('Novo IP do Servidor (ex: 192.168.1.10:3001)');
                                    if (val) updateServer(val);
                                }}
                                className="w-full py-1 text-[10px] bg-blue-600/30 text-blue-300 rounded hover:bg-blue-600/50"
                            >
                                + Adicionar Manualmente
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* REGISTER MODAL */}
            {showRegisterModal && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
                    <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-2xl border border-slate-700 shadow-2xl">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Dumbbell className="text-blue-500" /> Painel SaaS Registrar
                                </h2>
                                <p className="text-slate-400 text-sm">Gerir Ginásios e Acessos</p>
                            </div>
                            <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-white">✕</button>
                        </div>

                        {/* TABS */}
                        <div className="flex gap-4 mb-6">
                            <button
                                onClick={() => setActiveTab('new_gym')}
                                className={`flex-1 py-2 rounded-lg font-bold border transition-all ${activeTab === 'new_gym' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400'}`}
                            >
                                Novo Ginásio
                            </button>
                            <button
                                onClick={() => { setActiveTab('existing_gym_user'); fetchGyms(); }}
                                className={`flex-1 py-2 rounded-lg font-bold border transition-all ${activeTab === 'existing_gym_user' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400'}`}
                            >
                                Adicionar Admin a Ginásio
                            </button>
                        </div>

                        <form onSubmit={handleRegisterAction} className="grid grid-cols-2 gap-6">

                            {activeTab === 'new_gym' ? (
                                <>
                                    <div className="space-y-4">
                                        <h3 className="text-blue-400 font-bold text-sm uppercase tracking-wider">Dados da Empresa</h3>
                                        <input className="input-field" placeholder="Nome do Ginásio" required
                                            value={regData.gymName} onChange={e => setRegData({ ...regData, gymName: e.target.value })} />
                                        <input className="input-field" placeholder="Endereço" required
                                            value={regData.gymAddress} onChange={e => setRegData({ ...regData, gymAddress: e.target.value })} />
                                        <input className="input-field" placeholder="NUIT" required
                                            value={regData.gymNuit} onChange={e => setRegData({ ...regData, gymNuit: e.target.value })} />
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-green-400 font-bold text-sm uppercase tracking-wider">Admin Inicial</h3>
                                        <input className="input-field" placeholder="Nome do Admin" required
                                            value={regData.adminName} onChange={e => setRegData({ ...regData, adminName: e.target.value })} />
                                        <input className="input-field" type="email" placeholder="Email Admin" required
                                            value={regData.adminEmail} onChange={e => setRegData({ ...regData, adminEmail: e.target.value })} />
                                        <input className="input-field" type="text" placeholder="Senha Admin" required
                                            value={regData.adminPassword} onChange={e => setRegData({ ...regData, adminPassword: e.target.value })} />
                                    </div>

                                    <div className="col-span-2 bg-slate-700/50 p-4 rounded-lg border border-slate-600">
                                        <label className="flex items-start gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="mt-1 w-5 h-5 rounded border-slate-500 text-blue-600 focus:ring-blue-500 bg-slate-800"
                                                checked={regData.cloneData}
                                                onChange={e => setRegData({ ...regData, cloneData: e.target.checked })}
                                            />
                                            <div>
                                                <span className="text-white font-medium block">Importar Dados do Hefel Gym Teste</span>
                                                <span className="text-slate-400 text-sm">Copia todos os Planos, Produtos, Catracas e Clientes atuais.</span>
                                            </div>
                                        </label>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="col-span-2 space-y-4">
                                        <label className="block text-slate-300 font-medium">Selecione o Ginásio</label>
                                        <select
                                            className="input-field w-full"
                                            value={regData.selectedGymId}
                                            onChange={e => setRegData({ ...regData, selectedGymId: e.target.value })}
                                            required
                                        >
                                            <option value="">-- Escolha um Ginásio --</option>
                                            {gymsList.map(g => (
                                                <option key={g.id} value={g.id}>{g.name} ({g.address})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="col-span-2 grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <input className="input-field" placeholder="Nome do Utilizador" required
                                                value={regData.adminName} onChange={e => setRegData({ ...regData, adminName: e.target.value })} />
                                            <select
                                                className="input-field"
                                                value={regData.newAdminRole}
                                                onChange={e => setRegData({ ...regData, newAdminRole: e.target.value })}
                                            >
                                                <option value="gym_admin">Administrador (Total)</option>
                                                <option value="manager">Gerente</option>
                                                <option value="operator">Operador</option>
                                            </select>
                                        </div>
                                        <div className="space-y-4">
                                            <input className="input-field" type="email" placeholder="Email Login" required
                                                value={regData.adminEmail} onChange={e => setRegData({ ...regData, adminEmail: e.target.value })} />
                                            <input className="input-field" type="text" placeholder="Senha" required
                                                value={regData.adminPassword} onChange={e => setRegData({ ...regData, adminPassword: e.target.value })} />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="col-span-2 pt-4 border-t border-slate-700 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowRegisterModal(false)} className="px-4 py-2 text-slate-300 hover:text-white">Cancelar</button>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2">
                                    {activeTab === 'new_gym' ? 'Registar Ginásio' : 'Criar Utilizador'} <ArrowRight size={16} />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
        .login-container {
            min-height: 100vh;
            background: #0f172a;
            display: flex; align-items: center; justify-content: center;
            padding: 1rem;
        }
        .login-card {
            background: #1e293b;
            padding: 2.5rem;
            border-radius: 16px;
            width: 100%; max-width: 420px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255,255,255,0.05);
        }
        .logo-box {
            width: 64px; height: 64px; background: rgba(59, 130, 246, 0.1);
            border-radius: 16px; display: flex; align-items: center; justify-content: center;
            margin: 0 auto;
        }
        .form-group label { display: block; color: #cbd5e1; font-size: 0.9rem; margin-bottom: 0.5rem; font-weight: 500; }
        .input-wrapper { position: relative; }
        .input-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #64748b; }
        .input-field {
            width: 100%; padding: 0.8rem 1rem 0.8rem 2.8rem;
            background: #0f172a; border: 1px solid #334155;
            border-radius: 8px; color: white; outline: none; transition: all 0.2s;
        }
        .input-field:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2); }
        
        .btn-login {
            width: 100%; padding: 0.9rem;
            background: #3b82f6; color: white; border: none; border-radius: 8px;
            font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
            transition: background 0.2s;
        }
        .btn-login:hover { background: #2563eb; }
        .btn-login:disabled { opacity: 0.7; cursor: not-allowed; }

        .footer-links { margin-top: 1.5rem; text-align: center; color: #64748b; font-size: 0.9rem; }
        .footer-links a { color: #3b82f6; text-decoration: none; margin: 0 0.5rem; }
        .footer-links a:hover { text-decoration: underline; }

        .error-alert {
            background: rgba(239, 68, 68, 0.1); color: #ef4444; padding: 0.8rem;
            border-radius: 8px; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem;
        }
      `}</style>
        </div>
    );
};

export default Login;
