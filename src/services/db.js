/**
 * HEFEL GYM - DUAL MODE ENGINE (LOCAL-FIRST + REMOTE VIEW)
 * 
 * Lógica Inteligente:
 * 1. Tenta conectar ao Servidor Local (SQLite/Hardware).
 * 2. Se falhar (ex: estou no telemóvel 4G), conecta direto ao Supabase (Modo Leitura Remota).
 */

import { supabase } from './supabase';

const getBaseAPI = () => {
    const saved = localStorage.getItem('custom_server_url');
    if (saved) return saved;

    // In production (Vercel/APK), we use the Render cloud backend
    if (import.meta.env.PROD) {
        return import.meta.env.VITE_PROD_API_URL || 'https://hefelgym.onrender.com/api';
    }

    // Dynamic Localhost for LAN Access (e.g. 192.168.x.x)
    const hostname = window.location.hostname;
    return import.meta.env.VITE_LOCAL_API_URL || `http://${hostname}:3001/api`;
};

export const API_LOCAL = getBaseAPI();
let USE_LOCAL_SERVER = false;

// Helpers API Local
const api = {
    get: async (endpoint) => {
        const res = await fetch(`${API_LOCAL}/${endpoint}`);
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
    },
    post: async (endpoint, data) => {
        const res = await fetch(`${API_LOCAL}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
    },
    put: async (endpoint, data) => {
        const res = await fetch(`${API_LOCAL}/${endpoint}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
    },
    delete: async (endpoint) => {
        const res = await fetch(`${API_LOCAL}/${endpoint}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
    }
};

// Helpers
const getAuthGymId = () => {
    try {
        const session = JSON.parse(localStorage.getItem('gymar_session'));
        return session?.gymId;
    } catch { return null; }
};

export const db = {
    // ... init ...
    init: async () => {
        if (import.meta.env.PROD) {
            console.log("☁️ DB INIT: Configurando para MODO CLOUD (Produção)...");
            USE_LOCAL_SERVER = false;
        } else {
            console.log("🛠️ DB INIT: Configurando para MODO LOCAL permanente...");
            USE_LOCAL_SERVER = true;
        }
    },

    checkSyncStatus: async () => {
        if (USE_LOCAL_SERVER) {
            try { return (await api.get('sync-status')).isSyncing; } catch { return false; }
        }
        return false;
    },

    inventory: {
        getAll: async () => {
            const gymId = getAuthGymId();
            if (USE_LOCAL_SERVER) return api.get(`inventory?gymId=${gymId || ''}`);
            const { data } = await supabase.from('products').select('*').eq('gym_id', gymId || 'hefel_gym_v1');
            return data.map(p => ({ ...p, price: Number(p.price), cost_price: Number(p.cost_price || 0) }));
        },
        create: async (data) => {
            // Gera ID aqui se não vier do server, ou deixa server gerar? 
            // O frontend geralmente espera um ID. Vamos gerar um temp ID se for POST.
            // Mas o backend aceita ID no body.
            const gymId = getAuthGymId() || 'hefel_gym_v1';
            const payload = { ...data, id: data.id || `PRD${Date.now()}`, gym_id: gymId };

            if (USE_LOCAL_SERVER) return api.post('inventory', payload);

            const newItem = {
                id: payload.id, gym_id: gymId,
                name: data.name, price: Number(data.price), cost_price: Number(data.cost_price || 0), stock: Number(data.stock), category: data.category
            };
            await supabase.from('products').insert(newItem);
            return newItem;
        },
        update: async (id, data) => {
            if (USE_LOCAL_SERVER) return api.put(`inventory/${id}`, data);
            await supabase.from('products').update(data).eq('id', id);
        },
        delete: async (id) => {
            if (USE_LOCAL_SERVER) return api.delete(`inventory/${id}`);
            await supabase.from('products').delete().eq('id', id);
        },
        // ... processSale ...
        processSale: async (clientId, items, paymentStatus, paymentDetails) => {
            // 1. Resolver Nome do Cliente
            let clientName = 'Consumidor Final';
            if (clientId) {
                try {
                    const clients = await db.clients.getAll();
                    const c = Array.isArray(clients) ? clients.find(cl => cl.id === clientId) : null;
                    if (c) clientName = c.name;
                } catch (e) { console.warn("Erro ao buscar nome cliente", e); }
            }

            // 2. Calcular Total Seguro
            const total = items.reduce((a, b) => {
                const price = Number(b.price) || 0;
                const qty = Number(b.qty) || Number(b.quantity) || 1;
                return a + (price * qty);
            }, 0);

            // 3. Normalizar Items
            const cleanItems = items.map(i => ({
                ...i,
                quantity: Number(i.qty) || Number(i.quantity) || 1,
                price: Number(i.price) || 0,
                description: i.description || i.name || 'Item'
            }));

            const gymId = getAuthGymId() || 'hefel_gym_v1';
            const invoiceId = `FT${Date.now()}`;

            const invoiceData = {
                id: invoiceId,
                client_id: clientId || null,
                client_name: clientName,
                amount: total,
                status: paymentStatus,
                items: JSON.stringify(cleanItems), // SERIALIZE as JSON string for Supabase
                date: new Date().toISOString(),
                payment_method: paymentDetails?.method || 'cash',
                payment_ref: paymentDetails?.ref || '',
                gym_id: gymId
            };

            if (USE_LOCAL_SERVER) {
                const result = await api.post('invoices', invoiceData);
                return { ...result, items: cleanItems }; // Return with parsed items
            } else {
                // Cloud Logic - Supabase
                const { data: newInvoice, error } = await supabase
                    .from('invoices')
                    .insert(invoiceData)
                    .select()
                    .single();

                if (error) throw error;

                // Update stock for products
                for (const item of items) {
                    if (item.productId || item.id) {
                        const productId = item.productId || item.id;
                        const { data: prod } = await supabase
                            .from('products')
                            .select('stock')
                            .eq('id', productId)
                            .single();

                        if (prod && prod.stock !== null) {
                            const newStock = Math.max(0, prod.stock - (item.qty || item.quantity || 1));
                            await supabase
                                .from('products')
                                .update({ stock: newStock })
                                .eq('id', productId);
                        }
                    }
                }

                // FIX: Garantir retorno dos dados originais (incluindo ID gerado) mesmo se newInvoice for null
                return { ...invoiceData, ...(newInvoice || {}), items: cleanItems };
            }
        }
    },

    // Histórico de Folhas (NOVO)
    payroll: {
        getAll: async () => {
            if (USE_LOCAL_SERVER) return api.get('payroll-history');
            const { data, error } = await supabase
                .from('payroll_history')
                .select('*')
                .order('month', { ascending: false });
            if (error) throw error;
            return data;
        },
        create: async (data) => {
            if (USE_LOCAL_SERVER) return api.post('payroll-history', data);
            const { data: res, error } = await supabase.from('payroll_history').insert(data).select().single();
            if (error) throw error;
            return res;
        }
    },

    clients: {
        getAll: async () => {
            const gymId = getAuthGymId();
            if (USE_LOCAL_SERVER) return api.get(`clients?gymId=${gymId || ''}`);
            const { data } = await supabase.from('clients').select('*').eq('gym_id', gymId || 'hefel_gym_v1');
            return data;
        },
        create: async (data) => {
            const gymId = getAuthGymId() || 'hefel_gym_v1';
            const payload = { ...data, id: data.id || `CL${Date.now()}` };
            if (USE_LOCAL_SERVER) return api.post('clients', payload);
            const newClient = { id: payload.id, gym_id: gymId, ...data, status: 'active', photo_url: data.photo };
            await supabase.from('clients').insert(newClient);
            return newClient;
        },
        update: async (id, data) => {
            if (USE_LOCAL_SERVER) return api.put(`clients/${id}`, data);
            await supabase.from('clients').update(data).eq('id', id);
        },
        delete: async (id) => {
            if (USE_LOCAL_SERVER) return api.delete(`clients/${id}`);
            await supabase.from('clients').delete().eq('id', id);
        }
    },

    expenses: {
        getAll: async () => {
            const gymId = getAuthGymId() || 'hefel_gym_v1';
            if (USE_LOCAL_SERVER) return api.get(`expenses/gym?gymId=${gymId}`);

            // Cloud Implementation
            const { data, error } = await supabase.from('gym_expenses').select('*').eq('gym_id', gymId).order('date', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        getProducts: async () => {
            const gymId = getAuthGymId() || 'hefel_gym_v1';
            if (USE_LOCAL_SERVER) return api.get('expenses/products');

            const { data, error } = await supabase.from('product_expenses').select('*').eq('gym_id', gymId).order('date', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        deleteProductExpense: async (id) => {
            if (USE_LOCAL_SERVER) return api.delete(`expenses/products/${id}`);
            const { error } = await supabase.from('product_expenses').delete().eq('id', id);
            if (error) throw error;
        },
        createProductExpense: async (data) => {
            const gymId = getAuthGymId() || 'hefel_gym_v1';
            const payload = { ...data, id: data.id || `PEXP${Date.now()}`, gym_id: gymId };

            if (USE_LOCAL_SERVER) return api.post('expenses/products', payload);

            const { error } = await supabase.from('product_expenses').insert(payload);
            if (error) throw error;
            return payload;
        },
        getGym: async () => {
            return db.expenses.getAll();
        },
        createGymExpense: async (data) => {
            const gymId = getAuthGymId() || 'hefel_gym_v1';
            const payload = { ...data, id: data.id || `EXP${Date.now()}`, gym_id: gymId, date: new Date().toISOString() };

            if (USE_LOCAL_SERVER) return api.post('expenses/gym', payload);

            const { error } = await supabase.from('gym_expenses').insert(payload);
            if (error) throw error;
            return payload;
        },
        deleteGymExpense: async (id) => {
            if (USE_LOCAL_SERVER) return api.delete(`expenses/gym/${id}`);
            const { error } = await supabase.from('gym_expenses').delete().eq('id', id);
            if (error) throw error;
        }
    },

    invoices: {
        getAll: async () => {
            const gymId = getAuthGymId();
            if (USE_LOCAL_SERVER) return api.get(`invoices?gymId=${gymId || ''}`);
            // Cloud fallback
            const { data } = await supabase.from('invoices').select('*').eq('gym_id', gymId || 'hefel_gym_v1').order('date', { ascending: false });
            return data.map(i => ({ ...i, total: i.amount, items: i.items || [] }));
        },
        getByUser: async (clientId) => {
            if (USE_LOCAL_SERVER) return api.get(`invoices?clientId=${clientId}`);
            const { data } = await supabase.from('invoices').select('*').eq('client_id', clientId).order('date', { ascending: false });
            return data.map(i => ({ ...i, total: i.amount, items: i.items || [] }));
        },
        getById: async (id) => {
            if (USE_LOCAL_SERVER) return api.get(`invoices?invoiceId=${id}`);
            const { data } = await supabase.from('invoices').select('*').eq('id', id).single();
            return { ...data, total: data.amount, items: data.items || [] };
        },
        create: async (data) => {
            const gymId = getAuthGymId();
            if (USE_LOCAL_SERVER) return api.post('invoices', { ...data, gym_id: gymId });
            // Cloud Logic
            await supabase.from('invoices').insert({ ...data, gym_id: gymId, items: data.items });
        },
        pay: async (id, method, ref) => {
            if (USE_LOCAL_SERVER) {
                return api.put(`invoices/${id}/pay`, { payment_method: method, payment_ref: ref });
            }
            await supabase.from('invoices').update({ status: 'pago', payment_method: method }).eq('id', id);
        },
        update: async (id, data) => {
            if (USE_LOCAL_SERVER) {
                // Se estivermos só a pagar, usar o endpoint de pay
                if (data.status === 'pago') return db.invoices.pay(id, data.payment_method || 'Numerário', data.payment_ref || '');
                // Se for outro update, precisaria de endpoint genérico. 
                // Por agora, vamos assumir que a maioria dos updates aqui são pagamentos.
                return api.put(`invoices/${id}`, data);
            }
            await supabase.from('invoices').update(data).eq('id', id);
        },
        void: async (id, reason) => {
            if (USE_LOCAL_SERVER) return api.put(`invoices/${id}/void`, { reason });
            await supabase.from('invoices').update({ status: 'anulada' }).eq('id', id);
        }
    },

    plans: {
        getAll: async () => {
            if (USE_LOCAL_SERVER) return api.get(`plans`);
            const { data } = await supabase.from('plans').select('*');
            return data || [];
        }
    },

    subscription: {
        get: async () => {
            if (USE_LOCAL_SERVER) return api.get('subscription');
            const { data } = await supabase.from('saas_subscriptions').select('*').single();
            return data;
        }
    },

    // Apenas para POS usar (envio mensagem)
    whatsapp: {
        send: async (payload) => {
            if (USE_LOCAL_SERVER) return api.post('whatsapp/send', payload);
            throw new Error("WhatsApp Bot indisponível em Modo Remoto.");
        }
    },

    classes: {
        getAll: async () => {
            if (USE_LOCAL_SERVER) return api.get('classes');
            // Cloud Logic stub
            return [];
        },
        create: async (data) => {
            if (USE_LOCAL_SERVER) return api.post('classes', { ...data, id: data.id || `CLS${Date.now()}` });
        },
        update: async (id, data) => {
            if (USE_LOCAL_SERVER) return api.put(`classes/${id}`, data);
        },
        delete: async (id) => {
            if (USE_LOCAL_SERVER) return api.delete(`classes/${id}`);
        }
    },
    trainings: {
        getAll: async () => {
            if (USE_LOCAL_SERVER) return api.get('trainings');
            return [];
        },
        create: async (data) => {
            if (USE_LOCAL_SERVER) return api.post('trainings', { ...data, id: data.id || `TR${Date.now()}` });
        },
        update: async (id, data) => {
            if (USE_LOCAL_SERVER) return api.put(`trainings/${id}`, data);
        },
        delete: async (id) => {
            if (USE_LOCAL_SERVER) return api.delete(`trainings/${id}`);
        }
    },
    instructors: {
        getAll: async () => {
            if (USE_LOCAL_SERVER) return api.get('instructors');
            const { data } = await supabase.from('instructors').select('*').eq('gym_id', 'hefel_gym_v1');
            return data;
        },
        create: async (data) => {
            const payload = { ...data, id: data.id || `INS${Date.now()}` };
            if (USE_LOCAL_SERVER) return api.post('instructors', payload);
            const newInst = { id: payload.id, gym_id: 'hefel_gym_v1', ...data, status: 'active' };
            await supabase.from('instructors').insert(newInst);
            return newInst;
        },
        update: async (id, data) => {
            if (USE_LOCAL_SERVER) return api.put(`instructors/${id}`, data);
            await supabase.from('instructors').update(data).eq('id', id);
        },
        delete: async (id) => {
            if (USE_LOCAL_SERVER) return api.delete(`instructors/${id}`);
            await supabase.from('instructors').delete().eq('id', id);
        },
        logSession: async (id, amount) => {
            const insts = await db.instructors.getAll();
            const inst = insts.find(i => i.id === id);
            if (!inst) throw new Error("Instrutor não encontrado");
            const newBalance = (Number(inst.balance) || 0) + Number(amount);
            await db.instructors.update(id, { balance: newBalance });
        },
        chargeFee: async (id, amount) => {
            const insts = await db.instructors.getAll();
            const inst = insts.find(i => i.id === id);
            if (!inst) throw new Error("Instrutor não encontrado");
            const newBalance = (Number(inst.balance) || 0) + Number(amount);
            await db.instructors.update(id, { balance: newBalance });
        },
        clearBalance: async (id) => {
            await db.instructors.update(id, { balance: 0 });
        }
    },

    // Novo: Presenças (Mock inicial para evitar crash)
    attendance: {
        getAll: async () => {
            const gymId = getAuthGymId() || 'hefel_gym_v1';
            if (USE_LOCAL_SERVER) return api.get('attendance');

            const { data, error } = await supabase.from('attendance').select('*').eq('gym_id', gymId).order('timestamp', { ascending: false }).limit(500);
            if (error) throw error;
            return data || [];
        },
        getByUser: async (userId) => {
            if (USE_LOCAL_SERVER) return api.get(`attendance?userId=${userId}`);

            const { data, error } = await supabase.from('attendance').select('*').eq('user_id', userId).order('timestamp', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    },

    // Novo: Hardware Control
    hardware: {
        getDevices: async () => {
            if (USE_LOCAL_SERVER) return api.get('hardware/devices');
            return []; // Cloud não vê hardware local direto
        },
        openDoor: async (ip, user, pass) => {
            if (USE_LOCAL_SERVER) return api.post('hardware/open-door', { ip, user, pass });
            throw new Error("Controlo hardware indisponível remotamente.");
        },
        userControl: async (ip, user, pass, userId, action) => {
            if (USE_LOCAL_SERVER) return api.post('hardware/user-control', { ip, user, pass, userId, action });
            throw new Error("Controlo hardware indisponível remotamente.");
        }
    },
    locations: {
        getAll: async () => {
            const gymId = getAuthGymId();
            if (USE_LOCAL_SERVER) return api.get(`locations?gymId=${gymId || ''}`);
            const { data } = await supabase.from('locations').select('*').eq('gym_id', gymId || 'hefel_gym_v1');
            return data;
        },
        create: async (data, sync = true) => {
            const gymId = getAuthGymId() || 'hefel_gym_v1';
            const payload = { ...data, id: data.id || `LOC${Date.now()}`, gym_id: gymId };
            if (USE_LOCAL_SERVER) return api.post('locations', payload);
            await supabase.from('locations').insert(payload);
            return payload;
        }
    },
    equipment: {
        getAll: async () => {
            const gymId = getAuthGymId();
            if (USE_LOCAL_SERVER) return api.get(`equipment?gymId=${gymId || ''}`);
            const { data } = await supabase.from('equipment').select('*').eq('gym_id', gymId || 'hefel_gym_v1');
            return data;
        },
        create: async (data) => {
            const gymId = getAuthGymId() || 'hefel_gym_v1';
            const payload = { ...data, id: data.id || `EQP${Date.now()}`, gym_id: gymId };
            if (USE_LOCAL_SERVER) return api.post('equipment', payload);
            await supabase.from('equipment').insert(payload);
            return payload;
        },
        update: async (id, data) => {
            if (USE_LOCAL_SERVER) return api.put(`equipment/${id}`, data);
            await supabase.from('equipment').update(data).eq('id', id);
        },
        delete: async (id) => {
            if (USE_LOCAL_SERVER) return api.delete(`equipment/${id}`);
            await supabase.from('equipment').delete().eq('id', id);
        }
    },
    pointOfSale: {
        renewPlanWithMonths: async (clientId, qty, status, paymentMethod, planDetails = null) => {
            if (USE_LOCAL_SERVER) {
                const client = (await api.get('clients') || []).find(c => c.id === clientId);
                if (!client) throw new Error("Cliente não encontrado.");

                const price = planDetails?.price || client.plan?.price || 1500;
                const planName = planDetails?.name || client.plan?.name || "Mensalidade";

                // Smart label for unit
                let unitLabel = "Meses";
                if (planName.toLowerCase().includes('diário') || planName.toLowerCase().includes('diario')) unitLabel = "Dias";
                if (planName.toLowerCase().includes('semanal')) unitLabel = "Semanas";

                const items = [{
                    productId: 'SUBSCRIPTION',
                    name: `Renovação ${planName}`,
                    description: `Renovação ${planName} (${qty} ${unitLabel})`,
                    quantity: qty,
                    price: price,
                    discount: 0
                }];
                // Note: Validity update is handled by Front-End calculation on MonthlyPayments page based on this description/qty
                return db.inventory.processSale(clientId, items, status, { method: paymentMethod });
            }
        }
    },
    system_users: {
        getAll: async () => {
            const gymId = getAuthGymId() || 'hefel_gym_v1';
            if (USE_LOCAL_SERVER) return api.get(`system-users?gymId=${gymId}`);

            const { data, error } = await supabase.from('system_users').select('*').eq('gym_id', gymId);
            if (error || !data || data.length === 0) {
                // Se falhar pelo gym_id ou se data vier vazio, tenta sem filtro para garantir que os Admins aparecem
                const { data: allData } = await supabase.from('system_users').select('*');
                return allData || [];
            }
            return data || [];
        },
        save: async (userData) => {
            const gymId = getAuthGymId() || 'hefel_gym_v1';
            const payload = { ...userData, gym_id: gymId };
            delete payload.password; // Por segurança, não enviar password em updates se vazia

            if (USE_LOCAL_SERVER) {
                const method = userData.id ? 'PUT' : 'POST';
                const endpoint = userData.id ? `system-users/${userData.id}` : 'system-users';
                return api.post(endpoint, { ...userData, gymId }); // O backend local usa POST p/ criar/update muitas vezes
            }

            if (userData.id) {
                const updatePayload = { ...payload };
                if (userData.password) updatePayload.password = userData.password;
                await supabase.from('system_users').update(updatePayload).eq('id', userData.id);
            } else {
                await supabase.from('system_users').insert({
                    ...payload,
                    id: userData.id || `USR${Date.now()}`,
                    password: userData.password || '123456'
                });
            }
        },
        delete: async (id) => {
            if (USE_LOCAL_SERVER) return api.delete(`system-users/${id}`);
            await supabase.from('system_users').delete().eq('id', id);
        }
    }
};
