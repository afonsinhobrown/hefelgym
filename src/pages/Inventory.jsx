import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Archive,
    Save,
    X,
    Edit2,
    Trash2,
    Package,
    TrendingUp,
    History,
    ShoppingCart,
    DollarSign,
    ArrowUpCircle,
    RefreshCw,
    MapPin,
    Dumbbell,
    List
} from 'lucide-react';
import { db } from '../services/db';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import InventoryReportTemplate from '../components/Reports/InventoryReportTemplate';
import { DownloadCloud } from 'lucide-react';

const ProductModal = ({ isOpen, onClose, onSave, initialData, locations, isAdmin }) => {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        cost_price: '',
        stock: '',
        category: 'Outros',
        location_id: '',
        photo_url: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                location_id: initialData.location_id || '',
                photo_url: initialData.photo_url || ''
            });
        } else {
            setFormData({ name: '', price: '', cost_price: '', stock: '', category: 'Outros', location_id: '', photo_url: '' });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            price: Number(formData.price),
            cost_price: Number(formData.cost_price || 0),
            stock: Number(formData.stock)
        });
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-fade-in">
                <div className="modal-header">
                    <h3>{initialData ? 'Editar Produto' : 'Novo Produto'}</h3>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group mb-4">
                        <label>Nome do Produto</label>
                        <input required type="text" className="input w-full" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div className="grid-3 mb-4">
                        <div className="form-group">
                            <label>Custo Base (MT)</label>
                            <input type="number" className="input w-full" value={formData.cost_price} onChange={e => setFormData({ ...formData, cost_price: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Preço Venda (MT)</label>
                            <input required type="number" className="input w-full" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Stock Inicial</label>
                            <input required type="number" className="input w-full" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid-2 mb-4">
                        <div className="form-group">
                            <label>Categoria</label>
                            <select className="input w-full" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                <option value="Bar">Bar</option>
                                <option value="Merchandise">Merchandise</option>
                                <option value="Suplementos">Suplementos</option>
                                <option value="Acessórios">Acessórios</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Localização / Armazém</label>
                            <select className="input w-full" value={formData.location_id} onChange={e => setFormData({ ...formData, location_id: e.target.value })}>
                                <option value="">Sem Localização</option>
                                {locations.map(loc => (
                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="form-group mb-4">
                        <label>URL da Imagem do Produto</label>
                        <input type="text" className="input w-full" placeholder="https://exemplo.com/imagem.png" value={formData.photo_url} onChange={e => setFormData({ ...formData, photo_url: e.target.value })} />
                    </div>
            </div>

            <div className="modal-footer">
                <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">{initialData ? 'Salvar Alterações' : (isAdmin ? 'Criar Produto' : 'Submeter para Aprovação')}</button>
            </div>
        </form>
            </div >
        </div >
    );
};

const EquipmentModal = ({ isOpen, onClose, onSave, initialData, locations }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        location_id: '',
        status: 'working',
        condition: 'Good',
        cost: 0,
        purchase_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (initialData) setFormData(initialData);
        else setFormData({ name: '', description: '', location_id: '', status: 'working', condition: 'Good', cost: 0, purchase_date: new Date().toISOString().split('T')[0] });
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-fade-in">
                <div className="modal-header">
                    <h3>{initialData ? 'Editar Equipamento' : 'Registar Equipamento'}</h3>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); onSave(formData); onClose(); }}>
                    <div className="grid-2 mb-4">
                        <div className="form-group">
                            <label>Nome do Equipamento</label>
                            <input required type="text" className="input w-full" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>URL da Imagem</label>
                            <input type="text" className="input w-full" value={formData.photo_url || ''} onChange={e => setFormData({ ...formData, photo_url: e.target.value })} placeholder="Link da foto..." />
                        </div>
                    </div>
                    <div className="form-group mb-4">
                        <label>Descrição / Especificações</label>
                        <textarea className="input w-full" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                    </div>
                    <div className="grid-2 mb-4">
                        <div className="form-group">
                            <label>Localização</label>
                            <select className="input w-full" value={formData.location_id} onChange={e => setFormData({ ...formData, location_id: e.target.value })}>
                                <option value="">Selecione...</option>
                                {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Estado</label>
                            <select className="input w-full" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                <option value="working">Operacional</option>
                                <option value="maintenance">Manutenção</option>
                                <option value="broken">Avariado</option>
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
                        <button type="submit" className="btn btn-primary">Registar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const RestockModal = ({ isOpen, onClose, product, onSave }) => {
    const [formData, setFormData] = useState({ quantity: 1, unit_cost: 0, supplier: '' });
    useEffect(() => {
        if (product) setFormData({ quantity: 1, unit_cost: product.cost_price || 0, supplier: '' });
    }, [product, isOpen]);
    if (!isOpen || !product) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content animate-fade-in" style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h3>Reposição: {product.name}</h3>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>
                <form onSubmit={e => { e.preventDefault(); onSave(formData); onClose(); }}>
                    <div className="grid-2 mb-4">
                        <div className="form-group">
                            <label>Quantidade</label>
                            <input required type="number" className="input w-full" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Custo Unit.</label>
                            <input required type="number" className="input w-full" value={formData.unit_cost} onChange={e => setFormData({ ...formData, unit_cost: e.target.value })} />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="submit" className="btn btn-danger w-full">Confirmar Compra</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const LocationModal = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content animate-fade-in" style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h3>Nova Localização</h3>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>
                <form onSubmit={e => { e.preventDefault(); onSave({ name }); setName(''); onClose(); }}>
                    <div className="form-group mb-4">
                        <label>Nome (Ex: Armazém A, Sala de Musculação...)</label>
                        <input required type="text" className="input w-full" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-primary w-full">Criar Local</button>
                </form>
            </div>
        </div>
    );
};

const GeneralExpenseModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({ title: '', amount: '', category: 'Outros', responsible: '', status: 'pago' });
    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content animate-fade-in" style={{ maxWidth: '450px' }}>
                <div className="modal-header">
                    <h3>Nova Despesa Geral</h3>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>
                <form onSubmit={e => { e.preventDefault(); onSave(formData); onClose(); }}>
                    <div className="form-group mb-3">
                        <label>Título / Nome da Despesa</label>
                        <input required type="text" className="input w-full" placeholder="Ex: Renda Mensal, Combustível..." value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                    </div>
                    <div className="grid-2 mb-3">
                        <div className="form-group">
                            <label>Valor (MT)</label>
                            <input required type="number" className="input w-full" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Categoria</label>
                            <select className="input w-full" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                <option value="Renda">Renda</option>
                                <option value="Energia">Energia / Água</option>
                                <option value="Combustível">Combustível</option>
                                <option value="Salários">Salários</option>
                                <option value="Manutenção">Manutenção</option>
                                <option value="Marketing">Marketing</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid-2 mb-4">
                        <div className="form-group">
                            <label>Responsável</label>
                            <input required type="text" className="input w-full" placeholder="Quem pagou?" value={formData.responsible} onChange={e => setFormData({ ...formData, responsible: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Estado</label>
                            <select className="input w-full" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                <option value="pago">Pago</option>
                                <option value="pendente">Pendente</option>
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary w-full">Registar Despesa</button>
                </form>
            </div>
        </div>
    );
};

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [equipment, setEquipment] = useState([]);
    const [locations, setLocations] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('products');
    const [search, setSearch] = useState('');

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
    const [isGeneralExpenseModalOpen, setIsGeneralExpenseModalOpen] = useState(false);

    const [editingItem, setEditingItem] = useState(null);
    const [restockingItem, setRestockingItem] = useState(null);

    const [userSession, setUserSession] = useState({});

    const loadData = async () => {
        try {
            setLoading(true);
            const sess = JSON.parse(localStorage.getItem('gymar_session') || '{}');
            setUserSession(sess);

            await db.init();
            const [p, e, l, pex, gex, invs] = await Promise.all([
                db.inventory.getAll(),
                db.equipment.getAll(),
                db.locations.getAll(),
                db.expenses.getProducts(),
                db.expenses.getAll(),
                db.invoices.getAll()
            ]);
            setProducts(Array.isArray(p) ? p : []);
            setEquipment(Array.isArray(e) ? e : []);
            setLocations(Array.isArray(l) ? l : []);

            // Unificar despesas para histórico
            const allExpenses = [
                ...(Array.isArray(pex) ? pex.map(x => ({ ...x, type: 'product' })) : []),
                ...(Array.isArray(gex) ? gex.map(x => ({ ...x, type: 'general', product_name: x.title || x.description })) : [])
            ].sort((a, b) => new Date(b.date) - new Date(a.date));

            setExpenses(allExpenses);

            const prodSales = [];
            (invs || []).forEach(inv => {
                if (inv.status === 'anulada') return;
                let items = [];
                try { items = Array.isArray(inv.items) ? inv.items : JSON.parse(inv.items || '[]'); } catch (e) { }
                items.forEach(item => {
                    if (item.productId !== 'SUBSCRIPTION') prodSales.push({ ...item, date: inv.date, client: inv.client_name });
                });
            });
            setSales(prodSales);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const isAdmin = userSession.role === 'super_admin' || userSession.role === 'gym_admin';
    const assignedLocations = useMemo(() => {
        if (isAdmin) return locations;
        try {
            const locIds = userSession.assigned_locations ? (typeof userSession.assigned_locations === 'string' ? JSON.parse(userSession.assigned_locations) : userSession.assigned_locations) : [];
            if (Array.isArray(locIds) && locIds.length > 0) {
                return locations.filter(l => locIds.includes(l.id));
            }
        } catch (e) { console.error(e); }
        return locations;
    }, [isAdmin, locations, userSession.assigned_locations]);

    const handleApprove = async (id) => {
        await db.inventory.approve(id);
        alert("Produto aprovado e ativado!");
        loadData();
    };

    const handleReject = async (id) => {
        if (confirm("Rejeitar e eliminar este pedido?")) {
            await db.inventory.reject(id);
            loadData();
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleSaveProduct = async (data) => {
        if (editingItem) await db.inventory.update(editingItem.id, data);
        else await db.inventory.create(data);
        loadData();
    };

    const handleSaveEquipment = async (data) => {
        if (editingItem) await db.equipment.update(editingItem.id, data);
        else await db.equipment.create(data);
        loadData();
    };

    const handleSaveLocation = async (data) => {
        await db.locations.create(data);
        loadData();
    };

    const handleRestock = async (data) => {
        await db.expenses.createProductExpense({ ...data, product_id: restockingItem.id, product_name: restockingItem.name });
        loadData();
    };

    const handleSaveGeneralExpense = async (data) => {
        await db.expenses.createGymExpense(data);
        loadData();
    };

    const deleteProduct = async (id) => { if (confirm('Eliminar produto?')) { await db.inventory.delete(id); loadData(); } };
    const deleteEquipment = async (id) => { if (confirm('Eliminar equipamento?')) { await db.equipment.delete(id); loadData(); } };

    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    const filteredEquipment = equipment.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

    const generateReport = async () => {
        try {
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 800));
            const element = document.getElementById('inventory-report-print');
            const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Relatorio_Inventario_${new Date().toLocaleDateString()}.pdf`);
            alert("✅ Relatório de Inventário gerado com sucesso!");
        } catch (e) {
            console.error(e);
            alert("Erro ao gerar relatório: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="inventory-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h2>Sistema de Inventário</h2>
                    <p>Gestão de Produtos, Equipamentos e Armazenamento</p>
                </div>
                <div className="flex gap-2">
                </div>
                <div className="flex gap-2">
                    {isAdmin && (
                        <>
                            <button className="btn btn-outline" onClick={() => generateReport()}>
                                <DownloadCloud size={18} className="mr-2" /> Relatório PDF
                            </button>
                            <button className="btn btn-outline" onClick={() => setIsLocationModalOpen(true)}>
                                <MapPin size={18} className="mr-2" /> Gerir Locais
                            </button>
                        </>
                    )}
                    {activeTab === 'products' ? (
                        <button className="btn btn-primary" onClick={() => { setEditingItem(null); setIsProductModalOpen(true); }}>
                            <Plus size={18} className="mr-2" /> {isAdmin ? 'Novo Produto' : 'Sugerir Produto'}
                        </button>
                    ) : activeTab === 'equipment' ? (
                        <button className="btn btn-primary" onClick={() => { setEditingItem(null); setIsEquipmentModalOpen(true); }}>
                            <Dumbbell size={18} className="mr-2" /> Registar Máquina
                        </button>
                    ) : null}
                </div>
            </div>

            {isAdmin && (
                <div className="inventory-stats grid grid-cols-4 gap-4 mb-6">
                    <div className="stat-card">
                        <span className="text-muted text-xs uppercase font-bold">Património Total</span>
                        <h3 className="text-xl font-bold">{equipment.reduce((acc, curr) => acc + (Number(curr.cost) || 0), 0).toLocaleString()} MT</h3>
                        <small className="text-primary">{equipment.length} Máquinas</small>
                    </div>
                    <div className="stat-card">
                        <span className="text-muted text-xs uppercase font-bold">Valor Inventário</span>
                        <h3 className="text-xl font-bold">{products.reduce((acc, curr) => acc + (curr.price * curr.stock), 0).toLocaleString()} MT</h3>
                        <small className="text-success">Preço de Venda</small>
                    </div>
                    <div className="stat-card">
                        <span className="text-muted text-xs uppercase font-bold">Rupturas Stock</span>
                        <h3 className="text-xl font-bold text-red-400">{products.filter(p => p.stock <= 0).length}</h3>
                        <small className="text-red-500/70">Produtos esgotados</small>
                    </div>
                    <div className="stat-card">
                        <span className="text-muted text-xs uppercase font-bold">Gastos Mensais</span>
                        <h3 className="text-xl font-bold">
                            {expenses
                                .filter(ex => new Date(ex.date).getMonth() === new Date().getMonth())
                                .reduce((acc, curr) => acc + (Number(curr.total_cost || curr.amount) || 0), 0)
                                .toLocaleString()} MT
                        </h3>
                        <small className="text-muted">Total despesas este mês</small>
                    </div>
                </div>
            )}

            <div className="search-bar-container">
                <div className="search-bar">
                    <Search size={20} className="search-icon" />
                    <input type="text" placeholder="Procurar no inventário..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="tabs">
                    <button className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
                        <Package size={18} className="mr-2" /> Produtos Venda
                    </button>
                    <button className={`tab-btn ${activeTab === 'equipment' ? 'active' : ''}`} onClick={() => setActiveTab('equipment')}>
                        <Dumbbell size={18} className="mr-2" /> Máquinas/Equipamento
                    </button>
                    {isAdmin && (
                        <>
                            <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
                                <RefreshCw size={18} className="mr-2" /> Pendentes Aprovação
                            </button>
                            <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                                <History size={18} className="mr-2" /> Histórico Gastos
                            </button>
                        </>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="loader-container"><RefreshCw className="animate-spin" /></div>
            ) : activeTab === 'products' ? (
                <div className="table-container">
                    <table className="data-table">
                        <thead><tr><th>Foto</th><th>Produto</th><th>Categoria</th><th>Local</th><th>Stock</th><th>Preço</th><th>Ações</th></tr></thead>
                        <tbody>
                            {filteredProducts.filter(p => !p.status || p.status === 'active').map(p => (
                                <tr key={p.id}>
                                    <td>
                                        <div className="product-img-mini">
                                            {p.photo_url ? <img src={p.photo_url} alt={p.name} /> : <Package size={20} />}
                                        </div>
                                    </td>
                                    <td><strong>{p.name}</strong></td>
                                    <td>{p.category}</td>
                                    <td><span className="text-muted"><MapPin size={12} className="inline mr-1" /> {locations.find(l => String(l.id) === String(p.location_id))?.name || '---'}</span></td>
                                    <td><span className={`stock-badge ${p.stock < 5 ? 'low' : 'ok'}`}>{p.stock} un</span></td>
                                    <td>{p.price.toLocaleString()} MT</td>
                                    <td>
                                        <div className="actions-cell">
                                            {isAdmin && <button className="icon-btn" title="Repor Stock" onClick={() => { setRestockingItem(p); setIsRestockModalOpen(true); }}><ArrowUpCircle size={16} /></button>}
                                            <button className="icon-btn" title="Editar" onClick={() => { setEditingItem(p); setIsProductModalOpen(true); }}><Edit2 size={16} /></button>
                                            {isAdmin && <button className="icon-btn danger" title="Eliminar" onClick={() => deleteProduct(p.id)}><Trash2 size={16} /></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : activeTab === 'equipment' ? (
                <div className="table-container">
                    <table className="data-table">
                        <thead><tr><th>Foto</th><th>Equipamento</th><th>Localização</th><th>Estado</th><th>Última Manut.</th><th>Ações</th></tr></thead>
                        <tbody>
                            {filteredEquipment.map(e => (
                                <tr key={e.id}>
                                    <td>
                                        <div className="product-img-mini">
                                            {e.photo_url ? <img src={e.photo_url} alt={e.name} /> : <Dumbbell size={20} />}
                                        </div>
                                    </td>
                                    <td><strong>{e.name}</strong><br /><small className="text-muted">{e.description}</small></td>
                                    <td><MapPin size={14} className="inline mr-1" /> {locations.find(l => String(l.id) === String(e.location_id))?.name || '---'}</td>
                                    <td><span className={`status-badge ${e.status}`}>{e.status}</span></td>
                                    <td>{e.purchase_date}</td>
                                    <td>
                                        <div className="actions-cell">
                                            <button className="icon-btn" onClick={() => { setEditingItem(e); setIsEquipmentModalOpen(true); }}><Edit2 size={16} /></button>
                                            <button className="icon-btn danger" onClick={() => deleteEquipment(e.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : activeTab === 'pending' ? (
                <div className="table-container">
                    <table className="data-table">
                        <thead><tr><th>Produto</th><th>Categoria</th><th>Local</th><th>Stock</th><th>Preço</th><th>Ações</th></tr></thead>
                        <tbody>
                            {products.filter(p => p.status === 'pending').map(p => (
                                <tr key={p.id}>
                                    <td><strong>{p.name}</strong></td>
                                    <td>{p.category}</td>
                                    <td>{locations.find(l => String(l.id) === String(p.location_id))?.name || '---'}</td>
                                    <td>{p.stock} un</td>
                                    <td>{p.price.toLocaleString()} MT</td>
                                    <td>
                                        <div className="actions-cell">
                                            <button className="btn btn-primary btn-sm" onClick={() => handleApprove(p.id)}>Aprovar</button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleReject(p.id)}>Rejeitar</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead><tr><th>Data</th><th>Despesa / Item</th><th>Tipo</th><th>Total</th><th>Estado</th></tr></thead>
                        <tbody>
                            {expenses.map(ex => (
                                <tr key={ex.id}>
                                    <td>{new Date(ex.date).toLocaleDateString()}</td>
                                    <td>
                                        <strong>{ex.product_name || ex.title || ex.description}</strong>
                                        {ex.responsible && <span className="block text-xs text-muted">Resp: {ex.responsible}</span>}
                                    </td>
                                    <td>
                                        <span className={`badge-sm ${ex.type === 'product' ? 'blue' : 'orange'}`}>
                                            {ex.type === 'product' ? 'Stock' : (ex.category || 'Geral')}
                                        </span>
                                    </td>
                                    <td className="text-red-400 font-bold">-{(ex.total_cost || ex.amount || 0).toLocaleString()} MT</td>
                                    <td>
                                        <span className={`status-dot ${ex.status === 'pendente' ? 'warning' : 'success'}`}>
                                            {ex.status === 'pendente' ? 'Pendente' : 'Pago'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ProductModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} onSave={handleSaveProduct} initialData={editingItem} locations={assignedLocations} isAdmin={isAdmin} />
            <EquipmentModal isOpen={isEquipmentModalOpen} onClose={() => setIsEquipmentModalOpen(false)} onSave={handleSaveEquipment} initialData={editingItem} locations={assignedLocations} />
            <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} onSave={handleSaveLocation} />
            <RestockModal isOpen={isRestockModalOpen} onClose={() => setIsRestockModalOpen(false)} product={restockingItem} onSave={handleRestock} />
            <GeneralExpenseModal isOpen={isGeneralExpenseModalOpen} onClose={() => setIsGeneralExpenseModalOpen(false)} onSave={handleSaveGeneralExpense} />

            {/* Hidden container for PDF export */}
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                <div id="inventory-report-print">
                    <InventoryReportTemplate
                        products={products}
                        equipment={equipment}
                        locations={locations}
                        sales={sales}
                        expenses={expenses}
                        summary={{
                            revenue: sales.reduce((acc, s) => acc + (s.price * (s.qty || s.quantity || 1)), 0),
                            costs: expenses.reduce((acc, ex) => acc + (ex.total_cost || 0), 0),
                            profit: sales.reduce((acc, s) => acc + (s.price * (s.qty || s.quantity || 1)), 0) - expenses.reduce((acc, ex) => acc + (ex.total_cost || 0), 0)
                        }}
                    />
                </div>
            </div>

            <style>{`
                .inventory-page { padding: 1rem; }
                .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .search-bar-container { margin-bottom: 2rem; }
                .tabs { display: flex; gap: 1rem; border-bottom: 1px solid var(--border); margin-top: 1rem; }
                .tab-btn { padding: 1rem; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; }
                .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
                .data-table { width: 100%; border-collapse: collapse; }
                .data-table th { text-align: left; padding: 1rem; border-bottom: 1px solid var(--border); }
                .data-table td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
                .stock-badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-weight: bold; }
                .stock-badge.low { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .stock-badge.ok { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .status-badge { padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; text-transform: uppercase; }
                .status-badge.working { background: rgba(16, 185, 129, 0.1); color: #10b981; }
                .status-badge.maintenance { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
                .status-badge.broken { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
                .modal-content { background: #1e293b; padding: 2rem; border-radius: 12px; width: 100%; max-width: 500px; }
                .icon-btn.danger:hover { color: #ef4444; }
                .inline { display: inline; }
                .loader-container { display: flex; justify-content: center; padding: 4rem; font-size: 2rem; color: var(--primary); }
                .grid-cols-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
                .stat-card { background: var(--bg-card); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border); display: flex; flex-direction: column; }
                .badge-sm { font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; font-weight: bold; }
                .badge-sm.blue { background: rgba(59, 130, 246, 0.1); color: #60a5fa; }
                .badge-sm.orange { background: rgba(249, 115, 22, 0.1); color: #f97316; }
                .status-dot { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; }
                .status-dot::before { content: ''; width: 8px; height: 8px; border-radius: 50%; }
                .status-dot.success::before { background: var(--success); }
                .status-dot.warning::before { background: #facc15; }
                .block { display: block; }
                .product-img-mini {
                    width: 40px; height: 40px; border-radius: 8px; overflow: hidden;
                    background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center;
                    border: 1px solid var(--border);
                }
                .product-img-mini img { width: 100%; height: 100%; object-fit: cover; }
            `}</style>
        </div >
    );
};

export default Inventory;
