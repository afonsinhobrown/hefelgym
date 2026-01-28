import React from 'react';
import { DollarSign, TrendingUp, Download } from 'lucide-react';

const AdminFinance = () => {
    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Financeiro SaaS</h1>
                    <p className="text-gray-400">Receitas provenientes de licenças de ginásios.</p>
                </div>
                <button className="btn btn-secondary flex items-center gap-2">
                    <Download size={18} /> Exportar Relatório
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-emerald-950/30 border border-emerald-900/50 p-6 rounded-2xl">
                    <p className="text-emerald-400 text-sm mb-1">Total Recebido (Este Mês)</p>
                    <h3 className="text-3xl font-bold text-white">5.000 MT</h3>
                </div>
                <div className="bg-blue-950/30 border border-blue-900/50 p-6 rounded-2xl">
                    <p className="text-blue-400 text-sm mb-1">Previsão (Próximo Mês)</p>
                    <h3 className="text-3xl font-bold text-white">5.000 MT</h3>
                </div>
                <div className="bg-purple-950/30 border border-purple-900/50 p-6 rounded-2xl">
                    <p className="text-purple-400 text-sm mb-1">MRR (Anualizado)</p>
                    <h3 className="text-3xl font-bold text-white">60.000 MT</h3>
                </div>
            </div>

            <div className="bg-[#1e293b] border border-gray-800 rounded-xl p-6 text-center">
                <p className="text-gray-400">Nenhuma transação recente para exibir.</p>
            </div>
        </div>
    );
};

export default AdminFinance;
