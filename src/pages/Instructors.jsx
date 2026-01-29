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
    Activity
} from 'lucide-react';
import { db } from '../services/db';

const InstructorModal = ({ isOpen, onClose, onSave, instructor }) => {
    const [formData, setFormData] = useState({
        name: '',
        type: 'internal', // internal or external
        phone: '',
        rate: 0, // Fee per session (internal) OR Rent fee (external)
        specialty: 'Geral'
    });

    useEffect(() => {
        if (instructor) {
            setFormData({
                id: instructor.id,
                name: instructor.name || '',
                phone: instructor.phone || '',
                // Map backend -> frontend
                type: instructor.contract_type || instructor.type || 'internal',
                rate: instructor.commission || instructor.rate || 0,
                specialty: instructor.specialties || instructor.specialty || ''
            });
        } else {
            setFormData({ name: '', type: 'internal', phone: '', rate: 0, specialty: 'Geral' });
        }
    }, [instructor, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return createPortal(
        <div className="modal-overlay">
            <div className="modal-content animate-fade-in">
                <div className="modal-header">
                    <h3>{instructor ? 'Editar' : 'Novo'} Profissional</h3>
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
                                    <option value="receptionist">Rececionista</option>
                                    <option value="cleaner">Limpeza</option>
                                    <option value="waiter">Barman / Waiter</option>
                                    <option value="security">Segurança</option>
                                    <option value="manager">Gerente</option>
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

                        <div className="grid-2 mb-4">
                            <div className="form-group">
                                <label>Contacto</label>
                                <input type="text" className="input w-full"
                                    value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>
                                    {formData.type === 'external' ? 'Taxa de Uso (MT)' : 'Salário Base (MT)'}
                                </label>
                                <input type="number" className="input w-full"
                                    value={formData.rate || 0} onChange={e => setFormData({ ...formData, rate: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
                    <button type="submit" form="instructorForm" className="btn btn-primary">Salvar</button>
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
        case 'receptionist': return 'Rececionista';
        case 'cleaner': return 'Limpeza';
        case 'waiter': return 'Bar / Waiter';
        case 'security': return 'Segurança';
        case 'manager': return 'Coordenador / Gerente';
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
    const [actionModal, setActionModal] = useState({ open: false, instructor: null, type: null });

    const loadData = async () => {
        try {
            const data = await db.instructors.getAll();
            setInstructors(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setInstructors([]); // Fallback
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
            specialties: data.specialty
        };

        if (editingId) {
            await db.instructors.update(editingId, payload);
        } else {
            await db.instructors.create(payload);
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

    const isInternalType = (type) => ['internal', 'receptionist', 'cleaner', 'waiter', 'security', 'manager', 'intern'].includes(type);

    return (
        <div className="instructors-page animate-fade-in">
            <div className="page-header">
                <div className="header-title">
                    <h2>Gestão de Pessoal e Staff</h2>
                    <p>Instrutores, Rececionistas e Equipa de Apoio</p>
                </div>
                <button className="btn btn-primary" onClick={() => setIsFormOpen(true)}>
                    <UserPlus size={20} /> Novo Colaborador
                </button>
            </div>

            <div className="instructors-grid">
                {instructors.map(inst => (
                    <div key={inst.id} className="card instructor-card">
                        <div className="card-header flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`avatar-placeholder ${isInternalType(inst.type) ? 'internal' : 'external'}`}>
                                    {inst.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{inst.name}</h3>
                                    <span className={`badge ${inst.type}`}>
                                        {getInstructorLabel(inst.type)}
                                    </span>
                                </div>
                            </div>
                            <div className="actions flex gap-2">
                                <button className="icon-btn" onClick={() => { setEditingId(inst.id); setIsFormOpen(true); }}><Edit2 size={16} /></button>
                                <button className="icon-btn danger" onClick={() => handleDelete(inst.id)}><Trash2 size={16} /></button>
                            </div>
                        </div>

                        <div className="financial-summary p-4 rounded mb-4">
                            <div className="flex justify-between mb-2 text-sm text-muted">
                                <span>{isInternalType(inst.type) ? 'Aulas/Sessões' : 'Taxas Pendentes'}</span>
                                <Activity size={16} />
                            </div>
                            <div className="text-2xl font-bold mb-1">
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
                ))}
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
