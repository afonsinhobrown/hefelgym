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
    ArrowDownCircle,
    ArrowUpCircle,
    BarChart3,
    RefreshCw
} from 'lucide-react';
import { db } from '../services/db';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import InventoryReportTemplate from '../components/Reports/InventoryReportTemplate';
import { DownloadCloud } from 'lucide-react';

const DEFAULT_CATALOG = [
    { name: 'Halteres (Dumbbells)', category: 'Equipamento', price: 0, cost_price: 0, stock: 0 },
    { name: 'Barras com Anilhas (Barbells)', category: 'Equipamento', price: 0, cost_price: 0, stock: 0 },
    { name: 'Kettlebell', category: 'Equipamento', price: 0, cost_price: 0, stock: 0 },
    { name: 'Esteira (Treadmill)', category: 'Máquinas', price: 0, cost_price: 0, stock: 0 },
    { name: 'Bicicleta Ergométrica', category: 'Máquinas', price: 0, cost_price: 0, stock: 0 },
    { name: 'Proteína em Pó (Whey)', category: 'Suplementos', price: 0, cost_price: 0, stock: 0 },
    { name: 'Bebida Energética', category: 'Bar', price: 0, cost_price: 0, stock: 0 },
    { name: 'Garrafas de Água (Venda)', category: 'Acessórios', price: 0, cost_price: 0, stock: 0 },
];

const ProductModal = ({ isOpen, onClose, onSave, initialData }) => {
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        cost_price: '',
        stock: '',
        category: 'Outros'
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({ name: '', price: '', cost_price: '', stock: '', category: 'Outros' });
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
                            <input type="number" className="input w-full" value={formData.cost_price} onChange={e => setFormData({ ...formData, cost_price: e.target.value })} placeholder="Quanto pagou?" />
                        </div>
                        <div className="form-group">
                            <label>Preço Venda (MT)</label>
                            <input required type="number" className="input w-full" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="Por quanto vende?" />
                        </div>
                        <div className="form-group">
                            <label>Stock Inicial</label>
                            <input required type="number" className="input w-full" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group mb-4">
                        <label>Categoria</label>
                        <select className="input w-full" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                            <option value="Bar">Bar</option>
                            <option value="Merchandise">Merchandise</option>
                            <option value="Suplementos">Suplementos</option>
                            <option value="Equipamento">Equipamento</option>
                            <option value="Máquinas">Máquinas</option>
                            <option value="Acessórios">Acessórios</option>
                            <option value="Serviço">Serviço/Aluguer</option>
                            <option value="Outros">Outros</option>
                        </select>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
                        <button type="submit" className="btn btn-primary"><Save size={18} className="mr-2" /> Salvar</button>
                    </div>
                </form>
            </div>
            <style>{`
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(8px); }
        .modal-content { background: #1e293b; padding: 2rem; border-radius: 16px; width: 100%; max-width: 550px; border: 1px solid #334155; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
        .modal-header { display: flex; justify-content: space-between; margin-bottom: 1.5rem; align-items: center; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
        .mb-4 { margin-bottom: 1.25rem; }
        .w-full { width: 100%; }
        .mr-2 { margin-right: 0.5rem; }
        .modal-footer { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
      `}</style>
        </div>
    );
};

// --- NOVO: Modal de Reposição de Stock (Gasto) ---
const RestockModal = ({ isOpen, onClose, product, onSave }) => {
    const [formData, setFormData] = useState({
        quantity: 1,
        unit_cost: 0,
        supplier: ''
    });

    useEffect(() => {
        if (product) {
            setFormData({
                quantity: 1,
                unit_cost: product.cost_price || 0,
                supplier: ''
            });
        }
    }, [product, isOpen]);

    if (!isOpen || !product) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            product_id: product.id,
            product_name: product.name,
            quantity: Number(formData.quantity),
            unit_cost: Number(formData.unit_cost),
            supplier: formData.supplier
        });
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content animate-fade-in">
                <div className="modal-header">
                    <div>
                        <h3>Reposição de Stock</h3>
                        <p className="text-sm text-slate-400">{product.name}</p>
                    </div>
                    <button onClick={onClose} className="close-btn"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="grid-2 mb-4">
                        <div className="form-group">
                            <label>Quantidade a Adicionar</label>
                            <input required type="number" min="1" className="input w-full" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label>Custo Unitário (Compra)</label>
                            <input required type="number" className="input w-full" value={formData.unit_cost} onChange={e => setFormData({ ...formData, unit_cost: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group mb-4">
                        <label>Fornecedor (Opcional)</label>
                        <input type="text" className="input w-full" value={formData.supplier} onChange={e => setFormData({ ...formData, supplier: e.target.value })} placeholder="Ex: Revendedor X" />
                    </div>

                    <div className="p-4 bg-slate-900/50 rounded-lg mb-4 text-center">
                        <p className="text-sm text-slate-400 mb-1">Total do Gasto</p>
                        <p className="text-2xl font-bold text-red-400">{(formData.quantity * formData.unit_cost).toLocaleString()} MT</p>
                    </div>

                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancelar</button>
                        <button type="submit" className="btn btn-danger"><ShoppingCart size={18} className="mr-2" /> Confirmar Compra</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Products = () => {
    const [products, setProducts] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [sales, setSales] = useState([]);
    const [summary, setSummary] = useState({ revenue: 0, costs: 0, profit: 0 });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRestockOpen, setIsRestockOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'restocks', 'sales'
    const [editingItem, setEditingItem] = useState(null);
    const [restockingItem, setRestockingItem] = useState(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [isPrintingReport, setIsPrintingReport] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            await db.init();

            // 1. Carregar Inventário primeiro (O mais importante)
            try {
                const prodData = await db.inventory.getAll();
                const list = Array.isArray(prodData) ? prodData : [];
                setProducts(list);
                console.log(`📦 ${list.length} produtos carregados.`);
            } catch (e) {
                console.error("Erro ao carregar inventário:", e);
                setProducts([]);
            }

            // 2. Carregar o resto (Despesas e Vendas) de forma independente
            try {
                const [expData, allInvoices] = await Promise.all([
                    db.expenses.getProducts(),
                    db.invoices.getAll()
                ]);

                setExpenses(Array.isArray(expData) ? expData : []);

                // Processar Vendas
                const productSales = [];
                let totalRev = 0;
                let totalCosts = 0;

                (allInvoices || []).forEach(inv => {
                    if (inv.status === 'anulada') return;
                    let items = [];
                    try {
                        items = Array.isArray(inv.items) ? inv.items : JSON.parse(inv.items || '[]');
                    } catch (e) { items = []; }

                    items.forEach(item => {
                        if (item.productId === 'SUBSCRIPTION' || item.id === 'SUBSCRIPTION') return;

                        const itemPrice = Number(item.price || item.total_price || 0);
                        const itemQty = Number(item.qty || item.quantity || 1);

                        productSales.push({
                            ...item,
                            price: itemPrice,
                            quantity: itemQty,
                            invId: inv.id,
                            date: inv.date,
                            client: inv.client_name,
                            status: inv.status
                        });

                        if (inv.status === 'pago' || inv.status === 'pendente') {
                            totalRev += (itemPrice * itemQty);
                        }
                    });
                });

                setSales(productSales.sort((a, b) => new Date(b.date) - new Date(a.date)));
                setSummary({ revenue: totalRev, costs: 0, profit: totalRev }); // Custos serão calculados depois

            } catch (e) {
                console.error("Erro ao carregar dados financeiros:", e);
            }

        } catch (e) {
            console.error("Erro geral no loadData:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleSave = async (data) => {
        try {
            if (editingItem) {
                await db.inventory.update(editingItem.id, data);
            } else {
                await db.inventory.create(data);
            }
            await loadData();
            setIsModalOpen(false);
        } catch (e) {
            alert("Erro ao salvar: " + e.message);
        }
    };

    const handleRestock = async (restockData) => {
        try {
            await db.expenses.createProductExpense(restockData);
            await loadData();
            alert("Stock reposto e gasto registado!");
        } catch (e) {
            console.error("Erro Restock:", e);
            alert(`Erro ao repôr stock: ${e.message}. \n\nDICA: Feche e abra o START_HEFELGYM.bat para atualizar o servidor.`);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem a certeza que deseja eliminar este produto? O histórico de vendas será mantido.')) return;
        try {
            if (db.inventory.delete) {
                await db.inventory.delete(id);
                await loadData();
            }
        } catch (e) { alert(e.message); }
    };

    const openEdit = (item) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const generateInventoryReport = async () => {
        setIsPrintingReport(true);
        try {
            // Delay for rendering
            await new Promise(resolve => setTimeout(resolve, 800));

            const element = document.getElementById('inventory-report-print');
            if (!element) throw new Error("Template not found");

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Relatorio_Inventario_HefelGym_${new Date().toLocaleDateString()}.pdf`);

            alert("Relatório gerado com sucesso!");
        } catch (e) {
            console.error(e);
            alert("Erro ao gerar relatório: " + e.message);
        } finally {
            setIsPrintingReport(false);
        }
    };

    const filteredProducts = products.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="products-page animate-fade-in">
            <div className="page-header">
                <div>
                    <h2>Gestão de Produtos</h2>
                    <p>Controle de stock e preços</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-outline" onClick={generateInventoryReport} disabled={isPrintingReport}>
                        {isPrintingReport ? <RefreshCw size={18} className="animate-spin" /> : <DownloadCloud size={18} className="mr-2" />}
                        {isPrintingReport ? 'Gerando...' : 'Relatório PDF / Imprimir'}
                    </button>
                    <button className="btn btn-primary" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
                        <Plus size={18} style={{ marginRight: '8px' }} /> Novo Produto
                    </button>
                </div>
            </div>

            <div className="search-bar-container">
                <div className="search-bar">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, categoria..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="tabs">
                    <button className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
                        <Package size={18} className="mr-2" /> Inventário
                    </button>
                    <button className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>
                        <TrendingUp size={18} className="mr-2" /> Registos de Vendas
                    </button>
                    <button className={`tab-btn ${activeTab === 'restocks' ? 'active' : ''}`} onClick={() => setActiveTab('restocks')}>
                        <History size={18} className="mr-2" /> Gastos de Reposição
                    </button>
                </div>
            </div>

            {/* Resumo Financeiro */}
            <div className="summary-cards mb-6">
                <div className="stat-card">
                    <span className="label text-blue-400">Total Vendas (Entrada)</span>
                    <h3 className="value">{summary.revenue.toLocaleString()} MT</h3>
                </div>
                <div className="stat-card">
                    <span className="label text-red-400">Total Custos (Saída)</span>
                    <h3 className="value">{summary.costs.toLocaleString()} MT</h3>
                </div>
                <div className="stat-card">
                    <span className="label text-green-400">Lucro Estimado</span>
                    <h3 className="value">{summary.profit.toLocaleString()} MT</h3>
                </div>
            </div>

            {loading ? (
                <div className="text-center p-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted">A carregar dados...</p>
                </div>
            ) : activeTab === 'inventory' ? (
                products.length === 0 ? (
                    <div className="empty-state text-center p-10 mt-10" style={{ opacity: 0.7 }}>
                        <Package size={64} style={{ margin: '0 auto 1rem', display: 'block' }} />
                        <h3>Nenhum Produto Encontrado</h3>
                        <p className="mb-4">Adicione produtos para gerir o seu stock.</p>
                        <button className="btn btn-primary" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
                            <Plus size={18} /> Novo Produto
                        </button>
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Produto</th>
                                    <th>Categoria</th>
                                    <th>Custo Compra</th>
                                    <th>Preço Venda</th>
                                    <th>Margem</th>
                                    <th>Stock</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map(item => {
                                    const price = Number(item.price || item.total_price || 0);
                                    const cost = Number(item.cost_price || 0);
                                    const margin = price - cost;
                                    const marginPct = cost > 0 ? (margin / cost * 100).toFixed(0) : '---';

                                    return (
                                        <tr key={item.id}>
                                            <td><strong>{item.name}</strong></td>
                                            <td><span className="badge-outline">{item.category}</span></td>
                                            <td className="text-slate-400">{cost.toLocaleString()} MT</td>
                                            <td className="font-bold text-slate-200">{price.toLocaleString()} MT</td>
                                            <td>
                                                <span className={`margin-badge ${margin > 0 ? 'positive' : 'negative'}`}>
                                                    {margin.toLocaleString()} MT ({marginPct}%)
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`stock-badge ${item.stock < 10 ? 'low' : 'ok'}`}>
                                                    {item.stock} un
                                                </span>
                                            </td>
                                            <td>
                                                <div className="actions-cell">
                                                    <button className="btn btn-sm btn-outline" onClick={() => { setRestockingItem(item); setIsRestockOpen(true); }}>
                                                        <ArrowUpCircle size={16} /> Compra
                                                    </button>
                                                    <button className="icon-btn" onClick={() => openEdit(item)}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className="icon-btn" onClick={() => handleDelete(item.id)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )
            ) : activeTab === 'sales' ? (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Produto</th>
                                <th>Cliente</th>
                                <th>Quantidade</th>
                                <th>Preço Unit.</th>
                                <th>Receita Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sales.length === 0 ? (
                                <tr><td colSpan="6" className="text-center p-8 text-slate-500">Nenhuma venda registada até ao momento.</td></tr>
                            ) : (
                                sales.map((sale, idx) => (
                                    <tr key={idx}>
                                        <td>{new Date(sale.date).toLocaleDateString()}</td>
                                        <td className="font-bold">{sale.name || sale.description}</td>
                                        <td>{sale.client}</td>
                                        <td>{sale.qty || sale.quantity} un</td>
                                        <td>{Number(sale.price).toLocaleString()} MT</td>
                                        <td className="text-blue-400 font-bold">+{(Number(sale.price) * (Number(sale.qty) || Number(sale.quantity) || 1)).toLocaleString()} MT</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Data Compra</th>
                                <th>Produto</th>
                                <th>Qtd Adicionada</th>
                                <th>Custo Unit.</th>
                                <th>Gasto Total</th>
                                <th>Fornecedor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.length === 0 ? (
                                <tr><td colSpan="6" className="text-center p-8 text-slate-500">Nenhum gasto de reposição registado.</td></tr>
                            ) : (
                                expenses.map(exp => (
                                    <tr key={exp.id}>
                                        <td>{new Date(exp.date).toLocaleDateString()}</td>
                                        <td className="font-bold">{exp.product_name}</td>
                                        <td><span className="text-blue-400">+{exp.quantity} un</span></td>
                                        <td>{Number(exp.unit_cost).toLocaleString()} MT</td>
                                        <td className="text-red-400 font-bold">-{Number(exp.total_cost).toLocaleString()} MT</td>
                                        <td className="text-slate-400">{exp.supplier || 'N/A'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingItem}
            />

            <RestockModal
                isOpen={isRestockOpen}
                onClose={() => setIsRestockOpen(false)}
                product={restockingItem}
                onSave={handleRestock}
            />

            <style>{`
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { text-align: left; padding: 1rem; color: var(--text-muted); border-bottom: 1px solid var(--border); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }
        .data-table td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; }
        
        .search-bar-container { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
        .tabs { display: flex; gap: 0.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0px; }
        .tab-btn { padding: 0.75rem 1.5rem; background: none; border: none; border-bottom: 2px solid transparent; color: var(--text-muted); cursor: pointer; transition: all 0.2s; font-weight: 500; display: flex; align-items: center; }
        .tab-btn:hover { color: var(--text-main); background: rgba(255,255,255,0.03); }
        .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); background: rgba(249,115,22,0.05); }

        .badge-outline { border: 1px solid var(--border); padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.8rem; color: var(--text-muted); }
        .stock-badge { font-weight: 600; padding: 0.2rem 0.5rem; border-radius: 4px; }
        .stock-badge.low { background: rgba(239, 68, 68, 0.1); color: #f87171; }
        .stock-badge.ok { background: rgba(16, 185, 129, 0.1); color: #34d399; }
        
        .margin-badge { font-size: 0.8rem; font-weight: 700; }
        .margin-badge.positive { color: #34d399; }
        .margin-badge.negative { color: #f87171; }

        .btn-outline { border: 1px solid var(--border); background: none; color: var(--text-main); }
        .btn-outline:hover { background: var(--border); }
        .btn-danger { background: #ef4444; color: white; border: none; }
        .btn-danger:hover { background: #dc2626; }

        .bg-card-hover { background: var(--bg-card-hover); }
        .rounded { border-radius: 4px; }
        .gap-2 { gap: 0.5rem; }
        .items-center { align-items: center; }
        .flex { display: flex; }
        .actions-cell { display: flex; gap: 0.5rem; align-items: center; }
        .icon-btn { padding: 0.5rem; border: none; background: none; color: var(--text-muted); cursor: pointer; border-radius: 4px; transition: all 0.2s; }
        .icon-btn:hover { background: var(--bg-card-hover); color: var(--primary); }
        
        .text-slate-400 { color: #94a3b8; }
        .text-slate-200 { color: #e2e8f0; }
        .font-mono { font-family: monospace; }
        
        .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
        .stat-card { background: var(--bg-card); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border); box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .stat-card .label { font-size: 0.8rem; text-transform: uppercase; font-weight: 600; margin-bottom: 0.5rem; display: block; }
        .stat-card .value { font-size: 1.5rem; font-weight: 700; margin: 0; }
        .mb-6 { margin-bottom: 1.5rem; }
      `}</style>
            {/* Container invisível para gerar o Relatório */}
            {isPrintingReport && (
                <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                    <div id="inventory-report-print">
                        <InventoryReportTemplate
                            products={products}
                            sales={sales}
                            expenses={expenses}
                            summary={summary}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
