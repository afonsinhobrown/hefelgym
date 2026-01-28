import React from 'react';

const BillingReportTemplate = ({ invoices, filters, summary }) => {
    const today = new Date().toLocaleDateString('pt-MZ', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const periodText = filters.startDate || filters.endDate
        ? `De ${filters.startDate || 'Início'} até ${filters.endDate || 'Hoje'}`
        : 'Histórico Completo';

    const clientFilterText = filters.search ? `Pesquisa: "${filters.search}"` : 'Todos os Clientes';

    // Fetch company data for branding
    const rawCompany = JSON.parse(localStorage.getItem('hefel_company_v3') || '{}');
    const companyLogo = rawCompany.logo || null;
    const ivaRate = rawCompany.ivaRate !== undefined ? Number(rawCompany.ivaRate) : 3;

    return (
        <div className="report-template" style={{ padding: '40px', background: 'white', color: '#1e293b', minHeight: '297mm', width: '210mm', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '20px', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {companyLogo ? (
                        <img src={companyLogo} alt="Logo" style={{ maxHeight: '60px', maxWidth: '120px', objectFit: 'contain' }} />
                    ) : (
                        <div style={{ width: '40px', height: '40px', background: '#3b82f6', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>HG</div>
                    )}
                    <div>
                        <h1 style={{ margin: 0, color: '#0f172a', fontSize: '24px', fontWeight: '800' }}>{rawCompany.name || 'HEFEL GYM'}</h1>
                        <p style={{ margin: '4px 0', color: '#1e40af', fontSize: '16px', fontWeight: '700' }}>Extrato de Faturamento e Recebimentos</p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '11px' }}>{periodText} • {clientFilterText}</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '10px', color: '#64748b' }}>DATA DE EMISSÃO</p>
                    <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: 'bold' }}>{today}</p>
                </div>
            </div>

            {/* Financial Summary Bars */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '35px' }}>
                <div style={{ padding: '15px 20px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bceabb' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: '#166534', fontWeight: '700' }}>TOTAL RECEBIDO (PAGO)</p>
                    <p style={{ margin: '5px 0 0', fontSize: '22px', fontWeight: '800', color: '#166534' }}>{summary.paid.toLocaleString()} MT</p>
                </div>
                <div style={{ padding: '15px 20px', background: '#fff1f2', borderRadius: '10px', border: '1px solid #fecaca' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: '#991b1b', fontWeight: '700' }}>TOTAL EM ABERTO (PENDENTE)</p>
                    <p style={{ margin: '5px 0 0', fontSize: '22px', fontWeight: '800', color: '#991b1b' }}>{summary.pending.toLocaleString()} MT</p>
                </div>
            </div>

            {/* Invoices Table */}
            <div style={{ marginBottom: '30px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>N.º Fatura</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Data</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Cliente</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Descrição</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0' }}>Estado</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>IVA</th>
                            <th style={{ padding: '10px', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map((inv, i) => {
                            const amount = Number(inv.amount) || Number(inv.total) || 0;
                            const net = amount / (1 + ivaRate / 100);
                            const iva = amount - net;

                            return (
                                <tr key={i}>
                                    <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', fontFamily: 'monospace' }}>{inv.id}</td>
                                    <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{new Date(inv.date).toLocaleDateString()}</td>
                                    <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}><strong>{inv.client_name || inv.client?.name || 'Cliente Final'}</strong></td>
                                    <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>
                                        {inv.description || (inv.items && inv.items[0]?.name) || 'Venda Diversa'}
                                    </td>
                                    <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                                        <span style={{
                                            padding: '3px 7px', borderRadius: '10px', fontSize: '9px', fontWeight: 'bold',
                                            background: inv.status === 'pago' ? '#dcfce7' : '#fef9c3',
                                            color: inv.status === 'pago' ? '#166534' : '#854d0e'
                                        }}>
                                            {inv.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', color: '#64748b' }}>
                                        {iva.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
                                    </td>
                                    <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 'bold' }}>
                                        {amount.toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Recommendations Section */}
            <div style={{ marginTop: 'auto', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#0f172a' }}>Notas do Auditor</h4>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b', lineHeight: '1.5' }}>
                    Este relatório contempla {invoices.length} faturas processadas no período selecionado.
                    {summary.pending > 0 ? ` Existe um valor de ${summary.pending.toLocaleString()} MT pendente que deve ser conciliado comercialmente.` : ' Não existem valores pendentes para os critérios selecionados.'}
                </p>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>
                © 2026 HEFEL GYM - Documento Gerado para Fins de Controlo Interno
            </div>
        </div>
    );
};

export default BillingReportTemplate;
