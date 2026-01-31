import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, ShieldCheck, Zap, BarChart3, ArrowRight, Play, CheckCircle, Smartphone, Globe, Lock } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-wrapper">
            {/* Background Background */}
            <div className="hero-bg-overlay">
                <img src="/gym-bg.png" alt="Gym Background" className="bg-image" />
                <div className="bg-gradient-overlay"></div>
            </div>

            {/* Navbar */}
            <nav className="glass-nav">
                <div className="nav-container">
                    <div className="brand" onClick={() => navigate('/')}>
                        <img
                            src="/encubadora_logo.jpeg"
                            alt="Logo"
                            style={{ height: '40px', width: 'auto', borderRadius: '8px' }}
                        />
                        <span className="brand-text">GYMAR <span className="text-primary">PRO</span></span>
                    </div>

                    <div className="nav-links">
                        <a href="#features">Funcionalidades</a>
                        <a href="#about">Sobre</a>
                        <a href="#contact">Contacto</a>
                    </div>

                    <div className="nav-actions">
                        <button className="btn-secondary-sm" onClick={() => navigate('/login')}>Entrar</button>
                        <button className="btn-primary-sm">Começar Agora</button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="hero">
                <div className="hero-content animate-slide-up">
                    <div className="hero-badge">
                        <span className="badge-new">EDITION</span>
                        <span className="badge-text">Software GYMAR • Versão HEFEL GYM</span>
                    </div>
                    <h1 className="hero-title">
                        O SISTEMA <br />
                        <span className="text-gradient">MOÇAMBICANO</span> <br />
                        PARA GINÁSIOS.
                    </h1>
                    <p className="hero-description">
                        Eleve a gestão do seu fitness a um nível profissional.
                        Controle mensalidades, estoque, acessos por biometria e faturamento
                        em tempo real com a plataforma mais moderna de Moçambique.
                    </p>
                    <div className="hero-cta">
                        <button className="btn-primary-lg" onClick={() => navigate('/login')}>
                            <Play size={20} fill="currentColor" /> ACESSAR PAINEL
                        </button>
                        <button className="btn-outline-lg">
                            SOLICITAR DEMO <ArrowRight size={20} />
                        </button>
                    </div>

                    <div className="hero-stats">
                        <div className="stat">
                            <span className="stat-num">50+</span>
                            <span className="stat-label">Ginásios</span>
                        </div>
                        <div className="stat">
                            <span className="stat-num">12k+</span>
                            <span className="stat-label">Atletas</span>
                        </div>
                        <div className="stat">
                            <span className="stat-num">100%</span>
                            <span className="stat-label">Seguro</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Features Glass Section */}
            <section id="features" className="features">
                <div className="section-header">
                    <h2 className="title">Tudo o que o seu negócio precisa</h2>
                    <p className="subtitle">Uma solução completa 360º desenhada para a realidade moçambicana.</p>
                </div>

                <div className="features-grid">
                    <div className="glass-card">
                        <div className="card-icon bg-blue"><Smartphone size={24} /></div>
                        <h3>Controlo de Acessos</h3>
                        <p>Integração direta com hardware de biometria e reconhecimento facial. Bloqueio automático de atletas com pagamento pendente.</p>
                    </div>
                    <div className="glass-card">
                        <div className="card-icon bg-purple"><BarChart3 size={24} /></div>
                        <h3>Gestão Financeira</h3>
                        <p>Relatórios detalhados de faturamento, fluxo de caixa, despesas e lucros. Gestão automática de mensalidades e renovações.</p>
                    </div>
                    <div className="glass-card">
                        <div className="card-icon bg-green"><Zap size={24} /></div>
                        <h3>Ponto de Venda (POS)</h3>
                        <p>Venda produtos de bar, suplementos e merchandise com controle de estoque integrado. Faturação rápida e envio por WhatsApp.</p>
                    </div>
                    <div className="glass-card">
                        <div className="card-icon bg-orange"><Globe size={24} /></div>
                        <h3>Multi-Localização</h3>
                        <p>Gerencie vários ginásios em cidades diferentes a partir de um único painel centralizado na nuvem.</p>
                    </div>
                    <div className="glass-card">
                        <div className="card-icon bg-red"><Globe size={24} /></div>
                        <h3>WhatsApp Automático</h3>
                        <p>Envio de lembretes de pagamento, comprovativos e mensagens de boas-vindas diretamente para o cliente via WhatsApp.</p>
                    </div>
                    <div className="glass-card">
                        <div className="card-icon bg-cyan"><Lock size={24} /></div>
                        <h3>Segurança Total</h3>
                        <p>Backups diários na nuvem e acesso local offline. Os seus dados estão protegidos por criptografia de nível bancário.</p>
                    </div>
                </div>
            </section>

            {/* Footer Section */}
            <footer className="footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="brand">
                            <div className="brand-logo">
                                <Dumbbell size={24} />
                            </div>
                            <span className="brand-text">GYMAR</span>
                        </div>
                        <p>Transformando ginásios em negócios inteligentes em Moçambique.</p>
                        <div className="mt-8 pt-6 border-t border-white/10">
                            <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Desenvolvido por</p>
                            <h4 className="font-bold text-white text-lg">ENCUBADORADESOLUÇÕES</h4>
                            <p className="text-xs text-primary">#ENCUBADORADESOLUCOES</p>
                        </div>
                    </div>
                    <div className="footer-links-grid">
                        <div className="footer-col">
                            <h4>Produto</h4>
                            <a href="#">Funcionalidades</a>
                            <a href="#">Preços</a>
                            <a href="#">Hardware</a>
                        </div>
                        <div className="footer-col">
                            <h4>Suporte</h4>
                            <a href="#">Contacto</a>
                            <a href="#">Documentação</a>
                            <a href="#">Updates</a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2026 Gymar Pro Moçambique. Versão HEFEL GYM.</p>
                </div>
            </footer>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Inter:wght@400;500;700&display=swap');

                :root {
                    --primary: #3b82f6;
                    --primary-glow: rgba(59, 130, 246, 0.5);
                    --bg-dark: #020617;
                    --text-main: #f8fafc;
                    --text-muted: #94a3b8;
                    --glass: rgba(255, 255, 255, 0.03);
                    --glass-border: rgba(255, 255, 255, 0.08);
                }

                .landing-wrapper {
                    background-color: var(--bg-dark);
                    color: var(--text-main);
                    min-height: 100vh;
                    font-family: 'Inter', sans-serif;
                    overflow-x: hidden;
                    position: relative;
                }

                /* Background Effects */
                .hero-bg-overlay {
                    position: absolute;
                    inset: 0;
                    height: 100vh;
                    z-index: 0;
                }
                .bg-image {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    opacity: 0.6;
                }
                .bg-gradient-overlay {
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at top right, rgba(59, 130, 246, 0.15), transparent 40%),
                                linear-gradient(to bottom, transparent 20%, var(--bg-dark) 90%),
                                linear-gradient(to right, var(--bg-dark) 40%, transparent);
                }

                /* Navbar */
                .glass-nav {
                    position: fixed;
                    top: 0; left: 0; right: 0;
                    z-index: 100;
                    padding: 1.5rem 0;
                    background: rgba(2, 6, 23, 0.3);
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid var(--glass-border);
                }
                .nav-container {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 2rem;
                }
                .brand {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                }
                .brand-logo {
                    width: 40px; height: 40px;
                    background: var(--primary);
                    border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 0 20px var(--primary-glow);
                }
                .brand-text {
                    font-family: 'Outfit', sans-serif;
                    font-size: 1.5rem;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                }
                .text-primary { color: var(--primary); }

                .nav-links { display: flex; gap: 2.5rem; }
                .nav-links a {
                    text-decoration: none;
                    color: var(--text-muted);
                    font-weight: 500;
                    transition: 0.3s;
                    font-size: 0.95rem;
                }
                .nav-links a:hover { color: white; }

                .nav-actions { display: flex; gap: 1rem; }
                .btn-secondary-sm {
                    background: transparent;
                    border: 1px solid var(--glass-border);
                    color: white;
                    padding: 0.6rem 1.2rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                }
                .btn-primary-sm {
                    background: var(--primary);
                    border: none;
                    color: white;
                    padding: 0.6rem 1.2rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    box-shadow: 0 4px 15px var(--primary-glow);
                }

                /* Hero Section */
                .hero {
                    position: relative;
                    z-index: 1;
                    padding: 180px 2rem 100px;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .hero-content { max-width: 750px; }
                
                .hero-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.75rem;
                    background: var(--glass);
                    border: 1px solid var(--glass-border);
                    padding: 0.5rem 1rem;
                    border-radius: 100px;
                    margin-bottom: 2.5rem;
                }
                .badge-new {
                    background: var(--primary);
                    font-size: 0.65rem;
                    font-weight: 800;
                    padding: 2px 6px;
                    border-radius: 4px;
                }
                .badge-text { font-size: 0.85rem; font-weight: 500; color: var(--text-muted); }

                .hero-title {
                    font-family: 'Outfit', sans-serif;
                    font-size: 4.5rem;
                    line-height: 1.1;
                    font-weight: 800;
                    margin-bottom: 2rem;
                }
                .text-gradient {
                    background: linear-gradient(90deg, #3b82f6, #60a5fa, #2dd4bf);
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }
                .hero-description {
                    font-size: 1.25rem;
                    color: var(--text-muted);
                    line-height: 1.7;
                    margin-bottom: 3rem;
                }

                .hero-cta { display: flex; gap: 1.5rem; margin-bottom: 4rem; }
                .btn-primary-lg {
                    background: var(--primary);
                    color: white;
                    border: none;
                    padding: 1.2rem 2.5rem;
                    border-radius: 12px;
                    font-size: 1.1rem;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex; align-items: center; gap: 0.75rem;
                    transition: 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    box-shadow: 0 10px 30px var(--primary-glow);
                }
                .btn-primary-lg:hover { transform: scale(1.05); }
                
                .btn-outline-lg {
                    background: transparent;
                    color: white;
                    border: 1px solid var(--glass-border);
                    padding: 1.2rem 2.5rem;
                    border-radius: 12px;
                    font-size: 1.1rem;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex; align-items: center; gap: 0.75rem;
                    transition: 0.3s;
                }
                .btn-outline-lg:hover { background: var(--glass); border-color: white; }

                .hero-stats { display: flex; gap: 4rem; padding-top: 2rem; border-top: 1px solid var(--glass-border); width: fit-content; }
                .stat { display: flex; flex-direction: column; gap: 0.25rem; }
                .stat-num { font-size: 1.75rem; font-weight: 800; font-family: 'Outfit'; }
                .stat-label { font-size: 0.85rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }

                /* Features Section */
                .features {
                    padding: 120px 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                    position: relative;
                    z-index: 1;
                }
                .section-header { text-align: center; margin-bottom: 5rem; }
                .section-header .title { font-family: 'Outfit'; font-size: 3rem; font-weight: 800; margin-bottom: 1rem; }
                .section-header .subtitle { color: var(--text-muted); font-size: 1.25rem; }

                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                    gap: 2rem;
                }
                .glass-card {
                    background: var(--glass);
                    border: 1px solid var(--glass-border);
                    backdrop-filter: blur(10px);
                    padding: 2.5rem;
                    border-radius: 24px;
                    transition: 0.4s;
                }
                .glass-card:hover {
                    transform: translateY(-10px);
                    background: rgba(255, 255, 255, 0.05);
                    border-color: var(--primary);
                }
                .card-icon {
                    width: 56px; height: 56px;
                    border-radius: 16px;
                    display: flex; align-items: center; justify-content: center;
                    margin-bottom: 2rem;
                }
                .card-icon.bg-blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
                .card-icon.bg-purple { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
                .card-icon.bg-green { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
                .card-icon.bg-orange { background: rgba(249, 115, 22, 0.1); color: #f97316; }
                .card-icon.bg-red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .card-icon.bg-cyan { background: rgba(6, 182, 212, 0.1); color: #06b6d4; }

                .glass-card h3 { font-family: 'Outfit'; font-size: 1.5rem; margin-bottom: 1rem; font-weight: 700; }
                .glass-card p { color: var(--text-muted); line-height: 1.6; font-size: 1rem; }

                /* Footer */
                .footer {
                    background: rgba(2, 6, 23, 0.8);
                    border-top: 1px solid var(--glass-border);
                    padding: 80px 2rem 40px;
                    margin-top: 100px;
                }
                .footer-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    margin-bottom: 60px;
                }
                .footer-brand p { color: var(--text-muted); max-width: 300px; margin-top: 1.5rem; }
                .footer-links-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4rem; }
                .footer-col h4 { font-family: 'Outfit'; font-size: 1.1rem; margin-bottom: 2rem; font-weight: 700; }
                .footer-col { display: flex; flex-direction: column; gap: 1rem; }
                .footer-col a { color: var(--text-muted); text-decoration: none; transition: 0.3s; }
                .footer-col a:hover { color: white; transform: translateX(5px); }
                
                .footer-bottom {
                    max-width: 1200px;
                    margin: 0 auto;
                    border-top: 1px solid var(--glass-border);
                    padding-top: 40px;
                    text-align: center;
                    color: #475569;
                    font-size: 0.9rem;
                }

                /* Animations */
                .animate-slide-up {
                    animation: slideUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
                }
                @keyframes slideUp {
                    from { transform: translateY(40px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                /* Mobile Optimization */
                @media (max-width: 1024px) {
                    .hero-title { font-size: 3.5rem; }
                    .footer-content { grid-template-columns: 1fr; gap: 4rem; }
                }
                @media (max-width: 768px) {
                    .hero-title { font-size: 2.75rem; }
                    .hero-cta { flex-direction: column; }
                    .nav-links { display: none; }
                    .hero-stats { gap: 2rem; }
                }
            `}</style>
        </div>
    );
};

export default Landing;
