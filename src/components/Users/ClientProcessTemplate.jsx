import React, { useRef } from 'react';
import {
    Printer,
    Phone,
    Download,
    X,
    FileText,
    Share2
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { QRCodeSVG } from 'qrcode.react';

const ClientProcessTemplate = ({ user, subscriptionInvoices, otherInvoices, debtSummary, onClose }) => {
    const processRef = useRef();

    // Fetch company data
    const rawCompany = JSON.parse(localStorage.getItem('hefel_company_v3') || '{}');
    const companyData = {
        name: rawCompany.name || 'Hefel Gym',
        nuit: rawCompany.nuit || 'N/A',
        address: rawCompany.address || '',
        email: rawCompany.email || '',
        phones: rawCompany.contacts ? rawCompany.contacts.map(c => c.value) : [],
        logo: rawCompany.logo || null
    };

    const generatePDF = () => {
        const element = processRef.current;
        const opt = {
            margin: [10, 10, 10, 10],
            filename: `Processo_${user.name.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, scrollY: 0 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    const handleWhatsApp = async () => {
        const choice = window.prompt(
            `Para quem deseja enviar o processo via WhatsApp Automático?\n\n` +
            `1. Número do Cliente (${user.phone || 'N/A'})\n` +
            `2. Outro Número (digite o número completo)\n\n`,
            "1"
        );

        if (!choice) return;

        let phoneNumber = "";
        if (choice === "1") {
            phoneNumber = user.phone ? user.phone.replace(/[^0-9]/g, '') : '';
            if (!phoneNumber) return alert("Cliente sem telefone!");
        } else {
            phoneNumber = choice.replace(/[^0-9]/g, '');
        }

        try {
            const element = processRef.current;
            const opt = {
                margin: [10, 10, 10, 10],
                filename: `Processo_${user.name.replace(/\s+/g, '_')}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, scrollY: 0 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            // Mostrar feedback de processamento
            const btn = document.activeElement;
            const originalText = btn.innerHTML;
            btn.innerHTML = "A gerar PDF...";
            btn.disabled = true;

            const pdfWorker = html2pdf().set(opt).from(element);
            const pdfBase64 = await pdfWorker.output('datauristring');

            const message = `Caro utente *${user.name}*, segue em anexo o seu *PROCESSO DO CLIENTE* atualizado.\n\nGinásio: *${companyData.name}*\nEstado Atual: *${user.status === 'active' ? 'ATIVO' : 'BLOQUEADO'}*\nSaldo em Dívida: *${debtSummary.total.toLocaleString()} MT*`;

            await fetch('http://localhost:3001/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: phoneNumber,
                    message: message,
                    pdfBase64: pdfBase64.split(',')[1]
                })
            });

            btn.innerHTML = originalText;
            btn.disabled = false;
            alert("✅ Processo enviado com sucesso para o WhatsApp!");
        } catch (e) {
            console.error(e);
            alert("Erro ao enviar: " + e.message);
        }
    };

    return (
        <div className="process-overlay">
            <div className="process-actions no-print">
                <button className="btn btn-secondary" onClick={onClose}>
                    <X size={18} /> Fechar
                </button>
                <div className="action-group">
                    <button className="btn btn-primary" onClick={handleWhatsApp} style={{ background: '#25d366', borderColor: '#25d366' }}>
                        <Share2 size={18} /> WhatsApp Automático
                    </button>
                    <button className="btn btn-secondary" onClick={generatePDF}>
                        <Download size={18} /> Baixar PDF
                    </button>
                    <button className="btn btn-secondary" onClick={() => window.print()}>
                        <Printer size={18} /> Imprimir
                    </button>
                </div>
            </div>

            <div className="process-a4-container" ref={processRef}>
                <header className="process-header">
                    <div className="company-logo-section">
                        {companyData.logo ? (
                            <img src={companyData.logo} alt="Logo" className="process-logo" />
                        ) : (
                            <div className="placeholder-logo">HG</div>
                        )}
                        <div className="company-info">
                            <h1>{companyData.name.toUpperCase()}</h1>
                            <p>NUIT: {companyData.nuit}</p>
                            <p>{companyData.address}</p>
                            <p>{companyData.phones?.[0]} | {companyData.email}</p>
                        </div>
                    </div>
                    <div className="title-section">
                        <h2 className="doc-title">PROCESSO DO CLIENTE</h2>
                        <p className="doc-date">Data: {new Date().toLocaleDateString()}</p>
                    </div>
                </header>

                <section className="process-section">
                    <h3>1. DADOS DE IDENTIFICAÇÃO</h3>
                    <div className="data-grid">
                        <div className="data-item"><label>Nome Full:</label> <span>{user.name}</span></div>
                        <div className="data-item"><label>ID Cliente:</label> <span>{user.id}</span></div>
                        <div className="data-item"><label>BI / NUIT:</label> <span>{user.nuit || '---'}</span></div>
                        <div className="data-item"><label>Telefone:</label> <span>{user.phone || '---'}</span></div>
                        <div className="data-item"><label>Email:</label> <span>{user.email || '---'}</span></div>
                        <div className="data-item"><label>Endereço:</label> <span>{user.address || '---'}</span></div>
                        <div className="data-item"><label>Data Inscrição:</label> <span>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '---'}</span></div>
                        <div className="data-item"><label>Plano Atual:</label> <span>{user.plan?.name || '---'}</span></div>
                        <div className="data-item"><label>Estado Atual:</label> <span className={user.status}>{user.status === 'active' ? 'ATIVO' : 'BLOQUEADO'}</span></div>
                    </div>
                </section>

                <section className="process-section">
                    <h3>2. SITUAÇÃO FINANCEIRA</h3>
                    <div className="debt-summary-box">
                        <div className="summary-col">
                            <label>Dívida Mensalidades:</label>
                            <span className={debtSummary.sub > 0 ? 'debt' : ''}>{debtSummary.sub.toLocaleString()} MT</span>
                        </div>
                        <div className="summary-col">
                            <label>Outras Dívidas:</label>
                            <span className={debtSummary.other > 0 ? 'debt' : ''}>{debtSummary.other.toLocaleString()} MT</span>
                        </div>
                        <div className="summary-col total">
                            <label>TOTAL EM ABERTO:</label>
                            <span className={debtSummary.total > 0 ? 'debt' : ''}>{debtSummary.total.toLocaleString()} MT</span>
                        </div>
                    </div>
                </section>

                <section className="process-section">
                    <h3>3. HISTORIAL DE MENSALIDADES</h3>
                    <table className="process-table">
                        <thead>
                            <tr>
                                <th>Nº FATURA</th>
                                <th>DATA</th>
                                <th>VALOR</th>
                                <th>ESTADO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscriptionInvoices.length > 0 ? subscriptionInvoices.map((inv, idx) => (
                                <tr key={idx}>
                                    <td>{inv.id}</td>
                                    <td>{new Date(inv.date).toLocaleDateString()}</td>
                                    <td>{Number(inv.amount || 0).toLocaleString()} MT</td>
                                    <td>{inv.status.toUpperCase()}</td>
                                </tr>
                            )) : <tr><td colSpan="4" className="text-center">Sem registos</td></tr>}
                        </tbody>
                    </table>
                </section>

                <section className="process-section">
                    <h3>4. OUTRAS DESPESAS / CONSUMO</h3>
                    <table className="process-table">
                        <thead>
                            <tr>
                                <th>Nº FATURA</th>
                                <th>DATA</th>
                                <th>ITENS</th>
                                <th>TOTAL</th>
                                <th>ESTADO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {otherInvoices.length > 0 ? otherInvoices.map((inv, idx) => (
                                <tr key={idx}>
                                    <td>{inv.id}</td>
                                    <td>{new Date(inv.date).toLocaleDateString()}</td>
                                    <td className="it-desc">{inv.items?.map(it => `${it.name} (x${it.quantity || 1})`).join(', ') || 'Venda'}</td>
                                    <td>{Number(inv.amount || 0).toLocaleString()} MT</td>
                                    <td>{inv.status.toUpperCase()}</td>
                                </tr>
                            )) : <tr><td colSpan="5" className="text-center">Sem registos</td></tr>}
                        </tbody>
                    </table>
                </section>

                <footer className="process-footer">
                    <div className="footer-cols">
                        <div className="qr-box">
                            <QRCodeSVG value={`PROCESS:${user.id}|DEBT:${debtSummary.total}`} size={60} />
                        </div>
                        <div className="legal-box">
                            <p>Este documento é um resumo oficial do processo do utente.</p>
                            <p>Processado por Hefel Gym System em {new Date().toLocaleString()}</p>
                        </div>
                    </div>
                </footer>
            </div>

            <style>{`
        .process-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background: rgba(15, 23, 42, 0.98); z-index: 2000;
          overflow-y: auto; padding: 2rem 1rem;
        }
        .process-actions {
          width: 100%; max-width: 210mm; 
          margin: 0 auto 1.5rem auto;
          display: flex; justify-content: space-between; align-items: center;
          background: rgba(30, 41, 59, 0.6); padding: 12px; border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .action-group { display: flex; gap: 8px; }
        
        .process-a4-container {
          width: 210mm; min-height: 297mm; margin: 0 auto;
          background: white; color: #1e293b; padding: 15mm;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .process-header { border-bottom: 3px solid #1e293b; padding-bottom: 5mm; margin-bottom: 8mm; display: flex; justify-content: space-between; align-items: flex-end; }
        .company-logo-section { display: flex; gap: 15px; align-items: center; }
        .process-logo { max-width: 50mm; max-height: 25mm; object-fit: contain; }
        .placeholder-logo { width: 40px; height: 40px; background: #3b82f6; color: white; display: flex; align-items: center; justify-content: center; font-bold: 700; border-radius: 8px; }
        .company-info h1 { margin: 0; font-size: 1.5rem; color: #1e293b; letter-spacing: -0.5px; }
        .company-info p { margin: 2px 0; font-size: 0.8rem; color: #64748b; }
        
        .title-section { text-align: right; }
        .doc-title { margin: 0; font-size: 1.8rem; font-weight: 800; color: #1e293b; }
        .doc-date { color: #64748b; font-size: 0.9rem; }
        
        .process-section { margin-bottom: 8mm; }
        .process-section h3 { background: #f1f5f9; padding: 6px 12px; font-size: 0.9rem; color: #1e293b; border-left: 4px solid #1e293b; cursor: default; margin-bottom: 12px; }
        
        .data-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; padding: 0 10px; }
        .data-item { font-size: 0.9rem; border-bottom: 1px solid #f1f5f9; padding: 4px 0; }
        .data-item label { color: #64748b; font-weight: 600; margin-right: 8px; font-size: 0.75rem; text-transform: uppercase; }
        .data-item span { font-weight: 500; }
        .data-item span.active { color: #059669; font-weight: 700; }
        .data-item span.inactive { color: #dc2626; font-weight: 700; }
        
        .debt-summary-box { display: flex; justify-content: space-around; background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; }
        .summary-col { text-align: center; }
        .summary-col label { display: block; font-size: 0.7rem; color: #64748b; font-weight: 700; margin-bottom: 5px; }
        .summary-col span { font-size: 1.2rem; font-weight: 800; }
        .summary-col.total span { color: #1e293b; }
        .summary-col span.debt { color: #ef4444; }
        
        .process-table { width: 100%; border-collapse: collapse; font-size: 0.8rem; }
        .process-table th { text-align: left; padding: 8px; border-bottom: 2px solid #e2e8f0; color: #64748b; text-transform: uppercase; font-size: 0.7rem; }
        .process-table td { padding: 8px; border-bottom: 1px solid #f1f5f9; }
        .process-table .it-desc { max-width: 300px; color: #475569; font-style: italic; }
        
        .process-footer { margin-top: 15mm; padding-top: 5mm; border-top: 1px solid #e2e8f0; }
        .footer-cols { display: flex; align-items: center; gap: 20px; }
        .legal-box p { margin: 2px 0; font-size: 0.75rem; color: #94a3b8; }
        
        @media print {
          .process-overlay { position: relative; padding: 0; background: white; }
          .no-print { display: none !important; }
          .process-a4-container { box-shadow: none; margin: 0; padding: 10mm; }
        }
      `}</style>
        </div>
    );
};

export default ClientProcessTemplate;
