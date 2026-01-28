import React from 'react';

const UsersReportTemplate = ({ users, plans, filters, summary }) => {
    const today = new Date().toLocaleDateString('pt-MZ', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const statusText = filters.status === 'all' ? 'Todos os Utentes' : filters.status === 'active' ? 'Utentes Ativos' : 'Utentes Inativos';
    const searchText = filters.search ? `Pesquisa: "${filters.search}"` : '';

    // Fetch company data for branding
    const rawCompany = JSON.parse(localStorage.getItem('hefel_company_v3') || '{}');
    const companyLogo = rawCompany.logo || null;

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
                        <p style={{ margin: '4px 0', color: '#10b981', fontSize: '18px', fontWeight: '700' }}>Listagem Geral de Membros</p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>{statusText} {searchText ? `• ${searchText}` : ''}</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Ficha de Auditoria</p>
                    <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: 'bold' }}>{today}</p>
                </div>
            </div>

            {/* Quick Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
                <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: 'bold' }}>TOTAL DE MEMBROS</p>
                    <p style={{ margin: '5px 0 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{users.length}</p>
                </div>
                <div style={{ padding: '15px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bceabb' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: '#166534', fontWeight: 'bold' }}>ATIVOS</p>
                    <p style={{ margin: '5px 0 0', fontSize: '24px', fontWeight: '800', color: '#166534' }}>{users.filter(u => u.status === 'active').length}</p>
                </div>
                <div style={{ padding: '15px', background: '#fff1f2', borderRadius: '10px', border: '1px solid #fecaca' }}>
                    <p style={{ margin: 0, fontSize: '11px', color: '#991b1b', fontWeight: 'bold' }}>DÍVIDA TOTAL ESTIMADA</p>
                    <p style={{ margin: '5px 0 0', fontSize: '24px', fontWeight: '800', color: '#991b1b' }}>{summary.totalDebt.toLocaleString()} MT</p>
                </div>
            </div>

            {/* Members Table */}
            <div style={{ marginBottom: '30px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                            <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Utente</th>
                            <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Telefone</th>
                            <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Plano</th>
                            <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Estado</th>
                            <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>Dívida</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u, i) => (
                            <tr key={i}>
                                <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                                    <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                                    <div style={{ fontSize: '9px', color: '#94a3b8' }}>{u.nuit || 'S/ NUIT'} | {u.id}</div>
                                </td>
                                <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>{u.phone}</td>
                                <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                                    {plans.find(p => p.id === (u.plan_id || u.planId))?.name || 'Sem Plano'}
                                </td>
                                <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                                    <span style={{
                                        padding: '3px 8px', borderRadius: '12px', fontSize: '9px', fontWeight: 'bold',
                                        background: u.status === 'active' ? '#dcfce7' : '#f1f5f9',
                                        color: u.status === 'active' ? '#166534' : '#64748b'
                                    }}>
                                        {u.status === 'active' ? 'ATIVO' : 'INATIVO'}
                                    </span>
                                </td>
                                <td style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 'bold', color: (u.balance || 0) > 0 ? '#ef4444' : '#10b981' }}>
                                    {(u.balance || 0).toLocaleString()} MT
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Recommendations */}
            <div style={{ marginTop: 'auto', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#1e293b' }}>Análise de Gestão</h4>
                <p style={{ margin: 0, fontSize: '10px', color: '#64748b', lineHeight: '1.4' }}>
                    * Taxa de Inatividade: {((users.filter(u => u.status !== 'active').length / users.length) * 100).toFixed(1)}% do total.<br />
                    * Foram identificados {users.filter(u => u.balance > 0).length} membros com pagamentos pendentes.<br />
                    * Recomenda-se contacto proativo via WhatsApp para regularização de dívidas e reativação de planos.
                </p>
            </div>

            <div style={{ marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '10px', textAlign: 'center', fontSize: '9px', color: '#94a3b8' }}>
                Este documento é propriedade do HEFEL GYM. Informação confidencial.
            </div>
        </div >
    );
};

export default UsersReportTemplate;
