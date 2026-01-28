import React, { useState, useEffect } from 'react';
import {
    CheckCircle,
    XCircle,
    User,
    Search,
    Clock,
    LogOut,
    Ban,
    RefreshCw
} from 'lucide-react';
import { db } from '../services/db';

const Attendance = () => {
    const [clients, setClients] = useState([]);
    const [logs, setLogs] = useState([]);
    const [search, setSearch] = useState('');
    const [statusMsg, setStatusMsg] = useState(null);

    // Hardware States
    const [devices, setDevices] = useState([]);
    const [openingStates, setOpeningStates] = useState({}); // { deviceId: boolean }

    // User Management States
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [deviceUsers, setDeviceUsers] = useState([]);
    const [selectedDeviceUsers, setSelectedDeviceUsers] = useState(null);

    const loadData = async () => {
        try {
            await db.init();
            const [c, l, devs] = await Promise.all([
                db.clients.getAll(),
                db.attendance.getAll(),
                db.hardware.getDevices().catch(() => [])
            ]);
            setClients(Array.isArray(c) ? c : []);
            setLogs(Array.isArray(l) ? l : []);
            setDevices(Array.isArray(devs) ? devs : []);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000); // Auto-refresh a cada 5s
        return () => clearInterval(interval);
    }, []);

    const handleAccess = async (clientId, type) => {
        try {
            if (type === 'in') {
                setStatusMsg({ type: 'success', text: 'Entrada Simulada' });
            } else {
                setStatusMsg({ type: 'success', text: 'Saída Simulada' });
            }
            await loadData();
        } catch (err) {
            setStatusMsg({ type: 'error', text: err.message });
        }
        setTimeout(() => setStatusMsg(null), 4000);
    };

    const handleOpenGate = async (device) => {
        if (!device) return;

        try {
            setOpeningStates(prev => ({ ...prev, [device.id]: true }));
            setStatusMsg({ type: 'success', text: `Abrindo ${device.name}...` });

            await db.hardware.openDoor(device.ip, device.username, device.password || '');

            setTimeout(() => {
                setOpeningStates(prev => ({ ...prev, [device.id]: false }));
            }, 3000);
        } catch (e) {
            console.error(e);
            setStatusMsg({ type: 'error', text: `Erro em ${device.name}: ` + e.message });
            setOpeningStates(prev => ({ ...prev, [device.id]: false }));
        }
    };

    const handleOpenUserManagement = async (device) => {
        if (!device) return;
        setSelectedDeviceUsers(device);
        try {
            const res = await fetch('http://localhost:3001/api/hardware/sync-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId: device.id })
            });
            const data = await res.json();
            if (res.ok) {
                setDeviceUsers(data.users || []);
                setUserModalOpen(true);
            } else {
                alert("Erro ao ler usuários: " + data.error);
            }
        } catch (e) { alert("Erro de comunicação com servidor."); }
    };

    const handleBlockUser = async (user, action) => {
        if (!selectedDeviceUsers) return;
        if (!confirm(`Tem a certeza que deseja ${action === 'block' ? 'BLOQUEAR' : 'DESBLOQUEAR'} ${user.name}?`)) return;

        try {
            const res = await fetch('http://localhost:3001/api/hardware/user-control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ip: selectedDeviceUsers.ip,
                    user: selectedDeviceUsers.username,
                    pass: selectedDeviceUsers.password,
                    userId: user.id,
                    action
                })
            });
            if (res.ok) {
                alert(`Usuário ${action === 'block' ? 'bloqueado' : 'desbloqueado'} com sucesso.`);
            } else {
                alert("Falha ao enviar comando.");
            }
        } catch (e) { alert("Erro de rede."); }
    };

    // Stats Calculation
    // Calcular utilizadores que estão DENTRO agora (Entrou e não saiu)
    // Lógica simplificada: Último evento foi entrada
    const activeUsersCount = (() => {
        // Mapa para rastrear o estado atual de cada user
        const userState = {};
        // Processar logs cronologicamente 
        // Assumindo que logs vêm ordenados ou ordená-los aqui? 
        // logs do DB normalmente vêm DESC, então iterar de trás p frente ou usar timestamp
        const sortedLogs = [...logs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        sortedLogs.forEach(log => {
            if (log.type === 'in') userState[log.clientId || log.cardNo] = true; // In
            else if (log.type === 'out') userState[log.clientId || log.cardNo] = false; // Out
        });

        return Object.values(userState).filter(status => status === true).length;
    })();

    const todayLogs = logs.filter(l => {
        const d = new Date(l.timestamp);
        const today = new Date();
        return d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
    });

    const todayAccesses = todayLogs.filter(l => l.type === 'in').length;

    const capacity = 200; // Capacidade maxima estimada
    const percentage = Math.min(100, Math.round((activeUsersCount / capacity) * 100));
    const circumference = 2 * Math.PI * 40;
    const dashoffset = circumference - (percentage / 100) * circumference;

    // Filter Logic
    const [filterTime, setFilterTime] = useState('today'); // Default to today

    const filteredLogs = logs.filter(log => {
        const d = new Date(log.timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - d);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // 1. Text Search
        if (search && !log.clientName?.toLowerCase().includes(search.toLowerCase())) return false;

        // 2. Time Filter
        if (filterTime === 'today') {
            return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        if (filterTime === 'week') return diffDays <= 7;
        if (filterTime === 'month') return diffDays <= 30;

        if (filterTime === 'active_now') {
            // Re-use logic: User is IN if last event was IN
            // This is tricky for a list of logs. 
            // We should probably only show the ENTRY log of currently active users?
            // Let's rely on the global active calculation or just filter logs of type 'in' for active users
            // Simpler: Show all logs for users who are currently active?
            // Best: Show the LATEST 'in' log for users who are currently active.

            // Calculate active user IDs first (from the previously added logic)
            const userState = {};
            [...logs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).forEach(l => {
                if (l.type === 'in') userState[l.clientId || l.cardNo] = true;
                else if (l.type === 'out') userState[l.clientId || l.cardNo] = false;
            });
            const activeIds = Object.keys(userState).filter(k => userState[k]);

            return activeIds.includes(log.clientId || log.cardNo) && log.type === 'in'; // Show only their entry
        }

        return true;
    });

    return (
        <div className="attendance-page animate-fade-in p-6 h-full overflow-y-auto flex flex-col gap-6">

            {/* TOP STATS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* ... (Existing Stats Cards) ... */}
                {/* ACTIVE USERS CIRCLE */}
                <div className="card p-4 bg-gradient-to-br from-blue-900/40 to-gray-900 border-blue-800/50 flex items-center justify-between relative overflow-hidden">
                    <div className="z-10">
                        <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider">Ativos Agora</h3>
                        <p className="text-4xl font-bold text-white mt-1">{activeUsersCount}</p>
                        <p className="text-xs text-blue-300 mt-1 flex items-center gap-1"><User size={12} /> No Ginásio</p>
                    </div>
                    <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg className="transform -rotate-90 w-24 h-24">
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-700" />
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent"
                                className="text-blue-500 transition-all duration-1000 ease-out"
                                style={{ strokeDasharray: circumference, strokeDashoffset: dashoffset }} />
                        </svg>
                        <div className="absolute text-xs font-bold text-blue-400">{percentage}%</div>
                    </div>
                </div>

                {/* TODAY STATS */}
                <div className="card p-4 bg-gray-800/60 border-gray-700 flex flex-col justify-center">
                    <h3 className="text-gray-400 text-sm font-bold uppercase">Acessos Hoje</h3>
                    <div className="flex items-end gap-2 mt-2">
                        <span className="text-3xl font-bold text-white">{todayAccesses}</span>
                        <span className="text-xs text-green-400 mb-1 flex items-center"><CheckCircle size={10} className="mr-1" /> Check-ins</span>
                    </div>
                </div>

                {/* SEARCH HEADER */}
                <div className="md:col-span-2 flex flex-col justify-center gap-2">
                    <div className="flex justify-between items-center mb-1">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Clock className="text-primary" /> Controle de Acessos
                        </h2>
                        <button
                            className="btn btn-sm btn-secondary flex items-center gap-2 text-xs"
                            onClick={async () => {
                                if (!confirm("Sincronizar eventos da catraca?")) return;
                                try {
                                    const devs = await db.hardware.getDevices();
                                    const targetDev = devs.find(d => d.ip.includes('149')) || devs[0];
                                    if (targetDev) {
                                        await fetch('http://localhost:3001/api/hardware/sync-events', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ deviceId: targetDev.id })
                                        });
                                        loadData();
                                        alert("Sincronizado!");
                                    } else alert("Sem dispositivo.");
                                } catch (e) { alert("Erro: " + e.message); }
                            }}
                        >
                            <RefreshCw size={14} /> Sincronizar
                        </button>
                    </div>
                    <div className="search-box flex items-center bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 shadow-inner w-full">
                        <Search size={20} className="text-gray-400 mr-3" />
                        <input
                            type="text"
                            placeholder="Buscar cliente por nome ou ID..."
                            className="bg-transparent border-none focus:outline-none text-white w-full text-base"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* STATUS MESSAGES */}
            {
                statusMsg && (
                    <div className={`p-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-down ${statusMsg.type === 'error' ? 'bg-red-900/80 text-white border-l-4 border-red-500' : 'bg-green-900/80 text-white border-l-4 border-green-500'}`}>
                        {statusMsg.type === 'error' ? <XCircle size={24} /> : <CheckCircle size={24} />}
                        <span className="font-bold text-lg">{statusMsg.text}</span>
                    </div>
                )
            }

            {/* MAIN CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow overflow-hidden">

                {/* LEFT: MANUAL ENTRY & GATE CONTROL ... */}
                <div className="lg:col-span-1 flex flex-col gap-6 overflow-hidden">
                    {/* ... (Gate Control & Manual List unchanged) ... */}
                    <div className="flex flex-col gap-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                        {devices.length === 0 && (
                            <div className="card bg-gray-800 border-gray-700 p-4 text-center text-gray-400 text-sm">
                                Nenhuma catraca configurada.
                            </div>
                        )}

                        {devices.map(dev => (
                            <div key={dev.id} className="card bg-gray-800 border-gray-700 shadow-xl overflow-hidden relative group shrink-0">
                                <div className={`absolute top-0 left-0 w-1 h-full ${openingStates[dev.id] ? 'bg-green-500' : 'bg-blue-500'} transition-all`}></div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-lg text-white">{dev.name}</h3>
                                            <p className="text-xs text-mono text-gray-500">{dev.ip}</p>
                                        </div>
                                        <div className="px-2 py-1 rounded text-xs font-bold border border-green-500/30 text-green-400 bg-green-500/10">
                                            ONLINE
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleOpenGate(dev)}
                                            disabled={openingStates[dev.id]}
                                            className={`py-2 px-3 rounded-lg font-bold text-white transition-all shadow-lg flex flex-col items-center justify-center gap-1 ${openingStates[dev.id] ? 'bg-green-600 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'}`}
                                        >
                                            {openingStates[dev.id] ? <CheckCircle size={20} /> : <LogOut size={20} />}
                                            <span className="text-[10px] uppercase mt-1">{openingStates[dev.id] ? 'ABERTO' : 'ABRIR PORTA'}</span>
                                        </button>

                                        <button
                                            onClick={() => handleOpenUserManagement(dev)}
                                            className="py-2 px-3 rounded-lg font-bold text-white bg-gray-700 hover:bg-gray-600 transition-all shadow-lg flex flex-col items-center justify-center gap-1"
                                        >
                                            <User size={20} className="text-blue-400" />
                                            <span className="text-[10px] uppercase mt-1">USUÁRIOS</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>

                {/* RIGHT: LIVE LOGS - NOW FULL WIDTH */}
                <div className="lg:col-span-2 flex-grow card p-0 flex flex-col overflow-hidden bg-gray-800/90 border-gray-700 backdrop-blur-sm shadow-2xl rounded-xl">
                    <div className="p-3 border-b border-gray-700 font-bold bg-gray-800 flex flex-wrap justify-between items-center gap-2">
                        <div className="flex items-center gap-2">
                            <Clock size={18} className="text-blue-400" />
                            <span>Histórico</span>
                        </div>

                        <div className="flex gap-1">
                            {['all', 'today', 'week', 'month', 'active_now'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilterTime(f)}
                                    className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${filterTime === f ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                                >
                                    {f === 'all' ? 'Todos' :
                                        f === 'today' ? 'Hoje' :
                                            f === 'week' ? 'Semana' :
                                                f === 'month' ? 'Mês' : 'Ativos Agora'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-grow custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="text-xs uppercase text-gray-400 bg-gray-900/50 sticky top-0 backdrop-blur-md">
                                <tr>
                                    <th className="p-4 font-semibold tracking-wider">Data/Hora</th>
                                    <th className="p-4 font-semibold tracking-wider">Cliente</th>
                                    <th className="p-4 font-semibold tracking-wider">Ação</th>
                                    <th className="p-4 font-semibold tracking-wider hidden sm:table-cell">Método</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50 text-sm">
                                {filteredLogs.length === 0 ? (
                                    <tr><td colSpan="4" className="p-12 text-center text-gray-500 italic">Sem conexões registradas para este filtro.</td></tr>
                                ) : filteredLogs.map((log) => {
                                    const d = new Date(log.timestamp);
                                    return (
                                        <tr key={log.id} className="hover:bg-gray-700/30 transition-colors group">
                                            <td className="p-4 font-mono text-gray-400 border-l-2 border-transparent group-hover:border-blue-500 transition-all">
                                                <div className="flex flex-col">
                                                    <span className="text-white font-bold">{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <span className="text-xs opacity-60">{d.toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 font-medium text-white flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-blue-500 opacity-50 group-hover:opacity-100"></div>
                                                <div>
                                                    <p>{log.user_name || log.userName || log.clientName || 'Desconhecido'}</p>
                                                    <p className="text-xs text-gray-500 font-mono">{log.user_id || log.userId || '---'}</p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide border ${log.type === 'in' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                    {log.type === 'in' ? <CheckCircle size={10} /> : <LogOut size={10} />}
                                                    {log.type === 'in' ? 'ENTRADA' : 'SAÍDA'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-gray-500 hidden sm:table-cell text-xs uppercase">
                                                {log.method == 75 ? 'FACE/CARTÃO' : (log.method || 'SISTEMA')}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* USER MANAGEMENT MODAL */}
            {
                userModalOpen && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-md">
                        <div className="bg-gray-800 rounded-xl max-w-2xl w-full p-0 shadow-2xl border border-gray-700 flex flex-col h-[80vh] overflow-hidden">
                            <div className="p-6 border-b border-gray-700 bg-gray-900/50 flex justify-between items-center">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                                    <User className="text-blue-500" />
                                    Usuários na Catraca
                                </h3>
                                <button onClick={() => setUserModalOpen(false)} className="text-gray-400 hover:text-white transition-colors bg-gray-700 p-1 rounded-full hover:bg-gray-600">
                                    <XCircle size={20} />
                                </button>
                            </div>

                            <div className="flex-grow overflow-y-auto p-6 bg-gradient-to-b from-gray-800 to-gray-900">
                                <table className="w-full text-left border-separate border-spacing-y-2">
                                    <thead>
                                        <tr className="text-gray-500 text-xs uppercase">
                                            <th className="pb-2 pl-2">ID</th>
                                            <th className="pb-2">Nome</th>
                                            <th className="pb-2 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deviceUsers.map(u => (
                                            <tr key={u.id} className="bg-gray-700/30 hover:bg-gray-700/50 transition-all rounded-lg">
                                                <td className="p-3 rounded-l-lg text-gray-300 font-mono text-xs">{u.id}</td>
                                                <td className="p-3 font-bold text-white">{u.name}</td>
                                                <td className="p-3 rounded-r-lg text-right flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleBlockUser(u, 'block')}
                                                        className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-md hover:bg-red-500 hover:text-white transition-all text-xs font-bold flex items-center gap-1"
                                                    >
                                                        <Ban size={12} /> BLOQUEAR
                                                    </button>
                                                    <button
                                                        onClick={() => handleBlockUser(u, 'unblock')}
                                                        className="px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/30 rounded-md hover:bg-green-500 hover:text-white transition-all text-xs font-bold flex items-center gap-1"
                                                    >
                                                        <CheckCircle size={12} /> LIBERAR
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {deviceUsers.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-40 text-gray-500 opacity-50">
                                        <User size={48} className="mb-2" />
                                        <p>Nenhum usuário encontrado.</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-gray-700 bg-gray-900/50 flex justify-end">
                                <button onClick={() => setUserModalOpen(false)} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-bold transition-all">
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <style>{`
                /* Scrollbar personalizada */
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
            `}</style>
        </div >
    );
};

export default Attendance;
