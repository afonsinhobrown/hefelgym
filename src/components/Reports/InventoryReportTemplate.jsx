import React from 'react';
import { Package, TrendingUp, History, AlertCircle, CheckCircle2, TrendingDown } from 'lucide-react';

const InventoryReportTemplate = ({ products, sales, expenses, summary }) => {
    const today = new Date().toLocaleDateString('pt-MZ', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Recommendations Logic
    const recommendations = [];
    const lowStock = products.filter(p => p.stock <= 5);
    if (lowStock.length > 0) {
        recommendations.push({
            type: 'warning',
            text: `Reposição Urgente: ${lowStock.length} produtos com stock crítico (<= 5 un).`,
            items: lowStock.map(p => p.name).join(', ')
        });
    }

    const highMargin = [...products].sort((a, b) => (b.price - b.cost_price) - (a.price - a.cost_price)).slice(0, 3);
    if (highMargin.length > 0) {
        recommendations.push({
            type: 'success',
            text: `Foco em Vendas: Estes produtos têm as melhores margens de lucro.`,
            items: highMargin.map(p => p.name).join(', ')
        });
    }

    const stagnant = products.filter(p => p.stock > 0 && !sales.some(s => s.productId === p.id));
    if (stagnant.length > 0) {
        recommendations.push({
            type: 'info',
            text: `Stock Parado: ${stagnant.length} produtos sem vendas recentes. Considere promoções.`,
            items: stagnant.slice(0, 5).map(p => p.name).join(', ')
        });
    }

    return (
        <div className="report-template" style={{ padding: '40px', background: 'white', color: '#1e293b', minHeight: '297mm', width: '210mm', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ margin: 0, color: '#0f172a', fontSize: '24px', fontWeight: '800' }}>HEFEL GYM</h1>
                    <p style={{ margin: '4px 0', color: '#64748b', fontSize: '14px' }}>Relatório de Inventário e Balanço Comercial</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: '600', fontSize: '12px' }}>DATA DO RELATÓRIO</p>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>{today}</p>
                </div>
            </div>

            {/* Financial Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Vendas Totais</p>
                    <p style={{ margin: '8px 0 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{summary.revenue.toLocaleString()} MT</p>
                </div>
                <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Custos de Reposição</p>
                    <p style={{ margin: '8px 0 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{summary.costs.toLocaleString()} MT</p>
                </div>
                <div style={{ padding: '15px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bceabb' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#166534', fontWeight: 'bold', textTransform: 'uppercase' }}>Lucro Bruto</p>
                    <p style={{ margin: '8px 0 0', fontSize: '20px', fontWeight: '800', color: '#166534' }}>{summary.profit.toLocaleString()} MT</p>
                </div>
            </div>

            {/* Recommendations Section */}
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '16px', borderLeft: '4px solid #3b82f6', paddingLeft: '10px', marginBottom: '15px' }}>Recomendações e Alertas</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {recommendations.map((rec, i) => (
                        <div key={i} style={{ padding: '12px', borderRadius: '6px', fontSize: '13px', border: '1px solid #e2e8f0', background: rec.type === 'warning' ? '#fff7ed' : rec.type === 'success' ? '#f0fdf4' : '#f8fafc' }}>
                            <strong style={{ display: 'block', marginBottom: '4px' }}>{rec.text}</strong>
                            <span style={{ color: '#64748b' }}>{rec.items}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Inventory Table */}
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Estado do Inventário</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                        <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                            <th style={{ padding: '10px', border: '1px solid #e2e8f0' }}>Produto</th>
                            <th style={{ padding: '10px', border: '1px solid #e2e8f0' }}>Categoría</th>
                            <th style={{ padding: '10px', border: '1px solid #e2e8f0' }}>P. Venda</th>
                            <th style={{ padding: '10px', border: '1px solid #e2e8f0' }}>Stock</th>
                            <th style={{ padding: '10px', border: '1px solid #e2e8f0' }}>Margem un.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p, i) => (
                            <tr key={i}>
                                <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{p.name}</td>
                                <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{p.category}</td>
                                <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{p.price.toLocaleString()} MT</td>
                                <td style={{ padding: '8px', border: '1px solid #e2e8f0', fontWeight: 'bold', color: p.stock <= 5 ? '#ef4444' : 'inherit' }}>{p.stock} un</td>
                                <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{(p.price - (p.cost_price || 0)).toLocaleString()} MT</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Recent Sales Summary */}
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Vendas Recentes</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                        <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                            <th style={{ padding: '10px', border: '1px solid #e2e8f0' }}>Data</th>
                            <th style={{ padding: '10px', border: '1px solid #e2e8f0' }}>Utente</th>
                            <th style={{ padding: '10px', border: '1px solid #e2e8f0' }}>Produtos</th>
                            <th style={{ padding: '10px', border: '1px solid #e2e8f0' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.slice(0, 10).map((s, i) => (
                            <tr key={i}>
                                <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{new Date(s.date).toLocaleDateString()}</td>
                                <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{s.client || 'Consumidor Final'}</td>
                                <td style={{ padding: '8px', border: '1px solid #e2e8f0' }}>{s.name || s.description}</td>
                                <td style={{ padding: '8px', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>{(s.price * s.quantity).toLocaleString()} MT</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 'auto', paddingTop: '30px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
                Relatório gerado automaticamente pelo sistema de gestão HEFEL GYM.
            </div>
        </div>
    );
};

export default InventoryReportTemplate;
