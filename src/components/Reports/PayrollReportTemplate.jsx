
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
                        <h1 style={{ margin: 0, color: '#0f172a', fontSize: '24px', fontWeight: '800' }}>{rawCompany.name || 'HEFEL'}</h1>
                        <p style={{ margin: '4px 0', color: '#3b82f6', fontSize: '18px', fontWeight: '700' }}>Folha de Salários (Payroll)</p>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Período de Referência: {period}</p>
                    </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#64748b' }}>
                    <p style={{ margin: 0 }}>NUIT: 401089330</p>
                    <p style={{ margin: 0 }}>NUEL: 101286010</p>
                    <p style={{ margin: 0 }}>Maputo, Moçambique</p>
                </div>
            </div>

            {/* Payroll Table */}
            <div style={{ marginBottom: '40px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
                    <thead>
                        <tr style={{ background: '#1e293b', color: 'white', textAlign: 'left' }}>
                            <th style={{ padding: '8px 5px', borderTopLeftRadius: '4px' }}>Nº</th>
                            <th style={{ padding: '8px 5px' }}>Trabalhador</th>
                            <th style={{ padding: '8px 5px' }}>Cargo</th>
                            <th style={{ padding: '8px 5px', textAlign: 'right' }}>S. Base</th>
                            <th style={{ padding: '8px 5px', textAlign: 'right' }}>H. Extra</th>
                            <th style={{ padding: '8px 5px', textAlign: 'right' }}>Bónus</th>
                            <th style={{ padding: '8px 5px', textAlign: 'right' }}>Acrésc.</th>
                            <th style={{ padding: '8px 5px', textAlign: 'right', background: '#334155' }}>S. Bruto</th>
                            <th style={{ padding: '8px 5px', textAlign: 'right' }}>INSS 3%</th>
                            <th style={{ padding: '8px 5px', textAlign: 'right' }}>Faltas</th>
                            <th style={{ padding: '8px 5px', textAlign: 'right' }}>IRPS</th>
                            <th style={{ padding: '8px 5px', textAlign: 'right' }}>Outros</th>
                            <th style={{ padding: '8px 5px', textAlign: 'right', background: '#0f172a', borderTopRightRadius: '4px' }}>Líquido</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((emp, i) => {
                            const bruto = (emp.base_salary || 0) + (emp.extra_hours || 0) + (emp.bonus || 0) + (emp.additional_earnings || 0);
                            return (
                                <tr key={i} style={{ borderBottom: '1px solid #e2e8f0', background: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                                    <td style={{ padding: '6px 5px' }}>{i + 1}</td>
                                    <td style={{ padding: '6px 5px', fontWeight: 'bold' }}>{emp.name}</td>
                                    <td style={{ padding: '6px 5px' }}>{emp.role_label}</td>
                                    <td style={{ padding: '6px 5px', textAlign: 'right' }}>{(emp.base_salary || 0).toLocaleString()}</td>
                                    <td style={{ padding: '6px 5px', textAlign: 'right' }}>{(emp.extra_hours || 0).toLocaleString()}</td>
                                    <td style={{ padding: '6px 5px', textAlign: 'right' }}>{(emp.bonus || 0).toLocaleString()}</td>
                                    <td style={{ padding: '6px 5px', textAlign: 'right' }}>{(emp.additional_earnings || 0).toLocaleString()}</td>
                                    <td style={{ padding: '6px 5px', textAlign: 'right', fontWeight: 'bold', background: '#f1f5f9' }}>{bruto.toLocaleString()}</td>
                                    <td style={{ padding: '6px 5px', textAlign: 'right', color: '#ef4444' }}>{(emp.inss_discount || 0).toLocaleString()}</td>
                                    <td style={{ padding: '6px 5px', textAlign: 'right', color: '#ef4444' }}>{(emp.absences_discount || 0).toLocaleString()}</td>
                                    <td style={{ padding: '6px 5px', textAlign: 'right', color: '#ef4444' }}>{(emp.irt_discount || 0).toLocaleString()}</td>
                                    <td style={{ padding: '6px 5px', textAlign: 'right', color: '#ef4444' }}>{(emp.other_deductions || 0).toLocaleString()}</td>
                                    <td style={{ padding: '6px 5px', textAlign: 'right', fontWeight: '800', background: '#f8fafc' }}>{(emp.net_salary || 0).toLocaleString()} MT</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Summary Section (Excel format) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px', marginBottom: '40px' }}>
                <div>
                    <h3 style={{ fontSize: '12px', borderBottom: '2px solid #3b82f6', display: 'inline-block', marginBottom: '15px' }}>RESUMO CONSOLIDADO</h3>
                    <div style={{ fontSize: '11px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span>Total Salário Bruto:</span>
                            <span style={{ fontWeight: 'bold' }}>{summary.totalGross.toLocaleString()} MT</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span>Desconto INSS Trabalhador (3%):</span>
                            <span style={{ color: '#ef4444' }}>-{employees.reduce((a, b) => a + (b.inss_discount || 0), 0).toLocaleString()} MT</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span>Desconto Faltas:</span>
                            <span style={{ color: '#ef4444' }}>-{employees.reduce((a, b) => a + (b.absences_discount || 0), 0).toLocaleString()} MT</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span>Dívidas Diversas / Outros:</span>
                            <span style={{ color: '#ef4444' }}>-{employees.reduce((a, b) => a + (b.other_deductions || 0), 0).toLocaleString()} MT</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span>IRPS Trabalho:</span>
                            <span style={{ color: '#ef4444' }}>-{employees.reduce((a, b) => a + (b.irt_discount || 0), 0).toLocaleString()} MT</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #0f172a', marginTop: '5px' }}>
                            <span style={{ fontWeight: 'bold' }}>VALOR LÍQUIDO A PAGAR:</span>
                            <span style={{ fontWeight: '800', fontSize: '14px', color: '#166534' }}>{summary.totalNet.toLocaleString()} MT</span>
                        </div>
                    </div>
                </div>

                <div style={{ fontSize: '11px' }}>
                    <h3 style={{ fontSize: '12px', color: '#64748b', marginBottom: '15px' }}>CONTROLO PATRONAL (COST)</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span>INSS Empresa (4%):</span>
                        <span>{employees.reduce((a, b) => a + (b.inss_company || 0), 0).toLocaleString()} MT</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid #e2e8f0', marginTop: '10px', fontWeight: 'bold' }}>
                        <span>Custo Total de Pessoal:</span>
                        <span>{(summary.totalGross + employees.reduce((a, b) => a + (b.inss_company || 0), 0)).toLocaleString()} MT</span>
                    </div>
                </div>
            </div>

            {/* Signatures Area */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '30px', marginTop: '60px' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #cbd5e1', marginBottom: '8px', height: '40px' }}></div>
                    <p style={{ margin: 0, fontSize: '10px', fontWeight: 'bold' }}>Dorcidia Maoze Muguande</p>
                    <p style={{ margin: 0, fontSize: '9px', color: '#64748b' }}>Processada por</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #cbd5e1', marginBottom: '8px', height: '40px' }}></div>
                    <p style={{ margin: 0, fontSize: '10px', fontWeight: 'bold' }}>Nádia Victorino Inroga Machel</p>
                    <p style={{ margin: 0, fontSize: '9px', color: '#64748b' }}>Verificada por</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #cbd5e1', marginBottom: '8px', height: '40px' }}></div>
                    <p style={{ margin: 0, fontSize: '10px', fontWeight: 'bold' }}>Henriques José Bambo</p>
                    <p style={{ margin: 0, fontSize: '9px', color: '#64748b' }}>Aprovada por</p>
                </div>
            </div>

            {/* Footer */}
            <div style={{ position: 'absolute', bottom: '40px', left: '40px', right: '40px', borderTop: '1px solid #f1f5f9', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#94a3b8' }}>
                <span>Folha de Salário Gerada pelo Sistema HEFEL GYM</span>
                <span>Maputo, Moçambique</span>
            </div>
        </div>
    );
};

export default PayrollReportTemplate;
