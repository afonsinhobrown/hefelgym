import { supabase } from './supabase';

export const API_LOCAL = 'https://hefelgym.onrender.com/api';

const getAuthGymId = () => {
    try {
        const session = JSON.parse(localStorage.getItem('gymar_session') || '{}');
        return session?.gymId || 'hefel_gym_v1';
    } catch { return 'hefel_gym_v1'; }
};

export const db = {
    init: async () => { console.log("🚀 Frontend em Modo Cloud Seguro"); },

    clients: {
        getAll: async () => {
            const gymId = getAuthGymId();
            const { data, error } = await supabase.from('clients').select('*').eq('gym_id', gymId).order('name');
            if (error) throw error;
            return data;
        },
        create: async (data) => {
            const gymId = getAuthGymId();
            const { data: res, error } = await supabase.from('clients').insert([{
                ...data,
                id: data.id || `CL${Date.now()}`,
                gym_id: gymId,
                status: 'active',
                created_at: new Date().toISOString()
            }]).select().single();
            if (error) throw error;
            return res;
        },
        update: async (id, data) => {
            const { error } = await supabase.from('clients').update(data).eq('id', id);
            if (error) throw error;
        }
    },

    invoices: {
        getAll: async () => {
            const gymId = getAuthGymId();
            const { data, error } = await supabase.from('invoices').select('*').eq('gym_id', gymId).order('date', { ascending: false });
            if (error) throw error;
            return data;
        },
        getByUser: async (clientId) => {
            const { data, error } = await supabase.from('invoices').select('*').eq('client_id', clientId).order('date', { ascending: false });
            if (error) throw error;
            return data;
        }
    },

    plans: {
        getAll: async () => {
            const gymId = getAuthGymId();
            const { data, error } = await supabase.from('plans').select('*').eq('gym_id', gymId);
            if (error) throw error;
            return data;
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
            const { error } = await supabase.from('system_users').upsert([{
                ...userData,
                gym_id: gymId
            }]);
            if (error) throw error;
        }
    }
};
