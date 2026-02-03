import { supabase } from './supabase';

export const API_LOCAL = 'https://hefelgym.onrender.com/api';

const getAuthGymId = () => {
    try {
        const session = JSON.parse(localStorage.getItem('gymar_session') || '{}');
        return session?.gymId || 'hefel_gym_v1';
    } catch { return 'hefel_gym_v1'; }
};

export const db = {
    init: async () => { console.log("🚀 Sistema Totalmente Restaurado - Modo Cloud"); },

    inventory: {
        getAll: async () => {
            const gymId = getAuthGymId();
            const { data, error } = await supabase.from('products').select('*').eq('gym_id', gymId);
            if (error) throw error;
            return data.map(p => ({ ...p, price: Number(p.price), cost_price: Number(p.cost_price || 0) }));
        },
        create: async (data) => {
            const gymId = getAuthGymId();
            const payload = { ...data, id: data.id || `PRD${Date.now()}`, gym_id: gymId };
            const { error } = await supabase.from('products').insert(payload);
            if (error) throw error;
            return payload;
        },
        update: async (id, data) => {
            const { error } = await supabase.from('products').update(data).eq('id', id);
            if (error) throw error;
        },
        delete: async (id) => {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;
        },
        processSale: async (clientId, items, paymentStatus, paymentDetails) => {
            const gymId = getAuthGymId();
            const total = items.reduce((a, b) => a + (Number(b.price) * (Number(b.qty) || 1)), 0);
            const invoiceId = `FT${Date.now()}`;

            const invoiceData = {
                id: invoiceId,
                client_id: clientId || null,
                amount: total,
                status: paymentStatus,
                items: JSON.stringify(items),
                date: new Date().toISOString(),
                payment_method: paymentDetails?.method || 'cash',
                gym_id: gymId
            };

            const { error } = await supabase.from('invoices').insert(invoiceData);
            if (error) throw error;

            // Update stock
            for (const item of items) {
                if (item.productId || item.id) {
                    const pid = item.productId || item.id;
                    const { data: prod } = await supabase.from('products').select('stock').eq('id', pid).single();
                    if (prod) {
                        await supabase.from('products').update({ stock: Math.max(0, prod.stock - (item.qty || 1)) }).eq('id', pid);
                    }
                }
            }
            return { ...invoiceData, items };
        }
    },

    clients: {
        getAll: async () => {
            const gymId = getAuthGymId();
            const { data, error } = await supabase.from('clients').select('*').eq('gym_id', gymId).order('name');
            if (error) throw error;
            return data;
        },
        create: async (data) => {
            const gymId = getAuthGymId();
            const payload = { ...data, id: data.id || `CL${Date.now()}`, gym_id: gymId, status: 'active', created_at: new Date().toISOString() };
            const { error } = await supabase.from('clients').insert(payload);
            if (error) throw error;
            return payload;
        },
        update: async (id, data) => {
            const { error } = await supabase.from('clients').update(data).eq('id', id);
            if (error) throw error;
        },
        delete: async (id) => {
            const { error } = await supabase.from('clients').delete().eq('id', id);
            if (error) throw error;
        }
    },

    expenses: {
        getAll: async () => {
            const gymId = getAuthGymId();
            const { data, error } = await supabase.from('gym_expenses').select('*').eq('gym_id', gymId).order('date', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        getProducts: async () => {
            const gymId = getAuthGymId();
            const { data, error } = await supabase.from('product_expenses').select('*').eq('gym_id', gymId).order('date', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        createGymExpense: async (data) => {
            const gymId = getAuthGymId();
            const payload = { ...data, id: `EXP${Date.now()}`, gym_id: gymId, date: new Date().toISOString() };
            const { error } = await supabase.from('gym_expenses').insert(payload);
            if (error) throw error;
            return payload;
        },
        deleteGymExpense: async (id) => {
            const { error } = await supabase.from('gym_expenses').delete().eq('id', id);
            if (error) throw error;
        }
    },

    payroll: {
        getAll: async () => {
            const { data, error } = await supabase.from('payroll_history').select('*').order('month', { ascending: false });
            if (error) throw error;
            return data;
        },
        create: async (data) => {
            const { data: res, error } = await supabase.from('payroll_history').insert(data).select().single();
            if (error) throw error;
            return res;
        }
    },

    invoices: {
        getAll: async () => {
            const gymId = getAuthGymId();
            const { data, error } = await supabase.from('invoices').select('*').eq('gym_id', gymId).order('date', { ascending: false });
            if (error) throw error;
            return data.map(i => ({ ...i, total: i.amount, items: typeof i.items === 'string' ? JSON.parse(i.items) : i.items }));
        },
        getByUser: async (clientId) => {
            const { data, error } = await supabase.from('invoices').select('*').eq('client_id', clientId).order('date', { ascending: false });
            if (error) throw error;
            return data.map(i => ({ ...i, total: i.amount, items: typeof i.items === 'string' ? JSON.parse(i.items) : i.items }));
        },
        update: async (id, data) => {
            const { error } = await supabase.from('invoices').update(data).eq('id', id);
            if (error) throw error;
        }
    },

    plans: {
        getAll: async () => {
            const gymId = getAuthGymId();
            const { data, error } = await supabase.from('plans').select('*').eq('gym_id', gymId);
            if (error) throw error;
            return data || [];
        }
    },

    instructors: {
        getAll: async () => {
            const gymId = getAuthGymId();
            const { data, error } = await supabase.from('instructors').select('*').eq('gym_id', gymId).order('name');
            if (error) throw error;
            return data;
        },
        update: async (id, data) => {
            const { error } = await supabase.from('instructors').update(data).eq('id', id);
            if (error) throw error;
        }
    },

    attendance: {
        getAll: async () => {
            const gymId = getAuthGymId();
            const { data, error } = await supabase.from('attendance').select('*').eq('gym_id', gymId).order('timestamp', { ascending: false }).limit(500);
            if (error) throw error;
            return data || [];
        },
        getByUser: async (userId) => {
            const { data, error } = await supabase.from('attendance').select('*').eq('user_id', userId).order('timestamp', { ascending: false });
            if (error) throw error;
            return data || [];
        }
    },

    system_users: {
        getAll: async () => {
            const gymId = getAuthGymId();
            const { data, error } = await supabase.from('system_users').select('*').eq('gym_id', gymId);
            if (error) throw error;
            return data;
        },
        save: async (userData) => {
            const gymId = getAuthGymId();
            // Mapeamento ESTREITO com base no SQL real fornecido pelo usuário
            const payload = {
                id: userData.id || `USR${Date.now()}`,
                name: userData.name,
                email: userData.email,
                role: userData.role,
                status: userData.status || 'active',
                gym_id: gymId
                // staff_id REMOVIDO pois não existe na tabela do Supabase
            };

            if (userData.password) {
                payload.password = userData.password;
            }

            const { error } = await supabase.from('system_users').upsert([payload]);
            if (error) {
                console.error("Erro Supabase:", error);
                throw error;
            }
        },
        delete: async (id) => {
            const { error } = await supabase.from('system_users').delete().eq('id', id);
            if (error) throw error;
        }
    }
};
