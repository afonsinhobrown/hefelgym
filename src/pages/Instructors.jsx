import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import html2pdf from 'html2pdf.js';
import QRCode from 'qrcode';

const Instructors = () => {
    const [instructors, setInstructors] = useState([]);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingInstructor, setEditingInstructor] = useState(null);
    const [formData, setFormData] = useState({});
    const [viewMode, setViewMode] = useState('payroll'); // 'payroll' or 'cards'
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // 2026-01
    const [payrollHistory, setPayrollHistory] = useState([]);
    const [isViewingHistory, setIsViewingHistory] = useState(false);

    const loadData = async () => {
        try {
            await db.init();
            const data = await db.instructors.getAll();

            if (!data || data.length === 0) {
                setError("Sem dados - Servidor Offline");
                return;
            }

            const sorted = data.sort((a, b) => (a.order_index || 99) - (b.order_index || 99));
            setInstructors(sorted);
            setError(null);
        } catch (err) {
            setError("Erro: Servidor Local não responde (Porta 3001)");
            console.error(err);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const isInternal = (type) => {
        if (!type || typeof type !== 'string') return true;
        return !type.toLowerCase().includes('external');
    };

    const filteredInstructors = instructors.filter(inst => {
        if (!searchTerm) return isInternal(inst.type);
        const search = searchTerm.toLowerCase();
        return isInternal(inst.type) && (
            inst.name?.toLowerCase().includes(search) ||
            inst.specialties?.toLowerCase().includes(search) ||
            inst.nuit?.toLowerCase().includes(search) ||
            inst.phone?.toLowerCase().includes(search)
        );
    });

    const totalLiquido = instructors.filter(isInternal).reduce((sum, i) => sum + (i.net_salary || 0), 0);
    const totalINSS = instructors.filter(isInternal).reduce((sum, i) => sum + (i.inss_discount || 0) + (i.inss_company || 0), 0);

    const handleEdit = (instructor) => {
        setEditingInstructor(instructor);
        setFormData({ ...instructor });
    };

    const handleSave = async () => {
        try {
            // Recalcular salário líquido
            const netSalary = (formData.base_salary || 0) + (formData.extra_hours || 0) + (formData.bonus || 0)
                - (formData.inss_discount || 0) - (formData.irt_discount || 0) - (formData.absences_discount || 0) - (formData.other_deductions || 0);

            const updatedData = { ...formData, net_salary: netSalary };

            await db.instructors.update(updatedData.id, updatedData);
            await loadData();
            setEditingInstructor(null);
            setFormData({});
        } catch (err) {
            alert('Erro ao guardar: ' + err.message);
        }
    };

    const handleClose = () => {
        setEditingInstructor(null);
        setFormData({});
    };

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const savePayrollSnapshot = async () => {
        try {
            const monthKey = selectedMonth; // 2026-01
            const [year, month] = monthKey.split('-');
            const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
            const monthName = monthNames[parseInt(month) - 1];

            const totalBruto = filteredInstructors.reduce((sum, i) => sum + ((i.base_salary || 0) + (i.extra_hours || 0) + (i.bonus || 0)), 0);
            const totalDescontos = filteredInstructors.reduce((sum, i) => sum + (i.inss_discount || 0) + (i.absences_discount || 0) + (i.irt_discount || 0) + (i.other_deductions || 0), 0);
            const totalLiquido = totalBruto - totalDescontos;

            const snapshot = {
                id: `payroll_${monthKey}_${Date.now()}`,
                gym_id: 'hefel_gym_v1',
                month: monthKey,
                year: parseInt(year),
                month_name: monthName,
                snapshot_date: new Date().toISOString(),
                data: JSON.stringify(filteredInstructors),
                total_bruto: totalBruto,
                total_descontos: totalDescontos,
                total_liquido: totalLiquido,
                created_by: 'admin',
                synced: 0
            };

            const response = await fetch('http://localhost:3001/api/payroll-history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(snapshot)
            });

            if (response.ok) {
                alert(`✅ Folha de ${monthName}/${year} guardada com sucesso!`);
                loadPayrollHistory();
            } else {
                throw new Error('Erro ao guardar snapshot');
            }
        } catch (err) {
            alert('Erro ao guardar folha: ' + err.message);
        }
    };

    const loadPayrollHistory = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/payroll-history');
            const data = await response.json();
            setPayrollHistory(data);
        } catch (err) {
            console.error('Erro ao carregar histórico:', err);
        }
    };

    const loadHistoricalPayroll = (monthKey) => {
        const historical = payrollHistory.find(h => h.month === monthKey);
        if (historical) {
            setInstructors(JSON.parse(historical.data));
            setIsViewingHistory(true);
        }
    };

    useEffect(() => {
        loadPayrollHistory();
    }, []);

    const exportToPDF = async () => {
        try {
            // Gerar QR Code
            const qrData = `HEFEL GYM - Folha Salarial ${new Date().toLocaleDateString('pt-MZ')}`;
            const qrCodeDataUrl = await QRCode.toDataURL(qrData, { width: 120 });

            const currentDate = new Date().toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric' });
            const totalBruto = filteredInstructors.reduce((sum, i) => sum + ((i.base_salary || 0) + (i.extra_hours || 0) + (i.bonus || 0)), 0);
            const totalINSSWorker = filteredInstructors.reduce((sum, i) => sum + (i.inss_discount || 0), 0);
            const totalFaltas = filteredInstructors.reduce((sum, i) => sum + (i.absences_discount || 0), 0);
            const totalIRPS = filteredInstructors.reduce((sum, i) => sum + (i.irt_discount || 0), 0);
            const totalDescontos = totalINSSWorker + totalFaltas + totalIRPS;
            const totalLiq = totalBruto - totalDescontos;

            const htmlContent = `
                <div style="font-family: Arial, sans-serif; padding: 40px; color: #000;">
                    <!-- HEADER -->
                    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 30px;">
                        <div>
                            <h1 style="margin: 0; font-size: 28px; color: #1e3a8a;">HEFEL GYM</h1>
                            <p style="margin: 5px 0; font-size: 12px; color: #666;">Av. Principal, Maputo • NUIT: 123456789 • Tel: +258 84 000 0000</p>
                        </div>
                        <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 100px; height: 100px;" />
                    </div>

                    <!-- TITLE -->
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h2 style="margin: 0; font-size: 22px; color: #1e3a8a;">FOLHA DE SALÁRIOS</h2>
                        <p style="margin: 5px 0; font-size: 14px; color: #666;">Período: ${currentDate}</p>
                    </div>

                    <!-- SUMMARY BOX -->
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #d1d5db;">
                        <h3 style="margin: 0 0 15px 0; font-size: 14px; color: #1e3a8a; text-transform: uppercase;">Resumo da Folha</h3>
                        <table style="width: 100%; font-size: 13px;">
                            <tr>
                                <td style="padding: 5px 0;"><strong>Total de Salário Bruto:</strong></td>
                                <td style="text-align: right; padding: 5px 0;">${totalBruto.toLocaleString()} MT</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 0;">Desconto INSS Trabalhador:</td>
                                <td style="text-align: right; padding: 5px 0; color: #dc2626;">${totalINSSWorker.toLocaleString()} MT</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 0;">Faltas:</td>
                                <td style="text-align: right; padding: 5px 0; color: #dc2626;">${totalFaltas.toLocaleString()} MT</td>
                            </tr>
                            <tr>
                                <td style="padding: 5px 0;">IRPS:</td>
                                <td style="text-align: right; padding: 5px 0; color: #dc2626;">${totalIRPS.toLocaleString()} MT</td>
                            </tr>
                            <tr style="border-top: 2px solid #1e3a8a;">
                                <td style="padding: 8px 0;"><strong>Total Descontos:</strong></td>
                                <td style="text-align: right; padding: 8px 0; color: #dc2626;"><strong>${totalDescontos.toLocaleString()} MT</strong></td>
                            </tr>
                            <tr style="background: #dcfce7;">
                                <td style="padding: 8px 0;"><strong>Total Líquido:</strong></td>
                                <td style="text-align: right; padding: 8px 0; color: #16a34a;"><strong>${totalLiq.toLocaleString()} MT</strong></td>
                            </tr>
                        </table>
                    </div>

                    <!-- PAYROLL TABLE -->
                    <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 40px;">
                        <thead>
                            <tr style="background: #1e3a8a; color: white;">
                                <th style="padding: 10px 5px; text-align: left; border: 1px solid #ddd;">Nº</th>
                                <th style="padding: 10px 5px; text-align: left; border: 1px solid #ddd;">Colaborador</th>
                                <th style="padding: 10px 5px; text-align: left; border: 1px solid #ddd;">Função</th>
                                <th style="padding: 10px 5px; text-align: right; border: 1px solid #ddd;">S. Base</th>
                                <th style="padding: 10px 5px; text-align: right; border: 1px solid #ddd;">H. Extra</th>
                                <th style="padding: 10px 5px; text-align: right; border: 1px solid #ddd;">Bónus</th>
                                <th style="padding: 10px 5px; text-align: right; border: 1px solid #ddd;">Bruto</th>
                                <th style="padding: 10px 5px; text-align: right; border: 1px solid #ddd;">INSS 3%</th>
                                <th style="padding: 10px 5px; text-align: right; border: 1px solid #ddd;">Faltas</th>
                                <th style="padding: 10px 5px; text-align: right; border: 1px solid #ddd;">IRPS</th>
                                <th style="padding: 10px 5px; text-align: right; border: 1px solid #ddd; background: #16a34a;">Líquido</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredInstructors.map((inst, idx) => {
                const bruto = (inst.base_salary || 0) + (inst.extra_hours || 0) + (inst.bonus || 0);
                return `
                                    <tr style="background: ${idx % 2 === 0 ? '#f9fafb' : 'white'};">
                                        <td style="padding: 8px 5px; border: 1px solid #ddd;">${idx + 1}</td>
                                        <td style="padding: 8px 5px; border: 1px solid #ddd;">${inst.name}</td>
                                        <td style="padding: 8px 5px; border: 1px solid #ddd;">${inst.specialties || inst.role || 'Staff'}</td>
                                        <td style="padding: 8px 5px; text-align: right; border: 1px solid #ddd;">${(inst.base_salary || 0).toLocaleString()}</td>
                                        <td style="padding: 8px 5px; text-align: right; border: 1px solid #ddd;">${(inst.extra_hours || 0).toLocaleString()}</td>
                                        <td style="padding: 8px 5px; text-align: right; border: 1px solid #ddd;">${(inst.bonus || 0).toLocaleString()}</td>
                                        <td style="padding: 8px 5px; text-align: right; border: 1px solid #ddd; font-weight: bold;">${bruto.toLocaleString()}</td>
                                        <td style="padding: 8px 5px; text-align: right; border: 1px solid #ddd; color: #dc2626;">${(inst.inss_discount || 0).toLocaleString()}</td>
                                        <td style="padding: 8px 5px; text-align: right; border: 1px solid #ddd; color: #dc2626;">${(inst.absences_discount || 0).toLocaleString()}</td>
                                        <td style="padding: 8px 5px; text-align: right; border: 1px solid #ddd; color: #dc2626;">${(inst.irt_discount || 0).toLocaleString()}</td>
                                        <td style="padding: 8px 5px; text-align: right; border: 1px solid #ddd; font-weight: bold; color: #16a34a;">${(inst.net_salary || 0).toLocaleString()}</td>
                                    </tr>
                                `;
            }).join('')}
                        </tbody>
                    </table>

                    <!-- SIGNATURES -->
                    <div style="margin-top: 60px; display: flex; justify-content: space-between;">
                        <div style="text-align: center; width: 45%;">
                            <div style="border-top: 2px solid #000; padding-top: 10px; margin-top: 60px;">
                                <strong>Processado por:</strong><br/>
                                <span style="font-size: 11px;">Dorcélia Macore Muguande</span><br/>
                                <span style="font-size: 10px; color: #666;">Data: _____/_____/_____</span>
                            </div>
                        </div>
                        <div style="text-align: center; width: 45%;">
                            <div style="border-top: 2px solid #000; padding-top: 10px; margin-top: 60px;">
                                <strong>Verificado por:</strong><br/>
                                <span style="font-size: 11px;">Nádia Vitorino Inrege Machel</span><br/>
                                <span style="font-size: 10px; color: #666;">Data: _____/_____/_____</span>
                            </div>
                        </div>
                    </div>

                    <!-- FOOTER -->
                    <div style="margin-top: 40px; text-align: center; font-size: 10px; color: #666; border-top: 1px solid #ddd; padding-top: 15px;">
                        <p style="margin: 0;">Documento gerado automaticamente pelo Sistema HEFEL GYM • ${new Date().toLocaleString('pt-MZ')}</p>
                    </div>
                </div>
            `;

            const element = document.createElement('div');
            element.innerHTML = htmlContent;

            const opt = {
                margin: 10,
                filename: `Folha_Salarial_HEFEL_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };

            await html2pdf().set(opt).from(element).save();
        } catch (err) {
            alert('Erro ao gerar PDF: ' + err.message);
            console.error(err);
        }
    };

    return (
        <div style={{ padding: '20px', color: 'white', fontFamily: 'Arial, sans-serif', background: '#0a0e1a', minHeight: '100vh' }}>
            <div style={{ marginBottom: '30px', borderBottom: '2px solid #1e3a8a', paddingBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '28px', margin: 0, fontWeight: 'bold' }}>
                        Gestão de Staff - HEFEL GYM
                    </h2>
                    <p style={{ color: '#94a3b8', marginTop: '5px' }}>
                        Ordem Hierárquica Oficial (1-22) • {filteredInstructors.length} Colaboradores
                    </p>
                </div>
                <div style={{
                    background: isViewingHistory ? '#854d0e' : '#1e3a8a',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    border: `2px solid ${isViewingHistory ? '#fbbf24' : '#3b82f6'}`,
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>
                        {isViewingHistory ? '📜 HISTÓRICO' : '📊 FOLHA ATUAL'}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: isViewingHistory ? '#fbbf24' : '#60a5fa' }}>
                        {isViewingHistory
                            ? payrollHistory.find(h => h.month === selectedMonth)?.month_name + '/' + payrollHistory.find(h => h.month === selectedMonth)?.year
                            : new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())
                        }
                    </div>
                </div>
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                <input
                    type="text"
                    placeholder="🔍 Pesquisar por nome, função, NUIT ou contacto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        flex: 1,
                        padding: '14px 20px',
                        background: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '14px',
                        outline: 'none'
                    }}
                />
                <button
                    onClick={exportToPDF}
                    style={{
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        padding: '14px 24px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    📄 Exportar PDF
                </button>
                <button
                    onClick={savePayrollSnapshot}
                    style={{
                        background: '#16a34a',
                        color: 'white',
                        border: 'none',
                        padding: '14px 24px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    💾 Guardar Folha
                </button>
            </div>

            {/* Month Selector for History */}
            {payrollHistory.length > 0 && (
                <div style={{ marginBottom: '20px', padding: '15px', background: '#1e293b', borderRadius: '10px', border: '1px solid #334155' }}>
                    <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', color: '#94a3b8' }}>
                        📅 Ver Folha Histórica:
                    </label>
                    <select
                        value={isViewingHistory ? selectedMonth : 'current'}
                        onChange={(e) => {
                            if (e.target.value === 'current') {
                                setIsViewingHistory(false);
                                loadData();
                            } else {
                                setSelectedMonth(e.target.value);
                                loadHistoricalPayroll(e.target.value);
                            }
                        }}
                        style={{
                            padding: '10px 15px',
                            background: '#0f172a',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '14px',
                            cursor: 'pointer',
                            minWidth: '200px'
                        }}
                    >
                        <option value="current">📊 Folha Atual (Editar)</option>
                        {payrollHistory.map(h => (
                            <option key={h.id} value={h.month}>
                                📜 {h.month_name}/{h.year} - {h.total_liquido.toLocaleString()} MT
                            </option>
                        ))}
                    </select>
                    {isViewingHistory && (
                        <span style={{ marginLeft: '15px', color: '#fbbf24', fontSize: '13px' }}>
                            ⚠️ Modo somente leitura - Histórico guardado
                        </span>
                    )}
                </div>
            )}


            {error && (
                <div style={{ background: '#7f1d1d', color: '#fca5a5', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #dc2626' }}>
                    ⚠️ {error}
                </div>
            )}

            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
                <div style={{ flex: 1, background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 'bold' }}>
                        Total Líquido
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
                        {totalLiquido.toLocaleString()} <span style={{ fontSize: '16px', color: '#6b7280' }}>MT</span>
                    </div>
                </div>
                <div style={{ flex: 1, background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 'bold' }}>
                        Encargos INSS
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>
                        {totalINSS.toLocaleString()} <span style={{ fontSize: '16px', color: '#6b7280' }}>MT</span>
                    </div>
                </div>
            </div>

            <div style={{ background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#0f172a' }}>
                            <tr>
                                <th style={thStyle}>Nº</th>
                                <th style={thStyle}>Colaborador / NUIT</th>
                                <th style={thStyle}>Função</th>
                                <th style={thStyle}>Contacto</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>S. Base (F)</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>H. Extra (G)</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Bónus (H)</th>
                                <th style={{ ...thStyle, textAlign: 'right' }}>Bruto (J)</th>
                                <th style={{ ...thStyle, textAlign: 'right', color: '#ef4444' }}>INSS 3% (K)</th>
                                <th style={{ ...thStyle, textAlign: 'right', color: '#ef4444' }}>IRPS (N)</th>
                                <th style={{ ...thStyle, textAlign: 'right', color: '#10b981' }}>Líquido (Q)</th>
                                <th style={{ ...thStyle, textAlign: 'center' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInstructors.map((inst, idx) => {
                                const bruto = (inst.base_salary || 0) + (inst.extra_hours || 0) + (inst.bonus || 0) + (inst.additional_earnings || 0);
                                return (
                                    <tr key={inst.id} style={{ borderBottom: '1px solid #334155', background: idx % 2 === 0 ? '#1e293b' : '#0f172a' }}>
                                        <td style={tdStyle}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                                {inst.order_index || idx + 1}
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
                                                {inst.name}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace' }}>
                                                {inst.nuit || '---'}
                                            </div>
                                        </td>
                                        <td style={tdStyle}>
                                            <div style={{ background: '#334155', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block' }}>
                                                {inst.specialties || inst.role || 'Staff'}
                                            </div>
                                        </td>
                                        <td style={{ ...tdStyle, fontSize: '12px', color: '#94a3b8' }}>
                                            {inst.phone || '---'}
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>
                                            {(inst.base_salary || 0).toLocaleString()}
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', color: '#94a3b8' }}>
                                            {(inst.extra_hours || 0).toLocaleString()}
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', color: '#94a3b8' }}>
                                            {(inst.bonus || 0).toLocaleString()}
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                            {bruto.toLocaleString()}
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', color: '#ef4444' }}>
                                            {(inst.inss_discount || 0).toLocaleString()}
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace', color: '#ef4444' }}>
                                            {(inst.irt_discount || 0).toLocaleString()}
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                                            <div style={{ background: '#065f46', color: '#10b981', padding: '6px 12px', borderRadius: '8px', fontFamily: 'monospace', fontWeight: 'bold', display: 'inline-block', border: '1px solid #10b981' }}>
                                                {(inst.net_salary || 0).toLocaleString()}
                                            </div>
                                        </td>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleEdit(inst)}
                                                style={{
                                                    background: '#3b82f6',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '8px 16px',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                ✏️ Editar
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL DE EDIÇÃO */}
            {editingInstructor && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#1e293b',
                        borderRadius: '16px',
                        maxWidth: '900px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        border: '1px solid #334155'
                    }}>
                        {/* Header */}
                        <div style={{ padding: '24px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                                Editar Colaborador: {editingInstructor.name}
                            </h3>
                            <button onClick={handleClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer' }}>×</button>
                        </div>

                        {/* Form Content */}
                        <div style={{ padding: '24px' }}>
                            {/* Dados Pessoais */}
                            <div style={{ marginBottom: '30px' }}>
                                <h4 style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 'bold' }}>📋 Dados Pessoais</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Nome Completo</label>
                                        <input type="text" value={formData.name || ''} onChange={(e) => updateField('name', e.target.value)} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>NUIT</label>
                                        <input type="text" value={formData.nuit || ''} onChange={(e) => updateField('nuit', e.target.value)} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Contacto</label>
                                        <input type="text" value={formData.phone || ''} onChange={(e) => updateField('phone', e.target.value)} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Email</label>
                                        <input type="email" value={formData.email || ''} onChange={(e) => updateField('email', e.target.value)} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Função</label>
                                        <input type="text" value={formData.specialties || ''} onChange={(e) => updateField('specialties', e.target.value)} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Nº Conta Bancária</label>
                                        <input type="text" value={formData.account_number || ''} onChange={(e) => updateField('account_number', e.target.value)} style={inputStyle} />
                                    </div>
                                </div>
                            </div>

                            {/* Dados Salariais */}
                            <div style={{ marginBottom: '30px' }}>
                                <h4 style={{ fontSize: '14px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 'bold' }}>💰 Salário e Ganhos</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Salário Base (F)</label>
                                        <input type="number" value={formData.base_salary || 0} onChange={(e) => updateField('base_salary', parseFloat(e.target.value) || 0)} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Horas Extra (G)</label>
                                        <input type="number" value={formData.extra_hours || 0} onChange={(e) => updateField('extra_hours', parseFloat(e.target.value) || 0)} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Bónus (H)</label>
                                        <input type="number" value={formData.bonus || 0} onChange={(e) => updateField('bonus', parseFloat(e.target.value) || 0)} style={inputStyle} />
                                    </div>
                                </div>
                            </div>

                            {/* Descontos */}
                            <div style={{ marginBottom: '30px' }}>
                                <h4 style={{ fontSize: '14px', color: '#ef4444', textTransform: 'uppercase', marginBottom: '16px', fontWeight: 'bold' }}>📉 Descontos</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>INSS 3% (K)</label>
                                        <input type="number" value={formData.inss_discount || 0} onChange={(e) => updateField('inss_discount', parseFloat(e.target.value) || 0)} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>IRPS (N)</label>
                                        <input type="number" value={formData.irt_discount || 0} onChange={(e) => updateField('irt_discount', parseFloat(e.target.value) || 0)} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Faltas</label>
                                        <input type="number" value={formData.absences_discount || 0} onChange={(e) => updateField('absences_discount', parseFloat(e.target.value) || 0)} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Outros Descontos</label>
                                        <input type="number" value={formData.other_deductions || 0} onChange={(e) => updateField('other_deductions', parseFloat(e.target.value) || 0)} style={inputStyle} />
                                    </div>
                                </div>
                            </div>

                            {/* Resumo */}
                            <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ color: '#94a3b8' }}>Salário Bruto:</span>
                                    <span style={{ fontWeight: 'bold', fontSize: '18px' }}>
                                        {((formData.base_salary || 0) + (formData.extra_hours || 0) + (formData.bonus || 0)).toLocaleString()} MT
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <span style={{ color: '#ef4444' }}>Total Descontos:</span>
                                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                                        -{((formData.inss_discount || 0) + (formData.irt_discount || 0) + (formData.absences_discount || 0) + (formData.other_deductions || 0)).toLocaleString()} MT
                                    </span>
                                </div>
                                <div style={{ borderTop: '1px solid #334155', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#10b981', fontSize: '16px', fontWeight: 'bold' }}>Salário Líquido:</span>
                                    <span style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold' }}>
                                        {((formData.base_salary || 0) + (formData.extra_hours || 0) + (formData.bonus || 0) - (formData.inss_discount || 0) - (formData.irt_discount || 0) - (formData.absences_discount || 0) - (formData.other_deductions || 0)).toLocaleString()} MT
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ padding: '24px', borderTop: '1px solid #334155', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button onClick={handleClose} style={{
                                background: '#334155',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}>
                                Cancelar
                            </button>
                            <button onClick={handleSave} style={{
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}>
                                💾 Guardar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginTop: '30px', padding: '20px', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '10px' }}>
                    Período de Referência: <strong style={{ color: 'white' }}>{new Date().toLocaleDateString('pt-MZ', { month: 'long', year: 'numeric' })}</strong>
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                    Folha Salarial Industrial • Sistema HEFEL GYM
                </div>
            </div>
        </div>
    );
};

const thStyle = {
    padding: '16px 12px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontSize: '10px',
    letterSpacing: '1px',
    fontWeight: 'bold'
};

const tdStyle = {
    padding: '16px 12px',
    fontSize: '13px'
};

const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '6px',
    color: 'white',
    fontSize: '14px',
    outline: 'none'
};

export default Instructors;
