import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { supabase } from '../services/supabase';
import { Printer, ShoppingCart, Trash2, Search, Plus, Minus, Save, Send, User, Check, FileText, Share2 } from 'lucide-react';
import InvoiceTemplate from '../components/Invoices/InvoiceTemplate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';


// Helper para conversão de Base64 para Blob (para upload)
function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

const POS = () => {
    const [products, setProducts] = useState([]);
    const [clients, setClients] = useState([]);
    const [plans, setPlans] = useState([]);
    const [cart, setCart] = useState([]);
    const [selectedClient, setSelectedClient] = useState('');
    const [search, setSearch] = useState('');
    const [generatedInvoice, setGeneratedInvoice] = useState(null);
    const [printingInvoice, setPrintingInvoice] = useState(null);
    const [lastSale, setLastSale] = useState(null); // Para modal de sucesso

    const [payMethod, setPayMethod] = useState('cash');
    const [payRef, setPayRef] = useState('');
    const [isPaymentStep, setIsPaymentStep] = useState(false);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            await db.init();
            try {
                const prods = await db.inventory.getAll();
                const clis = await db.clients.getAll();
                const pls = await db.plans.getAll();
                setProducts(prods || []);
                setClients(clis || []);
                setPlans(pls || []);
            } catch (e) { console.error("Erro loading POS async:", e); }
        };
        loadData();
    }, []);

    // Reset payment fields when cart clears
    useEffect(() => { if (cart.length === 0) setIsPaymentStep(false); }, [cart]);

    /* Lógica PDF igual às Faturas */
    /* Lógica PDF igual às Faturas */
    useEffect(() => {
        if (printingInvoice) {
            const generatePDF = async () => {
                setIsSending(true);
                try {
                    // Pequeno delay para garantir renderização DOM
                    await new Promise(resolve => setTimeout(resolve, 800));

                    const originalElement = document.getElementById('pos-print-container');
                    if (!originalElement) throw new Error('Elemento de impressão não encontrado');

                    // TÉCNICA DE CLONAGEM PARA FORÇAR VISIBILIDADE
                    const clone = originalElement.cloneNode(true);
                    clone.style.position = 'fixed';
                    clone.style.top = '0';
                    clone.style.left = '0';
                    clone.style.zIndex = '99999';
                    clone.style.background = 'white';
                    clone.style.width = '80mm'; // CORREÇÃO: Largura térmica correta para o POS
                    clone.style.display = 'block';
                    clone.style.visibility = 'visible';
                    document.body.appendChild(clone);

                    const canvas = await html2canvas(clone, {
                        scale: 2,
                        logging: true,
                        useCORS: true,
                        backgroundColor: '#ffffff'
                    });

                    document.body.removeChild(clone);

                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF('p', 'mm', [80, 297]);
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

                    const pdfBase64 = pdf.output('datauristring');

                    // PROVA: Baixar ficheiro
                    pdf.save(`Recibo_${printingInvoice.id}.pdf`);

                    console.log("PDF Gerado. Tamanho: " + pdfBase64.length);
                    await sendToBot(printingInvoice, pdfBase64);
                } catch (err) {
                    console.error("ERRO CRITICO AO GERAR PDF:", err);
                    alert("Erro PDF: " + err.message);
                } finally {
                    setPrintingInvoice(null);
                    setIsSending(false);
                }
            };
            generatePDF();
        }
    }, [printingInvoice]);



    // Helper para conversão de Base64 para Blob (para upload)
    function dataURItoBlob(dataURI) {
        const byteString = atob(dataURI.split(',')[1]);
        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], { type: mimeString });
    }

    const sendToBot = async (invoice, base64File) => {
        // 1. Validar Cliente
        let phone = invoice.client?.phone;
        const clientName = invoice.client?.name || 'Cliente';

        if (!phone) {
            const client = clients.find(c => c.id === invoice.clientId);
            if (client && client.phone) phone = client.phone;
            else return alert('Para enviar WhatsApp, o cliente precisa de um número de telefone associado.');
        }

        const message = `*COMPRA HEFEL GYM* 🏋️\n\nOlá *${clientName}*,\nObrigado pela preferência!\nSegue o recibo da sua compra *#${invoice.id}*.\n\nTotal Pago: *${invoice.total.toLocaleString()} MT*\nData: *${new Date(invoice.date).toLocaleDateString()}*\n\nVolte sempre!`;

        try {
            // Tenta enviar via SERVIDOR LOCAL (Bot Automático)
            // Isto acontece em background, sem abrir janelas
            await fetch('http://localhost:3001/api/whatsapp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: phone,
                    message: message,
                    pdfBase64: base64File ? base64File.split(',')[1] : null
                })
            });
            alert('✅ Enviado automaticamente pelo Sistema!');

        } catch (e) {
            console.error("Bot Local desligado:", e);
            alert("⚠️ O Sistema de Envio Automático (Servidor Local) está desligado.\n\nPor favor inicie o servidor ou envie manualmente.");
        }
    };


    const addToCart = (product) => {
        if (!product.price || product.price <= 0) return alert('Este produto não tem preço definido. Edite-o na página de Produtos.');
        if (product.stock <= 0) return alert('Produto sem stock!');
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                if (existing.qty >= product.stock) return prev;
                return prev.map(item => item.productId === product.id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { ...product, productId: product.id, qty: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const updateQty = (productId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.productId === productId) {
                const newQty = item.qty + delta;
                const product = products.find(p => p.id === productId);
                if (newQty > product.stock) return item;
                return newQty > 0 ? { ...item, qty: newQty } : item;
            }
            return item;
        }));
    };

    const calculateTotal = () => {
        return cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    };

    const handleCheckout = (type) => {
        if (!selectedClient && type === 'invoice') return alert('Para emitir fatura, selecione um cliente!');
        if (cart.length === 0) return alert('Carrinho vazio!');

        if (type === 'pay_now') {
            setIsPaymentStep(true);
        } else {
            // Fatura Pendente (Pagar Depois)
            if (window.confirm(`EMITIR FATURA (Pagar Depois): ${calculateTotal()} MT. Confirmar?`)) {
                finalizeSale('pendente', null);
            }
        }
    };

    const [received, setReceived] = useState(0);
    const [change, setChange] = useState(0);

    const calculateChange = (val) => {
        const total = calculateTotal();
        setReceived(val);
        setChange(val > total ? val - total : 0);
    };

    const confirmPayment = (e) => {
        e.preventDefault();
        const total = calculateTotal();
        if (payMethod === 'cash' && received < total) {
            return alert(`Valor recebido (${received} MT) é inferior ao total (${total} MT)`);
        }

        const paymentDetails = {
            method: payMethod,
            ref: payRef || 'N/A',
            received: received,
            change: change,
            date: new Date().toISOString()
        };

        if (window.confirm(`Confirmar Pagamento de ${total} MT via ${payMethod.toUpperCase()}?`)) {
            finalizeSale('pago', paymentDetails);
        }
    };

    const finalizeSale = async (status, paymentDetails) => {
        try {
            const invoice = await db.inventory.processSale(selectedClient, cart, status, paymentDetails);

            // Em Cloud Mode, processSale já devolve a fatura.
            // Precisamos apenas garantir que temos o nome do cliente se não for avulso
            const clientName = clients.find(c => c.id === selectedClient)?.name || 'Cliente Avulso';

            // CRITICAL FIX: Ensure display uses LOCAL data for immediate feedback, 
            // protecting against backend missing fields (like items or total) in response.
            const fullInvoice = {
                ...invoice,
                items: cart, // Trust local cart for display
                total: calculateTotal(),
                amount: calculateTotal(),
                status: status, // Ensure status is correctly reflected
                clientName,
                client: { name: clientName, phone: clients.find(c => c.id === selectedClient)?.phone }
            };

            setLastSale(fullInvoice);
            setGeneratedInvoice(fullInvoice);

            setCart([]);
            // Reload products to update stock
            const updatedProducts = await db.inventory.getAll();
            setProducts(updatedProducts);

            setSearch('');
            setIsPaymentStep(false);
            setPayRef('');
            setPayMethod('cash');
        } catch (err) {
            alert('Erro: ' + err.message);
        }
    };

    // Função para finalmente fechar tudo
    const closeSale = () => {
        setLastSale(null);
        setGeneratedInvoice(null);
        setSelectedClient('');
    };

    const [activeTab, setActiveTab] = useState('all');

    const filteredProducts = products.concat(
        // Adicionar Planos como produtos virtuais se não existirem
        plans.map(p => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            type: 'plan',
            stock: 9999, // Unlimited
            photo_url: null
        }))
    ).filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;

        if (activeTab === 'all') return true;
        if (activeTab === 'products') return (!p.type || p.type === 'product');
        if (activeTab === 'memberships') return (p.type === 'plan' || p.name.toLowerCase().includes('plano') || p.name.toLowerCase().includes('mensal') || p.name.toLowerCase().includes('diária'));
        if (activeTab === 'fees') return (p.type === 'fee' || p.name.toLowerCase().includes('inscrição') || p.name.toLowerCase().includes('cartão') || p.name.toLowerCase().includes('ficha'));

        return true;
    }).sort((a, b) => {
        // Critério 1: Preço > 0 (Vendáveis primeiro)
        const aHasPrice = a.price > 0;
        const bHasPrice = b.price > 0;
        if (aHasPrice && !bHasPrice) return -1;
        if (!aHasPrice && bHasPrice) return 1;

        // Critério 2: Stock > 0 (Disponíveis primeiro)
        const aHasStock = a.stock > 0;
        const bHasStock = b.stock > 0;
        if (aHasStock && !bHasStock) return -1;
        if (!aHasStock && bHasStock) return 1;

        // Critério 3: Ordem Alfabética
        return a.name.localeCompare(b.name);
    });

    // ... (rest of logic)

    return (
        <div className="pos-page animate-fade-in">
            {/* ... */}
            <div className="pos-container no-print">

                {/* Left Side: Product Grid */}
                <div className="pos-products">
                    <div className="pos-header flex-col items-start gap-2">
                        <div className="flex justify-between w-full items-center">
                            <h2>Ponto de Venda</h2>
                            <div className="search-box">
                                <Search size={20} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Buscar produto..."
                                    className="input search-input"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-2 w-full mt-2 overflow-x-auto pb-1">
                            <button
                                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'all' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                onClick={() => setActiveTab('all')}
                            >
                                Tudo
                            </button>
                            <button
                                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'products' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                onClick={() => setActiveTab('products')}
                            >
                                Produtos
                            </button>
                            <button
                                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'memberships' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                onClick={() => setActiveTab('memberships')}
                            >
                                Mensalidades/Planos
                            </button>
                            <button
                                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'fees' ? 'bg-orange-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                                onClick={() => setActiveTab('fees')}
                            >
                                Inscrições/Taxas
                            </button>
                        </div>
                    </div>

                    <div className="products-grid">
                        {filteredProducts.map(product => (
                            <div
                                key={product.id || Math.random()}
                                className={`product-card ${product.stock === 0 ? 'disabled' : ''}`}
                                onClick={() => addToCart(product)}
                            >
                                <div className="product-icon">
                                    {product.photo_url ? (
                                        <img src={product.photo_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                                    ) : (
                                        // Dynamic Icon based on type
                                        product.type === 'plan' || product.name.toLowerCase().includes('plano') ? 'P' :
                                            product.type === 'fee' || product.name.toLowerCase().includes('inscrição') ? 'T' :
                                                product.name.charAt(0)
                                    )}
                                </div>
                                <div className="product-info">
                                    <h4>{product.name}</h4>
                                    <span className="stock">{product.stock > 1000 ? '9999+' : product.stock} un</span>
                                    <span className="price">{product.price} MT</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Cart */}
                <div className="pos-cart">
                    <div className="cart-header">
                        <h3>Carrinho Atual</h3>
                        <div className="client-select">
                            <User size={18} />
                            <select
                                className="input"
                                value={selectedClient}
                                onChange={e => setSelectedClient(e.target.value)}
                            >
                                <option value="">Cliente Avulso / Selecionar...</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="cart-items">
                        {cart.length === 0 ? (
                            <div className="empty-cart">
                                <ShoppingCart size={40} />
                                <p>Carrinho vazio</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.productId} className="cart-item">
                                    <div className="item-name">
                                        <span>{item.name}</span>
                                        <small>{item.price} MT</small>
                                    </div>
                                    <div className="item-controls">
                                        <button onClick={() => updateQty(item.productId, -1)}><Minus size={14} /></button>
                                        <span>{item.qty}</span>
                                        <button onClick={() => updateQty(item.productId, 1)}><Plus size={14} /></button>
                                    </div>
                                    <div className="item-total">{(item.price * item.qty).toLocaleString()} MT</div>
                                    <button className="delete-btn" onClick={() => removeFromCart(item.productId)}><Trash2 size={16} /></button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="cart-footer">
                        <div className="total-row">
                            <span>Total a Pagar</span>
                            <span className="total-amount">{calculateTotal().toLocaleString()} MT</span>
                        </div>

                        {isPaymentStep ? (
                            <form onSubmit={confirmPayment} className="payment-form animate-fade-in">
                                <div className="form-group mb-2">
                                    <label className="text-sm text-muted block mb-1">Método de Pagamento</label>
                                    <select className="input w-full" value={payMethod} onChange={e => {
                                        setPayMethod(e.target.value);
                                        if (e.target.value !== 'cash') { setReceived(calculateTotal()); setChange(0); }
                                    }}>
                                        <option value="cash">Numerário (Dinheiro)</option>
                                        <option value="mpesa">M-Pesa</option>
                                        <option value="emola">e-Mola</option>
                                        <option value="pos">POS / Cartão</option>
                                    </select>
                                </div>
                                {payMethod === 'cash' && (
                                    <div className="cash-payment-section animate-fade-in">
                                        <div className="quick-cash-grid mb-2">
                                            {[200, 500, 1000, 2000].map(amt => (
                                                <button
                                                    key={amt}
                                                    type="button"
                                                    className="btn btn-outline text-xs px-2 py-1"
                                                    onClick={() => calculateChange(amt)}
                                                >
                                                    {amt}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                className="btn btn-outline text-xs px-2 py-1 border-emerald-500/50 text-emerald-500"
                                                onClick={() => calculateChange(calculateTotal())}
                                            >
                                                Exato
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <div className="form-group">
                                                <label className="text-xs text-muted block mb-1">Recebido</label>
                                                <input
                                                    type="number"
                                                    className="input w-full font-bold"
                                                    value={received || ''}
                                                    onChange={e => calculateChange(Number(e.target.value))}
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label className="text-xs text-muted block mb-1">Troco</label>
                                                <div className="input w-full bg-slate-800 font-bold text-emerald-500 flex items-center h-full">
                                                    {change.toLocaleString()} MT
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {payMethod !== 'cash' && (
                                    <div className="form-group mb-4">
                                        <label className="text-sm text-muted block mb-1">Ref. / Nº Talão</label>
                                        <input required type="text" className="input w-full" placeholder="Ex: 8JSH29..." value={payRef} onChange={e => setPayRef(e.target.value)} />
                                    </div>
                                )}
                                <div className="checkout-actions" style={{ marginTop: '1rem' }}>
                                    <button type="button" className="btn btn-outline" onClick={() => setIsPaymentStep(false)}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="btn btn-primary checkout-btn">
                                        Confirmar Pagamento
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="checkout-actions">
                                <button className="btn btn-primary checkout-btn" onClick={() => handleCheckout('pay_now')}>
                                    <Check size={20} /> Pagar Agora
                                    <span className="sub-text">Emitir Recibo</span>
                                </button>

                                <button className="btn btn-outline checkout-btn" onClick={() => handleCheckout('invoice')}>
                                    <FileText size={20} /> Pagar Depois
                                    <span className="sub-text">Emitir Fatura</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            <style>{`
        /* Reuse POS Styles */
        /* Reuse POS Styles */
        /* Changed height calculation to assume header availability and added padding-bottom for safety */
        .pos-page { height: calc(100vh - 100px); overflow: hidden; display: flex; flex-direction: column; padding-bottom: 2rem; }
        .pos-container { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; height: 100%; padding-bottom: 1rem; }
        
        .pos-products { display: flex; flex-direction: column; overflow: hidden; padding-right: 0.5rem; }
        .pos-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-shrink: 0; }
        
        .products-grid { 
          display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 0.8rem; 
          overflow-y: auto; padding-right: 0.5rem; flex: 1;
          align-content: start; /* CORREÇÃO: Impede que os cartões estiquem verticalmente */
        }

        .pos-cart { 
          background: var(--bg-card); 
          display: flex; flex-direction: column; height: 100%; maxHeight: 100%;
          border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden;
        }
        
        .cart-header { padding: 1rem; border-bottom: 1px solid var(--border); flex-shrink: 0; background: var(--bg-card); }
        .client-select { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem; }
        
        /* A lista de itens deve ocupar o espaço disponível e ter scroll */
        .cart-items { 
            flex: 1; 
            overflow-y: auto; 
            padding: 1rem; 
            min-height: 0; /* Importante para o Flexbox não transbordar */
        }

        .cart-footer { 
            padding: 1rem; 
            background: var(--bg-card); 
            border-top: 1px solid var(--border); 
            flex-shrink: 0; /* Não encolher */
            box-shadow: 0 -4px 12px rgba(0,0,0,0.2); /* Sombra para separar */
            z-index: 10;
        }

        /* Classes Restauradas */
        .product-card { 
          background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius);
          padding: 1rem; cursor: pointer; transition: all 0.2s; display: flex; flex-direction: column; align-items: center; text-align: center;
        }
        .product-card:hover { border-color: var(--primary); transform: translateY(-2px); }
        .product-card.disabled { opacity: 0.5; cursor: not-allowed; }
        
        .product-icon { 
          width: 40px; height: 40px; background: var(--bg-card-hover); border-radius: 50%; 
          display: flex; align-items: center; justify-content: center; font-weight: bold; margin-bottom: 0.5rem; color: var(--primary);
        }
        .product-info h4 { font-size: 0.9rem; margin-bottom: 0.2rem; }
        .product-info .stock { font-size: 0.75rem; color: var(--text-muted); display: block; }
        .product-info .price { font-weight: 700; color: var(--text-main); display: block; margin-top: 0.25rem; }

        .empty-cart { 
          display: flex; flex-direction: column; align-items: center; justify-content: center; 
          height: 100%; color: var(--text-muted); gap: 1rem; opacity: 0.5; 
        }
        
        .cart-item { 
          display: flex; align-items: center; justify-content: space-between; 
          margin-bottom: 0.5rem; padding: 0.75rem; 
          background: rgba(255, 255, 255, 0.05); /* Fundo subtil */
          border-radius: var(--radius);
          border: 1px solid transparent;
          gap: 0.5rem;
        }
        .cart-item:hover { border-color: var(--primary); background: rgba(255, 255, 255, 0.08); }
        .item-name { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .item-name span { font-weight: 500; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .item-name small { color: var(--text-muted); font-size: 0.75rem; }
        
        .item-controls { display: flex; align-items: center; gap: 0.5rem; background: var(--bg-main); padding: 0.2rem; border-radius: 4px; }
        .item-controls button { padding: 4px; border: none; background: transparent; color: var(--text-main); cursor: pointer; display: flex; }
        .item-controls button:hover { color: var(--primary); }
        .item-controls span { font-size: 0.9rem; min-width: 1.5rem; text-align: center; font-weight: bold; }

        .item-total { font-weight: bold; color: var(--primary); font-size: 0.9rem; min-width: 60px; text-align: right; }
        .delete-btn { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; margin-left: 4px; }
        .delete-btn:hover { color: #ef4444; }
        
        .cart-footer { padding: 1.5rem; background: var(--bg-card-hover); border-top: 1px solid var(--border); }
        .total-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; font-size: 1.1rem; }
        .total-amount { font-weight: 800; font-size: 1.5rem; color: var(--primary); }
        
        .checkout-actions { display: flex; gap: 1rem; }
        .checkout-btn { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0.8rem; font-size: 1rem; gap: 0.2rem; }
        .sub-text { font-size: 0.7rem; font-weight: 400; opacity: 0.8; }
        .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text-main); }
        .btn-outline:hover { border-color: var(--primary); color: var(--primary); }
        
        @media (max-width: 1024px) {
          .pos-container { grid-template-columns: 1fr; overflow-y: auto; }
          .pos-page { height: auto; overflow: auto; }
        }
        
        .search-box { position: relative; max-width: 300px; }
        .search-icon { position: absolute; left: 0.8rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
        .search-input { padding-left: 2.5rem; width: 100%; }

        .quick-cash-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.4rem; padding: 2px; }
        .quick-cash-grid button { padding: 4px; font-size: 0.75rem; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2); border-radius: 4px; color: var(--text-muted); cursor: pointer; }
        .quick-cash-grid button:hover { border-color: var(--primary); color: var(--primary); }

        /* Modal Styles */
        .success-modal { text-align: center; padding: 2.5rem; width: 400px; max-width: 90%; }
        .success-icon { 
            width: 80px; height: 80px; background: rgba(16,185,129,0.1); color: var(--success); 
            border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;
        }
        .success-amount { margin: 1.5rem 0; background: var(--bg-main); padding: 1rem; border-radius: var(--radius); }
        .success-amount small { display: block; color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }
        .success-amount span { display: block; font-size: 2rem; font-weight: 800; color: var(--primary); }
        
        .success-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 2rem 0; }
        .action-btn { 
            display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem;
            padding: 1.5rem; background: var(--bg-card-hover); border: 1px solid var(--border); border-radius: var(--radius);
            color: var(--text-main); cursor: pointer; transition: all 0.2s;
        }
        .action-btn:hover { border-color: var(--primary); transform: translateY(-3px); }
        .action-btn.print:hover { color: var(--info); border-color: var(--info); }
        .action-btn.whatsapp:hover { color: var(--success); border-color: var(--success); }
        
        .btn-new-sale { 
            width: 100%; padding: 1rem; background: var(--primary); color: white; border: none; border-radius: var(--radius); 
            font-weight: 600; cursor: pointer; 
        }

        /* PRINT STYLES - CRUCIAL PARA TÉRMICA */
        .print-only { display: none; }
        
        @media print {
            .no-print { display: none !important; }
            .print-only { display: block !important; position: absolute; left: 0; top: 0; width: 100%; }
            .modal-overlay { display: none !important; }
            
            /* Reset body for thermal print width (usually controlled by printer settings, but good to ensure flow) */
            body, html { width: 100%; margin: 0; padding: 0; background: white; }
            .pos-page { height: auto; overflow: visible; }
        }
      `}</style>
        </div>
    );
};

export default POS;
