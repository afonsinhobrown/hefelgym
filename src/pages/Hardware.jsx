import React, { useState, useEffect } from 'react';
import { Wifi, Plus, Trash2, Key, Search, CheckCircle, XCircle, Unlock, RefreshCw } from 'lucide-react';

const Hardware = () => {
    const [devices, setDevices] = useState([]);
    const [scannedDevices, setScannedDevices] = useState([]);
    const [scanning, setScanning] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Novo Dispositivo
    const [newDevice, setNewDevice] = useState({ name: '', ip: '', port: 80, username: 'admin', password: '', type: 'Hikvision' });

    // Estado para Info do Teste
    const [testInfo, setTestInfo] = useState(null);
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        loadDevices();
    }, []);

    const loadDevices = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/hardware/devices');
            if (res.ok) setDevices(await res.json());
        } catch (e) {
            console.error("Erro ao carregar devices", e);
        }
    };

    const handleScan = async () => {
        setScanning(true);
        try {
            const res = await fetch('http://localhost:3001/api/network/scan');
            if (res.ok) {
                const data = await res.json();
                setScannedDevices(data.devices || []);
            }
        } catch (e) {
            alert("Erro ao varrer rede.");
        } finally {
            setScanning(false);
        }
    };

    const handleTestConnection = async () => {
        setTesting(true);
        setTestInfo(null);
        try {
            const res = await fetch('http://localhost:3001/api/hardware/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tempConfig: newDevice })
            });
            const data = await res.json();
            if (res.ok) {
                setTestInfo({ success: true, ...data.info });
            } else {
                setTestInfo({ success: false, msg: data.error });
            }
        } catch (e) {
            setTestInfo({ success: false, msg: "Erro de rede" });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        try {
            await fetch('http://localhost:3001/api/hardware/devices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newDevice)
            });
            setIsModalOpen(false);
            loadDevices();
            setNewDevice({ name: '', ip: '', port: 80, username: 'admin', password: '', type: 'Hikvision' });
            setTestInfo(null);
        } catch (e) { alert("Erro ao salvar."); }
    };

    const handleDelete = async (id) => {
        if (!confirm("Remover dispositivo?")) return;
        await fetch(`http://localhost:3001/api/hardware/devices/${id}`, { method: 'DELETE' });
        loadDevices();
    };

    const handleTestOpen = async (device) => {
        // Simulação de teste real
        alert(`Enviando comando ABRIR para ${device.ip}...`);
    };

    const handleSyncUsers = async (device) => {
        if (!confirm(`Deseja importar utilizadores da catraca ${device.ip}?`)) return;
        try {
            const res = await fetch('http://localhost:3001/api/hardware/sync-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId: device.id })
            });
            const data = await res.json();

            if (res.ok) {
                alert(`✅ Sucesso! Encontrados ${data.users.length} utilizadores:\n` +
                    data.users.map(u => `${u.id}: ${u.name}`).join('\n'));
            } else {
                alert(`❌ Erro: ${data.error}\n${data.hint || ''}`);
            }
        } catch (e) { alert("Erro de comunicação."); }
    };

    // Estado para Gestão de Users
    const [userModal, setUserModal] = useState({ open: false, device: null, users: [] });

    const handleManageUsers = async (device) => {
        try {
            const res = await fetch('http://localhost:3001/api/hardware/sync-users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deviceId: device.id })
            });
            const data = await res.json();
            if (res.ok) {
                setUserModal({ open: true, device, users: data.users || [] });
            } else {
                alert(`Erro ao ler usuários: ${data.error}`);
            }
        } catch (e) { alert("Erro de comunicação."); }
    };

    const handleUserAction = async (user, action) => {
        // action: 'block' | 'unblock'
        if (!confirm(`Deseja ${action === 'block' ? 'BLOQUEAR' : 'DESBLOQUEAR'} este usuário?`)) return;

        try {
            const res = await fetch('http://localhost:3001/api/hardware/user-control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ip: userModal.device.ip,
                    user: userModal.device.username,
                    pass: userModal.device.password,
                    userId: user.id,
                    action
                })
            });
            if (res.ok) {
                alert("Comando enviado com sucesso!");
                // Opcional: Atualizar estado local
            } else {
                alert("Falha ao enviar comando.");
            }
        } catch (e) { alert("Erro de rede."); }
    };

    return (
        <div className="hardware-page animate-fade-in p-6 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2"><Key /> Hardware & Acessos</h2>
                <div className="flex gap-2">
                    <button onClick={handleScan} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded flex items-center gap-2" disabled={scanning}>
                        {scanning ? <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div> : <Search size={18} />}
                        {scanning ? 'Varrendo Rede...' : 'Procurar Automático'}
                    </button>
                    <button onClick={() => { setTestInfo(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2">
                        <Plus size={18} /> Adicionar Manual
                    </button>
                </div>
            </div>

            {/* LISTA DE DISPOSITIVOS CONFIGURADOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {devices.map(dev => (
                    <div key={dev.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6 relative group">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleDelete(dev.id)} className="text-red-400 hover:text-red-300"><Trash2 size={18} /></button>
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-gray-700 p-3 rounded-full">
                                <Wifi size={24} className="text-green-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{dev.name}</h3>
                                <p className="text-sm text-gray-400 font-mono">{dev.ip}:{dev.port}</p>
                            </div>
                        </div>

                        <div className="bg-black/30 rounded p-3 text-xs text-gray-400 mb-4">
                            <p>Tipo: <span className="text-white">{dev.type}</span></p>
                            <p>User: <span className="text-white">{dev.username}</span></p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button onClick={() => handleTestOpen(dev)} className="w-full bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/50 py-2 rounded flex items-center justify-center gap-2">
                                <Unlock size={16} /> Testar Abertura
                            </button>
                            <button onClick={() => handleManageUsers(dev)} className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/50 py-2 rounded flex items-center justify-center gap-2">
                                <Search size={16} /> Gerir Usuários ({dev.usersCount || '?'})
                            </button>
                        </div>
                    </div>
                ))}

                {devices.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-gray-800/50 rounded-lg border border-dashed border-gray-700">
                        <p className="text-gray-400">Nenhum dispositivo configurado.</p>
                        <p className="text-sm text-gray-500">Clique em "Procurar Automático" ou adicione manualmente.</p>
                    </div>
                )}
            </div>

            {/* RESULTADOS DO SCANNER */}
            {scannedDevices.length > 0 && (
                <div className="animate-fade-in mt-8">
                    <h3 className="text-xl font-bold mb-4">Dispositivos Encontrados na Rede</h3>
                    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900 text-gray-400 text-xs uppercase">
                                <tr>
                                    <th className="p-4">IP Address</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {scannedDevices.map((d, i) => (
                                    <tr key={i} className="hover:bg-gray-700/50">
                                        <td className="p-4 font-mono">{d.ip}</td>
                                        <td className="p-4"><span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">Online</span></td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => { setNewDevice({ ...newDevice, ip: d.ip, name: `Catraca ${d.ip.split('.').pop()}` }); setIsModalOpen(true); }}
                                                className="text-blue-400 hover:text-blue-300 text-sm font-bold"
                                            >
                                                Configurar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL ADICIONAR */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 animate-scale-in">
                        <h3 className="text-xl font-bold mb-4">Configurar Dispositivo</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Nome</label>
                                <input className="input w-full" value={newDevice.name} onChange={e => setNewDevice({ ...newDevice, name: e.target.value })} placeholder="Ex: Entrada Principal" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">IP</label>
                                    <input className="input w-full" value={newDevice.ip} onChange={e => setNewDevice({ ...newDevice, ip: e.target.value })} placeholder="192.168.1.x" />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Porta</label>
                                    <input className="input w-full" value={newDevice.port} onChange={e => setNewDevice({ ...newDevice, port: e.target.value })} placeholder="80" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Username</label>
                                    <input className="input w-full" value={newDevice.username} onChange={e => setNewDevice({ ...newDevice, username: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Password</label>
                                    <input type="password" className="input w-full" value={newDevice.password} onChange={e => setNewDevice({ ...newDevice, password: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Modelo/Protocolo</label>
                                <select className="input w-full" value={newDevice.type} onChange={e => setNewDevice({ ...newDevice, type: e.target.value })}>
                                    <option value="Hikvision">Hikvision (ISAPI)</option>
                                    <option value="ControlID">Control iD</option>
                                    <option value="ZKTeco">ZKTeco</option>
                                </select>
                            </div>

                            {/* ÁREA DE TESTE */}
                            <div className="bg-gray-900 p-3 rounded border border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-gray-400">STATUS DA CONEXÃO</span>
                                    <button
                                        onClick={handleTestConnection}
                                        disabled={testing}
                                        className="text-xs bg-blue-600/20 text-blue-400 border border-blue-600/50 px-2 py-1 rounded hover:bg-blue-600/30"
                                    >
                                        {testing ? 'A Testar...' : 'Testar Conexão'}
                                    </button>
                                </div>
                                {testInfo && (
                                    <>
                                        {testInfo.success ? (
                                            <div className="text-xs text-green-400 animate-fade-in">
                                                <p>✅ <strong>Conectado com Sucesso!</strong></p>
                                                <div className="mt-3 grid grid-cols-2 gap-3">
                                                    <div className="bg-gray-800/50 p-2 rounded">
                                                        <span className="text-gray-500 text-xs block">Modelo</span>
                                                        <span className="font-medium">{testInfo.model}</span>
                                                    </div>
                                                    <div className="bg-gray-800/50 p-2 rounded">
                                                        <span className="text-gray-500 text-xs block">Serial</span>
                                                        <span className="font-medium">{testInfo.serial}</span>
                                                    </div>
                                                    <div className="col-span-2 bg-gray-800/50 p-2 rounded">
                                                        <span className="text-gray-500 text-xs block">Firmware</span>
                                                        <span className="font-medium tracking-wide">{testInfo.firmware}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-red-400 animate-fade-in">❌ Falha: {testInfo.msg}</p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded border border-gray-600 hover:bg-gray-700">Cancelar</button>
                            <button onClick={handleSave} className="flex-1 py-3 rounded bg-blue-600 hover:bg-blue-500 font-bold" disabled={testing}>Salvar Configuração</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL GESTÃO DE USUÁRIOS */}
            {userModal.open && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 rounded-lg max-w-2xl w-full p-6 animate-scale-in" style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Usuários no Dispositivo</h3>
                            <div className="flex gap-2">
                                <button
                                    className="btn btn-sm btn-secondary flex items-center gap-1 text-xs"
                                    onClick={async () => {
                                        if (!confirm("Importar estes utilizadores para a base de dados local?")) return;
                                        try {
                                            await fetch('http://localhost:3001/api/hardware/sync-users', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ deviceId: userModal.device.id })
                                            });
                                            alert("Sincronização iniciada! Verifique a página de Utentes.");
                                        } catch (e) { alert("Erro: " + e.message); }
                                    }}
                                >
                                    <RefreshCw size={14} /> Sincronizar Tudo
                                </button>
                                <button onClick={() => setUserModal({ open: false, device: null, users: [] })} className="text-gray-400 hover:text-white"><XCircle size={24} /></button>
                            </div>
                        </div>

                        <div className="flex-grow overflow-y-auto bg-gray-900 rounded p-2 border border-gray-700">
                            <table className="w-full text-left font-mono text-sm">
                                <thead className="text-gray-500 border-b border-gray-700 sticky top-0 bg-gray-900">
                                    <tr>
                                        <th className="p-2">ID</th>
                                        <th className="p-2">Nome</th>
                                        <th className="p-2">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userModal.users.map(u => (
                                        <tr key={u.id} className="border-b border-gray-800 hover:bg-gray-800">
                                            <td className="p-2">{u.id}</td>
                                            <td className="p-2">{u.name}</td>
                                            <td className="p-2 flex gap-2">
                                                <button onClick={() => handleUserAction(u, 'block')} className="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded border border-red-900 hover:bg-red-900">Bloquear</button>
                                                <button onClick={() => handleUserAction(u, 'unblock')} className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded border border-green-900 hover:bg-green-900">Desbloquear</button>
                                            </td>
                                        </tr>
                                    ))}
                                    {userModal.users.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-muted">Nenhum utente encontrado na catraca.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .input { background: #1f2937; border: 1px solid #374151; border-radius: 0.375rem; padding: 0.5rem; color: white; }
                .input:focus { outline: 2px solid #2563eb; border-color: transparent; }
            `}</style>
        </div>
    );
};

export default Hardware;
