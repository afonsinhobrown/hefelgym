import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  AlertCircle,
  DollarSign,
  Briefcase,
  DownloadCloud,
  X,
  Send,
  RefreshCw
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import FinanceReportTemplate from '../components/Reports/FinanceReportTemplate';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { db, API_LOCAL } from '../services/db';

const StatCard = ({ title, value, subtext, icon: Icon, trend, onClick }) => (
  <div className={`card stat-card ${onClick ? 'clickable' : ''}`} onClick={onClick}>
    <div className="stat-header">
      <div className="stat-icon-bg">
        <Icon size={24} className="stat-icon" />
      </div>
      {trend && (
        <span className={`trend ${trend > 0 ? 'positive' : 'negative'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div className="stat-content">
      <h3>{value}</h3>
      <p>{title}</p>
      <span className="subtext">{subtext}</span>
    </div>
  </div>
);

const TransactionModal = ({ isOpen, onClose, title, transactions }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content animate-scale-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="close-btn"><X size={20} /></button>
        </div>
        <div className="table-container custom-scrollbar" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t, i) => (
                <tr key={i}>
                  <td>{t.date}</td>
                  <td className="font-bold">{t.client}</td>
                  <td>
                    <span className={`status-badge ${t.status === 'pago' ? 'paid' : 'pending'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{t.amount.toLocaleString()} MT</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    revenue: 0,
    activeUsers: 0,
    pendingInvoices: 0,
    pendingAmount: 0,
    recentActivity: [],
    monthlyData: [],
    allInvoices: [] // Store for filtering
  });

  const [viewDetails, setViewDetails] = useState({ open: false, title: '', items: [] });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        await db.init();

        // Fetch Data Async
        const [invoicesData, clientsData] = await Promise.all([
          db.invoices.getAll().catch(() => []),
          db.clients.getAll().catch(() => [])
        ]);

        const invoices = Array.isArray(invoicesData) ? invoicesData : [];
        const clients = Array.isArray(clientsData) ? clientsData : [];

        // 1. Calculate Revenue (Total Paid Invoices)
        const totalRevenue = invoices
          .filter(i => i.status === 'pago')
          .reduce((sum, i) => sum + (Number(i.total || i.amount) || 0), 0);

        // 2. Calculate Pending Invoices Amount
        const pendingAmount = invoices
          .filter(i => i.status !== 'pago')
          .reduce((sum, i) => sum + (Number(i.total || i.amount) || 0), 0);

        const pendingCount = invoices.filter(i => i.status !== 'pago').length;

        // 3. Active Users
        const activeUsers = clients.filter(c => c.status === 'active').length;

        // 4. Recent Activity (Last 10 Invoices)
        const recentActivity = invoices.slice(0, 10).map(inv => {
          const client = clients.find(c => c.id === inv.clientId);
          return {
            id: inv.id,
            client: inv.client_name || client?.name || 'Cliente Final',
            status: inv.status,
            date: new Date(inv.date).toLocaleDateString(),
            amount: Number(inv.total || inv.amount || 0)
          };
        });

        // 5. Monthly Data (Mock for chart if empty)
        const monthlyData = [
          { name: 'Jan', value: 0 }, { name: 'Fev', value: 0 }, { name: 'Mar', value: 0 },
          { name: 'Abr', value: 0 }, { name: 'Mai', value: 0 }, { name: 'Jun', value: 0 },
        ];
        // Simple aggregation
        invoices.filter(i => i.status === 'pago').forEach(inv => {
          const month = new Date(inv.date).getMonth();
          if (month < 6) monthlyData[month].value += (Number(inv.total || inv.amount) || 0);
        });

        // CALCULAR IVA (Baseado na taxa configurada)
        const rawCompany = JSON.parse(localStorage.getItem('hefel_company_v3') || '{}');
        const ivaRate = rawCompany.ivaRate !== undefined ? Number(rawCompany.ivaRate) : 3;

        // Assumindo que a Receita Total é BRUTA (inclui IVA), separamos:
        // Total = Net * (1 + rate)  =>  Net = Total / (1 + rate)
        // IVA = Total - Net
        const estimatedVAT = totalRevenue - (totalRevenue / (1 + (ivaRate / 100)));

        setStats({
          revenue: totalRevenue,
          vat: estimatedVAT, // Novo campo
          ivaRate: ivaRate, // Guardar taxa para usar no UI
          activeUsers: activeUsers,
          pendingInvoices: pendingCount,
          pendingAmount: pendingAmount,
          recentActivity: recentActivity,
          monthlyData: monthlyData,
          allInvoices: invoices.map(inv => {
            const client = clients.find(c => c.id === (inv.clientId || inv.client_id));
            return {
              id: inv.id,
              client: inv.client_name || client?.name || 'Cliente Final',
              status: inv.status,
              date: new Date(inv.date).toLocaleDateString(),
              amount: Number(inv.total || inv.amount || 0),
              phone: client?.phone
            };
          })
        });
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      }
    };

    loadData();
  }, []);

  const generateReport = async (sendWhatsApp = false) => {
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const element = document.getElementById('finance-report-export');
      if (!element) throw new Error("Template not found");

      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      if (sendWhatsApp) {
        const pdfBase64 = pdf.output('datauristring').split(',')[1];
        const res = await fetch(`${API_LOCAL}/whatsapp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: '840000000', // Default admin or let user pick, for now let's assume generic admin
            message: '*RELATÓRIO FINANCEIRO HEFEL GYM*\nSegue o resumo de performance associado ao período atual.',
            pdfBase64: pdfBase64
          })
        });
        if (res.ok) alert("Relatório enviado por WhatsApp!");
        else throw new Error("Falha no envio");
      } else {
        pdf.save(`Relatorio_Financeiro_HefelGym_${new Date().toLocaleDateString()}.pdf`);
      }
    } catch (e) {
      alert("Erro ao gerar relatório: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (val) => val.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });

  const showStatsDetails = (category) => {
    let filtered = [];
    let title = '';
    if (category === 'revenue') {
      filtered = stats.allInvoices.filter(i => i.status === 'pago');
      title = 'Detalhamento de Receitas (Pago)';
    } else if (category === 'pending') {
      filtered = stats.allInvoices.filter(i => i.status !== 'pago' && i.status !== 'anulada');
      title = 'Detalhamento de Valores Pendentes';
    } else if (category === 'users') {
      filtered = stats.allInvoices.slice(0, 50); // Exemplo de movimentos
      title = 'Últimos Movimentos Financeiros';
    }
    setViewDetails({ open: true, title, items: filtered });
  };

  return (
    <div className="dashboard animate-fade-in">
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Painel de Controlo</h1>
          <p className="text-muted">Análise detalhada de receitas e performance</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={() => generateReport(false)} disabled={isGenerating}>
            {isGenerating ? <RefreshCw size={18} className="animate-spin" /> : <DownloadCloud size={18} className="mr-2" />}
            {isGenerating ? 'Processando...' : 'Gerar Relatório / Documento Processo'}
          </button>
          <button className="btn btn-outline" onClick={() => generateReport(true)} disabled={isGenerating}>
            <Send size={18} className="mr-2" /> Enviar Dashboard via WhatsApp
          </button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <StatCard
          title="Receita Total"
          value={formatCurrency(stats.revenue)}
          subtext="Acumulado Pago"
          icon={DollarSign}
          trend={14}
          onClick={() => showStatsDetails('revenue')}
        />
        <StatCard
          title={`IVA Apurado (${stats.ivaRate}%)`}
          value={formatCurrency(stats.vat || 0)}
          subtext="Incluído na Receita"
          icon={TrendingUp}
          trend={0}
        />
        <StatCard
          title="Valor Pendente"
          value={formatCurrency(stats.pendingAmount)}
          subtext={`${stats.pendingInvoices} Faturas em aberto`}
          icon={AlertCircle}
          trend={-2}
          onClick={() => showStatsDetails('pending')}
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(stats.revenue / (stats.activeUsers || 1))}
          subtext="Por Utente Ativo"
          icon={Briefcase}
          trend={1.2}
        />
        <StatCard
          title="Utentes Ativos"
          value={stats.activeUsers}
          subtext="Registados no Sistema"
          icon={Users}
          trend={8}
          onClick={() => showStatsDetails('users')}
        />
      </div>

      <div className="charts-section">
        <div className="card chart-card">
          <div className="card-header">
            <h2>Evolução da Receita (Semestral)</h2>
            <select className="chart-filter">
              <option>Últimos 6 meses</option>
            </select>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.monthlyData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#f97316"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card activity-card">
          <h2>Atividade Recente (Vendas/Faturas)</h2>
          <ul className="activity-list">
            {stats.recentActivity.length === 0 ? (
              <p className="text-muted text-sm mt-4">Nenhuma atividade recente.</p>
            ) : (
              stats.recentActivity.map((item, i) => (
                <li key={item.id || i} className="activity-item">
                  <div className={`activity-dot ${item.status === 'pago' ? 'bg-success' : 'bg-warning'}`}></div>
                  <div className="activity-info">
                    <p className="activity-text">
                      {item.status === 'pago' ? 'Pagamento recebido de ' : 'Fatura emitida para '}
                      <strong>{item.client}</strong>
                    </p>
                    <span className="activity-time">{item.date} • #{item.id}</span>
                  </div>
                  <span className={`activity-amount ${item.status === 'pago' ? 'text-success' : 'text-warning'}`}>
                    +{item.amount.toLocaleString()} MT
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Transactions Detail Modal */}
      <TransactionModal
        isOpen={viewDetails.open}
        onClose={() => setViewDetails({ ...viewDetails, open: false })}
        title={viewDetails.title}
        transactions={viewDetails.items}
      />

      {/* Hidden Report Container */}
      {isGenerating && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <div id="finance-report-export">
            <FinanceReportTemplate
              summary={{
                revenue: stats.revenue - (stats.vat || 0), // Passamos o líquido para o relatório calcular o imposto corretamente
                pending: stats.pendingAmount,
                average: stats.revenue / (stats.activeUsers || 1)
              }}
              transactions={stats.allInvoices.slice(0, 20)}
              period="Análise Geral Atualizada"
            />
          </div>
        </div>
      )}

      <style>{`
        .clickable { cursor: pointer; transition: all 0.2s; border: 1px solid transparent; }
        .clickable:hover { border-color: var(--primary); background: rgba(249, 115, 22, 0.05); transform: translateY(-3px); }
        .status-badge { padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.7rem; font-weight: bold; }
        .status-badge.paid { background: #dcfce7; color: #166534; }
        .status-badge.pending { background: #fef9c3; color: #854d0e; }
        
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .modal-content { background: var(--bg-card); padding: 2rem; border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow-lg); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { text-align: left; padding: 0.75rem; color: var(--text-muted); border-bottom: 2px solid var(--border); }
        .data-table td { padding: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .animate-scale-in { animation: scaleIn 0.3s ease-out; }
        @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .stat-icon-bg {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background-color: rgba(249, 115, 22, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
        }

        .trend {
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          border-radius: 20px;
        }

        .trend.positive {
          background-color: rgba(16, 185, 129, 0.1);
          color: var(--success);
        }

        .trend.negative {
          background-color: rgba(239, 68, 68, 0.1);
          color: var(--danger);
        }

        .stat-content h3 {
          font-size: 1.75rem;
          font-weight: 700;
          line-height: 1.2;
          margin-bottom: 0.25rem;
        }

        .stat-content p {
          color: var(--text-muted);
          font-size: 0.875rem;
        }
        
        .subtext {
          font-size: 0.75rem;
          color: var(--text-muted);
          opacity: 0.8;
        }

        .charts-section {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
        }
        
        @media (max-width: 1024px) {
            .charts-section { grid-template-columns: 1fr; }
        }

        .chart-card {
          min-height: 400px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .chart-filter {
          background-color: var(--bg-dark);
          color: var(--text-main);
          border: 1px solid var(--border);
          padding: 0.5rem;
          border-radius: 8px;
          outline: none;
        }

        .activity-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid rgba(51, 65, 85, 0.5);
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: var(--primary);
          margin-top: 0.4rem;
          box-shadow: 0 0 8px var(--primary);
        }
        .activity-dot.bg-success { background-color: var(--success); box-shadow: 0 0 8px var(--success); }
        .activity-dot.bg-warning { background-color: #f59e0b; box-shadow: 0 0 8px #f59e0b; }

        .activity-info {
          flex: 1;
        }

        .activity-text {
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .activity-time {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .activity-amount {
          font-weight: 600;
        }
        .activity-amount.text-success { color: var(--success); }
        .activity-amount.text-warning { color: #f59e0b; }
      `}</style>
    </div>
  );
};

export default Dashboard;
