import React from 'react';

const PayrollReportTemplate = ({ employees, month, year, summary }) => {
    const today = new Date().toLocaleDateString('pt-MZ', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const period = `${month} / ${year}`;

    // Fetch company data
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
                        <p style={{ margin: '4px 0', color: '#3b82f6', fontSize: '18px', fontWeight: '700' }}>Folha de Salários (Payroll)</p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Período de Referência: {period}</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: '700', fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Processamento Salarial</p>
                    <p style={{ margin: 0, color: '#0f172a', fontSize: '14px', fontWeight: 'bold' }}>{today}</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
                <div style={{ padding: '10px 15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: 0, fontSize: '10px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Colaboradores</p>
                    <p style={{ margin: '5px 0 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{employees.length}</p>
                </div>
                <div style={{ padding: '10px 15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <p style={{ margin: 0, fontSize: '10px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Salário Bruto Total</p>
                    <p style={{ margin: '5px 0 0', fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>{summary.totalGross.toLocaleString()} MT</p>
                </div>
                <div style={{ padding: '10px 15px', background: '#fff1f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
                    <p style={{ margin: 0, fontSize: '10px', color: '#991b1b', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Descontos</p>
                    <p style={{ margin: '5px 0 0', fontSize: '18px', fontWeight: '800', color: '#991b1b' }}>{summary.totalDeductions.toLocaleString()} MT</p>
                </div>
                <div style={{ padding: '10px 15px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bceabb' }}>
                    <p style={{ margin: 0, fontSize: '10px', color: '#166534', fontWeight: 'bold', textTransform: 'uppercase' }}>Total Líquido a Pagar</p>
                    <p style={{ margin: '5px 0 0', fontSize: '18px', fontWeight: '800', color: '#166534' }}>{summary.totalNet.toLocaleString()} MT</p>
                </div>
            </div>

            {/* Payroll Table */}
            <div style={{ marginBottom: '40px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                    <thead>
                        <tr style={{ background: '#1e293b', color: 'white', textAlign: 'left' }}>
                            <th style={{ padding: '10px', borderTopLeftRadius: '6px' }}>Colaborador</th>
                            <th style={{ padding: '10px' }}>Cargo</th>
                            <th style={{ padding: '10px', textAlign: 'right' }}>Salário Base</th>
                            <th style={{ padding: '10px', textAlign: 'right' }}>Bónus</th>
                            <th style={{ padding: '10px', textAlign: 'right' }}>INSS (3%)</th>
                            <th style={{ padding: '10px', textAlign: 'right' }}>IRT</th>
                            <th style={{ padding: '10px', textAlign: 'right' }}>Outros</th>
                            <th style={{ padding: '10px', textAlign: 'right', background: '#334155', borderTopRightRadius: '6px' }}>Líquido</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((emp, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                                <td style={{ padding: '8px 10px', fontWeight: 'bold', color: '#334155' }}>{emp.name}</td>
                                <td style={{ padding: '8px 10px', color: '#64748b' }}>{emp.role_label}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace' }}>{(emp.base_salary || 0).toLocaleString()}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: '#166534' }}>{(emp.bonus || 0).toLocaleString()}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: '#ef4444' }}>{(emp.inss_discount || 0).toLocaleString()}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: '#ef4444' }}>{(emp.irt_discount || 0).toLocaleString()}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', color: '#ef4444' }}>{(emp.other_deductions || 0).toLocaleString()}</td>
                                <td style={{ padding: '8px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '11px', color: '#0f172a', background: '#f1f5f9' }}>
                                    {(emp.net_salary || 0).toLocaleString()} MT
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ background: '#f8fafc', fontWeight: 'bold' }}>
                            <td colSpan={2} style={{ padding: '10px', textAlign: 'right', textTransform: 'uppercase', fontSize: '9px' }}>Totais Gerais</td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>{employees.reduce((a, b) => a + (b.base_salary || 0), 0).toLocaleString()}</td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>{employees.reduce((a, b) => a + (b.bonus || 0), 0).toLocaleString()}</td>
                            <td style={{ padding: '10px', textAlign: 'right', color: '#ef4444' }}>{employees.reduce((a, b) => a + (b.inss_discount || 0), 0).toLocaleString()}</td>
                            <td style={{ padding: '10px', textAlign: 'right', color: '#ef4444' }}>{employees.reduce((a, b) => a + (b.irt_discount || 0), 0).toLocaleString()}</td>
                            <td style={{ padding: '10px', textAlign: 'right', color: '#ef4444' }}>{employees.reduce((a, b) => a + (b.other_deductions || 0), 0).toLocaleString()}</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontSize: '12px' }}>{summary.totalNet.toLocaleString()} MT</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Signatures */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px', marginTop: '60px' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #cbd5e1', marginBottom: '8px', height: '40px' }}></div>
                    <p style={{ margin: 0, fontSize: '10px', color: '#64748b' }}>Elaborado por (RH/Admin)</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #cbd5e1', marginBottom: '8px', height: '40px' }}></div>
                    <p style={{ margin: 0, fontSize: '10px', color: '#64748b' }}>Aprovado por (Gerência)</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #cbd5e1', marginBottom: '8px', height: '40px' }}></div>
                    <p style={{ margin: 0, fontSize: '10px', color: '#64748b' }}>Data de Processamento</p>
                </div>
            </div>

            {/* Footer */}
            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#94a3b8' }}>
                <span>Processado via HEFEL GYM System</span>
                <span>Página 1 de 1</span>
            </div>
        </div>
    );
};

export default PayrollReportTemplate;
