import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Eye,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Banknote,
  X,
  Send,
  Smartphone,
  Trash2,
  Ban,
  DownloadCloud,
  RefreshCw
} from 'lucide-react';
import BillingReportTemplate from '../components/Reports/BillingReportTemplate';
import { db } from '../services/db';
import { supabase } from '../services/supabase';
import InvoiceTemplate from '../components/Invoices/InvoiceTemplate';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Modal de Pagamento
const PaymentModal = ({ invoice, isOpen, onClose, onConfirm }) => {
  const [method, setMethod] = useState('mpesa');
  const [ref, setRef] = useState('');

  if (!isOpen || !invoice) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(invoice.id, method, ref);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h3>Registar Pagamento</h3>
          <button onClick={onClose} className="close-btn"><X size={20} /></button>
        </div>
        <div className="payment-summary mb-4 p-4 bg-muted rounded">
          <p className="text-sm text-muted">Fatura #{invoice.id}</p>
          <p className="text-xl font-bold">{(Number(invoice.amount) || Number(invoice.total) || 0).toLocaleString('pt-MZ')} MT</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group mb-4">
            <label className="block mb-2 text-sm text-muted">Método de Pagamento</label>
            <div className="payment-methods-grid">
              <button type="button" className={`method-btn ${method === 'mpesa' ? 'active' : ''}`} onClick={() => setMethod('mpesa')}>
                M-Pesa
              </button>
              <button type="button" className={`method-btn ${method === 'emola' ? 'active' : ''}`} onClick={() => setMethod('emola')}>
                e-Mola
              </button>
              <button type="button" className={`method-btn ${method === 'pos' ? 'active' : ''}`} onClick={() => setMethod('pos')}>
                POS / Cartão
              </button>
              <button type="button" className={`method-btn ${method === 'cash' ? 'active' : ''}`} onClick={() => setMethod('cash')}>
                Numerário
              </button>
            </div>
          </div>
          <div className="form-group mb-4">
            <label className="block mb-2 text-sm text-muted">Referência / Nº Talão</label>
            <input required type="text" className="input w-full" placeholder="Ex: 8JSH293..." value={ref} onChange={e => setRef(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary w-full">Confirmar Pagamento</button>
        </form>
      </div>
      <style>{`
        .mb-4 { margin-bottom: 1rem; }
        .p-4 { padding: 1rem; }
        .bg-muted { background: var(--bg-card-hover); }
        .rounded { border-radius: var(--radius); }
        .text-xl { font-size: 1.5rem; }
        .w-full { width: 100%; }
        .payment-methods-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
        .method-btn {
          padding: 0.75rem; border: 1px solid var(--border); background: transparent; color: var(--text-muted);
          border-radius: var(--radius); cursor: pointer; transition: all 0.2s;
        }
        .method-btn:hover { border-color: var(--primary); color: var(--primary); }
        .method-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
      `}</style>
    </div>
  );
};

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState(''); // NEW SEARCH STATE
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [invoiceToPay, setInvoiceToPay] = useState(null);
  const [printingInvoice, setPrintingInvoice] = useState(null); // Para PDF oculto
  const [isPrintingReport, setIsPrintingReport] = useState(false);

  const loadData = async () => {
    await db.init();
    try {
      const invs = await db.invoices.getAll();
      // Parse items if it's a JSON string
      const parsed = (Array.isArray(invs) ? invs : []).map(inv => ({
        ...inv,
        items: typeof inv.items === 'string' ? (inv.items ? JSON.parse(inv.items) : []) : (inv.items || [])
      }));
      setInvoices(parsed);
    } catch (e) { console.error("Erro loading invoices", e); }
  };

  useEffect(() => { loadData(); }, []);

  const handlePayClick = (invoice) => {
    setInvoiceToPay(invoice);
    setPaymentModalOpen(true);
  };

  const processPayment = async (id, method, ref) => {
    try {
      await db.invoices.pay(id, method, ref);
      setPaymentModalOpen(false);
      await loadData();
      alert('Pagamento registado com sucesso!');
    } catch (e) { alert("Erro ao pagar: " + e.message); }
  };

  const handleVoid = async (invoice) => {
    if (!confirm(`ATENÇÃO: Deseja anular a fatura #${invoice.id}? Esta ação é irreversível e ficará registada.`)) return;

    const reason = prompt("Por favor, indique o motivo da anulação:");
    if (!reason) return alert("Motivo é obrigatório para auditoria.");

    try {
      // 1. Ação Cloud (ja é async no db.js)
      await db.invoices.void(invoice.id, reason);

      // 2. Auditoria Remota (Supabase)
      const session = JSON.parse(localStorage.getItem('gymar_session') || '{}');
      if (supabase) {
        await supabase.from('audit_logs').insert({
          action: 'INVOICE_VOIDED',
          user_email: session.email || 'unknown',
          entity: 'invoices',
          entity_id: invoice.id,
          details: { reason, amount: invoice.total, previous_status: invoice.status }
        });
      }

      await loadData();
      alert(`Fatura #${invoice.id} anulada.`);
    } catch (e) { alert("Erro ao anular: " + e.message); }
  };

  /* Lógica de envio com PDF (Método Robusto Clonagem) */
  useEffect(() => {
    if (printingInvoice) {
      const generatePDF = async () => {
        try {
          // Pequeno delay para garantir renderização DOM
          await new Promise(resolve => setTimeout(resolve, 800));

          const originalElement = document.getElementById('print-container');
          if (!originalElement) throw new Error("Elemento de impressão não encontrado");

          // TÉCNICA DE CLONAGEM PARA FORÇAR VISIBILIDADE
          // Garante que o html2canvas captura o conteúdo mesmo se o original estiver off-screen
          const clone = originalElement.cloneNode(true);
          clone.style.position = 'fixed';
          clone.style.top = '0';
          clone.style.left = '0';
          clone.style.zIndex = '99999';
          clone.style.background = 'white'; // Fundo branco explicitamente
          clone.style.width = printingInvoice.format === 'thermal' ? '80mm' : '210mm';
          clone.style.minHeight = printingInvoice.format === 'thermal' ? 'auto' : '297mm'; // Auto height para térmico evitar corte ou excesso
          clone.style.height = 'auto'; // Garantir que cresce com conteúdo

          clone.style.display = 'block';
          clone.style.visibility = 'visible';

          // CRITICO: Remover elementos 'no-print' do clone antes de capturar
          try {
            const noPrintElements = clone.querySelectorAll('.no-print');
            if (noPrintElements && noPrintElements.length > 0) {
              noPrintElements.forEach(el => el.remove());
            }
          } catch (e) { console.warn("Erro ao limpar elementos no-print", e); }

          document.body.appendChild(clone);

          const canvas = await html2canvas(clone, {
            scale: 2,
            logging: true,
            useCORS: true,
            backgroundColor: '#ffffff'
          });

          // Remover clone imediatamente após captura
          document.body.removeChild(clone);

          const imgData = canvas.toDataURL('image/png');

          // Calcular dimensões corretas Baseado no Canvas
          // Se for térmico, queremos manter a proporção e largura de 80mm
          const isThermal = printingInvoice.format === 'thermal';
          let pdf;
          let pdfWidth, pdfHeight;

          if (isThermal) {
            // Para térmico, definimos a largura fixa de 80mm e altura proporcional
            const mmWidth = 80;
            const mmHeight = (canvas.height * mmWidth) / canvas.width;
            // Criar PDF com tamanho 'custom' [largura, altura]
            pdf = new jsPDF('p', 'mm', [mmWidth, mmHeight + 10]); // +10mm margem
            pdfWidth = mmWidth;
            pdfHeight = mmHeight;
          } else {
            pdf = new jsPDF('p', 'mm', 'a4');
            pdfWidth = pdf.internal.pageSize.getWidth();
            pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          }

          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

          const pdfBase64 = pdf.output('datauristring');

          // DEBUG: Baixar automaticamente para prova
          pdf.save(`Fatura_${printingInvoice.id}.pdf`);

          // Enviar para o Bot
          await sendToBot(printingInvoice, pdfBase64);

        } catch (err) {
          console.error(err);
          alert("Erro ao gerar PDF: " + err.message);
        } finally {
          setPrintingInvoice(null); // Limpar
        }
      };
      generatePDF();
    }
  }, [printingInvoice]);

  const sendToBot = async (invoice, base64File) => {
    const totalMsg = (invoice.total || 0).toLocaleString('pt-MZ', { style: 'currency', currency: 'MZN' });
    const message = `*FATURA HEFEL GYM*

Olá Cliente *${invoice.client?.name || 'Estimado Cliente'}*,
Segue o resumo da sua fatura *#${invoice.id}*.

Valor Total: *${totalMsg}*
Vencimento: *${invoice.dueDate || invoice.date}*
Estado: *${(invoice.status || 'Pendente').toUpperCase()}*

Pagamento via:
M-Pesa: 84 123 4567
e-Mola: 87 123 4567
BCI: 1234567890123

Por favor, envie o comprovativo após pagamento.`;

    try {
      // 1. Enviar Texto
      await fetch('http://localhost:3001/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: invoice.client.phone, message })
      });

      // 2. Enviar PDF
      if (base64File) {
        await fetch('http://localhost:3001/send-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: invoice.client.phone,
            fileBase64: base64File,
            fileName: `Fatura_${invoice.id}.pdf`,
            caption: "Segue o PDF da fatura."
          })
        });
      }

      alert('Fatura e mensagem enviadas com sucesso!');
    } catch (e) {
      alert('Erro ao enviar: ' + e.message);
    }
  };

  const sendInvoiceWhatsApp = async (invoice, format = 'a4') => {
    if (!invoice.client?.phone) {
      try {
        const allClients = await db.clients.getAll();
        // Support both camelCase and snake_case IDs
        const idToSearch = invoice.clientId || invoice.client_id;
        const fullClient = Array.isArray(allClients) ? allClients.find(c => c.id === idToSearch) : null;

        if (!fullClient) return alert(`Cliente não encontrado na DB (ID: ${idToSearch || 'N/A'}).`);
        if (!fullClient.phone) return alert(`Cliente ${fullClient.name} encontrado, mas sem telefone registado na ficha.`);

        // Garantir que invoice.client existe para atribuir o telefone
        if (!invoice.client) invoice.client = { name: fullClient.name };
        invoice.client.phone = fullClient.phone;
      } catch (e) {
        console.error("Erro ao buscar cliente:", e);
        return alert("Erro ao buscar dados do cliente: " + e.message);
      }
    }

    if (confirm(`Gerar PDF (${format === 'thermal' ? 'Térmico' : 'A4'}) e enviar para ${invoice.client.phone}?`)) {
      setPrintingInvoice({ ...invoice, format });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pago': return <span className="status-badge paid"><CheckCircle size={14} /> Pago</span>;
      case 'pendente': return <span className="status-badge pending"><Clock size={14} /> Pendente</span>;
      case 'anulada': return <span className="status-badge cancelled" style={{ backgroundColor: 'var(--danger)', color: 'white' }}><Ban size={14} /> Anulada</span>;
      default: return <span className="status-badge overdue"><AlertCircle size={14} /> Atrasado</span>;
    }
  };

  const generateBillingReport = async (sendWhatsApp = false) => {
    setIsPrintingReport(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const element = document.getElementById('billing-report-export');
      if (!element) throw new Error("Template not found");

      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      if (sendWhatsApp) {
        const pdfBase64 = pdf.output('datauristring').split(',')[1];
        await fetch('http://localhost:3001/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: '840000000', // Default admin
            message: `*RELATÓRIO DE FATURAÇÃO HEFEL GYM*\nFiltros ativos: ${search || 'Nenhum'} | ${statusFilter}\nDe ${startDate || 'Início'} até ${endDate || 'Hoje'}`,
            pdfBase64: pdfBase64
          })
        });
        alert("Relatório enviado por WhatsApp!");
      } else {
        pdf.save(`Relatorio_Faturacao_${new Date().toLocaleDateString()}.pdf`);
      }
    } catch (e) {
      alert("Erro ao gerar relatório: " + e.message);
    } finally {
      setIsPrintingReport(false);
    }
  };

  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // ... (rest of methods)

  const filteredInvoices = invoices.filter(inv => {
    const term = search.toLowerCase();
    const searchMatch = (
      inv.id.toLowerCase().includes(term) ||
      (inv.client?.name || '').toLowerCase().includes(term) ||
      inv.status.toLowerCase().includes(term)
    );

    let statusMatch = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'pendente') statusMatch = inv.status === 'pendente';
      else if (statusFilter === 'pago') statusMatch = inv.status === 'pago';
      else if (statusFilter === 'anulada') statusMatch = inv.status === 'anulada';
    }

    let dateMatch = true;
    if (startDate) {
      dateMatch = new Date(inv.date) >= new Date(startDate);
    }
    if (endDate && dateMatch) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59);
      dateMatch = new Date(inv.date) <= end;
    }

    return searchMatch && statusMatch && dateMatch;
  });

  return (
    <div className="invoices-page animate-fade-in">
      <div className="page-header">
        <div className="header-title">
          <h2>Faturação</h2>
          <p>Gerir faturas e pagamentos</p>
        </div>
      </div>

      <div className="filters-bar card p-4 mb-4 grid grid-cols-4 gap-4 items-end">
        <div className="search-box col-span-2">
          <label className="text-xs text-muted mb-1 block">Pesquisa</label>
          <div className="flex items-center gap-2 bg-dark rounded px-2 border border-white/10">
            <Search size={18} className="text-muted" />
            <input
              type="text"
              placeholder="Fatura, Cliente..."
              className="bg-transparent border-none p-2 w-full text-sm focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-group">
          <label className="text-xs text-muted mb-1 block">Estado</label>
          <select
            className="bg-dark border border-white/10 rounded p-2 w-full text-sm"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="pago">Pagas</option>
            <option value="anulada">Anuladas</option>
          </select>
        </div>

        <div className="filter-group flex gap-2">
          <div>
            <label className="text-xs text-muted mb-1 block">De</label>
            <input type="date" className="bg-dark border border-white/10 rounded p-2 text-sm w-full" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Até</label>
            <input type="date" className="bg-dark border border-white/10 rounded p-2 text-sm w-full" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        <div className="report-actions flex gap-2">
          <button className="btn btn-primary text-xs flex items-center gap-1" onClick={() => generateBillingReport(false)} disabled={isPrintingReport}>
            {isPrintingReport ? <RefreshCw size={14} className="animate-spin" /> : <DownloadCloud size={14} />}
            Relatório PDF
          </button>
          <button className="btn btn-outline text-xs flex items-center gap-1" onClick={() => generateBillingReport(true)} disabled={isPrintingReport}>
            <Send size={14} />
            WhatsApp
          </button>
        </div>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Fatura Nº</th>
              <th>Cliente</th>
              <th>Descrição</th>
              <th>Data</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr><td colSpan="7" className="text-center p-8 text-muted">Sem registos encontrados.</td></tr>
            ) : filteredInvoices.map((inv) => (
              <tr key={inv.id}>
                <td className="font-mono">{inv.id}</td>
                <td className="font-bold">{inv.client_name || inv.client?.name || 'Consumidor Final'}</td>
                <td className="text-muted text-sm">
                  {inv.description || (inv.items && inv.items[0] ? (inv.items[0].description || inv.items[0].name) + (inv.items.length > 1 ? ` +${inv.items.length - 1}` : '') : 'Vários Itens')}
                </td>
                <td>{new Date(inv.date).toLocaleDateString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                <td className="font-bold">
                  {(Number(inv.amount) || Number(inv.total) || (inv.items || []).reduce((a, b) => a + ((Number(b.price) || 0) * (Number(b.qty) || Number(b.quantity) || 1)), 0)).toLocaleString('pt-MZ')} MT
                </td>
                <td>{getStatusBadge(inv.status)}</td>
                <td>
                  <div className="actions-cell">
                    {inv.status !== 'pago' && inv.status !== 'anulada' && (
                      <button className="btn-pay" onClick={() => handlePayClick(inv)}>
                        <CreditCard size={14} style={{ marginRight: '4px' }} /> Pagar
                      </button>
                    )}
                    <button className="icon-btn" onClick={() => sendInvoiceWhatsApp(inv)} title="Enviar por WhatsApp">
                      <Send size={18} className="text-success" />
                    </button>
                    <button className="icon-btn" onClick={() => setSelectedInvoice(inv)}>
                      <Eye size={18} />
                    </button>
                    {inv.status !== 'anulada' && (
                      <button className="icon-btn" onClick={() => handleVoid(inv)} title="Anular Fatura (Auditoria)" style={{ color: 'var(--danger)' }}>
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedInvoice && (
        <InvoiceTemplate
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onSendToBot={(format) => {
            setSelectedInvoice(null);
            sendInvoiceWhatsApp(selectedInvoice, format);
          }}
        />
      )}

      <PaymentModal
        isOpen={paymentModalOpen}
        invoice={invoiceToPay}
        onClose={() => setPaymentModalOpen(false)}
        onConfirm={processPayment}
      />

      <style>{`
        /* Reuse common styles */
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th { text-align: left; padding: 1rem; color: var(--text-muted); border-bottom: 1px solid var(--border); }
        .data-table td { padding: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
        
        .status-badge { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; border: 1px solid transparent; }
        .status-badge.paid { color: var(--success); background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.2); }
        .status-badge.pending { color: var(--warning); background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.2); }
        
        .btn-pay {
          background-color: var(--primary); color: white; border: none; padding: 0.4rem 0.8rem; border-radius: 4px;
          cursor: pointer; font-size: 0.8rem; font-weight: 600; display: flex; align-items: center;
          margin-right: 0.5rem;
        }
        .btn-pay:hover { opacity: 0.9; }
        .text-success { color: var(--success); }
        
        .actions-cell { display: flex; align-items: center; }
        
        /* Modal styles duplicated for ensuring independence if needed, usually global */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .modal-content { background: var(--bg-card); width: 100%; border-radius: var(--radius); padding: 1.5rem; border: 1px solid var(--border); }
        .modal-header { display: flex; justify-content: space-between; margin-bottom: 1rem; }
      `}</style>

      {/* Container invisível para gerar PDF */}
      {printingInvoice && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <div id="print-container" style={{ width: printingInvoice.format === 'thermal' ? '80mm' : '210mm', background: 'white', color: 'black', padding: '20px' }}>
            <InvoiceTemplate
              invoice={printingInvoice}
              onClose={() => { }}
              isPrintMode={true} // Oculta botões e overlays
              isThermal={printingInvoice.format === 'thermal'}
            />
          </div>
        </div>
      )}
      {/* Container invisível para gerar o Relatório */}
      {isPrintingReport && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
          <div id="billing-report-export">
            <BillingReportTemplate
              invoices={filteredInvoices}
              filters={{ search, startDate, endDate, status: statusFilter }}
              summary={{
                paid: filteredInvoices.filter(i => i.status === 'pago').reduce((a, b) => a + (Number(b.amount) || Number(b.total) || 0), 0),
                pending: filteredInvoices.filter(i => i.status !== 'pago' && i.status !== 'anulada').reduce((a, b) => a + (Number(b.amount) || Number(b.total) || 0), 0)
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
