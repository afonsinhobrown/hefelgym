import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, ShieldCheck, Zap, BarChart3, ArrowRight } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();

    return (
        <div className="landing-container">
            {/* Navbar */}
            <nav className="landing-nav">
                <div className="nav-logo">
                    <Dumbbell className="logo-icon" size={32} />
                    <span className="brand-name">GYMAR</span>
                </div>
                <div className="nav-links">
                    <button className="btn-link">Funcionalidades</button>
                    <button className="btn-link">Preços</button>
                    <button className="btn-login" onClick={() => navigate('/login')}>Entrar</button>
                    <button className="btn-cta" onClick={() => navigate('/register')}>Começar Grátis</button>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-content">
                    <div className="badge-new">NOVO: Integração WhatsApp Automática</div>
                    <h1 className="hero-title">
                        O Sistema Operativo do <span className="highlight">Seu Ginásio</span>
                    </h1>
                    <p className="hero-text">
                        Gestão completa, faturação, controlo de acesso e retenção de alunos num único lugar.
                        Dê ao seu ginásio a tecnologia das grandes redes.
                    </p>
                    <div className="hero-buttons">
                        <button className="btn-primary-lg" onClick={() => navigate('/register')}>
                            Criar Meu Ginásio <ArrowRight size={20} />
                        </button>
                        <button className="btn-secondary-lg">Ver Demo</button>
                    </div>
                    <p className="hero-disclaimer">Sem cartão de crédito • 14 dias grátis • Cancelamento fácil</p>
                </div>

                {/* Abstract Dashboard Preview */}
                <div className="hero-visual">
                    <div className="dashboard-card card-1">
                        <div className="card-header">
                            <div className="circle red"></div>
                            <div className="line long"></div>
                        </div>
                        <div className="stat-big">986.00 MT</div>
                        <div className="stat-label">Vendas Hoje</div>
                    </div>
                    <div className="dashboard-card card-2">
                        <div className="icon-box"><Zap size={24} color="#FACC15" /></div>
                        <div className="stat-med">Ativos</div>
                        <div className="stat-val">+124</div>
                    </div>
                </div>
            </header>

            {/* Features Grid */}
            <section className="features-section">
                <div className="section-header">
                    <h2>Tudo o que precisa para crescer</h2>
                    <p>O GYMAR substitui 5 ferramentas diferentes.</p>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="f-icon"><Zap /></div>
                        <h3>Rápido e Intuitivo</h3>
                        <p>Treine a sua equipa em 10 minutos. Interface desenhada para velocidade no balcão.</p>
                    </div>
                    <div className="feature-card">
                        <div className="f-icon"><BarChart3 /></div>
                        <h3>Gestão Financeira</h3>
                        <p>Controle mensalidades, produtos e caixa. Saiba exatamente quanto lucrou.</p>
                    </div>
                    <div className="feature-card">
                        <div className="f-icon"><ShieldCheck /></div>
                        <h3>Controlo de Acesso</h3>
                        <p>Integração com catracas e biometria. Bloqueio automático de inadimplentes.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <span className="brand-name">GYMAR</span>
                        <p>Software para Ginásios Modernos.</p>
                    </div>
                    <div className="footer-copy">
                        &copy; {new Date().getFullYear()} Gymar Systems. Todos os direitos reservados.
                    </div>
                </div>
            </footer>

            <style>{`
        :root {
            --gymar-black: #0f172a;
            --gymar-dark: #1e293b;
            --gymar-primary: #3b82f6;
            --gymar-accent: #60a5fa;
            --gymar-text: #f8fafc;
            --gymar-text-dim: #94a3b8;
        }

        .landing-container {
            background-color: var(--gymar-black);
            color: var(--gymar-text);
            min-height: 100vh;
            font-family: 'Inter', sans-serif;
            overflow-x: hidden;
        }

        /* Nav */
        .landing-nav {
            display: flex; justify-content: space-between; align-items: center;
            padding: 1.5rem 2rem;
            max-width: 1200px; margin: 0 auto;
        }
        .nav-logo { display: flex; align-items: center; gap: 0.5rem; color: white; font-weight: 800; font-size: 1.5rem; letter-spacing: -0.5px; }
        .logo-icon { color: var(--gymar-primary); }
        .nav-links { display: flex; gap: 1.5rem; align-items: center; }
        .btn-link { background: none; border: none; color: var(--gymar-text-dim); cursor: pointer; font-weight: 500; font-size: 1rem; transition: color 0.2s; }
        .btn-link:hover { color: white; }
        .btn-login { background: none; border: 1px solid var(--gymar-dark); color: white; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 600; transition: all 0.2s; }
        .btn-login:hover { border-color: var(--gymar-primary); }
        .btn-cta { background: var(--gymar-primary); border: none; color: white; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 600; transition: transform 0.2s; }
        .btn-cta:hover { transform: translateY(-1px); background: var(--gymar-accent); }

        /* Hero */
        .hero-section {
            padding: 4rem 2rem;
            max-width: 1200px; margin: 0 auto;
            display: flex; align-items: center; justify-content: space-between;
            min-height: 80vh;
        }
        .hero-content { max-width: 600px; }
        .badge-new { 
            display: inline-block; background: rgba(59, 130, 246, 0.1); color: var(--gymar-accent); 
            padding: 0.4rem 0.8rem; border-radius: 100px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1.5rem; border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .hero-title { font-size: 3.5rem; line-height: 1.1; font-weight: 800; margin-bottom: 1.5rem; letter-spacing: -1px; }
        .highlight { color: transparent; background: linear-gradient(90deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; background-clip: text; }
        .hero-text { font-size: 1.25rem; color: var(--gymar-text-dim); line-height: 1.6; margin-bottom: 2.5rem; max-width: 480px; }
        
        .hero-buttons { display: flex; gap: 1rem; margin-bottom: 1rem; }
        .btn-primary-lg { 
            background: var(--gymar-primary); color: white; border: none; padding: 1rem 2rem; border-radius: 12px; 
            font-size: 1.1rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; 
            transition: all 0.2s; box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.4);
        }
        .btn-primary-lg:hover { transform: translateY(-2px); box-shadow: 0 15px 30px -5px rgba(59, 130, 246, 0.5); }
        
        .btn-secondary-lg {
             background: var(--gymar-dark); color: white; border: 1px solid rgba(255,255,255,0.1); padding: 1rem 2rem; border-radius: 12px; 
             font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
        }
        .btn-secondary-lg:hover { background: rgba(255,255,255,0.1); }
        
        .hero-disclaimer { font-size: 0.9rem; color: #64748b; margin-top: 1rem; }

        /* Visual Abstract */
        .hero-visual { position: relative; width: 450px; height: 400px; display: none; } 
        @media (min-width: 1024px) { .hero-visual { display: block; } }

        .dashboard-card {
            background: var(--gymar-dark); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px;
            position: absolute; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.5);
            padding: 1.5rem;
        }
        .card-1 { top: 40px; right: 40px; width: 280px; z-index: 2; transform: rotate(-3deg); animation: float 6s ease-in-out infinite; }
        .card-2 { bottom: 60px; left: 40px; width: 200px; z-index: 1; transform: rotate(3deg); animation: float 6s ease-in-out infinite 1s; }
        
        .card-header { display: flex; gap: 10px; margin-bottom: 20px; }
        .circle { width: 12px; height: 12px; border-radius: 50%; }
        .red { background: #ef4444; }
        .line { height: 12px; background: rgba(255,255,255,0.1); border-radius: 6px; }
        .long { flex: 1; }
        
        .stat-big { font-size: 2.5rem; font-weight: 800; color: white; letter-spacing: -1px; }
        .stat-label { color: #64748b; font-size: 0.9rem; margin-top: 5px; }
        
        .icon-box { background: rgba(250, 204, 21, 0.1); width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
        .stat-med { font-size: 1rem; color: #94a3b8; }
        .stat-val { font-size: 2rem; font-weight: 700; color: white; }

        @keyframes float {
            0% { transform: translateY(0px) rotate(-3deg); }
            50% { transform: translateY(-15px) rotate(-3deg); }
            100% { transform: translateY(0px) rotate(-3deg); }
        }

        /* Features */
        .features-section { padding: 4rem 2rem; background: #0b1120; }
        .section-header { text-align: center; max-width: 600px; margin: 0 auto 4rem auto; }
        .section-header h2 { font-size: 2.5rem; margin-bottom: 1rem; }
        .section-header p { color: #94a3b8; font-size: 1.2rem; }
        
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; max-width: 1200px; margin: 0 auto; }
        .feature-card { background: var(--gymar-dark); padding: 2rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); transition: transform 0.2s; }
        .feature-card:hover { transform: translateY(-5px); border-color: rgba(59, 130, 246, 0.3); }
        .f-icon { width: 50px; height: 50px; background: rgba(59, 130, 246, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--gymar-accent); margin-bottom: 1.5rem; }
        .feature-card h3 { font-size: 1.25rem; margin-bottom: 0.75rem; color: white; }
        .feature-card p { color: #94a3b8; line-height: 1.6; }

        /* Footer */
        .landing-footer { border-top: 1px solid #1e293b; padding: 3rem 2rem; margin-top: auto; }
        .footer-content { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; }
        .footer-brand .brand-name { font-size: 1.5rem; font-weight: 800; color: white; }
        .footer-brand p { color: #64748b; margin-top: 0.5rem; }
        .footer-copy { color: #475569; font-size: 0.9rem; }

        /* Responsive */
        @media (max-width: 768px) {
            .hero-title { font-size: 2.5rem; }
            .hero-section { flex-direction: column; text-align: center; padding-top: 2rem; }
            .hero-buttons { justify-content: center; flex-direction: column; }
            .footer-content { flex-direction: column; gap: 2rem; text-align: center; }
        }
      `}</style>
        </div>
    );
};

export default Landing;
