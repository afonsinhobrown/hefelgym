import React from 'react';

const FullFinancialReportTemplate = ({ summary, invoices, period = 'Este Mês', chartsData }) => {
    const today = new Date().toLocaleDateString('pt-MZ', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const rawCompany = JSON.parse(localStorage.getItem('hefel_company_v3') || '{}');
    const ivaRate = rawCompany.ivaRate !== undefined ? Number(rawCompany.ivaRate) : 3;
    const totalIVA = summary.totalRevenue * (ivaRate / 100);

    return (
        <div id="full-financial-report-export" className="report-template" style={{ padding: '50px', background: 'white', color: '#1e293b', minHeight: '297mm', width: '210mm', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Header with Logo */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #0f172a', paddingBottom: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '60px', height: '60px', background: '#0f172a', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '900', fontSize: '24px' }}>HG</div>
                    <div>
                        <h1 style={{ margin: 0, color: '#0f172a', fontSize: '28px', fontWeight: '900', letterSpacing: '-1px' }}>HEFEL GYM</h1>
                        <p style={{ margin: 0, color: '#3b82f6', fontSize: '14px', fontWeight: '700', textTransform: 'uppercase' }}>Gestão Profissional de Fitness</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <h2 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>RELATÓRIO ANALÍTICO</h2>
                    <p style={{ margin: '4px 0', color: '#64748b', fontSize: '12px' }}>Período: <strong>{period}</strong></p>
                    <p style={{ margin: '4px 0', color: '#64748b', fontSize: '12px' }}>Data de Emissão: {today}</p>
                </div>
            </div>

            {/* Executive Summary */}
            <h3 style={{ fontSize: '16px', textTransform: 'uppercase', marginBottom: '15px', color: '#1e40af', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Sumário Executivo</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '40px' }}>
                <div style={{ padding: '15px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bceabb' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: '#166534', fontWeight: 'bold' }}>RECEITA LÍQUIDA</p>
                    <p style={{ margin: '10px 0 0', fontSize: '24px', fontWeight: '900', color: '#166534' }}>{summary.totalRevenue.toLocaleString()} MT</p>
                </div>
                <div style={{ padding: '15px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: '#1e40af', fontWeight: 'bold' }}>TOTAL IVA ({ivaRate}%)</p>
                    <p style={{ margin: '10px 0 0', fontSize: '24px', fontWeight: '900', color: '#1e40af' }}>{totalIVA.toLocaleString()} MT</p>
                </div>
                <div style={{ padding: '15px', background: '#fff1f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: '#991b1b', fontWeight: 'bold' }}>VALOR PENDENTE</p>
                    <p style={{ margin: '10px 0 0', fontSize: '24px', fontWeight: '900', color: '#991b1b' }}>{summary.pendingAmount.toLocaleString()} MT</p>
                </div>
                <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>TOTAL BRUTO (Est.)</p>
                    <p style={{ margin: '10px 0 0', fontSize: '24px', fontWeight: '900', color: '#0f172a' }}>{(summary.totalRevenue + totalIVA).toLocaleString()} MT</p>
                </div>
            </div>

            {/* ... */}

            {/* Detailed Transactions List */}
            <h3 style={{ fontSize: '16px', textTransform: 'uppercase', marginBottom: '15px', color: '#1e40af', borderBottom: '1px solid #e2e8f0', paddingBottom: '5px' }}>Detalhamento de Transações</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '40px' }}>
                <thead>
                    <tr style={{ background: '#0f172a', color: 'white' }}>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Data</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Cliente</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Histórico / Itens</th>
                        <th style={{ padding: '10px', textAlign: 'left' }}>Estado</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Taxa ({ivaRate}%)</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Valor Final</th>
                    </tr>
                </thead>
                <tbody>
                    {invoices.map((inv, i) => {
                        const amount = Number(inv.total || inv.amount || 0);
                        const net = amount / (1 + ivaRate / 100);
                        const iva = amount - net;

                        return (
                            <tr key={inv.id} style={{ background: i % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '10px' }}>{new Date(inv.date).toLocaleDateString()}</td>
                                <td style={{ padding: '10px', fontWeight: '700' }}>{inv.client_name || inv.client?.name || 'Cliente Final'}</td>
                                <td style={{ padding: '10px', color: '#64748b' }}>
                                    {inv.items ? (typeof inv.items === 'string' ? inv.items : inv.items.map(it => it.name).join(', ')) : 'Prestação de Serviços'}
                                </td>
                                <td style={{ padding: '10px' }}>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold',
                                        background: inv.status === 'pago' ? '#dcfce7' : '#fee2e2',
                                        color: inv.status === 'pago' ? '#166534' : '#991b1b'
                                    }}>
                                        {inv.status.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '10px', textAlign: 'right', color: '#64748b' }}>
                                    {iva.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
                                </td>
                                <td style={{ padding: '10px', textAlign: 'right', fontWeight: '800' }}>
                                    {amount.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>

            {/* Footer */}
            <div style={{ marginTop: 'auto', paddingTop: '30px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8' }}>
                <p>HEFEL GYM - Sistema de Gestão Inteligente v2.0</p>
                <p>Página 1 de 1</p>
            </div>
        </div >
    );
};

export default FullFinancialReportTemplate;
