import { supabase } from './supabase';

const API_URL = 'https://hefelgym.onrender.com/api';

export const db = {
    init: async () => { console.log("🚀 Frontend em Modo Cloud Puro"); },

    clients: {
        getAll: async () => {
            const { data, error } = await supabase.from('clients').select('*').order('name');
            if (error) throw error;
            return data;
        },
        create: async (data) => {
            const { data: res, error } = await supabase.from('clients').insert([{
                ...data,
                id: `CL${Date.now()}`,
                gym_id: 'hefel_gym_v1',
                status: 'active',
                created_at: new Date().toISOString()
            }]).select().single();
            if (error) {
                console.error("Erro Supabase:", error);
                throw new Error("Falha ao salvar no Supabase: " + error.message);
            }
            return res;
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

    invoices: {
        getAll: async () => {
            const { data, error } = await supabase.from('invoices').select('*').order('date', { ascending: false });
            if (error) throw error;
            return data;
        },
        getByUser: async (clientId) => {
            const { data, error } = await supabase.from('invoices').select('*').eq('client_id', clientId).order('date', { ascending: false });
            if (error) throw error;
            return data;
        },
        update: async (id, data) => {
            const { error } = await supabase.from('invoices').update(data).eq('id', id);
            if (error) throw error;
        }
    },

    plans: {
        getAll: async () => {
            const { data, error } = await supabase.from('plans').select('*');
            if (error) throw error;
            return data;
        }
    },

    attendance: {
        getByUser: async (userId) => {
            const { data, error } = await supabase.from('attendance').select('*').eq('user_id', userId).order('timestamp', { ascending: false });
            if (error) throw error;
            return data;
        }
    },

    system_users: {
        getAll: async () => {
            const { data, error } = await supabase.from('system_users').select('*');
            if (error) throw error;
            return data;
        },
        save: async (userData) => {
            const { error } = await supabase.from('system_users').upsert([userData]);
            if (error) throw error;
        }
    },

    inventory: {
        getAll: async () => {
            const { data, error } = await supabase.from('products').select('*');
            if (error) throw error;
            return data;
        },
        processSale: async (clientId, items, status, details) => {
            const total = items.reduce((a, b) => a + (Number(b.price) * (b.qty || 1)), 0);
            const { data, error } = await supabase.from('invoices').insert([{
                id: `FT${Date.now()}`,
                client_id: clientId,
                amount: total,
                status: status,
                items: JSON.stringify(items),
                date: new Date().toISOString(),
                payment_method: details.method,
                gym_id: 'hefel_gym_v1'
            }]).select().single();
            if (error) throw error;
            return data;
        }
    }
};
