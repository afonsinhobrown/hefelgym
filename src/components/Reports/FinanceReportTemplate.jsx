import React from 'react';

const FinanceReportTemplate = ({ summary, transactions, chartsData, period = 'Este Mês' }) => {
    const today = new Date().toLocaleDateString('pt-MZ', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Fetch company data for branding
    const rawCompany = JSON.parse(localStorage.getItem('hefel_company_v3') || '{}');
    const companyLogo = rawCompany.logo || null;
    const ivaRate = rawCompany.ivaRate !== undefined ? Number(rawCompany.ivaRate) : 3;

    // Calculate Global IVA (Estimated based on revenue being the base or total? 
    // Assuming Revenue shown is the Subtotal as per usual DB logic, IVA is on top. 
    // If Revenue is Total, we extract. check InvoiceTemplate logic: Total = Sub + IVA
    // Let's assume for reports we show the Tax AMOUNT that corresponds to this revenue)
    const totalIVA = summary.revenue * (ivaRate / 100);

    return (
        <div className="report-template" style={{ padding: '40px', background: 'white', color: '#1e293b', minHeight: '297mm', width: '210mm', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {companyLogo ? (
                        <img src={companyLogo} alt="Logo" style={{ maxHeight: '60px', maxWidth: '120px', objectFit: 'contain' }} />
                    ) : (
                        <div style={{ width: '50px', height: '50px', background: '#3b82f6', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' }}>HG</div>
                    )}
                    <div>
                        <h1 style={{ margin: 0, color: '#0f172a', fontSize: '24px', fontWeight: '800' }}>{rawCompany.name || 'HEFEL GYM'}</h1>
                        <p style={{ margin: '4px 0', color: '#3b82f6', fontSize: '14px', fontWeight: '600' }}>Relatório Financeiro Analítico</p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Período: {period}</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '8px' }}>
                        <p style={{ margin: 0, fontWeight: '700', fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Documento n.º</p>
                        <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: 'bold' }}>FIN-{Date.now()}</p>
                    </div>
                    <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '12px' }}>Emitido em: {today}</p>
                </div>
            </div>

            {/* Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '40px' }}>
                <div style={{ padding: '15px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bceabb' }}>
                    <p style={{ margin: 0, fontSize: '10px', color: '#166534', fontWeight: 'bold' }}>RECEITA LÍQUIDA</p>
                    <p style={{ margin: '5px 0 0', fontSize: '18px', fontWeight: '800', color: '#166534' }}>{summary.revenue.toLocaleString()} MT</p>
                </div>
                <div style={{ padding: '15px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                    <p style={{ margin: 0, fontSize: '10px', color: '#1e40af', fontWeight: 'bold' }}>TOTAL IVA ({ivaRate}%)</p>
                    <p style={{ margin: '5px 0 0', fontSize: '18px', fontWeight: '800', color: '#1e40af' }}>{totalIVA.toLocaleString()} MT</p>
                </div>
                <div style={{ padding: '15px', background: '#fff1f2', borderRadius: '12px', border: '1px solid #fecaca' }}>
                    <p style={{ margin: 0, fontSize: '10px', color: '#991b1b', fontWeight: 'bold' }}>VALOR PENDENTE</p>
                    <p style={{ margin: '5px 0 0', fontSize: '18px', fontWeight: '800', color: '#991b1b' }}>{summary.pending.toLocaleString()} MT</p>
                </div>
                <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: 0, fontSize: '10px', color: '#64748b', fontWeight: 'bold' }}>TOTAL BRUTO</p>
                    <p style={{ margin: '5px 0 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{(summary.revenue + totalIVA).toLocaleString()} MT</p>
                </div>
            </div>

            {/* Recommendations / Insights */}
            <div style={{ marginBottom: '40px', padding: '20px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#1e40af' }}>Análise e Recomendações</h3>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#1e3a8a', lineHeight: '1.6' }}>
                    <li>A receita do período mostra um crescimento saudável.</li>
                    <li>{summary.pending > summary.revenue * 0.3 ? 'Atenção: O valor pendente está elevado. Recomenda-se reforçar a cobrança.' : 'O rácio de cobrança está dentro dos níveis ideais.'}</li>
                    <li>Considere campanhas para aumentar o Ticket Médio através de suplementos ou serviços extra.</li>
                </ul>
            </div>

            {/* Transaction List */}
            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '18px', borderLeft: '4px solid #3b82f6', paddingLeft: '12px', marginBottom: '15px' }}>Extrato de Movimentos Recentes</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Data</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Cliente/Utente</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Descrição</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Estado</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>IVA ({ivaRate}%)</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        const gross = Number(t.amount || 0);
                        const net = gross / (1 + ivaRate / 100);
                        const iva = gross - net;

                        return (
                        <tr key={i}>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{t.date}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}><strong>{t.client}</strong></td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{t.id}</td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                                <span style={{
                                    padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold',
                                    background: t.status === 'pago' ? '#dcfce7' : '#fef9c3',
                                    color: t.status === 'pago' ? '#166534' : '#854d0e'
                                }}>
                                    {t.status.toUpperCase()}
                                </span>
                            </td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', color: '#64748b' }}>
                                {iva.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
                            </td>
                            <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 'bold' }}>
                                {gross.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
                            </td>
                        </tr>
                        );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer Charts or Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '40px', borderTop: '1px solid #e2e8f0', fontSize: '10px', color: '#94a3b8' }}>
                <p>© 2026 HEFEL GYM - Gestão Inteligente</p>
                <p>Página 1 de 1</p>
            </div>
        </div>
    );
};

export default FinanceReportTemplate;
