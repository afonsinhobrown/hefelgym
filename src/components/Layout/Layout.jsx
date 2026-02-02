import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { db } from '../../services/db';
import { RefreshCw } from 'lucide-react';

const Layout = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Monitorizar Sincronização (Bloqueio de Ecrã)
  useEffect(() => {
    const checkSync = async () => {
      const syncing = await db.checkSyncStatus();
      setIsSyncing(syncing);
    };

    const interval = setInterval(checkSync, 2000); // Check a cada 2s
    return () => clearInterval(interval);
  }, []);

  // PROTEÇÃO DE ROTA (SAAS AUTH)
  // Se não houver sessão ativa, redireciona para Login
  let session = null;
  try {
    const sessionData = localStorage.getItem('gymar_session');
    if (sessionData) {
      session = JSON.parse(sessionData);
    }
  } catch (e) {
    console.error("Sessão inválida", e);
  }

  // Se sessão inválida ou inexistente, manda para LOGIN
  if (!session || !session.user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <div className={`app-layout ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
        <div className={`sidebar-wrapper ${isMobileMenuOpen ? 'open' : ''}`}>
          <Sidebar onNavItemClick={() => setIsMobileMenuOpen(false)} />
        </div>
        <main className="main-content">
          <header className="top-header glass">
            <div className="header-left">
              <button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(true)}>
                <div className="hamburger"></div>
              </button>
              <div className="greeting">
                <h1>Olá, {session.user}</h1>
                <p>{session.role === 'super_admin' ? 'Painel de Gestão Global' : 'Painel de Controlo'}</p>
              </div>
            </div>
            <div className="user-profile">
              <div className="avatar">A</div>
            </div>
          </header>
          <div className="page-content">
            <Outlet />
          </div>
        </main>
      </div>

      {/* DISCREET SYNC INDICATOR (Replaces full blocker) */}
      {isSyncing && (
        <div className="sync-pill-indicator">
          <RefreshCw size={14} className="spin-icon" />
          <span>Sincronizando...</span>
        </div>
      )}

      <style>{`
        .sync-pill-indicator {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: rgba(15, 23, 42, 0.9);
            backdrop-filter: blur(8px);
            border: 1px solid var(--primary);
            padding: 8px 16px;
            border-radius: 50px;
            display: flex;
            align-items: center;
            gap: 10px;
            color: white;
            font-size: 0.75rem;
            font-weight: 600;
            z-index: 10000;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
            animation: slideInUp 0.3s ease-out;
        }

        @keyframes slideInUp {
            from { transform: translateY(100px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .spin-icon { 
            color: var(--primary);
            animation: spin 1.5s linear infinite; 
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        .app-layout {
          display: flex;
          min-height: 100vh;
        }

        .main-content {
          flex: 1;
          margin-left: 280px; /* Alinhado com a largura da sidebar */
          background-color: var(--bg-dark);
          min-height: 100vh;
          transition: margin 0.3s ease;
          position: relative;
          z-index: 10;
        }

        .top-header {
          height: 80px;
          padding: 0 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 40;
          border-bottom: 1px solid var(--border);
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .mobile-toggle {
            display: none;
            background: rgba(255,255,255,0.05);
            border: 1px solid var(--border);
            width: 40px;
            height: 40px;
            border-radius: 8px;
            cursor: pointer;
            position: relative;
        }

        .hamburger, .hamburger::before, .hamburger::after {
            content: '';
            display: block;
            background: var(--text-main);
            height: 2px;
            width: 20px;
            position: absolute;
            left: 10px;
            transition: all 0.2s ease;
        }
        .hamburger { top: 18px; }
        .hamburger::before { top: -6px; left: 0; }
        .hamburger::after { top: 6px; left: 0; }

        .greeting h1 {
          font-size: 1.25rem;
          margin-bottom: 0.25rem;
        }

        .greeting p {
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary) 0%, #ea580c 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: white;
          border: 2px solid var(--bg-card);
        }

        .page-content {
          padding: 2rem 2rem 10rem 2rem;
          max-width: 1600px;
          margin: 0 auto;
        }

        .sidebar-wrapper {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            width: 280px;
            z-index: 50;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(4px);
            z-index: 45;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
            .main-content {
                margin-left: 0;
            }
            .sidebar-wrapper {
                transform: translateX(-280px);
                left: 0;
            }
            .sidebar-wrapper.open {
                transform: translateX(0);
            }
            .mobile-toggle {
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .sidebar-overlay {
                display: block;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
            }
            .app-layout.mobile-open .sidebar-overlay {
                opacity: 1;
                pointer-events: auto;
            }
            .top-header {
                padding: 0 1rem;
            }
            .page-content {
                padding: 1.5rem 1rem 8rem 1rem;
            }
        }
      `}</style>
    </>
  );
};

export default Layout;
