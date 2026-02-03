import React, { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { db } from '../../services/db';
import { RefreshCw, Lock, X, CheckCircle, AlertCircle } from 'lucide-react';

const Layout = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [pwdData, setPwdData] = useState({ next: '', confirm: '' });
  const [pwdStatus, setPwdStatus] = useState({ type: '', msg: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleOpenModal = () => {
      setPwdStatus({ type: '', msg: '' });
      setShowProfileModal(true);
    };
    window.addEventListener('open-profile-modal', handleOpenModal);
    return () => window.removeEventListener('open-profile-modal', handleOpenModal);
  }, []);

  // Monitorizar Sincronização (Bloqueio de Ecrã)
  useEffect(() => {
    const checkSync = async () => {
      try {
        if (db.checkSyncStatus) {
          const syncing = await db.checkSyncStatus();
          setIsSyncing(syncing);
        }
      } catch (e) { }
    };
    const interval = setInterval(checkSync, 5000);
    return () => clearInterval(interval);
  }, []);

  // PROTEÇÃO DE ROTA
  let session = null;
  try {
    const sessionData = localStorage.getItem('gymar_session');
    if (sessionData) session = JSON.parse(sessionData);
  } catch (e) { console.error("Sessão inválida", e); }

  if (!session || !session.user) {
    return <Navigate to="/login" replace />;
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdStatus({ type: '', msg: '' });

    if (pwdData.next.length < 4) {
      return setPwdStatus({ type: 'error', msg: 'A senha deve ter pelo menos 4 caracteres.' });
    }
    if (pwdData.next !== pwdData.confirm) {
      return setPwdStatus({ type: 'error', msg: 'As novas senhas não coincidem.' });
    }

    setIsSaving(true);
    try {
      // Garantir que não perdemos o email ou nome ao trocar a senha
      await db.system_users.save({
        id: session.userId,
        name: session.user,
        email: session.email || email, // Usa o da sessão ou o digitado no login
        role: session.role,
        password: pwdData.next
      });

      setPwdStatus({ type: 'success', msg: 'Senha atualizada com sucesso!' });
      setPwdData({ next: '', confirm: '' });
      setTimeout(() => setShowProfileModal(false), 2000);
    } catch (e) {
      setPwdStatus({ type: 'error', msg: 'Falha ao atualizar: ' + e.message });
    } finally {
      setIsSaving(false);
    }
  };

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
                <p>{session.role === 'gym_admin' ? 'Administrador do Ginásio' : 'Membro da Equipa'}</p>
              </div>
            </div>
            <div className="user-profile" onClick={() => { setPwdStatus({ type: '', msg: '' }); setShowProfileModal(true); }} style={{ cursor: 'pointer' }} title="Mudar Senha">
              <div className="avatar">{session.user?.charAt(0).toUpperCase()}</div>
            </div>
          </header>
          <div className="page-content">
            <Outlet />
          </div>
        </main>
      </div>

      {/* MODAL DE PERFIL / SENHA */}
      {showProfileModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal card glass">
            <div className="modal-header">
              <h3><Lock size={18} /> Segurança da Conta</h3>
              <button className="close-btn" onClick={() => setShowProfileModal(false)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <p className="user-info">Utilizador: <strong>{session.user}</strong> ({session.email})</p>

              <form onSubmit={handlePasswordChange}>
                <div className="input-group">
                  <label>Nova Palavra-passe</label>
                  <input type="password" value={pwdData.next} onChange={e => setPwdData({ ...pwdData, next: e.target.value })} placeholder="Digite a nova senha" required disabled={isSaving} />
                </div>
                <div className="input-group">
                  <label>Confirmar Nova Senha</label>
                  <input type="password" value={pwdData.confirm} onChange={e => setPwdData({ ...pwdData, confirm: e.target.value })} placeholder="Repita a nova senha" required disabled={isSaving} />
                </div>

                {pwdStatus.msg && (
                  <div className={`status-msg ${pwdStatus.type}`}>
                    {pwdStatus.type === 'success' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    {pwdStatus.msg}
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={isSaving}>
                  {isSaving ? 'A guardar...' : 'Atualizar Senha'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {isSyncing && (
        <div className="sync-pill-indicator">
          <RefreshCw size={14} className="spin-icon" />
          <span>Sincronizando...</span>
        </div>
      )}

      <style>{`
                .profile-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.8);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }
                .profile-modal {
                    width: 100%;
                    max-width: 400px;
                    padding: 24px !important;
                    border: 1px solid var(--border) !important;
                }
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .modal-header h3 { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 1.1rem; }
                .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; }
                
                .user-info { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px; border-bottom: 1px solid var(--border); pb: 10px; }
                
                .input-group { margin-bottom: 16px; }
                .input-group label { display: block; font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px; font-weight: 700; }
                .input-group input { width: 100%; background: var(--bg-dark); border: 1px solid var(--border); padding: 12px; border-radius: 8px; color: white; outline: none; transition: border 0.2s; }
                .input-group input:focus { border-color: var(--primary); }
                
                .status-msg { padding: 10px; border-radius: 6px; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
                .status-msg.success { background: rgba(34, 197, 94, 0.1); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.2); }
                .status-msg.error { background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }
                
                .btn-primary { width: 100%; background: var(--primary); color: white; border: none; padding: 14px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: opacity 0.2s; }
                .btn-primary:hover:not(:disabled) { opacity: 0.9; }
                .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

                /* Layout Base Styles */
                .app-layout { display: flex; min-height: 100vh; }
                .main-content { flex: 1; margin-left: 280px; background-color: var(--bg-dark); min-height: 100vh; transition: margin 0.3s ease; position: relative; z-index: 10; }
                .top-header { height: 80px; padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 40; border-bottom: 1px solid var(--border); background: rgba(var(--bg-dark-rgb), 0.7); backdrop-filter: blur(12px); }
                .header-left { display: flex; align-items: center; gap: 1rem; }
                .mobile-toggle { display: none; background: rgba(255,255,255,0.05); border: 1px solid var(--border); width: 40px; height: 40px; border-radius: 8px; cursor: pointer; position: relative; }
                .hamburger, .hamburger::before, .hamburger::after { content: ''; display: block; background: var(--text-main); height: 2px; width: 20px; position: absolute; left: 10px; transition: all 0.2s ease; }
                .hamburger { top: 18px; } .hamburger::before { top: -6px; left: 0; } .hamburger::after { top: 6px; left: 0; }
                .greeting h1 { font-size: 1.25rem; margin-bottom: 0.25rem; color: white; }
                .greeting p { color: var(--text-muted); font-size: 0.875rem; margin: 0; }
                .avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; color: white; border: 2px solid rgba(255,255,255,0.1); transition: transform 0.2s; }
                .user-profile:hover .avatar { transform: scale(1.1); }
                .page-content { padding: 2rem; max-width: 1600px; margin: 0 auto; }
                .sidebar-wrapper { position: fixed; left: 0; top: 0; bottom: 0; width: 280px; z-index: 50; }
                
                @media (max-width: 1024px) {
                    .main-content { margin-left: 0; }
                    .sidebar-wrapper { transform: translateX(-280px); transition: transform 0.3s; }
                    .sidebar-wrapper.open { transform: translateX(0); }
                    .mobile-toggle { display: flex; justify-content: center; align-items: center; }
                    .top-header { padding: 0 1rem; }
                    .page-content { padding: 1rem; }
                }
            `}</style>
    </>
  );
};

export default Layout;
