import React, { useRef, useState } from 'react';
import {
  Printer,
  Phone,
  Download,
  X,
  FileText,
  ScrollText,
  Share2
} from 'lucide-react';
import { db } from '../../services/db';
import html2pdf from 'html2pdf.js';
import { QRCodeSVG } from 'qrcode.react';

const InvoiceTemplate = ({ invoice, onClose, isThermal = false, isPrintMode = false, onSendToBot = null }) => {
  // Safe fetch of company data with complete fallback
  // Safe fetch of company data with complete fallback
  // Safe fetch of company data (Fixed: read directly from localStorage to avoid db.company undefined error)
  const rawCompany = JSON.parse(localStorage.getItem('hefel_company_v3') || '{}');

  const companyData = {
    name: rawCompany.name || 'Hefel Gym',
    nuit: rawCompany.nuit || 'N/A',
    address: rawCompany.address || '',
    email: rawCompany.email || '',
    phones: rawCompany.contacts ? rawCompany.contacts.map(c => c.value) : [],
    logo: rawCompany.logo || null,
    // Converte array de payments do Settings para objeto simples se necessário, ou usa direto
    paymentMethods: {
      mpesa: rawCompany.payments?.find(p => p.name === 'M-Pesa')?.value,
      emola: rawCompany.payments?.find(p => p.name === 'e-Mola')?.value,
      bci: { account: rawCompany.payments?.find(p => p.name === 'BCI' || p.name === 'Millennium BIM')?.value }
    }
  };

  const invoiceRef = useRef();
  // LÓGICA CORRIGIDA: Se é POS (isThermal), usa thermal. Se é Faturas (!isThermal), usa sempre A4 por defeito, mesmo se pago.
  const [format, setFormat] = useState(isThermal ? 'thermal' : 'a4');

  // Se for modo de impressão (oculto), não mostramos overlay nem botões
  const isSilentMode = isThermal || isPrintMode;


  const generatePDF = () => {
    const element = invoiceRef.current;

    const opt = format === 'a4' ? {
      margin: [5, 5, 5, 5],
      filename: `Fatura_${invoice.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    } : {
      margin: [0, 0, 0, 0],
      filename: `Recibo_${invoice.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, scrollY: 0 },
      jsPDF: { unit: 'mm', format: [80, 200], orientation: 'portrait' } // 80mm width for thermal
    };

    html2pdf().set(opt).from(element).save();
  };

  /* Helper para obter numero seguro */
  const getSafeNumber = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    // Remove 'MT', 'MTn', espaços e troca virgula por ponto
    const str = String(val).replace(/[^0-9.,-]/g, '').replace(',', '.');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  const calculateSubtotal = () => {
    return (invoice.items || []).reduce((acc, item) => {
      const qty = getSafeNumber(item.quantity) || getSafeNumber(item.qty) || 1;
      const finalQty = qty === 0 && (item.quantity === undefined || item.quantity === null) ? 1 : qty;
      const price = getSafeNumber(item.price);
      const discount = getSafeNumber(item.discount);
      return acc + (finalQty * price) - discount;
    }, 0);
  };

  // ... inside render loop for A4 ...
  const renderA4Items = () => {
    return (invoice.items || []).map((item, index) => {
      const qty = getSafeNumber(item.quantity) || getSafeNumber(item.qty) || 1;
      const price = getSafeNumber(item.price);
      const total = (qty * price) - getSafeNumber(item.discount);

      return (
        <tr key={item.id || index}>
          <td>{index + 1}</td>
          <td>{item.description || item.name || 'Item Diverso'}</td>
          <td className="text-right">{qty}</td>
          <td className="text-right">{formatCurrency(price)}</td>
          <td className="text-right">{formatCurrency(total)}</td>
        </tr>
      );
    });
  };

  const calculateIVA = () => {
    // Ler taxa configurada (default 3% conforme pedido)
    const rate = rawCompany.ivaRate !== undefined ? Number(rawCompany.ivaRate) : 3;
    return calculateSubtotal() * (rate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateIVA();
  };

  const handleWhatsApp = async () => {
    // Se o pai (Invoices.jsx) fornecer um handler (como o setPrintingInvoice que dispara o useEffect) usamos ele
    if (onSendToBot) {
      onSendToBot(format); // Formato é A4 ou Thermal
      return;
    }

    // Caso contrário (uso individual), usamos a API do Bot diretamente
    const phoneNumber = invoice.client?.phone ? invoice.client.phone.replace(/[^0-9]/g, '') : '';
    if (!phoneNumber) return alert("Cliente sem telefone registado.");

    try {
      const btn = document.activeElement;
      const originalHTML = btn.innerHTML;
      btn.innerHTML = "Enviando...";
      btn.disabled = true;

      // Usar a mesma técnica de geração de base64 que o ClientProcessTemplate
      const element = invoiceRef.current;
      const opt = {
        margin: [5, 5, 5, 5],
        filename: `Doc_${invoice.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, scrollY: 0 },
        jsPDF: { unit: 'mm', format: format === 'a4' ? 'a4' : [80, 200] }
      };

      const pdfWorker = html2pdf().set(opt).from(element);
      const pdfBase64 = await pdfWorker.output('datauristring');

      const message = `Caro utente *${invoice.client?.name || ''}*, segue em anexo o seu documento *#${invoice.id}* do ginásio *${companyData.name}*.\n\nTotal: *${calculateTotal().toLocaleString()} MT*\nEstado: *${invoice.status.toUpperCase()}*`;

      await fetch('http://localhost:3001/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phoneNumber,
          message: message,
          pdfBase64: pdfBase64.split(',')[1]
        })
      });

      btn.innerHTML = originalHTML;
      btn.disabled = false;
      alert("✅ Documento enviado com sucesso pelo WhatsApp!");
    } catch (e) {
      console.error(e);
      alert("Erro ao enviar: " + e.message);
    }
  };

  const formatCurrency = (val) => {
    return val.toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });
  };

  return (
    <div className={isSilentMode ? "print-wrapper" : "invoice-overlay"}>
      {!isSilentMode && (
        <div className="invoice-actions no-print">
          <button className="btn btn-secondary" onClick={onClose}>
            <X size={18} /> Fechar
          </button>

          <div className="format-toggles">
            <button className={`btn ${format === 'a4' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFormat('a4')}>
              <FileText size={18} /> A4 (Fatura)
            </button>
            <button className={`btn ${format === 'thermal' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setFormat('thermal')}>
              <ScrollText size={18} /> Térmico (Recibo)
            </button>
          </div>

          <div className="action-group">
            <button className="btn btn-primary" onClick={handleWhatsApp} style={{ background: '#25d366', borderColor: '#25d366' }}>
              <Share2 size={18} /> Enviar WhatsApp
            </button>
            <button className="btn btn-secondary" onClick={generatePDF}>
              <Download size={18} /> Baixar PDF
            </button>
          </div>
        </div>
      )}

      {/* DYNAMIC CONTAINER BASED ON FORMAT */}
      <div className={`invoice-container ${format}`} id="invoice-content" ref={invoiceRef}>

        {/* === THERMAL RECEIPT LAYOUT === */}
        {format === 'thermal' ? (
          <div className="thermal-layout">
            <div className="thermal-header text-center">
              {companyData.logo && <img src={companyData.logo} alt="Logo" className="thermal-logo" />}
              <h2 className="font-bold print-black">{companyData.name.toUpperCase()}</h2>
              <p>{companyData.address}</p>
              <p>Tel: {companyData.phones?.[0]}</p>
              <p>NUIT: {companyData.nuit}</p>
              <div className="divider-dashed"></div>
              <h3>{invoice.status === 'pago' ? 'RECIBO DE PAGAMENTO' : 'FATURA (PENDENTE)'}</h3>
              <p>{invoice.date} {new Date().toLocaleTimeString().slice(0, 5)}</p>
              <div className="divider-dashed"></div>
              {invoice.status === 'anulada' && (
                <div style={{ border: '1px dashed black', padding: '5px', margin: '5px 0', textAlign: 'center', fontWeight: 'bold' }}>
                  *** ANULADA ***
                  {invoice.void_reason && <div style={{ fontWeight: 'normal', fontSize: '0.8em' }}>{invoice.void_reason}</div>}
                </div>
              )}
            </div>

            <div className="thermal-client">
              <p><strong>Cliente:</strong> {invoice.client?.name || 'Consumidor Final'}</p>
              {invoice.client?.nuit && <p>NUIT: {invoice.client.nuit}</p>}
            </div>

            <table className="thermal-table">
              <tbody>
                {invoice.items?.map((item, idx) => {
                  const qty = getSafeNumber(item.quantity) || getSafeNumber(item.qty) || 1;
                  const price = getSafeNumber(item.price);
                  const total = (qty * price);
                  return (
                    <tr key={idx}>
                      <td>{qty}x {item.description || item.name || 'Item'}</td>
                      <td className="text-right">{formatCurrency(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="divider-solid"></div>

            <div className="thermal-totals">
              <div className="row"><span>Subtotal:</span> <span>{formatCurrency(calculateSubtotal())}</span></div>
              <div className="row"><span>IVA:</span> <span>{formatCurrency(calculateIVA())}</span></div>
              <div className="row big"><span>TOTAL:</span> <span>{formatCurrency(calculateTotal())}</span></div>
            </div>

            <div className="divider-solid"></div>

            <div className="thermal-pay-info">
              <p>Forma de Pagamento:</p>
              <p><strong>{invoice.paymentData?.method || 'Numerário/POS'}</strong></p>
              <p>Ref: {invoice.paymentData?.ref || '-'}</p>
            </div>

            <div className="thermal-footer text-center">
              <div className="qr-code-container">
                <QRCodeSVG value={`REC:${invoice.id}|TOT:${calculateTotal()}`} size={96} />
              </div>
              <p>Obrigado pela preferência!</p>
              <p className="tiny-text">Processado por Hefel Gym System</p>
            </div>
          </div>
        ) : (
          /* === A4 INVOICE LAYOUT === */
          <div className="a4-layout">
            {/* Header */}
            <header className="invoice-header">
              <div className="company-branding">
                {companyData.logo ? (
                  <img src={companyData.logo} alt={companyData.name} className="invoice-logo" />
                ) : (
                  <img src="/logo.png" alt="Hefel Gym" className="invoice-logo" />
                )}
                <div className="company-details">
                  <h1>{(companyData.name || 'HEFEL GYM').toUpperCase()}</h1>
                  <p>NUIT: {companyData.nuit}</p>
                  <p>{companyData.address}</p>
                  <p>{companyData.email}</p>
                  <p>Telefone: {companyData.phones?.[0]}</p>
                </div>
              </div>

              <div className="invoice-info">
                <h2>{invoice.status === 'pago' ? 'RECIBO' : 'FATURA COMERCIAL'}</h2>
                <div className="info-grid">
                  <div className="info-row">
                    <span className="label">Nº:</span>
                    <span className="value ft-number">{invoice.id}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Data:</span>
                    <span className="value">{invoice.date}</span>
                  </div>
                </div>
                <div className="qr-code-a4">
                  <QRCodeSVG value={`DOC:${invoice.id}|${invoice.date}|${calculateTotal()}`} size={80} />
                </div>
              </div>
            </header>

            {invoice.status === 'anulada' && (
              <div style={{ border: '2px solid #ef4444', backgroundColor: '#fef2f2', color: '#b91c1c', padding: '10px', margin: '0 0 20px 0', textAlign: 'center', fontWeight: 'bold', borderRadius: '4px' }}>
                FATURA ANULADA
                {invoice.void_reason && <div style={{ fontSize: '0.9em', marginTop: '5px', fontWeight: 'normal' }}>Motivo: {invoice.void_reason}</div>}
              </div>
            )}

            {/* Client Info */}
            <section className="client-section">
              <h3>DADOS DO CLIENTE:</h3>
              <div className="client-details">
                <p><strong>Nome:</strong> {invoice.client?.name || 'Consumidor Final'}</p>
                <p><strong>Telefone:</strong> {invoice.client?.phone || 'N/A'}</p>
                <p><strong>NUIT:</strong> {invoice.client?.nuit || '________________'}</p>
              </div>
            </section>

            {/* Items Table */}
            <section className="items-section">
              <table className="items-table">
                <thead>
                  <tr>
                    <th style={{ width: '5%' }}>#</th>
                    <th style={{ width: '55%' }}>Descrição</th>
                    <th className="text-right" style={{ width: '10%' }}>Qtd</th>
                    <th className="text-right" style={{ width: '15%' }}>Preço</th>
                    <th className="text-right" style={{ width: '15%' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items && invoice.items.length > 0 ? renderA4Items() : (
                    <tr><td colSpan="5">Sem itens</td></tr>
                  )}
                </tbody>
              </table>
            </section>

            {/* Footer Grid */}
            <section className="summary-section">
              <div className="payment-info">
                <h4>Dados Bancários para Pagamento</h4>
                <p>M-Pesa: {companyData.paymentMethods?.mpesa}</p>
                <p>e-Mola: {companyData.paymentMethods?.emola}</p>
                <p>BCI: {companyData.paymentMethods?.bci?.account}</p>
              </div>

              <div className="total-box-container">
                <div className="total-box">
                  <div className="summary-row"><span>Subtotal:</span> <span>{formatCurrency(calculateSubtotal())}</span></div>
                  <div className="summary-row">
                    <span>IVA ({rawCompany.ivaRate !== undefined ? rawCompany.ivaRate : 3}%):</span>
                    <span>{formatCurrency(calculateIVA())}</span>
                  </div>
                  <div className="summary-row total"><span>TOTAL:</span> <span>{formatCurrency(calculateTotal())}</span></div>
                </div>
              </div>
            </section>

            <div className="footer-legal">
              <p>Processado por computador. Válido sem assinatura.</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .invoice-overlay {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          background-color: rgba(15, 23, 42, 0.95); z-index: 1000;
          overflow-y: auto; 
          display: block; /* Mudar de flex para block para scroll mais previsivel */
          padding: 2rem 1rem;
        }
        .invoice-actions {
          width: 100%; max-width: 210mm; 
          display: flex; flex-wrap: wrap; gap: 10px; justify-content: space-between; align-items: center; 
          margin: 0 auto 2rem auto; /* Centrado horizontalmente */
          background: rgba(0,0,0,0.5); padding: 10px; border-radius: 8px;
        }
        .invoice-container {
            margin: 0 auto 15rem auto; /* Margem gorda em baixo */
        }.format-toggles { display: flex; gap: 0.5rem; background: rgba(255,255,255,0.1); padding: 4px; border-radius: 8px; }
        .action-group { display: flex; gap: 1rem; }
        
        /* === A4 STYLES === */
        .invoice-container.a4 {
          background-color: white; color: #1e293b;
          width: 210mm; min-height: 297mm;
          padding: 15mm 20mm; /* Increased margins to prevent cut-off */
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          font-family: 'Arial', sans-serif; font-size: 10pt;
          box-sizing: border-box;
        }
        .a4-layout .invoice-header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 5mm; margin-bottom: 5mm; }
        .a4-layout .company-branding { width: 60%; }
        .a4-layout .invoice-logo { max-width: 40mm; max-height: 25mm; object-fit: contain; }
        .a4-layout .invoice-info { width: 35%; text-align: right; }
        .a4-layout .items-table { width: 100%; border-collapse: collapse; margin-bottom: 10mm; }
        .a4-layout .items-table th { background: #f1f5f9; text-align: left; padding: 2mm; border-bottom: 1px solid #000; }
        .a4-layout .items-table td { padding: 2mm; border-bottom: 1px solid #e2e8f0; }
        .a4-layout .summary-section { display: flex; justify-content: space-between; }
        .a4-layout .total-box { border: 2px solid #000; padding: 5mm; min-width: 200px; }
        .a4-layout .summary-row { display: flex; justify-content: space-between; margin-bottom: 2mm; }
        .a4-layout .summary-row.total { font-weight: 800; font-size: 12pt; border-top: 1px solid #000; margin-top: 2mm; padding-top: 2mm; }
        .a4-layout .qr-code-a4 { margin-top: 10px; display: flex; justify-content: flex-end; }

        /* === THERMAL STYLES === */
        .invoice-container.thermal {
          background-color: white; color: #000;
          width: 80mm; min-height: 150mm; /* Auto height really */
          padding: 5mm;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
          font-family: 'Courier New', monospace; font-size: 9pt;
          box-sizing: border-box;
        }
        .invoice-container.thermal h1, 
        .invoice-container.thermal h2, 
        .invoice-container.thermal h3, 
        .invoice-container.thermal h4, 
        .invoice-container.thermal p, 
        .invoice-container.thermal span,
        .invoice-container.thermal div {
             color: #000000 !important; /* FORÇAR PRETO ABSOLUTO */
        }
        .thermal-header { margin-bottom: 5mm; }
        .thermal-logo { max-width: 40mm; margin: 0 auto 2mm auto; display: block; filter: grayscale(100%); }
        .divider-dashed { border-top: 1px dashed #000; margin: 2mm 0; }
        .divider-solid { border-top: 1px solid #000; margin: 2mm 0; }
        .thermal-table { width: 100%; margin: 2mm 0; }
        .thermal-table td { vertical-align: top; padding: 1mm 0; }
        .thermal-totals .row { display: flex; justify-content: space-between; margin-bottom: 1mm; }
        .thermal-totals .big { font-weight: 800; font-size: 11pt; }
        .thermal-footer { margin-top: 5mm; text-align: center; }
        .qr-code-container { margin: 3mm auto; display: flex; justify-content: center; }
        .tiny-text { font-size: 7pt; margin-top: 2mm; color: #555; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        
        /* Force black for printing thermal */
        .print-black { color: #000 !important; -webkit-print-color-adjust: exact; }
      `}</style>
    </div>
  );
};

export default InvoiceTemplate;
