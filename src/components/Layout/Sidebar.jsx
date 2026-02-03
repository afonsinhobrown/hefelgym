import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Building,
  LayoutDashboard,
  Receipt,
  Users,
  CreditCard,
  Dumbbell,
  CalendarDays,
  Settings,
  LogOut,
  BarChart3,
  Package,
  ShoppingCart,
  ScanLine,
  DollarSign,
  Briefcase,
  Smartphone,
  Key,
  Coins,
  User as UserIcon
} from 'lucide-react';
import '../../styles/design_system.css';
import { supabase } from '../../services/supabase';

const Sidebar = ({ onNavItemClick }) => {
  const navigate = useNavigate();
  const [gymName, setGymName] = useState('Hefel Gym Teste'); // Default correto
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState('operator');

  useEffect(() => {
    try {
      // Tentar carregar nome atualizado das configurações
      const company = JSON.parse(localStorage.getItem('hefel_company_v3')) || JSON.parse(localStorage.getItem('hefel_company_v2'));
      if (company && company.name) {
        setGymName(company.name);
      }

      // Determinar Role
      const session = JSON.parse(localStorage.getItem('gymar_session') || '{}');
      const role = session.role || 'operator';
      setUserRole(role);

      if (role === 'super_admin') {
        setIsSuperAdmin(true);
        setGymName('GYMAR Admin');
      }
    } catch (e) { }
  }, []);

  const handleLogout = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('gymar_session') || '{}');
      if (session.email) {
        await supabase.from('audit_logs').insert({
          action: 'LOGOUT',
          user_email: session.email,
          entity: 'auth',
          details: { timestamp: new Date().toISOString() }
        });
      }
    } catch (e) { }

    localStorage.removeItem('gymar_session');
    navigate('/login');
  };

  const commonItems = [
    { icon: UserIcon, label: 'O Meu Perfil', action: () => window.dispatchEvent(new CustomEvent('open-profile-modal')) },
  ];

  const saasNavItems = [
    { icon: LayoutDashboard, label: 'Visão Geral', path: '/dashboard' },
    ...commonItems,
    { icon: Building, label: 'Ginásios (Clientes)', path: '/admin/gyms' },
    { icon: Users, label: 'Utilizadores GYMAR', path: '/admin/users' },
    { icon: DollarSign, label: 'Financeiro SaaS', path: '/admin/finance' },
  ];

  const gymNavItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    ...commonItems,
    { icon: Smartphone, label: 'WhatsApp Bot', path: '/whatsapp' },
    { icon: ScanLine, label: 'Acessos', path: '/attendance' },
    { icon: Key, label: 'Hardware / Catracas', path: '/hardware' },
    { icon: ShoppingCart, label: 'Ponto de Venda', path: '/pos' },
    { icon: DollarSign, label: 'Mensalidades', path: '/payments' },
    { icon: Receipt, label: 'Faturação', path: '/invoices' },
    { icon: Coins, label: 'Financeiro', path: '/finance' },
    { icon: UserIcon, label: 'Acessos / Logins', path: '/admin/users' },
    { icon: Briefcase, label: 'Equipa & Salários', path: '/instructors' },
    { icon: Users, label: 'Utentes', path: '/users' },
    { icon: CreditCard, label: 'Planos', path: '/plans' },
    { icon: CalendarDays, label: 'Aulas', path: '/classes' },
    { icon: Package, label: 'Inventário', path: '/inventory' },
    { icon: Dumbbell, label: 'Treinos', path: '/trainings' },
    { icon: BarChart3, label: 'Relatórios', path: '/reports' },
  ];

  const operatorNavItems = [
    ...commonItems,
    { icon: ShoppingCart, label: 'Ponto de Venda', path: '/pos' },
    { icon: DollarSign, label: 'Mensalidades', path: '/payments' },
  ];

  let itemsToShow = [];
  if (userRole === 'super_admin') itemsToShow = saasNavItems;
  else if (userRole === 'gym_admin' || userRole === 'manager') itemsToShow = gymNavItems;
  else itemsToShow = operatorNavItems;

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <div className="logo-glow">
          <img src="/logo.png" alt="Logo" className="logo" />
        </div>
        <div className="brand-info">
          <span className="brand-name">{gymName}</span>
          <span className="brand-subtitle">{isSuperAdmin ? 'Super Admin' : 'Painel de Gestão'}</span>
        </div>
      </div>

      <nav className="nav-menu">
        {itemsToShow.map((item) => (
          item.path ? (
            <NavLink
              key={item.label}
              to={item.path}
              onClick={onNavItemClick}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              <div className="icon-box"><item.icon size={20} /></div>
              <span>{item.label}</span>
            </NavLink>
          ) : (
            <button
              key={item.label}
              onClick={() => { item.action(); onNavItemClick(); }}
              className="nav-item"
              style={{ border: 'none', width: '100%', textAlign: 'left', background: 'transparent', cursor: 'pointer' }}
            >
              <div className="icon-box"><item.icon size={20} /></div>
              <span>{item.label}</span>
            </button>
          )
        ))}
      </nav>

      <div className="sidebar-footer">
        {userRole !== 'operator' && (
          <NavLink to="/settings" className="nav-item logout-btn">
            <div className="icon-box"><Settings size={20} /></div>
            <span>Configurações</span>
          </NavLink>
        )}
        <button className="nav-item logout-btn" onClick={handleLogout}>
          <div className="icon-box"><LogOut size={20} /></div>
          <span>Sair</span>
        </button>
        <div className="mt-4 text-[10px] text-gray-600 text-center flex flex-col items-center">
          <p className="mb-1 opacity-70">Desenvolvido por</p>
          <img
            src="/encubadora_logo.jpeg"
            alt="Encubadora de Soluções"
            style={{ width: '60px', height: 'auto', display: 'block', margin: '4px auto 2px auto', borderRadius: '4px', opacity: 0.8 }}
          />
          <p className="text-[9px] opacity-30 mt-1">#ENCUBADORADESOLUCOES</p>
        </div>
      </div>

      <style>{`
        .sidebar {
            width: 100%;
            height: 100%;
            background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
            border-right: 1px solid rgba(255,255,255,0.08);
            display: flex;
            flex-direction: column;
            box-shadow: 4px 0 24px rgba(0,0,0,0.4);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .logo-container {
            height: 100px;
            padding: 0 1.5rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            background: rgba(255,255,255,0.02);
        }

        .logo-glow {
            width: 48px; height: 48px;
            background: rgba(59, 130, 246, 0.1);
            border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            border: 1px solid rgba(59, 130, 246, 0.2);
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.1);
        }

        .logo { width: 32px; height: 32px; object-fit: contain; }

        .brand-info { display: flex; flex-direction: column; }
        .brand-name {
            font-size: 1.1rem; font-weight: 700; color: white;
            letter-spacing: -0.02em;
        }
        .brand-subtitle { font-size: 0.75rem; color: #64748b; font-weight: 500; }

        .nav-menu {
            flex: 1; padding: 1.5rem 1rem;
            display: flex; flex-direction: column; gap: 8px; /* Mais espaço */
            overflow-y: auto;
        }

        .nav-item {
            display: flex !important; flex-direction: row !important;
            align-items: center !important; gap: 14px !important;
            padding: 14px 18px;
            border-radius: 12px; /* Mais arredondado */
            color: #94a3b8;
            font-weight: 500; font-size: 0.95rem;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            border: 1px solid transparent;
            text-decoration: none; cursor: pointer; background: transparent; width: 100%;
        }

        .nav-item:hover {
            background: rgba(255, 255, 255, 0.03);
            color: #e2e8f0;
            transform: translateX(4px); /* Micro-interação */
        }

        .nav-item.active {
            background: linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%);
            color: #60a5fa;
            border: 1px solid rgba(59, 130, 246, 0.2);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
        }

        .icon-box {
            display: flex; align-items: center; justify-content: center;
        }

        .sidebar-footer {
            padding: 1.5rem 1rem;
            border-top: 1px solid rgba(255,255,255,0.05);
            background: rgba(15, 23, 42, 0.5);
            display: flex; flex-direction: column; gap: 8px;
        }

        .logout-btn { color: #ef4444 !important; }
        .logout-btn:hover { 
            background: rgba(239, 68, 68, 0.1) !important; 
            border-color: rgba(239, 68, 68, 0.2) !important;
            color: #f87171 !important;
        }

        /* Scrollbar */
        .nav-menu::-webkit-scrollbar { width: 4px; }
        .nav-menu::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
      `}</style>
    </aside>
  );
};

export default Sidebar;
