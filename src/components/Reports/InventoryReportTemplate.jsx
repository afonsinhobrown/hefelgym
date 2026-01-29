import React from 'react';
import { Package, TrendingUp, History, AlertCircle, CheckCircle2, TrendingDown } from 'lucide-react';

const InventoryReportTemplate = ({ products, equipment, locations, sales, expenses, summary }) => {
    const today = new Date().toLocaleDateString('pt-MZ', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const rawCompany = JSON.parse(localStorage.getItem('hefel_company_v3') || '{}');

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

    const highMargin = [...products].sort((a, b) => (b.price - (b.cost_price || 0)) - (a.price - (a.cost_price || 0))).slice(0, 3);
    if (highMargin.length > 0) {
        recommendations.push({
            type: 'success',
            text: `Foco em Vendas: Estes produtos têm as melhores margens de lucro.`,
            items: highMargin.map(p => p.name).join(', ')
        });
    }

    const equipmentMaintenance = equipment?.filter(e => e.status !== 'working');
    if (equipmentMaintenance?.length > 0) {
        recommendations.push({
            type: 'warning',
            text: `Manutenção Pendente: ${equipmentMaintenance.length} equipamentos/máquinas fora de operação ou em manutenção.`,
            items: equipmentMaintenance.map(e => e.name).join(', ')
        });
    }

    return (
        <div className="report-template" style={{ padding: '40px', background: 'white', color: '#1e293b', minHeight: '297mm', width: '210mm', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {rawCompany.logo && <img src={rawCompany.logo} style={{ maxHeight: '50px' }} />}
                    <div>
                        <h1 style={{ margin: 0, color: '#0f172a', fontSize: '24px', fontWeight: '800' }}>{rawCompany.name || 'HEFEL GYM'}</h1>
                        <p style={{ margin: '4px 0', color: '#64748b', fontSize: '14px' }}>Relatório de Inventário e Balanço Comercial</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: '600', fontSize: '12px' }}>DATA DO RELATÓRIO</p>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>{today}</p>
                </div>
            </div>

            {/* Financial Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Vendas Totais (Produtos)</p>
                    <p style={{ margin: '8px 0 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{summary.revenue.toLocaleString()} MT</p>
                </div>
                <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Investimento em Reposição</p>
                    <p style={{ margin: '8px 0 0', fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>{summary.costs.toLocaleString()} MT</p>
                </div>
                <div style={{ padding: '15px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bceabb' }}>
                    <p style={{ margin: 0, fontSize: '12px', color: '#166534', fontWeight: 'bold', textTransform: 'uppercase' }}>Balanço Comercial</p>
                    <p style={{ margin: '8px 0 0', fontSize: '20px', fontWeight: '800', color: '#166534' }}>{summary.profit.toLocaleString()} MT</p>
                </div>
            </div>

            {/* Recommendations Section */}
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '16px', borderLeft: '4px solid #3b82f6', paddingLeft: '10px', marginBottom: '15px' }}>Análise de Stock e Ativos</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {recommendations.map((rec, i) => (
                        <div key={i} style={{ padding: '12px', borderRadius: '6px', fontSize: '13px', border: '1px solid #e2e8f0', background: rec.type === 'warning' ? '#fff7ed' : rec.type === 'success' ? '#f0fdf4' : '#f8fafc' }}>
                            <strong style={{ display: 'block', marginBottom: '4px' }}>{rec.text}</strong>
                            <span style={{ color: '#64748b' }}>{rec.items}</span>
                        </div>
                    ))}
                    {recommendations.length === 0 && <p style={{ fontSize: '13px', color: '#64748b' }}>Tudo operacional e bem abastecido.</p>}
                </div>
            </div>

            {/* Inventory Table */}
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Stock de Produtos de Venda</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                        <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Produto</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Categoría</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Localização</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>P. Venda</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0', textAlign: 'center' }}>Stock</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '8px' }}><strong>{p.name}</strong></td>
                                <td style={{ padding: '8px' }}>{p.category}</td>
                                <td style={{ padding: '8px' }}>{locations?.find(l => l.id === p.location_id)?.name || '---'}</td>
                                <td style={{ padding: '8px' }}>{p.price.toLocaleString()} MT</td>
                                <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: p.stock <= 5 ? '#ef4444' : '#166534' }}>{p.stock}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Equipment Table */}
            {equipment?.length > 0 && (
                <div style={{ marginBottom: '30px', pageBreakBefore: products.length > 15 ? 'always' : 'auto' }}>
                    <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Património e Equipamento</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                        <thead>
                            <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                                <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Equipamento</th>
                                <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Localização</th>
                                <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Estado</th>
                                <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Última Rev.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {equipment.map((e, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '8px' }}><strong>{e.name}</strong></td>
                                    <td style={{ padding: '8px' }}>{locations?.find(l => l.id === e.location_id)?.name || '---'}</td>
                                    <td style={{ padding: '8px' }}>
                                        <span style={{
                                            padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold',
                                            background: e.status === 'working' ? '#dcfce7' : e.status === 'maintenance' ? '#fef9c3' : '#fee2e2',
                                            color: e.status === 'working' ? '#166534' : e.status === 'maintenance' ? '#854d0e' : '#991b1b'
                                        }}>
                                            {e.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '8px' }}>{e.purchase_date || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: 'auto', paddingTop: '30px', borderTop: '1px solid #e2e8f0', textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
                HEFEL GYM - Sistema de Gestão Profissional de Inventário
            </div>
        </div>
    );
};

export default InventoryReportTemplate;
