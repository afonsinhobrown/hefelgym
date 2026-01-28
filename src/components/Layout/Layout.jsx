import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { db } from '../../services/db';
import { RefreshCw } from 'lucide-react';

const Layout = () => {
  const [isSyncing, setIsSyncing] = useState(false);

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
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <header className="top-header glass">
            <div className="greeting">
              <h1>Olá, {session.user}</h1>
              <p>{session.role === 'super_admin' ? 'Painel de Gestão Global' : 'Painel de Controlo'}</p>
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

      {/* SYNC BLOCKER OVERLAY */}
      {isSyncing && (
        <div className="sync-overlay">
          <div className="sync-content glass">
            <RefreshCw size={48} className="spin-icon" />
            <h2>A Sincronizar...</h2>
            <p>A atualizar dados com a nuvem. Por favor aguarde.</p>
            <div className="progress-bar">
              <div className="progress-fill"></div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .sync-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.85); z-index: 99999;
            display: flex; align-items: center; justify-content: center;
            backdrop-filter: blur(8px);
        }
        .sync-content {
            padding: 3rem; border-radius: 1rem; text-align: center;
            border: 1px solid var(--primary);
            box-shadow: 0 0 50px rgba(0,255,136,0.2);
        }
        .spin-icon { 
            color: var(--primary); margin-bottom: 1.5rem; 
            animation: spin 1s linear infinite; 
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        
        .progress-bar {
            height: 4px; background: rgba(255,255,255,0.1); width: 100%;
            margin-top: 1.5rem; border-radius: 2px; overflow: hidden;
        }
        .progress-fill {
            height: 100%; background: var(--primary); width: 50%;
            animation: progress 2s ease-in-out infinite;
        }
        @keyframes progress {
            0% { width: 0%; transform: translateX(-50%); }
            100% { width: 100%; transform: translateX(100%); }
        }

        .app-layout {
          display: flex;
          min-height: 100vh;
        }

        .main-content {
          flex: 1;
          margin-left: 260px;
          background-color: var(--bg-dark);
          min-height: 100vh;
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
          padding: 2rem 2rem 10rem 2rem; /* Extra padding bottom para scroll longo */
          max-width: 1600px;
          margin: 0 auto;
        }
      `}</style>
    </>
  );
};

export default Layout;
