import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    Users,
    UserPlus,
    DollarSign,
    Briefcase,
    CalendarCheck,
    MoreVertical,
    Trash2,
    Edit2,
    CheckCircle,
    TrendingUp,
    TrendingDown,
    Activity,
    History,
    FileText,
    Shield
} from 'lucide-react';
import { db, API_LOCAL } from '../services/db';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PayrollReportTemplate from '../components/Reports/PayrollReportTemplate';
import { FileText as FileTextIcon } from 'lucide-react';

const HistoryModal = ({ isOpen, onClose, history, instructorName }) => {
    if (!isOpen) return null;
    return createPortal(
        <div className="modal-overlay">
            <div className="modal-content animate-fade-in" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h3>Histórico de Evolução: {instructorName}</h3>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>
                <div className="modal-body">
                    <div className="history-list">
                        {history.length === 0 ? (
                            <p className="text-center text-muted p-4">Nenhum histórico registado ainda.</p>
                        ) : (
                            history.map(item => (
                                <div key={item.id} className="history-item p-3 border-b border-white/5 mb-2 hover:bg-white/5 rounded transition-all">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-xs font-bold text-primary">{new Date(item.change_date).toLocaleDateString()} {new Date(item.change_date).toLocaleTimeString()}</span>
                                        <span className="badge-sm blue">{item.reason || 'Atualização'}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-muted uppercase">Salário</p>
                                            <p className="text-sm">
                                                <span className="text-red-400 line-through mr-2">{item.old_salary?.toLocaleString()}</span>
                                                <span className="text-green-400 font-bold">{item.new_salary?.toLocaleString()} MT</span>
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted uppercase">Cargo/Função</p>
                                            <p className="text-sm">
                                                <span className="text-muted italic mr-2">{item.old_role}</span>
                                                <span className="font-bold">→ {item.new_role}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                <div className="modal-footer">
                    <button onClick={onClose} className="btn btn-secondary">Fechar</button>
                </div>
            </div>
            <style>{`
                .badge-sm { font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; font-weight: bold; }
                .badge-sm.blue { background: rgba(59, 130, 246, 0.1); color: #60a5fa; }
            `}</style>
        </div>,
        document.body
    );
};

const InstructorModal = ({ isOpen, onClose, onSave, instructor }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'internal',
        phone: '',
        specialty: 'Geral',
        base_salary: 0,
        bonus: 0,
        inss_discount: 0,
        irt_discount: 0,
        other_deductions: 0,
        net_salary: 0,
        rate: 0,
        absences_discount: 0,
        change_reason: ''
    });

    useEffect(() => {
        if (instructor) {
            setFormData({
                id: instructor.id,
                name: instructor.name || '',
                phone: instructor.phone || '',
                type: instructor.contract_type || instructor.type || 'internal',
                rate: instructor.commission || instructor.rate || 0,
                specialty: instructor.specialties || instructor.specialty || '',
                base_salary: instructor.base_salary || 0,
                bonus: instructor.bonus || 0,
                inss_discount: instructor.inss_discount || 0,
                irt_discount: instructor.irt_discount || 0,
                other_deductions: instructor.other_deductions || 0,
                absences_discount: instructor.absences_discount || 0,
                net_salary: instructor.net_salary || 0,
                change_reason: ''
            });
        } else {
            setFormData({
                name: '', type: 'internal', phone: '', specialty: 'Geral',
                base_salary: 0, bonus: 0, inss_discount: 0, irt_discount: 0, other_deductions: 0, net_salary: 0, rate: 0,
                change_reason: ''
            });
        }
    }, [instructor, isOpen]);

    // Calcular Salário Líquido Automático
    useEffect(() => {
        const base = Number(formData.base_salary) || 0;
        const bonus = Number(formData.bonus) || 0;
        const inss = Number(formData.inss_discount) || (base * 0.03); // 3% padrão

        // Simulação IRPS (Tabela Moçambique simplifies)
        let irps = 0;
        if (base > 20000) irps = (base - 20000) * 0.10;
        if (base > 50000) irps = 3000 + (base - 50000) * 0.20;

        const deductions = Number(formData.other_deductions) || 0;
        const net = (base + bonus) - inss - irps - deductions;

        // Só atualiza se mudar e não estivermos em loop
        if (formData.irt_discount !== irps || formData.inss_discount !== inss || formData.net_salary !== net) {
            // setFormData(prev => ({ ...prev, inss_discount: inss, irt_discount: irps, net_salary: net }));
            // Para não causar lag, vamos deixar os campos editáveis mas sugerir valores
        }
    }, [formData.base_salary, formData.bonus]);

    const calculateSalary = () => {
        const base = Number(formData.base_salary) || 0;
        const bonus = Number(formData.bonus) || 0;
        const inss = base * 0.03;
        let irps = 0;
        if (base > 20000) irps = (base - 20000) * 0.10;
        if (base > 50000) irps = 3000 + (base - 50000) * 0.20;
        const net = (base + bonus) - inss - irps - (Number(formData.other_deductions) || 0) - (Number(formData.absences_discount) || 0);

        setFormData(prev => ({
            ...prev,
            inss_discount: Math.round(inss),
            irt_discount: Math.round(irps),
            net_salary: Math.round(net)
        }));
    };

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return createPortal(
        <div className="modal-overlay">
            <div className="modal-content animate-fade-in" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h3>{instructor ? 'Editar' : 'Novo'} Colaborador / PT</h3>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>
                <div className="modal-body">
                    <form onSubmit={handleSubmit} id="instructorForm">
                        <div className="form-group mb-4">
                            <label>Nome Completo</label>
                            <input required type="text" className="input w-full"
                                value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid-2 mb-4">
                            <div className="form-group">
                                <label>Tipo de Contrato</label>
                                <select className="input w-full" value={formData.type || 'internal'} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="internal">Instrutor (Staff)</option>
                                    <option value="receptionist">Rececionista / Caixa</option>
                                    <option value="manager">Gerente / Administrador</option>
                                    <option value="cleaner">Limpeza / Auxiliar</option>
                                    <option value="security">Segurança / Guarda</option>
                                    <option value="waiter">Barman / Waiter</option>
                                    <option value="maintenance">Manutenção / Técnico</option>
                                    <option value="intern">Estagiário</option>
                                    <option value="external">PT Externo (Freelancer)</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Especialidade / Função</label>
                                <input type="text" className="input w-full"
                                    value={formData.specialty || ''} onChange={e => setFormData({ ...formData, specialty: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group mb-4">
                            <label>Contacto</label>
                            <input type="text" className="input w-full"
                                value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>

                        {formData.type !== 'external' ? (
                            <div className="salary-section p-4 rounded bg-black/20 border border-white/5 mb-4">
                                <h4 className="text-sm font-bold uppercase text-primary mb-3">Detalhes de Salário (Payroll)</h4>
                                <div className="grid-2 mb-3">
                                    <div className="form-group">
                                        <label className="text-xs">Salário Base (MT)</label>
                                        <input type="number" className="input w-full"
                                            value={formData.base_salary} onChange={e => setFormData({ ...formData, base_salary: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="text-xs">Bónus/Subsídios</label>
                                        <input type="number" className="input w-full"
                                            value={formData.bonus} onChange={e => setFormData({ ...formData, bonus: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                                <div className="grid-3 mb-4">
                                    <div className="form-group">
                                        <label className="text-xs text-red-400">INSS (3%)</label>
                                        <input type="number" className="input w-full text-red-300"
                                            value={formData.inss_discount} onChange={e => setFormData({ ...formData, inss_discount: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="text-xs text-red-500">IRT (IRPS)</label>
                                        <input type="number" className="input w-full text-red-300"
                                            value={formData.irt_discount} onChange={e => setFormData({ ...formData, irt_discount: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="text-xs text-red-400">Outros Desc.</label>
                                        <input type="number" className="input w-full text-red-300"
                                            value={formData.other_deductions} onChange={e => setFormData({ ...formData, other_deductions: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="text-xs text-red-400">Desc. Faltas</label>
                                        <input type="number" className="input w-full text-red-300"
                                            value={formData.absences_discount} onChange={e => setFormData({ ...formData, absences_discount: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>

                                {instructor && (
                                    <div className="form-group mb-3">
                                        <label className="text-xs text-primary">Motivo da Alteração (Histórico)</label>
                                        <input type="text" className="input w-full"
                                            placeholder="Ex: Promoção, Aumento Anual..."
                                            value={formData.change_reason} onChange={e => setFormData({ ...formData, change_reason: e.target.value })}
                                        />
                                    </div>
                                )}
                                <div className="flex justify-between items-center border-t border-white/10 pt-3">
                                    <button type="button" onClick={calculateSalary} className="btn btn-outline btn-sm">Calcular Auto</button>
                                    <div className="text-right">
                                        <span className="text-xs text-muted block">Salário Líquido</span>
                                        <span className="text-xl font-bold text-success">{Number(formData.net_salary).toLocaleString()} MT</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="form-group mb-4">
                                <label>Taxa de Uso / Aula (MT)</label>
                                <input type="number" className="input w-full"
                                    value={formData.rate || 0} onChange={e => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                                />
                            </div>
                        )}
                    </form>
                </div>

                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
                    <button type="submit" form="instructorForm" className="btn btn-primary">Salvar Colaborador</button>
                </div>
            </div>
            <style>{`
                /* ... (manter estilos existentes ou ajustar se necessário) ... */
                .modal-overlay { 
                    position: fixed; inset: 0; background: rgba(0,0,0,0.8); 
                    display: flex; align-items: center; justify-content: center; 
                    z-index: 9999; backdrop-filter: blur(4px); padding: 1rem;
                }
                .modal-content { 
                    background: var(--bg-card); 
                    border-radius: var(--radius); 
                    width: 100%; 
                    max-width: 500px; 
                    border: 1px solid var(--border);
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                }
                .modal-header { 
                    padding: 1.5rem; 
                    border-bottom: 1px solid var(--border);
                    display: flex; justify-content: space-between; align-items: center;
                    flex-shrink: 0;
                }
                .modal-body {
                    padding: 1.5rem;
                    overflow-y: auto;
                    flex-grow: 1;
                }
                .modal-footer { 
                    padding: 1rem 1.5rem; 
                    border-top: 1px solid var(--border);
                    display: flex; justify-content: flex-end; gap: 1rem;
                    flex-shrink: 0;
                }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .mb-4 { margin-bottom: 1rem; }
                .w-full { width: 100%; }
                .close-btn { background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; }
            `}</style>
        </div>,
        document.body
    );
};

// ...

// Helper for labels
const getInstructorLabel = (type) => {
    switch (type) {
        case 'internal': return 'Instrutor';
        case 'receptionist': return 'Receção / Caixa';
        case 'cleaner': return 'Aux. Limpeza';
        case 'waiter': return 'Bar / Waiter';
        case 'security': return 'Guarda / Segurança';
        case 'manager': return 'Gerente / Admin';
        case 'maintenance': return 'Manutenção';
        case 'intern': return 'Estagiário';
        case 'external': return 'Freelancer / PT';
        default: return 'Colaborador';
    }
};

// Simple Modal to Log a Session or Charge Fee
const ActionModal = ({ isOpen, onClose, instructor, actionType }) => {
    // ... (logic remains)
    const [amount, setAmount] = useState(0);
    const [note, setNote] = useState('');

    useEffect(() => {
        if (instructor) {
            setAmount(instructor.rate || 0);
        }
    }, [instructor]);

    if (!isOpen || !instructor) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        if (actionType === 'session') {
            db.instructors.logSession(instructor.id, amount);
        } else {
            db.instructors.chargeFee(instructor.id, amount);
        }
        onClose(true);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-fade-in" style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h3>{actionType === 'session' ? 'Registar Sessão/Aula' : 'Cobrar Taxa de Ginásio'}</h3>
                </div>
                <div className="p-4 bg-gray-800 rounded mb-4 text-center">
                    <p className="text-muted">{instructor.name}</p>
                    <h2 className="text-xl font-bold">{actionType === 'session' ? 'Pagamento a Receber' : 'Dívida a Pagar'}</h2>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group mb-4">
                        <label>Valor (MT)</label>
                        <input type="number" className="input w-full" value={amount} onChange={e => setAmount(e.target.value)} />
                    </div>
                    <div className="form-group mb-4">
                        <label>Nota / Cliente (Opcional)</label>
                        <input type="text" className="input w-full" placeholder="Ex: Sessão com Ana" value={note} onChange={e => setNote(e.target.value)} />
                    </div>
                    <div className="flex gap-2 justify-end mt-4">
                        <button type="button" onClick={() => onClose(false)} className="btn btn-secondary">Cancelar</button>
                        <button type="submit" className="btn btn-primary">Confirmar</button>
                    </div>
                </form>
            </div>
            <style>{`
                .p-4 { padding: 1rem; }
                .bg-gray-800 { background: rgba(255,255,255,0.05); }
                .rounded { border-radius: 8px; }
            `}</style>
        </div>
    );
}

const Instructors = () => {
    // ... (state setup remains the same)
    const [instructors, setInstructors] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [actionModal, setActionModal] = useState({ open: false, instructor: null, type: null });
    const [historyModal, setHistoryModal] = useState({ open: false, instructor: null, data: [] });
    const [isGenerating, setIsGenerating] = useState(false);

    const generatePayroll = async () => {
        setIsGenerating(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 800)); // Wait for render
            const element = document.getElementById('payroll-report-export');
            if (!element) throw new Error("Template not found");

            const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            const dateStr = new Date().toLocaleDateString('pt-MZ').replace(/\//g, '-');
            pdf.save(`Folha_Salarial_${dateStr}.pdf`);
        } catch (e) {
            alert("Erro ao gerar folha salarial: " + e.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const loadData = async () => {
        try {
            const data = await db.instructors.getAll();
            setInstructors(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setInstructors([]); // Fallback
        }
    };

    const loadHistory = async (id) => {
        try {
            const res = await fetch(`${db.API_LOCAL}/instructors/${id}/history`);
            const history = await res.json();
            const inst = instructors.find(i => i.id === id);
            setHistoryModal({ open: true, instructor: inst, data: history || [] });
        } catch (e) {
            console.error("Erro ao carregar histórico", e);
        }
    };

    useEffect(() => {
        db.init();
        loadData();
    }, []);

    const handleSave = async (data) => {
        // Map frontend -> backend
        const payload = {
            id: data.id || Date.now().toString(),
            name: data.name,
            phone: data.phone,
            email: data.email || '',
            contract_type: data.type,
            commission: data.rate,
            specialties: data.specialty,
            base_salary: data.base_salary,
            bonus: data.bonus,
            inss_discount: data.inss_discount,
            irt_discount: data.irt_discount,
            irt_discount: data.irt_discount,
            other_deductions: data.other_deductions,
            absences_discount: data.absences_discount,
            net_salary: data.net_salary
        };

        if (editingId) {
            // Include everything for put route
            const fullPayload = {
                ...payload,
                base_salary: data.base_salary,
                bonus: data.bonus,
                inss_discount: data.inss_discount,
                irt_discount: data.irt_discount,
                inss_discount: data.inss_discount,
                irt_discount: data.irt_discount,
                other_deductions: data.other_deductions,
                absences_discount: data.absences_discount,
                net_salary: data.net_salary,
                role: data.type,
                change_reason: data.change_reason
            };
            await db.instructors.update(editingId, fullPayload);
        } else {
            // For create, just the payload is fine for now but let's be safe
            await db.instructors.create({
                ...payload,
                base_salary: data.base_salary,
                role: data.type
            });
        }
        setEditingId(null);
        await loadData();
    };

    const handleDelete = async (id) => {
        if (confirm('Tem certeza?')) {
            await db.instructors.delete(id);
            await loadData();
        }
    };

    const handleClearBalance = async (id) => {
        if (confirm('Confirmar liquidação total do saldo?')) {
            await db.instructors.clearBalance(id);
            await loadData();
        }
    };

    // Include EVERYONE except strictly external PTs/Freelancers
    const isInternalType = (type) => type !== 'external';

    return (
        <div className="instructors-page animate-fade-in">
            <div className="page-header">
                <div className="header-title">
                    <h2>Gestão de Pessoal e Staff</h2>
                    <p>Instrutores, Rececionistas e Equipa de Apoio</p>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="flex bg-black/40 rounded-xl p-1.5 mr-4 border border-white/10">
                        <button
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${viewMode === 'grid' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <Users size={20} /> Mosaico
                        </button>
                        <button
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all ${viewMode === 'payroll' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                            onClick={() => setViewMode('payroll')}
                        >
                            <FileTextIcon size={20} /> Tabela Salarial
                        </button>
                    </div>

                    {viewMode === 'payroll' && (
                        <button
                            className="btn btn-outline flex items-center gap-2 font-bold border-2"
                            style={{ height: '50px', padding: '0 24px', borderColor: 'rgba(255,255,255,0.2)' }}
                            onClick={generatePayroll}
                            disabled={isGenerating}
                        >
                            {isGenerating ? 'A GERAR...' : <><FileTextIcon size={20} /> BAIXAR RELATÓRIO PDF</>}
                        </button>
                    )}

                    <button
                        className="btn btn-primary flex items-center gap-2 font-bold shadow-lg"
                        style={{ height: '50px', padding: '0 24px', background: '#2563eb' }}
                        onClick={() => setIsFormOpen(true)}
                    >
                        <UserPlus size={20} /> NOVO COLABORADOR
                    </button>
                </div>
            </div>

            <div className="instructors-grid">
                {viewMode === 'grid' ? (
                    instructors.map(inst => (
                        <div key={inst.id} className="card instructor-card">
                            <div className="card-header flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`avatar-placeholder ${isInternalType(inst.type) ? 'internal' : 'external'}`}>
                                        {inst.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{inst.name}</h3>
                                        <div className="flex gap-1 items-center">
                                            <span className={`badge ${inst.type}`}>
                                                {getInstructorLabel(inst.type)}
                                            </span>
                                            <button className="text-xs text-primary hover:underline flex items-center gap-1 ml-2" onClick={() => loadHistory(inst.id)}>
                                                <History size={12} /> Histórico
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="actions flex gap-2">
                                    <button className="icon-btn" title="Histórico" onClick={() => loadHistory(inst.id)}><History size={16} /></button>
                                    <button className="icon-btn" onClick={() => { setEditingId(inst.id); setIsFormOpen(true); }}><Edit2 size={16} /></button>
                                    <button className="icon-btn danger" onClick={() => handleDelete(inst.id)}><Trash2 size={16} /></button>
                                </div>
                            </div>

                            <div className="financial-summary p-4 rounded mb-4">
                                <div className="flex justify-between mb-2 text-sm text-muted">
                                    <span>Salário Líquido</span>
                                    <DollarSign size={16} />
                                </div>
                                <div className="text-2xl font-bold mb-1">
                                    {(inst.net_salary || inst.base_salary || 0).toLocaleString()} MT
                                </div>
                                <div className="flex justify-between text-xs text-muted mb-3 border-b border-white/5 pb-2">
                                    <span>Base: {inst.base_salary?.toLocaleString()} MT</span>
                                    <span className="text-red-400">Desc: -{((inst.inss_discount || 0) + (inst.irt_discount || 0)).toLocaleString()}</span>
                                </div>

                                <div className="flex justify-between mb-2 text-sm text-muted">
                                    <span>{isInternalType(inst.type) ? 'Comissões/Extras' : 'Taxas Pendentes'}</span>
                                    <Activity size={16} />
                                </div>
                                <div className="text-xl font-bold mb-1">
                                    {(inst.balance || 0).toLocaleString()} MT
                                </div>
                                <div className="text-xs text-muted flex items-center gap-1">
                                    {isInternalType(inst.type)
                                        ? <span className="text-success flex items-center gap-1"><TrendingUp size={12} /> A pagar ao Instrutor</span>
                                        : <span className="text-warning flex items-center gap-1"><TrendingDown size={12} /> A receber do PT</span>
                                    }
                                </div>
                            </div>

                            <div className="card-actions grid grid-cols-2 gap-2 mt-auto">
                                {isInternalType(inst.type) ? (
                                    <>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => setActionModal({ open: true, instructor: inst, type: 'session' })}
                                        >
                                            <CheckCircle size={16} /> Reg. Sessão
                                        </button>
                                        <button
                                            className="btn btn-outline-success btn-sm"
                                            onClick={() => handleClearBalance(inst.id)}
                                            disabled={!inst.balance}
                                        >
                                            <DollarSign size={16} /> Pagar Saldo
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => setActionModal({ open: true, instructor: inst, type: 'fee' })}
                                        >
                                            <Briefcase size={16} /> Cobrar Taxa
                                        </button>
                                        <button
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={() => handleClearBalance(inst.id)}
                                            disabled={!inst.balance}
                                        >
                                            <DollarSign size={16} /> Receber
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))) : (
                    /* PAYROLL TABLE VIEW */
                    <div className="payroll-table-container card p-0 overflow-hidden col-span-full" style={{ background: '#1e293b', border: '1px solid #334155' }}>
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div>
                                <h3 className="font-bold text-xl text-white">Folha de Processamento Salarial</h3>
                                <p className="text-sm text-gray-400 mt-1">Mês de Referência: {new Date().toLocaleDateString('pt-MZ', { month: 'long', year: 'numeric' })}</p>
                            </div>
                            <div className="text-right bg-black/20 p-3 rounded-lg border border-white/5">
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Líquido a Pagar</p>
                                <p className="text-2xl font-bold text-emerald-400">
                                    {instructors.filter(i => isInternalType(i.type)).reduce((sum, i) => sum + (i.net_salary || 0), 0).toLocaleString()} MT
                                </p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse" style={{ minWidth: '1000px' }}>
                                <thead className="bg-black/20 text-gray-400 uppercase text-xs font-bold tracking-wider">
                                    <tr>
                                        <th className="p-4 border-b border-white/5">Colaborador</th>
                                        <th className="p-4 border-b border-white/5">Cargo</th>
                                        <th className="p-4 border-b border-white/5 text-right">Salário Base</th>
                                        <th className="p-4 border-b border-white/5 text-right">Bónus</th>
                                        <th className="p-4 border-b border-white/5 text-right text-red-400">Faltas</th>
                                        <th className="p-4 border-b border-white/5 text-right text-red-400">INSS (3%)</th>
                                        <th className="p-4 border-b border-white/5 text-right text-red-400">IRT</th>
                                        <th className="p-4 border-b border-white/5 text-right text-red-400">Outros</th>
                                        <th className="p-4 border-b border-white/5 text-right bg-white/5 text-white">Líquido</th>
                                        <th className="p-4 border-b border-white/5 text-center">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {instructors.filter(i => isInternalType(i.type)).map(inst => (
                                        <tr key={inst.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-4 font-medium text-white group-hover:text-blue-400 transition-colors">{inst.name}</td>
                                            <td className="p-4 text-gray-400">{getInstructorLabel(inst.type)}</td>
                                            <td className="p-4 text-right font-mono text-gray-300">{inst.base_salary?.toLocaleString()}</td>
                                            <td className="p-4 text-right font-mono text-emerald-400">{inst.bonus?.toLocaleString()}</td>
                                            <td className="p-4 text-right font-mono text-red-400" title="Faltas">-{inst.absences_discount?.toLocaleString()}</td>
                                            <td className="p-4 text-right font-mono text-red-400">-{inst.inss_discount?.toLocaleString()}</td>
                                            <td className="p-4 text-right font-mono text-red-400">-{inst.irt_discount?.toLocaleString()}</td>
                                            <td className="p-4 text-right font-mono font-bold text-lg bg-white/5 text-white shadow-inner">{inst.net_salary?.toLocaleString()} MT</td>
                                            <td className="p-4 text-center">
                                                <button
                                                    className="p-2 rounded hover:bg-blue-500/20 text-blue-400 transition-all"
                                                    onClick={() => { setEditingId(inst.id); setIsFormOpen(true); }}
                                                    title="Editar Salário"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            <InstructorModal
                isOpen={isFormOpen}
                onClose={() => { setIsFormOpen(false); setEditingId(null); }}
                onSave={handleSave}
                instructor={editingId ? instructors.find(i => i.id === editingId) : null}
            />

            <ActionModal
                isOpen={actionModal.open}
                instructor={actionModal.instructor}
                actionType={actionModal.type}
                onClose={(refresh) => {
                    setActionModal({ open: false, instructor: null, type: null });
                    if (refresh) loadData();
                }}
            />

            <HistoryModal
                isOpen={historyModal.open}
                onClose={() => setHistoryModal({ open: false, instructor: null, data: [] })}
                history={historyModal.data}
                instructorName={historyModal.instructor?.name}
            />

            {/* Hidden Report Render */}
            {isGenerating && (
                <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                    <div id="payroll-report-export">
                        <PayrollReportTemplate
                            employees={instructors.filter(i => isInternalType(i.type)).map(i => ({
                                ...i,
                                role_label: getInstructorLabel(i.type)
                            }))}
                            month={new Date().toLocaleDateString('pt-MZ', { month: 'long' })}
                            year={new Date().getFullYear()}
                            summary={{
                                totalGross: instructors.filter(i => isInternalType(i.type)).reduce((sum, i) => sum + (i.base_salary || 0) + (i.bonus || 0), 0),
                                totalDeductions: instructors.filter(i => isInternalType(i.type)).reduce((sum, i) => sum + (i.inss_discount || 0) + (i.irt_discount || 0) + (i.other_deductions || 0), 0),
                                totalNet: instructors.filter(i => isInternalType(i.type)).reduce((sum, i) => sum + (i.net_salary || 0), 0)
                            }}
                        />
                    </div>
                </div>
            )}

            <style>{`
                .instructors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
                .instructor-card { display: flex; flex-direction: column; height: 100%; transition: transform 0.2s; }
                .instructor-card:hover { transform: translateY(-2px); border-color: var(--primary); }
                
                .avatar-placeholder { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: bold; color: white; }
                .avatar-placeholder.internal { background: linear-gradient(135deg, #3b82f6, #2563eb); }
                .avatar-placeholder.external { background: linear-gradient(135deg, #f97316, #ea580c); }
                
                .badge { font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
                .badge.internal { background: rgba(59, 130, 246, 0.1); color: #60a5fa; }
                .badge.external { background: rgba(249, 115, 22, 0.1); color: #fdba74; }
                
                .financial-summary { background: rgba(0,0,0,0.2); border: 1px solid var(--border); }
                .text-success { color: var(--success); }
                .text-warning { color: #facc15; }
                
                .btn-outline-success { border: 1px solid var(--success); color: var(--success); background: transparent; }
                .btn-outline-success:hover { background: var(--success); color: white; }
                
                .btn-outline-primary { border: 1px solid var(--primary); color: var(--primary); background: transparent; }
                .btn-outline-primary:hover { background: var(--primary); color: white; }
                
                .btn-sm { padding: 0.5rem; font-size: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
                .grid-cols-2 { display: grid; grid-template-columns: 1fr 1fr; }
            `}</style>
        </div>
    );
};

export default Instructors;
