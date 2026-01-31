import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Lock, Mail, ArrowRight, AlertTriangle, ChevronRight, Server, Shield } from 'lucide-react';
import { supabase } from '../services/supabase';
import { API_LOCAL } from '../services/db';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [serverHistory, setServerHistory] = useState(() => {
        const saved = localStorage.getItem('server_history');
        return saved ? JSON.parse(saved) : ['10.214.174.159:3001', 'localhost:3001'];
    });

    const updateServer = (ip) => {
        if (!ip) return;
        localStorage.setItem('custom_server_url', `http://${ip}/api`);
        const newHistory = [ip, ...serverHistory.filter(h => h !== ip)].slice(0, 5);
        localStorage.setItem('server_history', JSON.stringify(newHistory));
        window.location.reload();
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Simplified login logic (keeping existing functionality but cleaned up)
            let { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
            let session = null;
            if (!authError && data.user) {
                session = { user: data.user.email, role: 'gym_admin', gymId: 'hefel_gym_v1' };
            } else {
                const res = await fetch(`${API_LOCAL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const localData = await res.json();
                if (res.ok && localData.user) {
                    session = { user: localData.user.name, role: localData.user.role, gymId: localData.user.gymId };
                }
            }
            if (session) {
                localStorage.setItem('gymar_session', JSON.stringify(session));
                navigate('/dashboard');
            } else {
                throw new Error('Credenciais inválidas.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-side-image">
                <img src="/gym-bg.png" alt="Gym" />
                <div className="image-overlay">
                    <div className="overlay-content">
                        <div className="brand">
                            <Dumbbell size={32} />
                            <span>GYMAR PRO</span>
                        </div>
                        <h2>Gerencie seu ginásio com inteligência artificial e dados reais.</h2>
                        <div className="mini-stats">
                            <div className="m-stat">
                                <span>+1.2k</span>
                                <p>Novos Atletas Mensais</p>
                            </div>
                            <div className="m-stat">
                                <span>99.9%</span>
                                <p>Uptime do Sistema</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="login-form-side">
                <div className="form-container">
                    <div className="form-header">
                        <h1>Bem-vindo de volta!</h1>
                        <p>Acesse sua conta para gerenciar seu ginásio.</p>
                    </div>

                    {error && (
                        <div className="error-box">
                            <AlertTriangle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <label>E-mail Corporativo</label>
                            <div className="input-box">
                                <Mail size={20} />
                                <input type="email" placeholder="exemplo@gymar.com" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Palavra-passe</label>
                            <div className="input-box">
                                <Lock size={20} />
                                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                            </div>
                        </div>

                        <div className="form-footer">
                            <label className="checkbox-container">
                                <input type="checkbox" />
                                <span className="checkmark"></span>
                                Lembrar-me
                            </label>
                            <a href="#">Esqueceu a senha?</a>
                        </div>

                        <button type="submit" className="btn-submit" disabled={loading}>
                            {loading ? <span className="loader"></span> : <>ENTRAR NO PAINEL <ArrowRight size={20} /></>}
                        </button>
                    </form>

                    <div className="divider">
                        <span>OU ACESSE PELO</span>
                    </div>

                    <div className="server-selector">
                        <button className="btn-server" onClick={() => setShowServerConfig(!showServerConfig)}>
                            <Server size={18} />
                            <span>{localStorage.getItem('custom_server_url')?.replace('http://', '').replace('/api', '') || 'Servidor Central Cloud'}</span>
                        </button>
                    </div>

                    <div className="help-text">
                        Não tem uma conta? <a href="#" onClick={() => navigate('/')}>Conheça nossos planos</a>
                    </div>
                </div>
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=Inter:wght@400;500;600&display=swap');

                .login-wrapper {
                    display: flex;
                    min-height: 100vh;
                    background: #020617;
                    font-family: 'Inter', sans-serif;
                }

                /* Side Image */
                .login-side-image {
                    flex: 1.2;
                    position: relative;
                    overflow: hidden;
                }
                .login-side-image img {
                    width: 100%; height: 100%;
                    object-fit: cover;
                }
                .image-overlay {
                    position: absolute; inset: 0;
                    background: linear-gradient(to right, #020617 0%, rgba(2, 6, 23, 0.4) 50%, transparent 100%);
                    display: flex; align-items: flex-end;
                    padding: 4rem;
                }
                .overlay-content { max-width: 480px; }
                .overlay-content .brand {
                    display: flex; align-items: center; gap: 0.75rem;
                    color: #3b82f6; font-family: 'Outfit'; font-size: 1.5rem; font-weight: 800;
                    margin-bottom: 2rem;
                }
                .overlay-content h2 {
                    font-family: 'Outfit'; font-size: 2.5rem; line-height: 1.2;
                    color: white; margin-bottom: 2.5rem;
                }
                .mini-stats { display: flex; gap: 3rem; }
                .m-stat span { display: block; font-family: 'Outfit'; font-size: 1.5rem; font-weight: 800; color: #3b82f6; }
                .m-stat p { font-size: 0.85rem; color: #94a3b8; margin-top: 0.25rem; }

                /* Form Side */
                .login-form-side {
                    flex: 1;
                    display: flex; align-items: center; justify-content: center;
                    padding: 2rem;
                    background: #020617;
                }
                .form-container {
                    width: 100%; max-width: 420px;
                }
                .form-header h1 {
                    font-family: 'Outfit'; font-size: 2rem; margin-bottom: 0.5rem; color: white;
                }
                .form-header p { color: #94a3b8; margin-bottom: 2.5rem; }

                .input-group { margin-bottom: 1.5rem; }
                .input-group label { display: block; color: #cbd5e1; font-size: 0.85rem; margin-bottom: 0.5rem; font-weight: 500; }
                .input-box {
                    position: relative;
                    display: flex; align-items: center;
                    background: #0f172a;
                    border: 1px solid #1e293b;
                    border-radius: 12px;
                    padding: 0 1rem;
                    transition: 0.3s;
                }
                .input-box:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 1px #3b82f6; }
                .input-box svg { color: #475569; }
                .input-box input {
                    flex: 1; background: transparent; border: none; padding: 0.8rem 1rem;
                    color: white; outline: none; font-size: 0.95rem;
                }

                .form-footer { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .checkbox-container { display: flex; align-items: center; gap: 0.75rem; color: #94a3b8; font-size: 0.85rem; cursor: pointer; }
                .form-footer a { color: #3b82f6; text-decoration: none; font-size: 0.85rem; }

                .btn-submit {
                    width: 100%; background: #3b82f6; color: white; border: none;
                    padding: 1rem; border-radius: 12px; font-weight: 700; font-size: 1rem;
                    cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.75rem;
                    transition: 0.3s; box-shadow: 0 10px 15px rgba(59, 130, 246, 0.2);
                }
                .btn-submit:hover { transform: translateY(-2px); background: #2563eb; }
                
                .divider { text-align: center; margin: 2rem 0; position: relative; }
                .divider::before { content: ''; position: absolute; left: 0; top: 50%; width: 100%; height: 1px; background: #1e293b; }
                .divider span { position: relative; background: #020617; padding: 0 1rem; color: #475569; font-size: 0.75rem; font-weight: 700; letter-spacing: 1px; }

                .btn-server {
                    width: 100%; background: #0f172a; border: 1px solid #1e293b;
                    color: #94a3b8; padding: 0.75rem; border-radius: 12px;
                    display: flex; align-items: center; justify-content: center; gap: 0.75rem;
                    cursor: pointer; font-size: 0.85rem; transition: 0.3s;
                }
                .btn-server:hover { border-color: #3b82f6; color: white; }

                .help-text { text-align: center; margin-top: 2rem; color: #475569; font-size: 0.9rem; }
                .help-text a { color: #3b82f6; font-weight: 600; text-decoration: none; }

                .error-box {
                    background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2);
                    color: #ef4444; padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem;
                    display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem;
                }

                @media (max-width: 900px) {
                    .login-side-image { display: none; }
                }
            `}</style>
        </div>
    );
};

export default Login;
