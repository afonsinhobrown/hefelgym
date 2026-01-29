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

const ProductModal = ({ isOpen, onClose, onSave, initialData, locations }) => {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        cost_price: '',
        stock: '',
        category: 'Outros',
        location_id: ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                location_id: initialData.location_id || ''
            });
        } else {
            setFormData({ name: '', price: '', cost_price: '', stock: '', category: 'Outros', location_id: '' });
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
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
                        <button type="submit" className="btn btn-primary">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
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
                    <div className="form-group mb-4">
                        <label>Nome do Equipamento</label>
                        <input required type="text" className="input w-full" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
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

    const [editingItem, setEditingItem] = useState(null);
    const [restockingItem, setRestockingItem] = useState(null);

    const loadData = async () => {
        try {
            setLoading(true);
            await db.init();
            const [p, e, l, ex, invs] = await Promise.all([
                db.inventory.getAll(),
                db.equipment.getAll(),
                db.locations.getAll(),
                db.expenses.getProducts(),
                db.invoices.getAll()
            ]);
            setProducts(Array.isArray(p) ? p : []);
            setEquipment(Array.isArray(e) ? e : []);
            setLocations(Array.isArray(l) ? l : []);
            setExpenses(Array.isArray(ex) ? ex : []);

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
                    <button className="btn btn-outline" onClick={() => generateReport()}>
                        <DownloadCloud size={18} className="mr-2" /> Relatório PDF
                    </button>
                    <button className="btn btn-outline" onClick={() => setIsLocationModalOpen(true)}>
                        <MapPin size={18} className="mr-2" /> Gerir Locais
                    </button>
                    {activeTab === 'products' ? (
                        <button className="btn btn-primary" onClick={() => { setEditingItem(null); setIsProductModalOpen(true); }}>
                            <Plus size={18} className="mr-2" /> Novo Produto
                        </button>
                    ) : (
                        <button className="btn btn-primary" onClick={() => { setEditingItem(null); setIsEquipmentModalOpen(true); }}>
                            <Dumbbell size={18} className="mr-2" /> Registar Máquina
                        </button>
                    )}
                </div>
            </div>

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
                    <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                        <History size={18} className="mr-2" /> Histórico Gastos
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loader-container"><RefreshCw className="animate-spin" /></div>
            ) : activeTab === 'products' ? (
                <div className="table-container">
                    <table className="data-table">
                        <thead><tr><th>Produto</th><th>Categoria</th><th>Local</th><th>Stock</th><th>Preço</th><th>Ações</th></tr></thead>
                        <tbody>
                            {filteredProducts.map(p => (
                                <tr key={p.id}>
                                    <td><strong>{p.name}</strong></td>
                                    <td>{p.category}</td>
                                    <td><span className="text-muted"><MapPin size={12} className="inline mr-1" /> {locations.find(l => l.id === p.location_id)?.name || '---'}</span></td>
                                    <td><span className={`stock-badge ${p.stock < 5 ? 'low' : 'ok'}`}>{p.stock} un</span></td>
                                    <td>{p.price.toLocaleString()} MT</td>
                                    <td>
                                        <div className="actions-cell">
                                            <button className="icon-btn" onClick={() => { setRestockingItem(p); setIsRestockModalOpen(true); }}><ArrowUpCircle size={16} /></button>
                                            <button className="icon-btn" onClick={() => { setEditingItem(p); setIsProductModalOpen(true); }}><Edit2 size={16} /></button>
                                            <button className="icon-btn danger" onClick={() => deleteProduct(p.id)}><Trash2 size={16} /></button>
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
                        <thead><tr><th>Equipamento</th><th>Localização</th><th>Estado</th><th>Última Manut.</th><th>Ações</th></tr></thead>
                        <tbody>
                            {filteredEquipment.map(e => (
                                <tr key={e.id}>
                                    <td><strong>{e.name}</strong><br /><small className="text-muted">{e.description}</small></td>
                                    <td><MapPin size={14} className="inline mr-1" /> {locations.find(l => l.id === e.location_id)?.name || '---'}</td>
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
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead><tr><th>Data</th><th>Item</th><th>Qtd</th><th>Custo Total</th></tr></thead>
                        <tbody>
                            {expenses.map(ex => (
                                <tr key={ex.id}>
                                    <td>{new Date(ex.date).toLocaleDateString()}</td>
                                    <td>{ex.product_name}</td>
                                    <td>+{ex.quantity}</td>
                                    <td className="text-red-400">-{ex.total_cost.toLocaleString()} MT</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ProductModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} onSave={handleSaveProduct} initialData={editingItem} locations={locations} />
            <EquipmentModal isOpen={isEquipmentModalOpen} onClose={() => setIsEquipmentModalOpen(false)} onSave={handleSaveEquipment} initialData={editingItem} locations={locations} />
            <LocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} onSave={handleSaveLocation} />
            <RestockModal isOpen={isRestockModalOpen} onClose={() => setIsRestockModalOpen(false)} product={restockingItem} onSave={handleRestock} />

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
            `}</style>
        </div>
    );
};

export default Inventory;
