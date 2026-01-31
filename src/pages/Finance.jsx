import React, { useState, useEffect } from 'react';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Plus,
    Receipt,
    FileText,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Filter,
    Clock,
    User,
    CheckCircle2,
    XCircle,
    Download,
    Trash2
} from 'lucide-react';
import { db } from '../services/db';
import "../styles/pages/Finance.css";
import MonthlyPayments from './MonthlyPayments';

const GeneralExpenseModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: 'Outros',
        responsible: '',
        status: 'pago',
        payment_method: 'Numerário',
        description: ''
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: '',
                amount: '',
                category: 'Outros',
                responsible: '',
                status: 'pago',
                payment_method: 'Numerário',
                description: ''
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-fade-in" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h3>Registar Nova Despesa Operacional</h3>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>
                <form onSubmit={e => { e.preventDefault(); onSave(formData); onClose(); }}>
                    <div className="form-group mb-4">
                        <label className="text-sm font-bold opacity-70">O QUE FOI PAGO? (TÍTULO)</label>
                        <input required type="text" className="input w-full" placeholder="Ex: Renda Mensal, Conta da EDM, Águas..." value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="form-group">
                            <label className="text-sm font-bold opacity-70">VALOR (MT)</label>
                            <input required type="number" className="input w-full p-3 text-lg font-bold" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="text-sm font-bold opacity-70">CATEGORIA</label>
                            <select className="input w-full" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                <option value="Renda">🏡 Renda</option>
                                <option value="Energia / Água">🚰 Energia / Água</option>
                                <option value="Salários">👥 Salários / Staff</option>
                                <option value="Combustível">⛽ Combustível</option>
                                <option value="Manutenção">🛠️ Manutenção / Reparos</option>
                                <option value="Marketing">📢 Marketing / Publicidade</option>
                                <option value="Limpeza">🧹 Produtos de Limpeza</option>
                                <option value="Internet / Software">💻 Internet / Software</option>
                                <option value="Outros">📦 Outros Gastos</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="form-group">
                            <label className="text-sm font-bold opacity-70">MÉTODO DE PAGAMENTO</label>
                            <select className="input w-full" value={formData.payment_method} onChange={e => setFormData({ ...formData, payment_method: e.target.value })}>
                                <option value="Numerário">💸 Numerário (Cash)</option>
                                <option value="M-Pesa">📱 M-Pesa</option>
                                <option value="e-Mola">📱 e-Mola</option>
                                <option value="Transferência">🏦 Transferência Bancária</option>
                                <option value="POS">💳 Cartão / POS</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="text-sm font-bold opacity-70">ESTADO</label>
                            <select className="input w-full" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                <option value="pago">✅ EFETUADO (PAGO)</option>
                                <option value="pendente">⏳ PENDENTE (DÍVIDA)</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group mb-6">
                        <label className="text-sm font-bold opacity-70">RESPONSÁVEL / QUEM PAGOU</label>
                        <input required type="text" className="input w-full" placeholder="Ex: Admin, João, Gerente..." value={formData.responsible} onChange={e => setFormData({ ...formData, responsible: e.target.value })} />
                    </div>

                    <button type="submit" className="btn btn-primary w-full py-4 text-lg font-black uppercase tracking-wider">
                        GRAVAR DESPESA AGORA
                    </button>
                </form>
            </div>
        </div>
    );
};

const Finance = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [search, setSearch] = useState('');
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            await db.init();
            const [invs, exps, pExps] = await Promise.all([
                db.invoices.getAll(),
                db.expenses.getAll(),
                db.expenses.getProducts()
            ]);

            setInvoices(invs || []);

            // Unified expenses
            const allExps = [
                ...(exps || []).map(x => ({ ...x, type: 'general', amount: Number(x.amount) })),
                ...(pExps || []).map(x => ({ ...x, type: 'product', title: `Compra: ${x.product_name}`, amount: Number(x.total_cost) }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date));

            setExpenses(allExps);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleSaveExpense = async (data) => {
        const payload = { ...data, amount: Number(data.amount) };
        await db.expenses.createGymExpense(payload);
        loadData();
    };

    const handleDeleteExpense = async (id, type) => {
        if (!confirm('Deseja realmente eliminar este registo?')) return;
        if (type === 'general') {
            await db.expenses.deleteGymExpense(id);
        } else {
            await db.expenses.deleteProductExpense(id);
        }
        loadData();
    };

    // Calculations
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthInvoices = invoices.filter(inv => {
        const d = new Date(inv.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear && inv.status === 'pago';
    });
    const income = monthInvoices.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

    const monthExpenses = expenses.filter(ex => {
        const d = new Date(ex.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const outflow = monthExpenses.reduce((acc, curr) => acc + (Number(curr.amount || curr.total_cost) || 0), 0);

    const profit = income - outflow;

    const filteredExpenses = expenses.filter(ex =>
    (ex.title?.toLowerCase().includes(search.toLowerCase()) ||
        ex.category?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="finance-page animate-fade-in">
            <div className="page-header">
                <div className="header-info">
                    <h2>Gestão Financeira</h2>
                    <p>Controle centralizado de receitas e despesas do ginásio</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-outline" onClick={() => window.print()}>
                        <Download size={18} /> Exportar Relatório
                    </button>
                    <button className="btn btn-primary" onClick={() => setIsExpenseModalOpen(true)}>
                        <Plus size={18} /> Registar Gasto (Água/Luz/Salário)
                    </button>
                </div>
            </div>

            {/* Main Stats */}
            <div className="finance-stats grid grid-cols-3 gap-6 mb-8">
                <div className="stat-card income">
                    <div className="stat-header">
                        <div className="stat-icon"><TrendingUp size={24} /></div>
                        <span className="stat-label">Receitas (Este Mês)</span>
                    </div>
                    <div className="stat-value">{income.toLocaleString()} MT</div>
                    <div className="stat-footer text-success">
                        <ArrowUpRight size={16} /> Entradas de mensalidades e vendas
                    </div>
                </div>
                <div className="stat-card expense">
                    <div className="stat-header">
                        <div className="stat-icon"><TrendingDown size={24} /></div>
                        <span className="stat-label">Despesas (Este Mês)</span>
                    </div>
                    <div className="stat-value">{outflow.toLocaleString()} MT</div>
                    <div className="stat-footer text-danger">
                        <ArrowDownRight size={16} /> Custos fixos, stock e manutenção
                    </div>
                </div>
                <div className="stat-card balance">
                    <div className="stat-header">
                        <div className="stat-icon"><DollarSign size={24} /></div>
                        <span className="stat-label">Balanço / Lucro</span>
                    </div>
                    <div className="stat-value" style={{ color: profit >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {profit.toLocaleString()} MT
                    </div>
                    <div className="stat-footer">Resultado líquido do período</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="card tabs-card p-0 overflow-hidden">
                <div className="tabs-header border-b border-gray-800">
                    <button className={`tab-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
                        <FileText size={18} /> Resumo Financeiro
                    </button>
                    <button className={`tab-link ${activeTab === 'income' ? 'active' : ''}`} onClick={() => setActiveTab('income')}>
                        <TrendingUp size={18} /> Receitas (Mensalidades)
                    </button>
                    <button className={`tab-link ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>
                        <TrendingDown size={18} /> Despesas / Gastos
                    </button>
                </div>

                <div className="tab-content p-6">
                    {activeTab === 'income' && <MonthlyPayments hideHeader={true} />}

                    {activeTab === 'expenses' && (
                        <>
                            <div className="toolbar flex justify-between mb-4">
                                <div className="search-box">
                                    <Search size={18} />
                                    <input type="text" placeholder="Filtrar despesas..." value={search} onChange={e => setSearch(e.target.value)} />
                                </div>
                            </div>
                            <div className="table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Título / Descrição</th>
                                            <th>Categoria</th>
                                            <th>Responsável</th>
                                            <th>Estado</th>
                                            <th>Valor</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredExpenses.map(ex => (
                                            <tr key={ex.id}>
                                                <td><div className="flex items-center gap-2"><Calendar size={14} className="text-muted" />{new Date(ex.date).toLocaleDateString()}</div></td>
                                                <td className="font-bold">{ex.title}</td>
                                                <td><span className="category-tag">{ex.category}</span></td>
                                                <td>{ex.responsible || '-'}</td>
                                                <td>
                                                    {ex.status === 'pago' ? (
                                                        <span className="status-badge success"><CheckCircle2 size={14} /> Pago</span>
                                                    ) : (
                                                        <span className="status-badge warning"><Clock size={14} /> Pendente</span>
                                                    )}
                                                </td>
                                                <td className="font-bold text-danger">-{Number(ex.amount || ex.total_cost).toLocaleString()} MT</td>
                                                <td>
                                                    <button
                                                        className="icon-btn text-danger opacity-50 hover:opacity-100"
                                                        onClick={() => handleDeleteExpense(ex.id, ex.type)}
                                                        title="Eliminar permanentemente"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredExpenses.length === 0 && (
                                            <tr><td colSpan="6" className="text-center py-8 text-muted">Nenhuma despesa registada.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {activeTab === 'overview' && (
                        <div className="overview-container grid grid-cols-2 gap-8">
                            <div className="recent-activity">
                                <h4 className="mb-4 flex items-center gap-2"><Clock size={18} /> Atividade Recente</h4>
                                <div className="activity-list space-y-4">
                                    {[...invoices, ...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10).map(item => {
                                        const isInvoice = !!item.client_name;
                                        return (
                                            <div key={item.id} className="activity-item flex justify-between p-3 bg-gray-900 rounded-lg border border-gray-800">
                                                <div className="flex gap-3">
                                                    <div className={`activity-icon ${isInvoice ? 'text-success' : 'text-danger'}`}>
                                                        {isInvoice ? <ArrowUpRight /> : <ArrowDownRight />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-sm">{isInvoice ? `Recebido de ${item.client_name}` : item.title}</div>
                                                        <div className="text-xs text-muted">{new Date(item.date).toLocaleDateString()} • {isInvoice ? 'Mensalidade/Venda' : item.category}</div>
                                                    </div>
                                                </div>
                                                <div className={`font-bold ${isInvoice ? 'text-success' : 'text-danger'}`}>
                                                    {isInvoice ? '+' : '-'}{Number(item.amount || item.total_cost).toLocaleString()} MT
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="expense-breakdown">
                                <h4 className="mb-4 flex items-center gap-2"><Filter size={18} /> Breakdown por Categoria</h4>
                                <div className="category-stats space-y-4">
                                    {['Renda', 'Energia / Água', 'Salários', 'Combustível', 'Manutenção', 'Marketing', 'Internet / Software', 'Outros'].map(cat => {
                                        const total = monthExpenses.filter(ex => ex.category === cat).reduce((acc, curr) => acc + (Number(curr.amount || curr.total_cost) || 0), 0);
                                        const percentage = outflow > 0 ? (total / outflow) * 100 : 0;
                                        return (
                                            <div key={cat} className="cat-stat-item">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>{cat}</span>
                                                    <span className="font-bold">{total.toLocaleString()} MT</span>
                                                </div>
                                                <div className="progress-bar bg-gray-800 h-2 rounded-full overflow-hidden">
                                                    <div className="progress-fill bg-primary h-full" style={{ width: `${percentage}%` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <GeneralExpenseModal
                isOpen={isExpenseModalOpen}
                onClose={() => setIsExpenseModalOpen(false)}
                onSave={handleSaveExpense}
            />

            <style>{`
                .finance-page { padding: 0.5rem; }
                .tab-link { 
                    padding: 1rem 1.5rem; border: none; background: none; color: var(--text-muted); 
                    cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-weight: 500;
                    border-bottom: 2px solid transparent; transition: all 0.2s;
                }
                .tab-link:hover { color: white; background: rgba(255,255,255,0.02); }
                .tab-link.active { color: var(--primary); border-bottom-color: var(--primary); background: rgba(59,130,246,0.05); }
                
                .stat-card { 
                    padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border); 
                    background: var(--bg-card); position: relative; overflow: hidden;
                }
                .stat-card .stat-icon { color: var(--text-muted); opacity: 0.5; }
                .stat-card.income .stat-icon { color: var(--success); }
                .stat-card.expense .stat-icon { color: var(--danger); }
                
                .stat-value { font-size: 2rem; font-weight: 800; margin: 0.5rem 0; letter-spacing: -1px; }
                .stat-label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
                .stat-footer { font-size: 0.75rem; display: flex; align-items: center; gap: 0.2rem; }
                
                .category-tag { 
                    padding: 0.2rem 0.6rem; background: rgba(255,255,255,0.05); 
                    border-radius: 4px; font-size: 0.8rem; color: var(--text-muted);
                }
                
                .category-stats .cat-stat-item { padding: 10px; background: rgba(0,0,0,0.2); border-radius: 8px; }
            `}</style>
        </div>
    );
};

export default Finance;
