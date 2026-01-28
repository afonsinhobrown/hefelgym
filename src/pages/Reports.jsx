import React, { useState } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Users,
    DollarSign,
    PieChart as PieChartIcon,
    BarChart as BarChartIcon,
    Calendar,
    AlertTriangle,
    DownloadCloud,
    RefreshCw,
    FileText,
    Share2
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell
} from 'recharts';
import FullFinancialReportTemplate from '../components/Reports/FullFinancialReportTemplate';

const Reports = () => {
    const [period, setPeriod] = useState('Este Mês');
    const [isPrinting, setIsPrinting] = useState(false);

    // Mock data based on local stats
    const data = {
        summary: {
            totalRevenue: 345000,
            pendingAmount: 12500,
            activeMembers: 245,
            activeInstructors: 8,
            topProduct: 'Água 500ml',
            growth: '+12%'
        },
        invoices: [] // Will be populated from DB in real usage
    };

    const monthlyData = [
        { name: 'Jan', receita: 45000, despesa: 12000 },
        { name: 'Fev', receita: 52000, despesa: 15000 },
        { name: 'Mar', receita: 48000, despesa: 18000 },
        { name: 'Abr', receita: 61000, despesa: 20000 },
        { name: 'Mai', receita: 55000, despesa: 22000 },
        { name: 'Jun', receita: 67000, despesa: 18000 },
    ];

    const paymentMethodsData = [
        { name: 'M-Pesa', value: 65, color: '#ef4444' },
        { name: 'e-Mola', value: 20, color: '#f97316' },
        { name: 'POS/Visa', value: 15, color: '#3b82f6' },
    ];

    const getDebtors = () => {
        return data.invoices.filter(i => i.status === 'pendente' || i.status === 'atrasado');
    };

    const generateReport = async (sendWhatsApp = false) => {
        setIsPrinting(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const element = document.getElementById('full-financial-report-export');
            if (!element) throw new Error("Template container not found");
            const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            if (sendWhatsApp) {
                const phoneNumber = window.prompt("Enviar relatório analítico para qual número?", "840000000");
                if (!phoneNumber) return;
                const pdfBase64 = pdf.output('datauristring').split(',')[1];
                await fetch('http://localhost:3001/api/whatsapp/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: phoneNumber,
                        message: `*RELATÓRIO FINANCEIRO ANALÍTICO - HEFEL GYM*\nPeríodo: ${period}\n\nSegue o relatório completo em PDF.`,
                        pdfBase64: pdfBase64
                    })
                });
                alert("✅ Relatório Analítico enviado com sucesso!");
            } else {
                pdf.save(`Relatorio_Analitico_HefelGym_${new Date().toLocaleDateString()}.pdf`);
                alert("Relatório Analítico Completo gerado com sucesso!");
            }
        } catch (e) {
            alert("Erro ao processo relatório: " + e.message);
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <div className="reports-page animate-fade-in">
            <div className="page-header">
                <div className="header-title">
                    <h2>Relatórios Financeiros</h2>
                    <p>Análise detalhada de receitas e performance</p>
                </div>
                <div className="filters-right flex items-center gap-3">
                    <button className="btn btn-outline flex items-center gap-2" onClick={() => generateReport(true)} disabled={isPrinting} style={{ borderColor: '#25d366', color: '#25d366' }}>
                        <Share2 size={18} /> WhatsApp
                    </button>
                    <button className="btn btn-primary" onClick={() => generateReport(false)} disabled={isPrinting}>
                        {isPrinting ? <RefreshCw size={18} className="animate-spin" /> : <DownloadCloud size={18} className="mr-2" />}
                        {isPrinting ? 'Gerando...' : 'Relatório PDF'}
                    </button>
                    <select className="input" value={period} onChange={e => setPeriod(e.target.value)}>
                        <option>Este Mês</option>
                        <option>Último Trimestre</option>
                        <option>Este Ano</option>
                    </select>
                </div>
            </div>

            <div className="stats-grid">
                <div className="card stat-card border-green">
                    <div className="stat-icon"><DollarSign size={24} /></div>
                    <div className="stat-info">
                        <label>Receita Total</label>
                        <h3>{data.summary.totalRevenue.toLocaleString()} MT</h3>
                        <span className="trend positive"><TrendingUp size={14} /> {data.summary.growth} este mês</span>
                    </div>
                </div>
                <div className="card stat-card border-orange">
                    <div className="stat-icon"><AlertTriangle size={24} /></div>
                    <div className="stat-info">
                        <label>Dívida em Aberto</label>
                        <h3>{data.summary.pendingAmount.toLocaleString()} MT</h3>
                        <span className="trend negative"><TrendingDown size={14} /> Requer Atenção</span>
                    </div>
                </div>
                <div className="card stat-card border-blue">
                    <div className="stat-icon"><Users size={24} /></div>
                    <div className="stat-info">
                        <label>Utentes Ativos</label>
                        <h3>{data.summary.activeMembers}</h3>
                        <span className="trend positive"><TrendingUp size={14} /> +8 novos</span>
                    </div>
                </div>
                <div className="card stat-card border-purple">
                    <div className="stat-icon"><BarChartIcon size={24} /></div>
                    <div className="stat-info">
                        <label>Top Produto</label>
                        <h3>{data.summary.topProduct}</h3>
                        <span className="trend positive">Mais Vendido</span>
                    </div>
                </div>
            </div>

            <div className="charts-container grid grid-cols-2 gap-6 mb-6">
                <div className="card p-6">
                    <div className="card-header mb-6">
                        <h4>Fluxo de Caixa (Receita vs Despesa)</h4>
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" />
                                <YAxis stroke="var(--text-muted)" />
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                                <Area type="monotone" dataKey="receita" stroke="var(--primary)" fillOpacity={1} fill="url(#colorRec)" />
                                <Area type="monotone" dataKey="despesa" stroke="#ef4444" fillOpacity={0} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card p-6">
                    <div className="card-header mb-6">
                        <h4>Métodos de Pagamento Preferred</h4>
                    </div>
                    <div style={{ height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={paymentMethodsData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {paymentMethodsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Container invisível para exportação do Relatório Completo */}
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                <div id="full-financial-report-export">
                    <FullFinancialReportTemplate
                        summary={data.summary}
                        period={period}
                        chartsData={monthlyData}
                        invoices={data.invoices}
                    />
                </div>
            </div>

            <style>{`
                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
                .stat-card { padding: 1.5rem; display: flex; align-items: center; gap: 1rem; border-left: 4px solid var(--primary); }
                .stat-card.border-green { border-left-color: #10b981; }
                .stat-card.border-orange { border-left-color: #f59e0b; }
                .stat-card.border-blue { border-left-color: #3b82f6; }
                .stat-card.border-purple { border-left-color: #8b5cf6; }
                
                .stat-icon { width: 48px; height: 48px; background: rgba(255,255,255,0.05); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--primary); }
                .stat-info label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; }
                .stat-info h3 { font-size: 1.5rem; font-weight: 800; margin: 0.2rem 0; }
                .trend { font-size: 0.75rem; display: flex; align-items: center; gap: 0.2rem; }
                .trend.positive { color: #10b981; }
                .trend.negative { color: #ef4444; }
                
                .grid { display: grid; }
                .grid-cols-2 { grid-template-columns: 1fr 1fr; }
                .gap-6 { gap: 1.5rem; }
                .mb-6 { margin-bottom: 1.5rem; }
            `}</style>
        </div>
    );
};

export default Reports;
