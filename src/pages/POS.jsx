import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db } from '../services/db';
import { supabase } from '../services/supabase';
import { Printer, ShoppingCart, Trash2, Search, Plus, Minus, Save, Send, User, Check, FileText, Share2, Search as SearchIcon, X, UserPlus, Calendar, ChevronDown, Download } from 'lucide-react';
import InvoiceTemplate from '../components/Invoices/InvoiceTemplate';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import html2pdf from 'html2pdf.js';

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
    const [search, setSearch] = useState('');
    const [generatedInvoice, setGeneratedInvoice] = useState(null);
    const [printingInvoice, setPrintingInvoice] = useState(null);
    const [lastSale, setLastSale] = useState(null);

    const [payMethod, setPayMethod] = useState('cash');
    const [payRef, setPayRef] = useState('');
    const [isPaymentStep, setIsPaymentStep] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [planStartDate, setPlanStartDate] = useState(new Date().toISOString().split('T')[0]);

    // Estado para o seletor de cliente pesquisável
    const [clientSearchInput, setClientSearchInput] = useState('');
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const clientSearchRef = useRef(null);

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (clientSearchRef.current && !clientSearchRef.current.contains(event.target)) {
                setShowClientDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filtro inteligente de clientes
    const filteredClients = useMemo(() => {
        if (!clients) return [];
        if (!clientSearchInput || typeof clientSearchInput !== 'string' || !clientSearchInput.trim()) {
            return clients.slice(0, 10);
        }

        const searchTerm = clientSearchInput.toLowerCase();
        return clients.filter(client => {
            return (
                (client.name && client.name.toLowerCase().includes(searchTerm)) ||
                (client.phone && client.phone.includes(searchTerm)) ||
                (client.email && client.email.toLowerCase().includes(searchTerm)) ||
                (client.nuit && client.nuit.includes(searchTerm))
            );
        }).slice(0, 15);
    }, [clients, clientSearchInput]);

    // Selecionar cliente
    const handleSelectClient = (client) => {
        if (client === null) {
            // Cliente avulso
            setSelectedClient({
                id: null,
                name: clientSearchInput || 'Cliente Avulso',
                phone: '',
                isTemp: true
            });
            setClientSearchInput(clientSearchInput || 'Cliente Avulso');
        } else {
            setSelectedClient(client);
            setClientSearchInput(client.name || '');
        }
        setShowClientDropdown(false);
    };

    // Limpar seleção
    const handleClearClient = () => {
        setSelectedClient(null);
        setClientSearchInput('');
        setShowClientDropdown(true);
        setTimeout(() => {
            if (clientSearchRef.current) {
                clientSearchRef.current.querySelector('input')?.focus();
            }
        }, 100);
    };

    // Carregar dados
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
            } catch (e) {
                console.error("Erro loading POS async:", e);
            }
        };
        loadData();
    }, []);

    // Reset payment fields when cart clears
    useEffect(() => {
        if (cart.length === 0) setIsPaymentStep(false);
    }, [cart]);

    // Lógica PDF - MOVI ESTE useEffect PARA DEPOIS DA FUNÇÃO sendToBot
    // Vou deixar ele aqui mas ele será definido depois

    const sendToBot = async (invoice, base64File) => {
        let phone = invoice.client?.phone;
        const clientName = invoice.client?.name || 'Cliente';

        if (!phone) {
            const client = clients.find(c => c.id === invoice.clientId);
            if (client && client.phone) phone = client.phone;
            else return alert('Para enviar WhatsApp, o cliente precisa de um número de telefone associado.');
        }

        const message = `*COMPRA HEFEL GYM* 🏋️\n\nOlá *${clientName}*,\nObrigado pela preferência!\nSegue o recibo da sua compra *#${invoice.id}*.\n\nTotal Pago: *${invoice.total.toLocaleString()} MT*\nData: *${new Date(invoice.date).toLocaleDateString()}*\n\nVolte sempre!`;

        try {
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

        if (product.type !== 'plan' && product.type !== 'fee' && product.stock <= 0) return alert('Produto sem stock!');

        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                if (product.type === 'plan' && !validatePlanLimits(product, existing.qty, 1)) {
                    return prev;
                }

                if (existing.qty >= product.stock && product.type !== 'plan' && product.type !== 'fee') return prev;
                return prev.map(item => item.productId === product.id ? { ...item, qty: item.qty + 1 } : item);
            }

            return [...prev, { ...product, productId: product.id, qty: 1 }];
        });
    };

    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const handleQuickRegister = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const phone = formData.get('phone');
        const nuit = formData.get('nuit');

        try {
            const newClient = await db.clients.create({
                name, phone, nuit,
                gym_id: 'hefel_gym_v1'
            });

            const allClients = await db.clients.getAll();
            setClients(allClients);

            handleSelectClient(newClient);
            setShowQuickRegister(false);

            alert(`✅ Cliente ${name} registado com sucesso! Prossiga com o pagamento.`);
            setIsPaymentStep(true);
        } catch (err) {
            alert("Erro ao criar cliente: " + err.message);
        }
    };

    const updateQty = (productId, delta) => {
        setCart(prev => prev.map(item => {
            if (item.productId === productId) {
                if (item.type === 'plan' && delta > 0) {
                    if (!validatePlanLimits(item, item.qty, delta)) return item;
                }

                const newQty = item.qty + delta;

                if (item.type !== 'plan' && item.type !== 'fee' && item.stock && newQty > item.stock) return item;

                return newQty > 0 ? { ...item, qty: newQty } : item;
            }
            return item;
        }));
    };

    const calculateTotal = () => {
        return cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    };

    // State for Quick Register Modal
    const [showQuickRegister, setShowQuickRegister] = useState(false);

    const validatePlanLimits = (plan, currentQty, delta) => {
        const newQty = currentQty + delta;

        // Verificar limites específicos
        if (plan.name.toLowerCase().includes('diária') || plan.name.toLowerCase().includes('diario')) {
            if (newQty > 14) {
                alert('O plano diário não pode ser comprado mais de 14 vezes de uma vez.');
                return false;
            }
        } else if (plan.name.toLowerCase().includes('mensal') || plan.name.toLowerCase().includes('ginásio')) {
            if (newQty > 6) {
                alert('O plano mensal não pode ser comprado mais de 6 meses de uma vez.');
                return false;
            }
        } else if (plan.name.toLowerCase().includes('pt ') || plan.name.toLowerCase().includes('personal')) {
            if (newQty > 12) {
                alert('O plano PT não pode ser comprado mais de 12 sessões de uma vez.');
                return false;
            }
        }

        return true;
    };

    const handleCheckout = (type) => {
        if (cart.length === 0) return alert('Carrinho vazio!');

        const hasEnrollment = cart.some(i =>
            i.type === 'fee' ||
            i.name.toLowerCase().includes('inscrição') ||
            i.name.toLowerCase().includes('matricula')
        );

        // Verificar se há cliente selecionado
        if (!selectedClient && type === 'invoice') {
            alert('Para emitir fatura, selecione um cliente!');
            return;
        }

        // Verificar inscrição sem cliente
        if (hasEnrollment && !selectedClient?.id) {
            alert("⚠️ Detectada Taxa de Inscrição!\n\nPor favor registe o cliente para associar a inscrição.");
            setShowQuickRegister(true);
            return;
        }

        if (type === 'pay_now') {
            setIsPaymentStep(true);
        } else {
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
            // Criar objeto de recibo antes de finalizar a venda
            const clientName = selectedClient?.name || 'Cliente Avulso';

            const receipt = {
                id: `TEMP_${Date.now()}`,
                date: new Date().toISOString(),
                items: [...cart],
                total: total,
                amount: total,
                status: 'pago',
                clientName,
                client: {
                    name: clientName,
                    phone: selectedClient?.phone || clients.find(c => c.id === selectedClient?.id)?.phone || ''
                },
                payment: paymentDetails
            };

            console.log("Criando recibo para impressão:", receipt);

            // Primeiro mostrar o recibo
            setPrintingInvoice(receipt);

            // Depois finalizar a venda
            finalizeSale('pago', paymentDetails);
        }
    };

    const finalizeSale = async (status, paymentDetails) => {
        try {
            // Usar o ID do cliente selecionado
            const clientId = selectedClient?.id || null;

            const invoice = await db.inventory.processSale(clientId, cart, status, paymentDetails);
            console.log("Venda finalizada no banco:", invoice);

            if (status === 'pago' && clientId) {
                const planItem = cart.find(i => i.type === 'plan' || i.name.toLowerCase().includes('plano') || i.name.toLowerCase().includes('pt '));

                if (planItem) {
                    const quantity = planItem.qty || 1;
                    const baseDuration = planItem.duration || 30;
                    const totalDuration = baseDuration * quantity;

                    const startDate = new Date(planStartDate);
                    const endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + totalDuration);

                    await db.clients.update(clientId, {
                        plan_id: planItem.id,
                        plan_name: quantity > 1 ? `${planItem.name} (${quantity}x)` : planItem.name,
                        start_date: startDate.toISOString(),
                        end_date: endDate.toISOString(),
                        status: 'active',
                        last_payment: new Date().toISOString()
                    });

                    db.clients.getAll().then(setClients);
                }
            }

            const clientName = selectedClient?.name || 'Cliente Avulso';

            const fullInvoice = {
                ...invoice,
                items: cart,
                total: calculateTotal(),
                amount: calculateTotal(),
                status: status,
                clientName,
                client: {
                    name: clientName,
                    phone: selectedClient?.phone || clients.find(c => c.id === selectedClient?.id)?.phone
                }
            };

            setLastSale(fullInvoice);
            setGeneratedInvoice(fullInvoice);

            // Atualizar/Definir o documento para impressão com os dados REAIS do banco
            // Isto garante que Faturas (Pagar Depois) abram o modal, e Recibos (Pagos) atualizem o ID
            console.log("Definindo documento final para impressão:", fullInvoice);
            setPrintingInvoice(fullInvoice);

            setCart([]);
            setIsPaymentStep(false);
            setReceived(0);
            setChange(0);

            // Limpar seleção de cliente após venda
            setSelectedClient(null);
            setClientSearchInput('');
        } catch (error) {
            console.error(error);
            alert('Erro ao finalizar venda: ' + error.message);
        }
    };

    const closeSale = () => {
        setLastSale(null);
        setGeneratedInvoice(null);
        setPrintingInvoice(null);
        setSelectedClient(null);
        setClientSearchInput('');
    };

    // Lógica PDF - AGORA DEFININDO O useEffect APÓS AS FUNÇÕES
    useEffect(() => {
        if (printingInvoice) {
            console.log("printingInvoice definido, preparando PDF:", printingInvoice);
            // Pequeno delay para garantir que o modal visível renderizou
            const timer = setTimeout(() => {
                const element = document.getElementById('pos-receipt-content');
                console.log("Elemento para PDF:", element);
                if (element) {
                    try {
                        // Tentar download automático
                        const opt = {
                            margin: 0,
                            filename: `Recibo_${printingInvoice.id}.pdf`,
                            image: { type: 'jpeg', quality: 0.98 },
                            html2canvas: { scale: 2, useCORS: true, logging: false },
                            jsPDF: { unit: 'mm', format: [80, 200] }
                        };

                        // Executar html2pdf
                        html2pdf().set(opt).from(element).save().then(async () => {
                            // Sucesso no Auto-Download
                            // Tentar gerar base64 para o Bot em background
                            try {
                                const worker = html2pdf().set(opt).from(element).toPdf();
                                const pdf = await worker.get('pdf');
                                const base64 = pdf.output('datauristring');
                                sendToBot(printingInvoice, base64);
                            } catch (e) {
                                console.warn("Erro ao enviar bot background:", e);
                            }
                        }).catch(err => {
                            console.warn("Auto-download falhou (popup bloqueado?). User pode usar botões manuais.", err);
                        });

                    } catch (e) {
                        console.error("Erro setup html2pdf:", e);
                    }
                } else {
                    console.error("Elemento 'pos-receipt-content' não encontrado!");
                }
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [printingInvoice]);

    const [activeTab, setActiveTab] = useState('all');

    const filteredProducts = products.concat(
        plans.map(p => ({
            id: p.id,
            name: p.name,
            price: Number(p.price),
            type: 'plan',
            stock: 9999,
            photo_url: null,
            duration: p.duration
        }))
    ).filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;

        const nameLower = p.name.toLowerCase();

        const isPT = nameLower.includes('pt ') || nameLower.includes('personal');
        const isFee = p.type === 'fee' || nameLower.includes('inscrição') || nameLower.includes('cartão') || nameLower.includes('ficha') || (nameLower.includes('plano') && nameLower.includes('treino')) || nameLower.includes('avulso');
        const isProduct = (!p.type || p.type === 'product') && !isPT && !isFee && !nameLower.includes('plano') && !nameLower.includes('mensal') && !nameLower.includes('diária');
        const isGymPlan = (p.type === 'plan' || nameLower.includes('plano') || nameLower.includes('mensal') || nameLower.includes('diária') || nameLower.includes('semanal') || nameLower.includes('ginasio') || nameLower.includes('ginásio')) && !isPT && !isFee;

        if (activeTab === 'all') return true;
        if (activeTab === 'products') return isProduct;
        if (activeTab === 'pt') return isPT;
        if (activeTab === 'memberships') return isGymPlan;
        if (activeTab === 'fees') return isFee;

        return true;
    }).sort((a, b) => {
        const aHasPrice = a.price > 0;
        const bHasPrice = b.price > 0;
        if (aHasPrice && !bHasPrice) return -1;
        if (!aHasPrice && bHasPrice) return 1;

        const aHasStock = a.stock > 0;
        const bHasStock = b.stock > 0;
        if (aHasStock && !bHasStock) return -1;
        if (!aHasStock && bHasStock) return 1;

        return a.name.localeCompare(b.name);
    });

    const isCartValid = useMemo(() => {
        return true;
    }, [cart]);

    return (
        <div className="pos-page animate-fade-in">
            {/* Quick Register Modal */}
            {showQuickRegister && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <form onSubmit={handleQuickRegister} className="bg-gray-900 border border-gray-700 p-6 rounded-xl w-full max-w-md shadow-2xl relative animate-scale-in">
                        <button type="button" onClick={() => setShowQuickRegister(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <UserPlus className="text-primary" /> Registo Rápido
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Nome do Cliente *</label>
                                <input name="name" className="input w-full bg-gray-800 border-gray-700 focus:border-primary text-white font-bold text-lg" placeholder="Nome Completo" required autoFocus />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">Telefone (WhatsApp)</label>
                                <input name="phone" className="input w-full bg-gray-800 border-gray-700 focus:border-primary text-white" placeholder="84/85..." />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 uppercase font-bold mb-1 block">NUIT (Opcional)</label>
                                <input name="nuit" className="input w-full bg-gray-800 border-gray-700 focus:border-primary text-white" placeholder="Opcional" />
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary w-full mt-6 py-3 text-lg font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                            ✅ Criar e Continuar
                        </button>
                    </form>
                </div>
            )}

            <div className="pos-container no-print">
                {/* Left Side: Product Grid */}
                <div className="pos-products">
                    <div className="pos-header flex-col items-start gap-2">
                        <div className="flex justify-between w-full items-center">
                            <div className="flex items-center gap-2">
                                <h2>Ponto de Venda</h2>
                                {lastSale && (
                                    <button
                                        onClick={() => {
                                            console.log("Forçando reimpressão:", lastSale);
                                            setPrintingInvoice(lastSale);
                                        }}
                                        className="text-xs bg-yellow-600 px-3 py-1 rounded-full text-white font-bold hover:bg-yellow-700 ml-2 animate-pulse flex items-center gap-1 shadow-lg border border-yellow-400"
                                        title="Clique aqui se o recibo não apareceu automaticamente"
                                    >
                                        <Printer size={14} /> Reimprimir Último
                                    </button>
                                )}
                            </div>
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
                        <div className="flex gap-3 w-full mt-4 overflow-x-auto pb-2 scrollbar-hide">
                            <button
                                className={`px-5 py-3 rounded-xl text-base font-bold whitespace-nowrap transition-all duration-200 shadow-md flex-shrink-0
                                    ${activeTab === 'all'
                                        ? 'bg-gradient-to-r from-primary to-primary/80 text-white ring-2 ring-primary/50 scale-105'
                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700 hover:border-gray-500'}`}
                                onClick={() => setActiveTab('all')}
                            >
                                Tudo
                            </button>
                            <button
                                className={`px-5 py-3 rounded-xl text-base font-bold whitespace-nowrap transition-all duration-200 shadow-md flex-shrink-0
                                    ${activeTab === 'products'
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white ring-2 ring-blue-500/50 scale-105'
                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700 hover:border-gray-500'}`}
                                onClick={() => setActiveTab('products')}
                            >
                                🥤 Produtos
                            </button>
                            <button
                                className={`px-5 py-3 rounded-xl text-base font-bold whitespace-nowrap transition-all duration-200 shadow-md flex-shrink-0
                                    ${activeTab === 'memberships'
                                        ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white ring-2 ring-purple-500/50 scale-105'
                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700 hover:border-gray-500'}`}
                                onClick={() => setActiveTab('memberships')}
                            >
                                🏋️ Planos Ginásio
                            </button>
                            <button
                                className={`px-5 py-3 rounded-xl text-base font-bold whitespace-nowrap transition-all duration-200 shadow-md flex-shrink-0
                                    ${activeTab === 'pt'
                                        ? 'bg-gradient-to-r from-pink-600 to-pink-500 text-white ring-2 ring-pink-500/50 scale-105'
                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700 hover:border-gray-500'}`}
                                onClick={() => setActiveTab('pt')}
                            >
                                💪 Personal Trainer
                            </button>
                            <button
                                className={`px-5 py-3 rounded-xl text-base font-bold whitespace-nowrap transition-all duration-200 shadow-md flex-shrink-0
                                    ${activeTab === 'fees'
                                        ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white ring-2 ring-orange-500/50 scale-105'
                                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700 hover:border-gray-500'}`}
                                onClick={() => setActiveTab('fees')}
                            >
                                📝 Taxas
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
                                        product.name.toLowerCase().includes('pt ') || product.name.toLowerCase().includes('personal') ? 'PT' :
                                            product.name.toLowerCase().includes('treino') || product.name.toLowerCase().includes('ficha') ? 'F' :
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

                        {/* SELECTOR DE CLIENTE PESQUISÁVEL - CORRIGIDO */}
                        <div className="client-search-wrapper mb-3" ref={clientSearchRef}>
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-2">
                                    <User size={18} className="text-gray-400" />
                                    <label className="text-sm font-medium text-gray-300">
                                        Cliente {selectedClient?.isTemp && <span className="text-yellow-500 text-xs">(Avulso)</span>}
                                    </label>
                                </div>

                                <div className="relative">
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 pl-11 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-all"
                                        placeholder="Digite nome, telefone ou email..."
                                        value={clientSearchInput}
                                        onChange={(e) => {
                                            setClientSearchInput(e.target.value);
                                            setShowClientDropdown(true);
                                        }}
                                        onFocus={() => setShowClientDropdown(true)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && filteredClients.length > 0) {
                                                handleSelectClient(filteredClients[0]);
                                            }
                                            if (e.key === 'Escape') {
                                                setShowClientDropdown(false);
                                            }
                                        }}
                                    />

                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                        <Search size={18} className="text-gray-400" />
                                    </div>

                                    {clientSearchInput && (
                                        <button
                                            onClick={handleClearClient}
                                            className="absolute right-10 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-700 rounded"
                                            type="button"
                                        >
                                            <X size={16} className="text-gray-400 hover:text-white" />
                                        </button>
                                    )}

                                    <button
                                        onClick={() => setShowClientDropdown(!showClientDropdown)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1"
                                        type="button"
                                    >
                                        <ChevronDown size={18} className={`text-gray-400 transition-transform ${showClientDropdown ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>

                                {/* DROPDOWN DE CLIENTES */}
                                {showClientDropdown && (
                                    <div className="absolute z-50 w-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl max-h-80 overflow-y-auto animate-fade-in">
                                        {/* Opção Cliente Avulso */}
                                        <div
                                            className={`p-3 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors ${!selectedClient?.id ? 'bg-gray-800' : ''}`}
                                            onClick={() => handleSelectClient(null)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="font-bold text-white">
                                                        {clientSearchInput || 'Cliente Avulso'}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded">Avulso</span>
                                                        <span className="text-xs text-gray-400">
                                                            {clientSearchInput ? `Usar: "${clientSearchInput}"` : 'Venda sem registo'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {!selectedClient?.id && (
                                                    <Check size={16} className="text-green-500" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Lista de Clientes Registados */}
                                        <div className="max-h-64 overflow-y-auto">
                                            {filteredClients.length > 0 ? (
                                                filteredClients.map(client => (
                                                    <div
                                                        key={client.id}
                                                        className={`p-3 border-b border-gray-800 cursor-pointer hover:bg-gray-800 transition-colors ${selectedClient?.id === client.id ? 'bg-gray-800' : ''}`}
                                                        onClick={() => handleSelectClient(client)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-white truncate">
                                                                        {client.name}
                                                                    </span>
                                                                    {client.status === 'active' && (
                                                                        <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-500 rounded">
                                                                            Ativo
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-gray-400">
                                                                    {client.phone && (
                                                                        <span className="flex items-center gap-1">
                                                                            📱 {client.phone}
                                                                        </span>
                                                                    )}
                                                                    {client.email && (
                                                                        <span className="flex items-center gap-1">
                                                                            ✉️ {client.email}
                                                                        </span>
                                                                    )}
                                                                    {client.nuit && (
                                                                        <span className="flex items-center gap-1">
                                                                            🏢 NUIT: {client.nuit}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {selectedClient?.id === client.id && (
                                                                <Check size={16} className="text-green-500 ml-2 flex-shrink-0" />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : clientSearchInput ? (
                                                <div className="p-4 text-center">
                                                    <div className="text-gray-400 mb-2">Nenhum cliente encontrado</div>
                                                    <button
                                                        onClick={() => setShowQuickRegister(true)}
                                                        className="btn btn-primary btn-sm flex items-center gap-2 mx-auto"
                                                        type="button"
                                                    >
                                                        <UserPlus size={14} />
                                                        Registar novo cliente
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="p-4 text-center text-gray-500">
                                                    Digite para pesquisar clientes...
                                                </div>
                                            )}
                                        </div>

                                        {/* Botão para adicionar novo cliente */}
                                        {clientSearchInput && filteredClients.length === 0 && (
                                            <div className="p-3 border-t border-gray-800 bg-gray-900/50">
                                                <button
                                                    onClick={() => {
                                                        setShowClientDropdown(false);
                                                        setShowQuickRegister(true);
                                                    }}
                                                    className="w-full btn btn-outline btn-sm flex items-center justify-center gap-2"
                                                    type="button"
                                                >
                                                    <UserPlus size={14} />
                                                    Criar cliente: "{clientSearchInput}"
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
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

                        {/* BOTÃO DE TESTE TEMPORÁRIO - REMOVER DEPOIS */}
                        <button
                            onClick={() => {
                                const testInvoice = {
                                    id: "TEST123",
                                    date: new Date().toISOString(),
                                    items: [{ name: "Produto Teste", price: 1000, qty: 1 }],
                                    total: 1000,
                                    clientName: "Cliente Teste",
                                    client: { name: "Cliente Teste", phone: "841234567" }
                                };
                                console.log("Testando recibo:", testInvoice);
                                setPrintingInvoice(testInvoice);
                            }}
                            className="btn btn-yellow mb-2 text-sm w-full"
                        >
                            🧪 Testar Recibo (Debug)
                        </button>

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

                                {/* Plan Start Date Selection */}
                                {(cart.some(i => i.type === 'plan' || i.name.toLowerCase().includes('plano') || i.name.toLowerCase().includes('pt '))) && (
                                    <div className="form-group mb-4 bg-gray-800 p-2 rounded border border-gray-700">
                                        <label className="text-sm text-primary font-bold block mb-1 flex items-center gap-2">
                                            <Calendar size={14} /> Data Início do Plano
                                        </label>
                                        <input
                                            type="date"
                                            className="input w-full bg-gray-700 text-white font-bold"
                                            value={planStartDate}
                                            onChange={e => setPlanStartDate(e.target.value)}
                                        />
                                        <small className="text-xs text-gray-500 block mt-1">
                                            A validade será calculada a partir desta data.
                                        </small>
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

            {/* Modal de Impressão / Recibo - VISIBLE & ROBUST */}
            {printingInvoice && (
                <div className="pos-print-modal" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(0,0,0,0.9)',
                    zIndex: 999999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px'
                }}>
                    <div style={{
                        background: 'white',
                        padding: '10px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        maxHeight: '70vh',
                        overflowY: 'auto',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                        width: 'auto',
                        minWidth: '300px'
                    }}>
                        {/* Wrapper for PDF generation */}
                        <div id="pos-receipt-content" className="printable-area" style={{
                            width: '80mm',
                            background: 'white',
                            margin: '0 auto',
                            minHeight: '200px'
                        }}>
                            {printingInvoice ? (
                                <InvoiceTemplate invoice={printingInvoice} isThermal={true} />
                            ) : (
                                <div style={{ padding: '20px', textAlign: 'center' }}>
                                    <p>Carregando recibo...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-4">
                        <button
                            className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700 flex items-center gap-2 shadow-lg"
                            onClick={() => {
                                console.log("Fechando recibo");
                                setPrintingInvoice(null);
                            }}
                        >
                            <X size={20} /> Fechar
                        </button>

                        <button
                            className="px-4 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg"
                            onClick={() => {
                                const element = document.getElementById('pos-receipt-content');
                                console.log("Gerando PDF do elemento:", element);
                                if (element) {
                                    // Configuração robusta para html2pdf
                                    const opt = {
                                        margin: [0, 0, 0, 0],
                                        filename: `Recibo_${printingInvoice.id}.pdf`,
                                        image: { type: 'jpeg', quality: 0.98 },
                                        html2canvas: {
                                            scale: 2,
                                            useCORS: true,
                                            logging: false,
                                            backgroundColor: '#ffffff'
                                        },
                                        jsPDF: {
                                            unit: 'mm',
                                            format: [80, 297],
                                            orientation: 'portrait'
                                        }
                                    };
                                    html2pdf().set(opt).from(element).save();
                                } else {
                                    alert("Elemento do recibo não encontrado!");
                                }
                            }}
                        >
                            <Download size={20} /> Baixar PDF
                        </button>

                        <button
                            className="px-4 py-2 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-lg"
                            onClick={() => window.print()}
                        >
                            <Printer size={20} /> Imprimir (Browser)
                        </button>
                    </div>
                    <p className="text-white mt-4 text-sm opacity-70 text-center">
                        Se o download automático não iniciou, use os botões acima.
                    </p>
                </div>
            )}

            <style>{`
                .pos-page { 
                    height: calc(100vh - 100px); 
                    overflow: hidden; 
                    display: flex; 
                    flex-direction: column; 
                    padding-bottom: 2rem; 
                }
                .pos-container { 
                    display: grid; 
                    grid-template-columns: 2fr 1fr; 
                    gap: 1rem; 
                    height: 100%; 
                    padding-bottom: 1rem; 
                }
                
                .pos-products { 
                    display: flex; 
                    flex-direction: column; 
                    overflow: hidden; 
                    padding-right: 0.5rem; 
                }
                .pos-header { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    margin-bottom: 1rem; 
                    flex-shrink: 0; 
                }
                
                .products-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); 
                    gap: 0.8rem; 
                    overflow-y: auto; 
                    padding-right: 0.5rem; 
                    flex: 1;
                    align-content: start;
                }

                .pos-cart { 
                    background: var(--bg-card); 
                    display: flex; 
                    flex-direction: column; 
                    height: 100%; 
                    maxHeight: 100%;
                    border-radius: var(--radius); 
                    border: 1px solid var(--border); 
                    overflow: hidden;
                }
                
                .cart-header { 
                    padding: 1rem; 
                    border-bottom: 1px solid var(--border); 
                    flex-shrink: 0; 
                    background: var(--bg-card); 
                }
                
                .cart-items { 
                    flex: 1; 
                    overflow-y: auto; 
                    padding: 1rem; 
                    min-height: 0;
                }

                .cart-footer { 
                    padding: 1rem; 
                    background: var(--bg-card); 
                    border-top: 1px solid var(--border); 
                    flex-shrink: 0;
                    box-shadow: 0 -4px 12px rgba(0,0,0,0.2);
                    z-index: 10;
                }

                .product-card { 
                    background: var(--bg-card); 
                    border: 1px solid var(--border); 
                    border-radius: var(--radius);
                    padding: 1rem; 
                    cursor: pointer; 
                    transition: all 0.2s; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    text-align: center;
                }
                .product-card:hover { 
                    border-color: var(--primary); 
                    transform: translateY(-2px); 
                }
                .product-card.disabled { 
                    opacity: 0.5; 
                    cursor: not-allowed; 
                }
                
                .product-icon { 
                    width: 40px; 
                    height: 40px; 
                    background: var(--bg-card-hover); 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    font-weight: bold; 
                    margin-bottom: 0.5rem; 
                    color: var(--primary);
                }
                .product-info h4 { 
                    font-size: 0.9rem; 
                    margin-bottom: 0.2rem; 
                }
                .product-info .stock { 
                    font-size: 0.75rem; 
                    color: var(--text-muted); 
                    display: block; 
                }
                .product-info .price { 
                    font-weight: 700; 
                    color: var(--text-main); 
                    display: block; 
                    margin-top: 0.25rem; 
                }

                .empty-cart { 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    justify-content: center; 
                    height: 100%; 
                    color: var(--text-muted); 
                    gap: 1rem; 
                    opacity: 0.5; 
                }
                
                .cart-item { 
                    display: flex; 
                    align-items: center; 
                    justify-content: space-between; 
                    margin-bottom: 0.5rem; 
                    padding: 0.75rem; 
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: var(--radius);
                    border: 1px solid transparent;
                    gap: 0.5rem;
                }
                .cart-item:hover { 
                    border-color: var(--primary); 
                    background: rgba(255, 255, 255, 0.08); 
                }
                .item-name { 
                    flex: 1; 
                    display: flex; 
                    flex-direction: column; 
                    overflow: hidden; 
                }
                .item-name span { 
                    font-weight: 500; 
                    color: var(--text-main); 
                    white-space: nowrap; 
                    overflow: hidden; 
                    text-overflow: ellipsis; 
                }
                .item-name small { 
                    color: var(--text-muted); 
                    font-size: 0.75rem; 
                }
                
                .item-controls { 
                    display: flex; 
                    align-items: center; 
                    gap: 0.5rem; 
                    background: var(--bg-main); 
                    padding: 0.2rem; 
                    border-radius: 4px; 
                }
                .item-controls button { 
                    padding: 4px; 
                    border: none; 
                    background: transparent; 
                    color: var(--text-main); 
                    cursor: pointer; 
                    display: flex; 
                }
                .item-controls button:hover { 
                    color: var(--primary); 
                }
                .item-controls span { 
                    font-size: 0.9rem; 
                    min-width: 1.5rem; 
                    text-align: center; 
                    font-weight: bold; 
                }

                .item-total { 
                    font-weight: bold; 
                    color: var(--primary); 
                    font-size: 0.9rem; 
                    min-width: 60px; 
                    text-align: right; 
                }
                .delete-btn { 
                    background: transparent; 
                    border: none; 
                    color: var(--text-muted); 
                    cursor: pointer; 
                    padding: 4px; 
                    margin-left: 4px; 
                }
                .delete-btn:hover { 
                    color: #ef4444; 
                }
                
                .total-row { 
                    display: flex; 
                    justify-content: space-between; 
                    align-items: center; 
                    margin-bottom: 1rem; 
                    font-size: 1.1rem; 
                }
                .total-amount { 
                    font-weight: 800; 
                    font-size: 1.5rem; 
                    color: var(--primary); 
                }
                
                .checkout-actions { 
                    display: flex; 
                    gap: 1rem; 
                }
                .checkout-btn { 
                    flex: 1; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    justify-content: center; 
                    padding: 0.8rem; 
                    font-size: 1rem; 
                    gap: 0.2rem; 
                }
                .sub-text { 
                    font-size: 0.7rem; 
                    font-weight: 400; 
                    opacity: 0.8; 
                }
                .btn-outline { 
                    background: transparent; 
                    border: 1px solid var(--border); 
                    color: var(--text-main); 
                }
                .btn-outline:hover { 
                    border-color: var(--primary); 
                    color: var(--primary); 
                }
                
                .btn-yellow {
                    background: #f59e0b;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                }
                .btn-yellow:hover {
                    background: #d97706;
                }
                
                @media (max-width: 1024px) {
                    .pos-container { 
                        grid-template-columns: 1fr; 
                        overflow-y: auto; 
                    }
                    .pos-page { 
                        height: auto; 
                        overflow: auto; 
                    }
                }
                
                .search-box { 
                    position: relative; 
                    max-width: 300px; 
                }
                .search-icon { 
                    position: absolute; 
                    left: 0.8rem; 
                    top: 50%; 
                    transform: translateY(-50%); 
                    color: var(--text-muted); 
                }
                .search-input { 
                    padding-left: 2.5rem; 
                    width: 100%; 
                }

                .quick-cash-grid { 
                    display: grid; 
                    grid-template-columns: repeat(5, 1fr); 
                    gap: 0.4rem; 
                    padding: 2px; 
                }
                .quick-cash-grid button { 
                    padding: 4px; 
                    font-size: 0.75rem; 
                    border: 1px solid rgba(255,255,255,0.1); 
                    background: rgba(0,0,0,0.2); 
                    border-radius: 4px; 
                    color: var(--text-muted); 
                    cursor: pointer; 
                }
                .quick-cash-grid button:hover { 
                    border-color: var(--primary); 
                    color: var(--primary); 
                }

                .client-search-wrapper .btn { 
                    padding: 0.5rem 1rem; 
                }
                .client-search-wrapper .btn-sm { 
                    padding: 0.25rem 0.75rem; 
                    font-size: 0.875rem; 
                }

                .print-only { 
                    display: none; 
                }
                
                @media print {
                    @page { margin: 0; size: auto; }
                    body * { visibility: hidden; height: 0; overflow: hidden; }
                    
                    /* Show only the print modal container (as a reset wrapper) */
                    .pos-print-modal {
                        position: fixed !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: 100% !important;
                        background: white !important;
                        display: block !important;
                        visibility: visible !important;
                        z-index: 999999 !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    
                    /* Hide controls within the modal */
                    .pos-print-modal button, 
                    .pos-print-modal p, 
                    .pos-print-modal .flex {
                        display: none !important;
                    }

                    /* The Receipt Content itself */
                    .printable-area, .printable-area * {
                        visibility: visible !important;
                        height: auto !important;
                        overflow: visible !important;
                    }

                    .printable-area {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 80mm !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        background: white !important;
                    }

                    .no-print { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default POS;