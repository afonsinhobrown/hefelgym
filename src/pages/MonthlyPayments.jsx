import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Clock,
    CreditCard,
    DollarSign,
    MoreVertical
} from 'lucide-react';
import { db } from '../services/db';
import InvoiceTemplate from '../components/Invoices/InvoiceTemplate';

// Reuse Renewal Modal or create a simplified Payment Confirm Modal
// For speed and consistency, we will adapt the Renewal logic directly here
const PaymentModal = ({ isOpen, onClose, user, plans = [] }) => {
    const [months, setMonths] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState('Numerário');
    const [loading, setLoading] = useState(false);

    // State para manipular plano selecionado (caso o defaults do user esteja vazio ou queira mudar)
    const [selectedPlanId, setSelectedPlanId] = useState('');

    // Inicializar plano
    useEffect(() => {
        if (isOpen && user) {
            // Se o user tem plano valido que existe na lista, usa esse. Senão usa o primeiro da lista.
            if (user.plan && user.plan.name) {
                // Tenta achar na lista
                const p = plans.find(pl => pl.name === user.plan.name) || user.plan;
                setSelectedPlanId(p.id || 'custom'); // custom se não tiver ID
            } else if (plans && plans.length > 0) {
                setSelectedPlanId(plans[0].id);
            }
        }
    }, [isOpen, user, plans]);

    if (!isOpen || !user) return null;

    // Achar o objeto do plano selecionado
    // Se 'custom', usa o do user. Se ID, usa da lista.
    let activePlan = plans.find(p => p.id === selectedPlanId);
    if (!activePlan && user.plan) activePlan = user.plan;
    if (!activePlan) activePlan = { name: 'Sem Plano', price: 0 };

    const planPrice = Number(activePlan.price) || 0;
    const total = planPrice * months;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            // Force status 'pago' immediately for this specific screen
            const newInvoice = await db.pointOfSale.renewPlanWithMonths(
                user.id,
                months,
                'pago',
                paymentMethod,
                { name: activePlan.name, price: activePlan.price }
            );
            onClose(newInvoice);
        } catch (e) {
            alert('Erro: ' + e.message);
            onClose(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-fade-in" style={{ maxWidth: '450px' }}>
                <div className="modal-header">
                    <h3>Confirmar Pagamento de Mensalidade</h3>
                </div>

                <div className="payment-summary p-4 bg-gray-800 rounded mb-4">
                    <div className="flex justify-between mb-2">
                        <span className="text-muted">Utente:</span>
                        <span className="font-bold">{user.name}</span>
                    </div>

                    {/* SELEÇÃO DE PLANO */}
                    <div className="flex justify-between items-center mb-2 gap-2">
                        <span className="text-muted">Plano:</span>
                        {plans.length > 0 ? (
                            <select
                                className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none"
                                value={selectedPlanId}
                                onChange={(e) => setSelectedPlanId(e.target.value)}
                            >
                                {plans.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} ({Number(p.price).toLocaleString()} MT)</option>
                                ))}
                                {!plans.some(p => p.id === selectedPlanId) && user.plan && (
                                    <option value="custom">{user.plan.name} (Atual)</option>
                                )}
                            </select>
                        ) : (
                            <span>{activePlan.name}</span>
                        )}
                    </div>

                    <div className="flex justify-between text-lg font-bold border-t border-gray-600 pt-2 mt-2">
                        <span>Valor Mensal:</span>
                        <span className="text-primary">{planPrice.toLocaleString()} MT</span>
                    </div>
                </div>

                <div className="form-group mb-4">
                    <label className="text-sm text-muted mb-1 block">Duração a Pagar</label>
                    <select className="input w-full" value={months} onChange={e => setMonths(Number(e.target.value))}>
                        <option value={1}>1 Mês ({total.toLocaleString()} MT)</option>
                        <option value={3}>3 Meses ({(planPrice * 3).toLocaleString()} MT)</option>
                        <option value={6}>6 Meses ({(planPrice * 6).toLocaleString()} MT)</option>
                        <option value={12}>1 Ano ({(planPrice * 12).toLocaleString()} MT)</option>
                    </select>
                </div>

                <div className="form-group mb-6">
                    <label className="text-sm text-muted mb-1 block">Método de Pagamento</label>
                    <select className="input w-full" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                        <option value="Numerário">Numerário / Cash</option>
                        <option value="M-Pesa">M-Pesa</option>
                        <option value="e-Mola">e-Mola</option>
                        <option value="POS">POS / Cartão</option>
                    </select>
                </div>

                <div className="flex gap-2 justify-end">
                    <button className="btn btn-secondary" onClick={() => onClose(false)}>Cancelar</button>
                    <button className="btn btn-primary" onClick={handleConfirm} disabled={loading}>
                        {loading ? 'Processando...' : `Confirmar ${total.toLocaleString()} MT`}
                    </button>
                </div>
            </div>
            <style>{`
                .modal-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.8); z-index: 1000;
                    display: flex; align-items: center; justify-content: center;
                    backdrop-filter: blur(4px);
                }
                .modal-content {
                    background: var(--bg-card); width: 100%;
                    border-radius: var(--radius); padding: 1.5rem;
                    border: 1px solid var(--border); box-shadow: var(--shadow-lg);
                }
                .bg-gray-800 { background: rgba(255,255,255,0.05); }
            `}</style>
        </div>
    );
};

const MonthlyPayments = () => {
    const [clients, setClients] = useState([]);
    const [plans, setPlans] = useState([]); // HERE: State for plans
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all'); // all, late, pending, paid
    const [selectedUser, setSelectedUser] = useState(null);
    const [generatedInvoice, setGeneratedInvoice] = useState(null);

    const loadData = async () => {
        try {
            const [fetchedClients, fetchedInvoices, fetchedPlans] = await Promise.all([
                db.clients.getAll().then(res => Array.isArray(res) ? res : []),
                db.invoices.getAll().then(res => Array.isArray(res) ? res : []),
                db.plans.getAll() // Fetch Plans
            ]);

            setPlans(Array.isArray(fetchedPlans) ? fetchedPlans : []); // Set plans state

            const allClients = fetchedClients;
            const allInvoices = fetchedInvoices;

            // Use the same centralized logic or replicate it for display
            const processed = allClients.map(c => {
                const startDate = new Date(c.joinedDate || new Date().toISOString().split('T')[0]);

                // Corrigido: Detetar mensalidade pela descrição do item
                const paidInvoices = allInvoices.filter(i =>
                    i.clientId === c.id &&
                    i.status === 'pago' &&
                    i.items?.some(item => item.description && (item.description.toLowerCase().includes('renovação') || item.description.toLowerCase().includes('plano') || item.description.toLowerCase().includes('mensalidade')))
                );

                let totalDaysPaid = 0;
                paidInvoices.forEach(inv => {
                    inv.items?.forEach(item => {
                        if (item.description && (item.description.toLowerCase().includes('renovação') || item.description.toLowerCase().includes('plano') || item.description.toLowerCase().includes('mensalidade'))) {
                            totalDaysPaid += (Number(item.quantity) || 1) * 30;
                        }
                    });
                });

                // Se nunca pagou, validUntil é joinedDate + 30 dias (primeiro mês gratis/incluido?) ou apenas joinedDate?
                // Vamos assumir joinedDate + dias pagos.
                const validUntil = new Date(startDate);
                validUntil.setDate(validUntil.getDate() + totalDaysPaid);

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const validUntilMidnight = new Date(validUntil);
                validUntilMidnight.setHours(0, 0, 0, 0);

                const diffTime = today.getTime() - validUntilMidnight.getTime();
                const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                let status = 'ok';
                if (daysOverdue > 0) {
                    if (daysOverdue <= 5) status = 'warning';
                    else status = 'late';
                } else {
                    status = 'ok';
                }

                return {
                    ...c,
                    paymentStatus: status,
                    daysRemaining: -daysOverdue,
                    nextDueDate: validUntil.toLocaleDateString('pt-MZ')
                };
            });
            setClients(processed);
        } catch (e) {
            console.error("Erro a carregar mensalidades", e);
        }
    };

    useEffect(() => {
        db.init();
        loadData();
    }, []);

    const filteredClients = clients.filter(c => {
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.nuit?.includes(search);

        if (filter === 'late') return matchSearch && c.paymentStatus === 'late';
        if (filter === 'warning') return matchSearch && c.paymentStatus === 'warning';
        if (filter === 'ok') return matchSearch && c.paymentStatus === 'ok';

        return matchSearch;
    });

    const getStatusBadge = (status, days) => {
        switch (status) {
            case 'late':
                return <span className="status-badge error"><AlertTriangle size={14} /> Atrasado ({Math.abs(days)} dias)</span>;
            case 'warning':
                return <span className="status-badge warning"><Clock size={14} /> Vence em {days} dias</span>;
            case 'ok':
                return <span className="status-badge success"><CheckCircle size={14} /> Em dia</span>;
            default:
                return <span className="status-badge neutral">Sem Pagamentos</span>;
        }
    };

    return (
        <div className="monthly-page animate-fade-in">
            <div className="page-header">
                <div className="header-title">
                    <h2>Gestão de Mensalidades</h2>
                    <p>Controlo de pagamentos e dívidas</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card error-card">
                    <div className="icon-wrapper"><AlertTriangle size={24} /></div>
                    <div className="stat-info">
                        <h3>{clients.filter(c => c.paymentStatus === 'late').length}</h3>
                        <p>Em Dívida</p>
                    </div>
                </div>
                <div className="stat-card warning-card">
                    <div className="icon-wrapper"><Clock size={24} /></div>
                    <div className="stat-info">
                        <h3>{clients.filter(c => c.paymentStatus === 'warning').length}</h3>
                        <p>A Vencer (5 dias)</p>
                    </div>
                </div>
                <div className="stat-card success-card">
                    <div className="icon-wrapper"><CheckCircle size={24} /></div>
                    <div className="stat-info">
                        <h3>{clients.filter(c => c.paymentStatus === 'ok').length}</h3>
                        <p>Regularizados</p>
                    </div>
                </div>
            </div>

            <div className="card table-card mt-6">
                <div className="toolbar">
                    <div className="search-box">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Buscar utente..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="filters">
                        <button className={`filter-btn ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todos</button>
                        <button className={`filter-btn error ${filter === 'late' ? 'active' : ''}`} onClick={() => setFilter('late')}>Em Dívida</button>
                        <button className={`filter-btn warning ${filter === 'warning' ? 'active' : ''}`} onClick={() => setFilter('warning')}>Vencendo</button>
                        <button className={`filter-btn success ${filter === 'ok' ? 'active' : ''}`} onClick={() => setFilter('ok')}>Em Dia</button>
                    </div>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Utente</th>
                            <th>Plano</th>
                            <th>Vencimento</th>
                            <th>Estado</th>
                            <th>Valor</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClients.map(client => (
                            <tr key={client.id}>
                                <td className="font-bold">{client.name}</td>
                                <td>{client.plan?.name || '-'}</td>
                                <td>{client.nextDueDate}</td>
                                <td>{getStatusBadge(client.paymentStatus, client.daysRemaining)}</td>
                                <td className="font-mono">{(client.plan?.price || 0).toLocaleString()} MT</td>
                                <td>
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => setSelectedUser(client)}
                                    // Disabled removed here!
                                    >
                                        <DollarSign size={16} /> Receber
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <PaymentModal
                isOpen={!!selectedUser}
                user={selectedUser}
                plans={plans}
                onClose={(inv) => {
                    setSelectedUser(null);
                    if (inv && inv.id) {
                        loadData();
                        // Wait slightly to ensure DB update is reflected or just use local
                        const fullInvoice = db.invoices.getAll().then(invs => {
                            const found = invs.find(i => i.id === inv.id);
                            if (found) setGeneratedInvoice(found);
                        });
                    }
                }}
            />

            {generatedInvoice && (
                <InvoiceTemplate
                    invoice={generatedInvoice}
                    onClose={() => setGeneratedInvoice(null)}
                />
            )}

            <style>{`
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
                .stat-card { padding: 1.5rem; border-radius: 8px; display: flex; align-items: center; gap: 1rem; border: 1px solid transparent; background: var(--bg-card); }
                .stat-card.error-card { border-color: rgba(239,68,68,0.3); background: rgba(239,68,68,0.05); }
                .stat-card.warning-card { border-color: rgba(234,179,8,0.3); background: rgba(234,179,8,0.05); }
                .stat-card.success-card { border-color: rgba(34,197,94,0.3); background: rgba(34,197,94,0.05); }
                
                .stat-info h3 { font-size: 1.8rem; line-height: 1; margin-bottom: 0.2rem; }
                .stat-info p { font-size: 0.9rem; color: var(--text-muted); }

                .toolbar { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid var(--border); margin-bottom: 0; }
                .search-box { display: flex; align-items: center; background: rgba(255,255,255,0.05); padding: 0.5rem 1rem; border-radius: 6px; gap: 0.5rem; width: 300px; }
                .search-box input { background: none; border: none; color: white; width: 100%; outline: none; }
                
                .filters { display: flex; gap: 0.5rem; }
                .filter-btn { background: none; border: 1px solid var(--border); color: var(--text-muted); padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; transition: all 0.2s; font-size: 0.9rem; }
                .filter-btn:hover { background: rgba(255,255,255,0.05); }
                .filter-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
                .filter-btn.error.active { background: var(--danger); border-color: var(--danger); }
                .filter-btn.warning.active { background: #eab308; border-color: #eab308; color: black; }
                .filter-btn.success.active { background: var(--success); border-color: var(--success); }

                .status-badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem; font-weight: 500; }
                .status-badge.error { background: rgba(239,68,68,0.1); color: var(--danger); }
                .status-badge.warning { background: rgba(234,179,8,0.1); color: #eab308; }
                .status-badge.success { background: rgba(34,197,94,0.1); color: var(--success); }
                .status-badge.neutral { background: rgba(255,255,255,0.05); color: var(--text-muted); }

                .font-mono { font-family: monospace; }
                .mt-6 { margin-top: 1.5rem; }
            `}</style>
        </div>
    );
};

export default MonthlyPayments;
