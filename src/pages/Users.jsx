import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Phone,
    Mail,
    X,
    Save,
    CreditCard,
    CalendarCheck,
    RefreshCw,
    Ban,
    CheckCircle,
    Eye,
    User,
    Info,
    DollarSign,
    Clock,
    DownloadCloud,
    Send
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import UsersReportTemplate from '../components/Reports/UsersReportTemplate';
import { db } from '../services/db';

import InvoiceTemplate from '../components/Invoices/InvoiceTemplate';
import ClientProcessTemplate from '../components/Users/ClientProcessTemplate';


// Modal Component para Renovar Mensalidade
const RenewalModal = ({ isOpen, onClose, user, plans }) => {
    const [months, setMonths] = useState(1);
    const [isPaidNow, setIsPaidNow] = useState(true); // Default to paid immediately for convenience
    const [paymentMethod, setPaymentMethod] = useState('Numerário');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !user) return null;

    const planPrice = user.plan?.price || 0;
    const total = planPrice * months;

    const handleRenew = async () => {
        setLoading(true);
        try {
            const status = isPaidNow ? 'pago' : 'pendente';
            const newInvoice = await db.pointOfSale.renewPlanWithMonths(user.id, months, status, paymentMethod);
            onClose(newInvoice);
        } catch (e) {
            alert('Erro ao renovar: ' + e.message);
            onClose(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999999,
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(4px)'
        }}>
            <div className="modal-content animate-fade-in" style={{ maxWidth: '450px', margin: 'auto' }}>
                <div className="modal-header">
                    <h3>Renovar / Pagar Mensalidade</h3>
                    <button onClick={() => onClose(false)} className="close-btn"><X size={20} /></button>
                </div>

                <div className="renewal-info">
                    <p><strong>Utente:</strong> {user.name}</p>
                    <p><strong>Plano Atual:</strong> {user.plan?.name || 'Sem Plano'}</p>
                    <hr className="my-4 border-gray-700" />

                    <div className="form-group mb-4">
                        <label>Selecione a Duração:</label>
                        <select className="input w-full" value={months} onChange={e => setMonths(Number(e.target.value))}>
                            <option value={1}>1 Mês ({planPrice} MT)</option>
                            <option value={3}>3 Meses ({planPrice * 3} MT)</option>
                            <option value={6}>6 Meses ({planPrice * 6} MT)</option>
                            <option value={12}>1 Ano ({planPrice * 12} MT)</option>
                        </select>
                    </div>

                    <div className="payment-options mb-4 p-4 border rounded border-gray-700">
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                            <input
                                type="checkbox"
                                checked={isPaidNow}
                                onChange={e => setIsPaidNow(e.target.checked)}
                                style={{ width: '20px', height: '20px' }}
                            />
                            <span className="font-bold">Registar Pagamento Agora?</span>
                        </label>

                        {isPaidNow && (
                            <div className="mt-2 animate-fade-in">
                                <label className="text-sm text-muted block mb-1">Método de Pagamento</label>
                                <select className="input w-full" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                    <option value="Numerário">Numerário / Cash</option>
                                    <option value="M-Pesa">M-Pesa</option>
                                    <option value="e-Mola">e-Mola</option>
                                    <option value="POS">POS / Cartão</option>
                                    <option value="Transferência">Transferência Bancária</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="total-display mb-6 p-4 bg-gray-800 rounded text-center">
                        <span className="text-muted block text-sm">Total a Pagar</span>
                        <span className="text-2xl font-bold text-primary">{total.toLocaleString()} MT</span>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button className="btn btn-secondary" onClick={() => onClose(false)}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleRenew} disabled={loading}>
                            {loading ? 'Processando...' : (isPaidNow ? 'Pagar e Emitir Recibo' : 'Gerar Fatura Pendente')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Componente de Detalhes - OTIMIZADO (Fetch Interno para escalabilidade)
// Componente de Detalhes - OTIMIZADO (Fetch Interno para escalabilidade)
const ClientDetailsModal = ({ isOpen, onClose, user, plans, onRefresh, onRenewal }) => {
    const [activeTab, setActiveTab] = useState('geral');
    const [attendance, setAttendance] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [viewProcess, setViewProcess] = useState(false);

    const loadModalData = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const [att, inv] = await Promise.all([
                db.attendance.getByUser(user.id).catch(() => []),
                db.invoices.getByUser(user.id).catch(() => [])
            ]);
            setAttendance(Array.isArray(att) ? att : []);
            setInvoices(Array.isArray(inv) ? inv : []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && user?.id) {
            setActiveTab('geral');
            setViewProcess(false);
            loadModalData();
        }
    }, [isOpen, user?.id]);

    const handlePay = async (invoiceId) => {
        if (!window.confirm("Confirmar recebimento deste valor?")) return;
        try {
            setLoading(true);
            await db.invoices.update(invoiceId, {
                status: 'pago',
                paymentDate: new Date().toISOString()
            });
            await loadModalData();
            if (onRefresh) onRefresh();
            alert("Pagamento registado com sucesso!");
        } catch (e) {
            alert("Erro: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !user) return null;

    // Resolver Nome do Plano e Cálculos
    const userPlan = plans?.find(p => p.id === (user?.planId || user?.plan?.id))?.name || user?.plan?.name || 'Sem Plano';

    // --- LÓGICA DE SEPARAÇÃO (Solicitado pelo Utilizador) ---

    // 1. Faturas de Mensalidades (Filtra pelo ID virtual 'SUBSCRIPTION' ou nomes de renovação)
    const subscriptionInvoices = invoices.filter(inv =>
        inv.items?.some(it => it.productId === 'SUBSCRIPTION' || it.name?.toLowerCase().includes('mensalidade') || it.name?.toLowerCase().includes('renovação'))
    ).sort((a, b) => new Date(b.date) - new Date(a.date));

    // 2. Outras Faturas (Vendas de balcão / Produtos)
    const otherInvoices = invoices.filter(inv =>
        !inv.items?.some(it => it.productId === 'SUBSCRIPTION' || it.name?.toLowerCase().includes('mensalidade') || it.name?.toLowerCase().includes('renovação'))
    ).sort((a, b) => new Date(b.date) - new Date(a.date));

    // 3. Cálculos de Dívida Segmentada
    const subDebt = subscriptionInvoices.filter(i => i.status === 'pendente').reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const otherDebt = otherInvoices.filter(i => i.status === 'pendente').reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const totalCurrentDebt = subDebt + otherDebt;

    const userName = user.name || 'Utente';

    if (viewProcess) {
        return (
            <ClientProcessTemplate
                user={{ ...user, plan: { name: userPlan } }}
                subscriptionInvoices={subscriptionInvoices}
                otherInvoices={otherInvoices}
                debtSummary={{ sub: subDebt, other: otherDebt, total: totalCurrentDebt }}
                onClose={() => setViewProcess(false)}
            />
        );
    }

    return createPortal(
        <div className="mdl-details-overlay" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 999999,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)'
        }} onClick={(e) => e.target.className === 'mdl-details-overlay' && onClose()}>
            <div className="mdl-details-container animate-fade-in shadow-2xl" style={{
                margin: 'auto'
            }}>
                <div className="mdl-details-header">
                    <div className="header-user-info">
                        <div className="avatar-circle large">{userName.charAt(0)}</div>
                        <div className="text-left">
                            <h3 className="user-name">{userName}</h3>
                            <small className="user-id">{user.id}</small>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setViewProcess(true)} className="btn btn-primary btn-sm flex items-center gap-1">
                            PROCESSO DO CLIENTE
                        </button>
                        <button onClick={() => onRenewal(user)} className="btn btn-warning btn-sm flex items-center gap-1" style={{ background: '#f59e0b' }}>
                            RENOVAR PLANO
                        </button>
                        <button onClick={onClose} className="close-btn p-2 hover:bg-white/10 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="tabs-container-details">
                    <button className={`tab-btn-details ${activeTab === 'geral' ? 'active' : ''}`} onClick={() => setActiveTab('geral')}>Info</button>
                    <button className={`tab-btn-details ${activeTab === 'acessos' ? 'active' : ''}`} onClick={() => setActiveTab('acessos')}>Historial Acessos</button>
                    <button className={`tab-btn-details ${activeTab === 'mensalidades' ? 'active' : ''}`} onClick={() => setActiveTab('mensalidades')}>Mensalidades</button>
                    <button className={`tab-btn-details ${activeTab === 'consumo' ? 'active' : ''}`} onClick={() => setActiveTab('consumo')}>Outras Despesas</button>
                </div>

                <div className="modal-details-body custom-scrollbar" style={{ position: 'relative' }}>
                    {loading && (
                        <div className="loading-state-overlay" style={{ background: 'rgba(15,23,42,0.7)', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                            <RefreshCw size={40} className="animate-spin text-blue-500 mr-2" /> <span>Sincronizando...</span>
                        </div>
                    )}

                    <div className="animate-fade-in">
                        {activeTab === 'geral' && (
                            <div className="summary-dashboard">
                                <div className="details-grid mb-8">
                                    <div className="detail-item"><label>BI / NUIT</label><p>{user.nuit || '---'}</p></div>
                                    <div className="detail-item"><label>Telefone</label><p>{user.phone || '---'}</p></div>
                                    <div className="detail-item"><label>Plano</label><p className="highlight-plan">{userPlan}</p></div>
                                    <div className="detail-item"><label>Estado Geral</label>
                                        <span className={`status-indicator ${user.status}`}>{user.status === 'active' ? '● ATIVO' : '● BLOQUEADO'}</span>
                                    </div>
                                    <div className="detail-item"><label>Inscrição</label><p>{user.created_at ? new Date(user.created_at).toLocaleDateString() : (user.id?.startsWith('CL') ? new Date(parseInt(user.id.substring(2))).toLocaleDateString() : '---')}</p></div>
                                </div>

                                <h4 className="mb-4 text-slate-400 font-bold uppercase text-xs tracking-wider">Resumo Financeiro</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="debt-card-mini bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                        <label className="block text-xs text-slate-500 font-bold mb-1 uppercase">Dívida de Mensalidades</label>
                                        <span className={`text-xl font-black ${subDebt > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{subDebt.toLocaleString()} MT</span>
                                    </div>
                                    <div className="debt-card-mini bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                        <label className="block text-xs text-slate-500 font-bold mb-1 uppercase">Outras Dívidas (Consumo)</label>
                                        <span className={`text-xl font-black ${otherDebt > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{otherDebt.toLocaleString()} MT</span>
                                    </div>
                                    <div className="col-span-2 bg-slate-900 p-4 rounded-xl border-2 border-slate-700 flex justify-between items-center">
                                        <span className="font-bold text-slate-300">TOTAL EM ABERTO</span>
                                        <span className={`text-2xl font-black ${totalCurrentDebt > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{totalCurrentDebt.toLocaleString()} MT</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'acessos' && (
                            <div className="attendance-list">
                                {attendance.length === 0 ? <p className="text-muted text-center py-12">Sem registos de acesso.</p> : (
                                    <table className="compact-table">
                                        <thead><tr><th>Data / Hora</th><th>Tipo</th></tr></thead>
                                        <tbody>
                                            {attendance.slice(0, 50).map((a, i) => (
                                                <tr key={i}>
                                                    <td>{new Date(a.timestamp).toLocaleString()}</td>
                                                    <td><span className={`badge ${a.type}`}>{a.type === 'in' ? 'ENTRADA' : 'SAÍDA'}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {activeTab === 'mensalidades' && (
                            <div className="payments-list">
                                {subscriptionInvoices.length === 0 ? <p className="text-muted text-center py-12">Sem historial de planos.</p> : (
                                    <table className="compact-table">
                                        <thead><tr><th>Nº Fatura</th><th>Data</th><th>Valor</th><th>Estado</th><th>Acção</th></tr></thead>
                                        <tbody>
                                            {subscriptionInvoices.map((inv, i) => (
                                                <tr key={i}>
                                                    <td className="font-mono text-xs">{inv.id}</td>
                                                    <td>{new Date(inv.date).toLocaleDateString()}</td>
                                                    <td>{Number(inv.amount || 0).toLocaleString()} MT</td>
                                                    <td><span className={`status-badge ${inv.status}`}>{inv.status}</span></td>
                                                    <td>
                                                        {inv.status === 'pendente' && (
                                                            <button onClick={() => handlePay(inv.id)} className="btn-pay-fast">PAGAR</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {activeTab === 'consumo' && (
                            <div className="other-expenses-list">
                                {otherInvoices.length === 0 ? <p className="text-muted text-center py-12">Sem outras despesas.</p> : (
                                    <table className="compact-table">
                                        <thead><tr><th>Nº Fatura</th><th>Data</th><th>Descrição Item</th><th>Total</th><th>Estado</th><th>Acção</th></tr></thead>
                                        <tbody>
                                            {otherInvoices.map((inv, i) => (
                                                <tr key={i}>
                                                    <td className="font-mono text-xs">{inv.id}</td>
                                                    <td>{new Date(inv.date).toLocaleDateString()}</td>
                                                    <td className="text-xs text-slate-300">
                                                        {inv.items?.map(it => `${it.name} (x${it.quantity || 1})`).join(', ') || 'Venda Diversa'}
                                                    </td>
                                                    <td>{Number(inv.amount || 0).toLocaleString()} MT</td>
                                                    <td><span className={`status-badge ${inv.status}`}>{inv.status}</span></td>
                                                    <td>
                                                        {inv.status === 'pendente' && (
                                                            <button onClick={() => handlePay(inv.id)} className="btn-pay-fast">PAGAR</button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

// Modal Component para Criar/Editar (Keep Existing)
const ClientModal = ({ isOpen, onClose, onSave, plans, initialData }) => {
    const [formData, setFormData] = useState({
        name: '',
        nuit: '',
        phone: '',
        email: '',
        address: '',
        planId: ''
    });

    // Payment State (Only for New Users)
    const [payNow, setPayNow] = useState(false);
    const [regFee, setRegFee] = useState(700); // Updated to 700 MT based on Table
    const [paymentMethod, setPaymentMethod] = useState('Numerário');

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
            setPayNow(false); // Don't show payment for edits by default
        } else {
            setFormData({ name: '', nuit: '', phone: '', email: '', address: '', planId: '' });
            setPayNow(true); // Default to pay now for new users
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...formData, payNow, regFee, paymentMethod });
        onClose();
    };

    const selectedPlan = plans.find(p => p.id === formData.planId);
    const planPrice = selectedPlan ? Number(selectedPlan.price) : 0;
    const totalFirstPayment = payNow ? (planPrice + Number(regFee)) : 0;

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-fade-in" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h3>{initialData ? 'Editar Utente' : 'Novo Utente'}</h3>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Nome Completo*</label>
                            <input required type="text" className="input" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>NUIT</label>
                            <input type="text" className="input" value={formData.nuit || ''} onChange={e => setFormData({ ...formData, nuit: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Telefone*</label>
                            <input required type="text" className="input" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" className="input" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div className="form-group full">
                            <label>Endereço</label>
                            <input type="text" className="input" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        </div>
                        <div className="form-group full">
                            <label>Plano de Adesão*</label>
                            <select required className="input" value={formData.planId || ''} onChange={e => setFormData({ ...formData, planId: e.target.value })}>
                                <option value="">Selecione um plano...</option>
                                {plans.map(p => <option key={p.id} value={p.id}>{p.name} - {Number(p.price).toLocaleString()} MT</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Section de Pagamento Inicial (Apenas Novo) */}
                    {!initialData && (
                        <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                            <div className="flex items-center gap-3 mb-3">
                                <input
                                    type="checkbox"
                                    id="payNow"
                                    className="w-5 h-5 rounded border-slate-600 bg-slate-700"
                                    checked={payNow}
                                    onChange={e => setPayNow(e.target.checked)}
                                />
                                <label htmlFor="payNow" className="font-bold text-slate-200 cursor-pointer select-none">
                                    Processar Inscrição e 1ª Mensalidade?
                                </label>
                            </div>

                            {payNow && (
                                <div className="space-y-3 animate-fade-in pl-1">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="form-group">
                                            <label className="text-xs text-slate-400">Taxa de Inscrição (Inclui Cartão + Plano)</label>
                                            <input
                                                type="number"
                                                className="input text-right"
                                                value={regFee}
                                                onChange={e => setRegFee(Math.max(0, Number(e.target.value)))}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="text-xs text-slate-400">Método Pagamento</label>
                                            <select
                                                className="input"
                                                value={paymentMethod}
                                                onChange={e => setPaymentMethod(e.target.value)}
                                            >
                                                <option value="Numerário">Numerário / Cash</option>
                                                <option value="M-Pesa">M-Pesa</option>
                                                <option value="POS">POS / Cartão</option>
                                                <option value="Transferência">Transferência</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded flex justify-between items-center border border-slate-600">
                                        <span className="text-sm font-bold text-slate-400">TOTAL A PAGAR:</span>
                                        <span className="text-lg font-black text-emerald-400">{totalFirstPayment.toLocaleString()} MT</span>
                                    </div>
                                    <p className="text-xs text-slate-500 text-center">
                                        (Inclui {planPrice.toLocaleString()} MT do plano + Taxa de Inscrição)
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="modal-footer mt-6">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
                        <button type="submit" className="btn btn-primary">
                            <Save size={18} /> {initialData ? 'Atualizar' : (payNow ? 'Salvar e Pagar' : 'Salvar Apenas')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ... (Modal Components above remain unchanged) ...

const UserRow = memo(({ user, plans, onRenewal, onDetails, onBlock, onEdit, onDelete }) => {
    const planId = user.plan_id || user.planId || user.plan?.id;
    const planName = plans?.find(p => p.id === planId)?.name || user.plan?.name || 'Sem Plano';
    const balance = Number(user.balance || 0);

    // Prioritizar o nome. Se for igual ao ID e for apenas números, sinalizar ou tratar
    const rawName = user.name || '';
    const isIdAsName = rawName === user.id && /^\d+$/.test(rawName);
    const userName = isIdAsName ? `ID: ${rawName}` : (rawName || 'Utente sem Nome');

    return (
        <tr className={user.status === 'inactive' ? 'opacity-50' : ''}>
            <td>
                <div className="user-info">
                    <div className="avatar-circle">{userName.charAt(0)}</div>
                    <div>
                        <p className="font-bold">{userName}</p>
                        <span className="text-small text-muted">{user.nuit || 'S/ NUIT'}</span>
                    </div>
                </div>
            </td>
            <td>
                <div className="contact-info">
                    <p><Phone size={14} className="inline-icon" /> {user.phone}</p>
                    {user.email && <p><Mail size={14} className="inline-icon" /> {user.email}</p>}
                </div>
            </td>
            <td>
                <span className="plan-badge gray">
                    {planName}
                </span>
            </td>
            <td>
                <span className={`balance-badge ${balance > 0 ? 'debt' : 'ok'}`}>
                    {balance.toLocaleString()} MT
                </span>
            </td>
            <td>
                <span className={`status-indicator ${user.status}`}>
                    {user.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
            </td>
            <td>
                <div className="actions-cell">
                    <button className="btn btn-sm btn-primary" onClick={() => onRenewal(user)}>
                        <CalendarCheck size={16} /> Pagar
                    </button>
                    <button className="icon-btn" style={{ color: '#3b82f6' }} onClick={() => onDetails(user)}>
                        <Eye size={18} />
                    </button>
                    <button
                        className={`icon-btn ${user.status === 'active' ? 'text-red-500' : 'text-green-500'}`}
                        onClick={() => onBlock(user)}
                    >
                        {user.status === 'active' ? <Ban size={18} /> : <CheckCircle size={18} />}
                    </button>
                    <button className="icon-btn" onClick={() => onEdit(user)}>
                        <Edit size={18} />
                    </button>
                    <button className="icon-btn delete" onClick={() => onDelete(user.id)}>
                        <Trash2 size={18} />
                    </button>
                </div>
            </td>
        </tr>
    );
});

const Users = () => {
    const [users, setUsers] = useState([]);
    const [plans, setPlans] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [renewalUser, setRenewalUser] = useState(null);
    const [detailsUser, setDetailsUser] = useState(null);
    const [generatedInvoice, setGeneratedInvoice] = useState(null);
    const [displayLimit, setDisplayLimit] = useState(50);
    const [isPrintingReport, setIsPrintingReport] = useState(false);

    const loadData = useCallback(async () => {
        try {
            await db.init();
            const [u, p, allInvoices] = await Promise.all([
                db.clients.getAll().then(res => Array.isArray(res) ? res : []),
                db.plans.getAll().then(res => Array.isArray(res) ? res : []),
                db.invoices.getAll().then(res => Array.isArray(res) ? res : [])
            ]);

            // Calcular saldo devedor para cada utente em tempo real
            const usersWithBalance = u.map(client => {
                const clientInvoices = allInvoices.filter(inv => (inv.client_id === client.id || inv.clientId === client.id));
                const unpaid = clientInvoices
                    .filter(inv => inv.status === 'pendente')
                    .reduce((total, inv) => total + (Number(inv.amount || inv.total) || 0), 0);

                return { ...client, balance: unpaid };
            });

            setUsers(usersWithBalance);
            setPlans(p);
        } catch (e) { console.error("Erro loading data", e); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSave = async (data) => {
        try {
            let clientId = editingUser?.id;

            if (editingUser) {
                // Update
                const updateData = { ...data };
                // Garantir que não enviamos campos extra se a API for estrita (SQLite ignora, mas por segurança)
                delete updateData.payNow;
                delete updateData.regFee;
                delete updateData.paymentMethod;

                await db.clients.update(editingUser.id, updateData);
            } else {
                // Create
                const clientData = { ...data };
                delete clientData.payNow;
                delete clientData.regFee;
                delete clientData.paymentMethod;

                const newClient = await db.clients.create(clientData);
                clientId = newClient.id; // API retorna o objeto criado
            }

            // --- Lógica de Pagamento Inicial (Apenas na Criação) ---
            if (!editingUser && data.payNow && clientId) {
                const selectedPlan = plans.find(p => p.id === data.planId);
                const planPrice = selectedPlan ? Number(selectedPlan.price) : 0;
                const fee = Number(data.regFee) || 0;

                const items = [];
                // Item 1: Inscrição
                if (fee > 0) items.push({ productId: 'FEE', name: 'Taxa de Inscrição (Inclui Cartão + Plano Inicial)', price: fee, qty: 1, type: 'fee' });
                // Item 2: Mensalidade
                if (planPrice > 0) items.push({ productId: 'SUBSCRIPTION', name: `Mensalidade 1º Mês (${selectedPlan.name})`, price: planPrice, qty: 1, type: 'subscription' });

                if (items.length > 0) {
                    // Usamos o endpoint de Stock/Venda pois ele gera Fatura.
                    await db.inventory.processSale(
                        clientId,
                        items,
                        'pago',
                        { method: data.paymentMethod }
                    );
                }
            }
            // -------------------------------------------------------

            setIsModalOpen(false);
            setEditingUser(null);
            await loadData();

            if (!editingUser && data.payNow) alert("Utente criado e pagamento registado!");
            else if (!editingUser) alert("Utente criado com sucesso!");
            else alert("Dados atualizados!");

        } catch (e) { alert("Erro ao salvar: " + e.message); }
    };

    const handleDelete = useCallback(async (id) => {
        if (!confirm("Tem a certeza que deseja eliminar este utente?")) return;
        try {
            db.run("ALTER TABLE clients ADD COLUMN created_at TEXT", () => { }); // Swallow error if exists
            db.run("ALTER TABLE clients ADD COLUMN last_access TEXT", () => { }); // Swallow error if exists
            db.run("ALTER TABLE clients ADD COLUMN plan_id TEXT", () => { });
            db.run("ALTER TABLE products ADD COLUMN cost_price REAL DEFAULT 0", () => { });
            if (db.clients.delete) {
                await db.clients.delete(id);
                await loadData();
            } else {
                alert("Funcionalidade de eliminar ainda não implementada no adaptador.");
            }
        } catch (e) {
            alert("Erro ao eliminar: " + e.message);
        }
    }, [loadData]);

    const handleEditClick = useCallback((user) => {
        setEditingUser(user);
        setIsModalOpen(true);
    }, []);

    const handleRenewalClick = useCallback((u) => setRenewalUser(u), []);
    const handleDetailsClick = useCallback((u) => setDetailsUser(u), []);

    const generateUsersReport = async (sendWhatsApp = false) => {
        setIsPrintingReport(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800));
            const element = document.getElementById('users-report-print');
            if (!element) throw new Error("Template not found");

            const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            if (sendWhatsApp) {
                const phoneNumber = window.prompt("Para qual número deseja enviar o relatório?", "840000000");
                if (!phoneNumber) return;

                const pdfBase64 = pdf.output('datauristring').split(',')[1];
                await fetch('http://localhost:3001/api/whatsapp/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: phoneNumber,
                        message: `*LISTAGEM DE MEMBROS HEFEL GYM*\nSegue em anexo o relatório geral de utentes atualizado.`,
                        pdfBase64: pdfBase64
                    })
                });
                alert("Relatório enviado por WhatsApp!");
            } else {
                pdf.save(`Relatorio_Membros_HefelGym_${new Date().toLocaleDateString()}.pdf`);
            }
        } catch (e) {
            alert("Erro ao gerar relatório: " + e.message);
        } finally {
            setIsPrintingReport(false);
        }
    };

    // Filter and Search Logic (Memoized to prevent lag on every button click)
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.nuit?.includes(searchTerm) ||
                user.phone?.includes(searchTerm);
            const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
            return matchesSearch && matchesStatus;
        });
    }, [users, searchTerm, filterStatus]);

    // Reset pagination when searching or filtering
    useEffect(() => {
        setDisplayLimit(50);
    }, [searchTerm, filterStatus]);

    const handleNewUserClick = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleSyncMock = async () => {
        if (!confirm("Deseja sincronizar os utilizadores e eventos com a catraca?")) return;
        try {
            const devs = await db.hardware.getDevices();
            const targetDev = devs.find(d => d.ip.includes('149')) || devs[0];

            if (!targetDev) {
                return alert("Nenhuma catraca configurada para sincronizar.");
            }

            // 1. Call Sync USERS API
            const resSpec = await fetch('http://localhost:3001/api/hardware/sync-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId: targetDev.id })
            });
            const userData = await resSpec.json();

            // 2. Call Sync EVENTS API
            const resEvents = await fetch('http://localhost:3001/api/hardware/sync-events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId: targetDev.id })
            });
            const eventData = await resEvents.json();


            if (resSpec.ok) {
                alert(`Sincronização concluída!\nUtentes: ${userData.users?.length || 0}\nEventos/Acessos: ${eventData.count || 0}`);
                loadData();
            } else {
                alert("Erro na sincronização de usuários.");
            }
        } catch (e) {
            alert("Erro ao conectar à catraca: " + e.message);
        }
    };

    const handleToggleBlock = useCallback(async (user) => {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        const action = newStatus === 'active' ? 'unblock' : 'block';

        if (!confirm(`Deseja ${action === 'block' ? 'BLOQUEAR' : 'DESBLOQUEAR'} acesso para ${user.name}?`)) return;

        try {
            // 1. Atualizar Hardware (Todos os dispositivos)
            const devs = await db.hardware.getDevices();
            if (devs.length > 0) {
                const promises = devs.map(d =>
                    fetch('http://localhost:3001/api/hardware/user-control', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            ip: d.ip, user: d.username, pass: d.password,
                            userId: user.id, action
                        })
                    }).catch(e => console.error(`Erro device ${d.ip}:`, e))
                );
                await Promise.all(promises);
            }

            // 2. Atualizar DB Local
            await db.clients.update(user.id, { status: newStatus });

            // 3. Atualizar UI (We could also call loadData(), but updating local state is faster)
            setUsers(u => u.map(item => item.id === user.id ? { ...item, status: newStatus } : item));
            alert(`Usuário ${newStatus === 'active' ? 'Desbloqueado' : 'Bloqueado'} com sucesso!`);

        } catch (e) {
            alert("Erro ao atualizar status: " + e.message);
        }
    }, []);

    return (
        <div className="users-page animate-fade-in">
            <div className="page-header">
                <div className="header-title">
                    <h2>Gestão de Utentes</h2>
                    <p>Membros registados do ginásio</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-secondary" onClick={handleSyncMock}>
                        <RefreshCw size={20} /> Sincronizar
                    </button>
                    <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-secondary" onClick={() => generateUsersReport(false)} disabled={isPrintingReport}>
                            {isPrintingReport ? <RefreshCw size={18} className="animate-spin" /> : <DownloadCloud size={18} className="mr-2" />}
                            Relatório Listagem
                        </button>
                        <button className="btn btn-outline" onClick={() => generateUsersReport(true)} disabled={isPrintingReport} style={{ borderColor: '#10b981', color: '#10b981' }}>
                            <Send size={18} className="mr-2" /> WhatsApp
                        </button>
                        <button className="btn btn-primary" onClick={() => { setEditingUser(null); setIsModalOpen(true); }}>
                            <Plus size={18} className="mr-2" /> Novo Utente
                        </button>
                    </div>
                </div>
            </div>

            <div className="filters-bar mb-6 flex gap-4">
                <div className="search-box">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Pesquisar por nome, NUIT..."
                        className="input search-input"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="all">Todos</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                </select>
            </div>

            <div className="card table-card">
                {users.length === 0 ? (
                    <div className="empty-state p-8 text-center text-muted">
                        <p>Nenhum utente registado. Adicione o primeiro utente.</p>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nome / NUIT</th>
                                <th>Contacto</th>
                                <th>Plano</th>
                                <th>Saldo Devedor</th>
                                <th>Estado</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.slice(0, displayLimit).map((user) => (
                                <UserRow
                                    key={user.id}
                                    user={user}
                                    plans={plans}
                                    onRenewal={handleRenewalClick}
                                    onDetails={handleDetailsClick}
                                    onBlock={handleToggleBlock}
                                    onEdit={handleEditClick}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </tbody>
                    </table>
                )}

                {filteredUsers.length > displayLimit && (
                    <div className="load-more-section p-4 text-center border-t border-gray-800">
                        <p className="text-muted text-sm mb-2">A mostrar {displayLimit} de {filteredUsers.length} utentes</p>
                        <button
                            className="btn btn-secondary btn-sm"
                            style={{ margin: '0 auto' }}
                            onClick={() => setDisplayLimit(prev => prev + 50)}
                        >
                            Ver Mais Utentes (+50)
                        </button>
                    </div>
                )}
            </div>

            <ClientModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                plans={plans}
                initialData={editingUser}
            />

            <RenewalModal
                isOpen={!!renewalUser}
                onClose={(invoice) => {
                    setRenewalUser(null);
                    loadData();
                    if (invoice && invoice.id) {
                        // Fetch full invoice with client details for the view
                        db.invoices.getById(invoice.id).then(full => {
                            if (full) setGeneratedInvoice(full);
                        });
                    }
                }}
                user={renewalUser}
            />

            <ClientDetailsModal
                isOpen={!!detailsUser}
                onClose={() => setDetailsUser(null)}
                user={detailsUser}
                plans={plans}
                onRefresh={loadData}
                onRenewal={handleRenewalClick}
            />

            {
                generatedInvoice && (
                    <InvoiceTemplate
                        invoice={generatedInvoice}
                        onClose={() => setGeneratedInvoice(null)}
                    />
                )
            }

            {/* Container invisível para gerar o Relatório */}
            {isPrintingReport && (
                <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                    <div id="users-report-print">
                        <UsersReportTemplate
                            users={filteredUsers}
                            plans={plans}
                            filters={{ search: searchTerm, status: filterStatus }}
                            summary={{
                                totalDebt: filteredUsers.reduce((acc, u) => acc + (u.balance || 0), 0)
                            }}
                        />
                    </div>
                </div>
            )}

            <style>{`
        /* Reuse core table styles */
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .header-title h2 { font-size: 1.8rem; margin-bottom: 0.25rem; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { text-align: left; padding: 1rem; color: var(--text-muted); border-bottom: 1px solid var(--border); }
        .data-table td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .user-info { display: flex; align-items: center; gap: 1rem; }
        .avatar-circle { width: 40px; height: 40px; border-radius: 50%; background: var(--bg-card-hover); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: bold; }
        .text-small { font-size: 0.8rem; }
        .font-bold { font-weight: 600; }
        .contact-info p { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; margin-bottom: 0.2rem; }
        
        .balance-badge { font-weight: 700; font-family: monospace; }
        .balance-badge.debt { color: var(--danger); }
        .balance-badge.ok { color: var(--success); }

        .plan-badge { padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); }
        .plan-badge.orange { color: #f97316; background: rgba(249,115,22,0.1); }
        .plan-badge.blue { color: #3b82f6; background: rgba(59,130,246,0.1); }
        .plan-badge.purple { color: #a855f7; background: rgba(168,85,247,0.1); }

        .status-indicator { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 4px; font-size: 0.8rem; }
        .status-indicator.active { color: var(--success); background: rgba(16,185,129,0.1); }
        .status-indicator.inactive { color: var(--text-muted); }

        .actions-cell { display: flex; gap: 0.5rem; }
        .icon-btn { padding: 0.5rem; background: none; border: none; color: var(--text-muted); cursor: pointer; border-radius: 4px; transition: all 0.2s; }
        .icon-btn:hover { background: var(--bg-card-hover); color: var(--text-main); }
        .icon-btn.delete:hover { color: var(--danger); background: rgba(239,68,68,0.1); }
        
        .btn-sm { padding: 0.25rem 0.75rem; font-size: 0.8rem; display: flex; align-items: center; gap: 0.3rem; height: 32px; }
        
        .opacity-50 { opacity: 0.5; }
        .filters-bar { margin-bottom: 1.5rem; }
        .search-box { position: relative; flex: 1; max-width: 400px; }
        .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
        .search-input { padding-left: 2.5rem; width: 100%; box-sizing: border-box; }

        /* --- GLOBAL MODAL STYLES --- */
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.8); z-index: 1000;
          display: flex; align-items: center; justify-content: center;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          background: var(--bg-card); width: 100%; max-width: 600px;
          border-radius: var(--radius); padding: 2rem;
          border: 1px solid var(--border);
          box-shadow: var(--shadow-lg);
          max-height: 90vh;
          display: flex; flex-direction: column;
        }
        .modal-header { display: flex; justify-content: space-between; margin-bottom: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; flex-shrink: 0; }
        .close-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; }
        
        form { display: flex; flex-direction: column; overflow: hidden; }
        .form-grid { 
            display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1rem; 
            overflow-y: auto; padding-right: 0.5rem;
        }
        .form-group.full { grid-column: span 2; }
        .form-group label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; color: var(--text-muted); font-weight: 500; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid var(--border); padding-top: 1rem; flex-shrink: 0; }

        /* --- CLIENT DETAILS DRASTIC FIX --- */
        .mdl-details-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.9); z-index: 999999 !important;
            display: flex !important; align-items: center; justify-content: center;
            padding: 20px;
            backdrop-filter: blur(10px);
        }
        .mdl-details-container {
            max-width: 850px; width: 100%; max-height: 90vh;
            background: #1e293b; padding: 0; border-radius: 20px; 
            border: 1px solid #334155; overflow: hidden;
            display: flex; flex-direction: column;
            box-shadow: 0 0 100px rgba(0,0,0,0.8);
            position: relative;
        }
        .mdl-details-header {
            padding: 1.5rem 2rem; background: rgba(15, 23, 42, 0.5); 
            display: flex; justify-content: space-between; align-items: center;
            border-bottom: 1px solid #334155;
        }
        .header-user-info { display: flex; align-items: center; gap: 1.5rem; }
        .user-name { margin: 0; font-size: 1.7rem; font-weight: 700; color: #f8fafc; }
        .user-id { color: #94a3b8; font-family: monospace; font-size: 0.9rem; }

        .tabs-container-details { 
            display: flex; gap: 0.25rem; padding: 0 1rem; 
            background: rgba(15, 23, 42, 0.3); border-bottom: 1px solid #334155; 
        }
        .tab-btn-details { 
            padding: 1.2rem 1.5rem; background: none; border: none; color: #94a3b8; 
            cursor: pointer; border-bottom: 3px solid transparent; display: flex; 
            align-items: center; gap: 0.7rem; transition: all 0.2s; font-weight: 600;
            font-size: 0.95rem;
        }
        .tab-btn-details:hover { color: #f8fafc; background: rgba(255,255,255,0.03); }
        .tab-btn-details.active { 
            color: #3b82f6; border-bottom-color: #3b82f6; 
            background: rgba(59, 130, 246, 0.05); 
        }
        
        .modal-details-body { flex: 1; overflow-y: auto; padding: 2rem; min-height: 400px; }
        .details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2.5rem; }
        .detail-item label { display: block; font-size: 0.75rem; color: #64748b; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; }
        .detail-item p { font-size: 1.2rem; font-weight: 500; color: #e2e8f0; }
        .detail-item.full { grid-column: 1 / -1; }
        .highlight-plan { color: #fb923c !important; font-weight: 700 !important; }

        .compact-table { width: 100%; border-collapse: collapse; }
        .compact-table th { text-align: left; padding: 1rem; border-bottom: 2px solid #334155; color: #64748b; font-size: 0.8rem; text-transform: uppercase; }
        .compact-table td { padding: 1rem; border-bottom: 1px solid rgba(51, 65, 85, 0.5); color: #cbd5e1; }
        
        .badge { padding: 0.3rem 0.8rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
        .badge.in { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
        .badge.out { background: rgba(249, 115, 22, 0.15); color: #fb923c; }
        
        .status-badge { font-size: 0.8rem; padding: 0.4rem 0.8rem; border-radius: 6px; font-weight: 600; }
        .status-badge.pago { background: rgba(34, 197, 94, 0.1); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.2); }
        .status-badge.pendente { background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }
        
        .status-indicator { font-weight: 700; font-size: 0.9rem; }
        .status-indicator.active { color: #4ade80; }
        .status-indicator.inactive { color: #f87171; }
        
        .debt-display { text-align: center; background: rgba(15, 23, 42, 0.4); padding: 4rem 2rem; border-radius: 20px; border: 1px solid rgba(239, 68, 68, 0.1); }
        .debt-display .label { color: #64748b; font-weight: 700; letter-spacing: 0.1em; }
        .debt-display .amount { font-size: 4.5rem; font-weight: 900; margin: 1rem 0; letter-spacing: -0.02em; }
        .debt-display .amount.negative { color: #ef4444; text-shadow: 0 0 20px rgba(239, 68, 68, 0.2); }
        .debt-display .amount.positive { color: #22c55e; text-shadow: 0 0 20px rgba(34, 197, 94, 0.2); }
        
        .avatar-circle.large { width: 72px; height: 72px; font-size: 2rem; background: #334155; color: #3b82f6; border: 3px solid #3b82f6; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        .btn-pay-fast {
            background: #10b981; color: white; border: none; padding: 0.3rem 0.6rem;
            border-radius: 4px; font-size: 0.7rem; font-weight: 700; cursor: pointer;
            transition: all 0.2s;
        }
        .btn-pay-fast:hover { background: #059669; transform: translateY(-1px); }
      `}</style>
        </div>
    );
};

export default Users;
