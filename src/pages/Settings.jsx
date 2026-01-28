import React, { useState, useEffect, useRef } from 'react';
import { Save, Building, Trash2, CloudUpload, QrCode, Server, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { db } from '../services/db';
import { QRCodeSVG } from 'qrcode.react';

const Settings = () => {
    // Estado do Sistema
    const [systemConfig, setSystemConfig] = useState({ gymId: null, status: 'loading' });
    const [newGymId, setNewGymId] = useState('');

    // Estado do WhatsApp
    const [waStatus, setWaStatus] = useState({ connected: false, qr: null });
    const qrRef = useRef(null);

    // Estado do Formulário (Dados da Empresa - Dinâmico)
    const [companyInfo, setCompanyInfo] = useState({
        name: '', nuit: '', address: '', logo: '', ivaRate: 3
    });

    // Listas Dinâmicas
    const [contacts, setContacts] = useState([]);
    const [payments, setPayments] = useState([]);

    const MOZ_PAYMENT_TYPES = [
        "M-Pesa", "e-Mola", "Millennium BIM", "BCI", "Standard Bank",
        "Moza Banco", "Absa", "Nedbank", "Access Bank", "POS", "Numerário", "Outro"
    ];

    useEffect(() => {
        loadSystemConfig();
        const cleanupPolling = setupWhatsAppStream();
        loadCompanyData();

        return () => {
            if (cleanupPolling) cleanupPolling();
        };
    }, []);

    // 1. Carregar Configuração do Backend
    const loadSystemConfig = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/config');
            if (res.ok) {
                const data = await res.json();
                setSystemConfig({ gymId: data.gymId, status: 'ok' });
            } else {
                setSystemConfig({ gymId: null, status: 'error' });
            }
        } catch (e) {
            setSystemConfig({ gymId: null, status: 'offline' });
        }
    };

    const handleConfigureGym = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('http://localhost:3001/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gymId: newGymId })
            });
            if (res.ok) {
                alert("Ginásio Configurado com Sucesso!");
                loadSystemConfig();
            } else {
                alert("Erro ao configurar.");
            }
        } catch (e) { alert("Erro de conexão."); }
    };

    // 2. WhatsApp Status (Polling)
    const setupWhatsAppStream = () => {
        const checkStatus = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/whatsapp/status');
                if (res.ok) {
                    const data = await res.json();
                    setWaStatus({
                        connected: data.connected,
                        qr: data.connected ? null : data.qr
                    });
                } else {
                    setWaStatus({ connected: false, qr: null, error: true });
                }
            } catch (e) {
                setWaStatus({ connected: false, qr: null, error: true });
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 3000);
        return () => clearInterval(interval);
    };

    const handleDisconnectWA = async () => {
        if (!confirm("Tem a certeza?")) return;
        await fetch('http://localhost:3001/api/whatsapp/disconnect', { method: 'POST' });
        setWaStatus({ connected: false, qr: null });
        setTimeout(setupWhatsAppStream, 2000);
    };

    // 3. Dados da Empresa
    const loadCompanyData = () => {
        const data = JSON.parse(localStorage.getItem('hefel_company_v3') || '{}');
        setCompanyInfo({
            name: data.name || '',
            nuit: data.nuit || '',
            address: data.address || '',
            logo: data.logo || '',
            ivaRate: data.ivaRate !== undefined ? data.ivaRate : 3
        });

        if (data.contacts && Array.isArray(data.contacts) && data.contacts.length > 0) {
            setContacts(data.contacts);
        } else {
            setContacts([{ type: 'Telemóvel', value: '' }]);
        }

        if (data.payments && Array.isArray(data.payments) && data.payments.length > 0) {
            setPayments(data.payments);
        } else {
            setPayments([]); // Começa vazio
        }
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_HEIGHT = 150;
                    let width = img.width; let height = img.height;
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                    canvas.width = width; canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    setCompanyInfo(prev => ({ ...prev, logo: canvas.toDataURL('image/jpeg', 0.8) }));
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveCompany = (e) => {
        e.preventDefault();
        const companyData = { ...companyInfo, contacts, payments };
        localStorage.setItem('hefel_company_v3', JSON.stringify(companyData));
        alert('Dados da empresa salvos localmente!');
        window.location.reload();
    };

    // Helpers
    const addContact = () => setContacts([...contacts, { type: 'Telemóvel', value: '' }]);
    const removeContact = (idx) => setContacts(contacts.filter((_, i) => i !== idx));
    const updateContact = (idx, field, val) => {
        const newC = [...contacts]; newC[idx][field] = val; setContacts(newC);
    };

    const addPayment = () => setPayments([...payments, { name: 'M-Pesa', value: '', isCustom: false }]);
    const removePayment = (idx) => setPayments(payments.filter((_, i) => i !== idx));
    const updatePayment = (idx, field, val) => {
        const newP = [...payments]; newP[idx][field] = val; setPayments(newP);
    };

    // Novo Helper para Selector de Banco
    const updatePaymentType = (idx, val) => {
        const newP = [...payments];
        newP[idx].name = val === 'Outro' ? '' : val;
        newP[idx].isCustom = val === 'Outro';
        setPayments(newP);
    };

    return (
        <div className="settings-page animate-fade-in p-6 h-full overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Server /> Configurações do Sistema</h2>

            {/* STATUS DO SERVIDOR */}
            <div className={`p-4 rounded-lg mb-8 ${systemConfig.status === 'offline' ? 'bg-red-900 border-red-600' : 'bg-gray-800 border-gray-700'} border`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-lg">Servidor Local & Hardware</h3>
                        <p className="text-sm opacity-80">
                            Status: {systemConfig.status === 'offline' ? '🛑 OFFLINE' : '✅ ONLINE (Base de Dados + Controlador)'}
                        </p>
                        {systemConfig.gymId && <p className="text-green-400 font-mono mt-1">ID do Ginásio: {systemConfig.gymId}</p>}
                    </div>
                    {systemConfig.status === 'ok' && !systemConfig.gymId && (
                        <form onSubmit={handleConfigureGym} className="flex gap-2">
                            <input type="text" placeholder="ID do Ginásio" className="bg-gray-900 border border-gray-600 px-3 py-2 rounded text-white" value={newGymId} onChange={e => setNewGymId(e.target.value)} required />
                            <button className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-500">Ativar Sync</button>
                        </form>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* WHATSAPP CONNECT */}
                <div className="card bg-gray-800 p-6 rounded-lg border border-gray-700 h-fit">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><QrCode /> Conexão WhatsApp</h3>
                    {systemConfig.status === 'offline' ? (
                        <p className="text-red-400">Servidor Offline.</p>
                    ) : waStatus.connected ? (
                        <div className="text-center py-8">
                            <div className="bg-green-500/20 text-green-400 p-4 rounded-full inline-block mb-4"><LinkIcon size={48} /></div>
                            <h4 className="text-xl font-bold text-green-400">Conectado!</h4>
                            <p className="text-gray-400 mb-6">Pronto para enviar faturas.</p>
                            <button onClick={handleDisconnectWA} className="text-red-400 hover:text-red-300 underline">Desconectar</button>
                        </div>
                    ) : waStatus.qr ? (
                        <div className="text-center">
                            <div className="bg-white p-4 inline-block rounded-lg mb-4"><QRCodeDisplay value={waStatus.qr} /></div>
                            <p className="text-sm text-gray-400">Escaneie com o seu WhatsApp.</p>
                        </div>
                    ) : (
                        <div className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div><p>A carregar...</p></div>
                    )}
                </div>

                {/* DADOS DA EMPRESA (Dinâmico) */}
                <form onSubmit={handleSaveCompany} className="card bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Building /> Dados para Faturas</h3>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Nome Comercial</label>
                            <input className="w-full bg-gray-700 border-none rounded p-2" value={companyInfo.name} onChange={e => setCompanyInfo({ ...companyInfo, name: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">NUIT</label>
                            <input className="w-full bg-gray-700 border-none rounded p-2" value={companyInfo.nuit} onChange={e => setCompanyInfo({ ...companyInfo, nuit: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Endereço (Sede)</label>
                            <input className="w-full bg-gray-700 border-none rounded p-2" value={companyInfo.address} onChange={e => setCompanyInfo({ ...companyInfo, address: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Taxa de IVA (%)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full bg-gray-700 border-none rounded p-2"
                                value={companyInfo.ivaRate}
                                onChange={e => setCompanyInfo({ ...companyInfo, ivaRate: e.target.value })}
                                placeholder="Ex: 16"
                            />
                        </div>
                    </div>

                    {/* CONTACTOS DINÂMICOS */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs text-blue-400 font-bold uppercase">Contactos</label>
                            <button type="button" onClick={addContact} className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded">+ Adicionar</button>
                        </div>
                        {contacts.map((c, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                                <select className="bg-gray-700 rounded text-sm w-1/3 p-2 border-none" value={c.type} onChange={e => updateContact(idx, 'type', e.target.value)}>
                                    <option>Telemóvel</option><option>Telefone</option><option>Email</option><option>Website</option>
                                </select>
                                <input className="bg-gray-700 rounded text-sm flex-1 p-2 border-none" placeholder="Valor..." value={c.value} onChange={e => updateContact(idx, 'value', e.target.value)} required />
                                <button type="button" onClick={() => removeContact(idx)} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>

                    {/* PAGAMENTOS DINÂMICOS */}
                    <div className="mb-6 border-t border-gray-700 pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs text-green-400 font-bold uppercase">Meios de Pagamento</label>
                            <button type="button" onClick={addPayment} className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded">+ Adicionar</button>
                        </div>

                        {payments.length === 0 && <p className="text-xs text-gray-500 italic mb-2">Nenhum meio de pagamento configurado.</p>}

                        {payments.map((p, idx) => (
                            <div key={idx} className="flex gap-2 mb-2 items-center">
                                {/* Selector de Tipo */}
                                <div className="w-1/3">
                                    {!p.isCustom && MOZ_PAYMENT_TYPES.includes(p.name) ? (
                                        <select
                                            className="bg-gray-700 rounded text-sm w-full p-2 border-none"
                                            value={p.name}
                                            onChange={e => updatePaymentType(idx, e.target.value)}
                                        >
                                            {MOZ_PAYMENT_TYPES.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                                        </select>
                                    ) : (
                                        <div className="flex gap-1" title="Clique para trocar para lista">
                                            <input
                                                className="bg-gray-700 rounded text-sm w-full p-2 border-none ring-1 ring-blue-500"
                                                placeholder="Nome do Banco..."
                                                value={p.name}
                                                onChange={e => updatePayment(idx, 'name', e.target.value)}
                                                autoFocus
                                            />
                                            <button type="button" onClick={() => updatePaymentType(idx, 'M-Pesa')} className="text-xs text-blue-400 px-1 border border-blue-500 rounded">Listar</button>
                                        </div>
                                    )}
                                </div>

                                <input className="bg-gray-700 rounded text-sm flex-1 p-2 border-none" placeholder="Número / NIB" value={p.value} onChange={e => updatePayment(idx, 'value', e.target.value)} />
                                <button type="button" onClick={() => removePayment(idx)} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={16} /></button>
                            </div>
                        ))}
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs text-gray-400 mb-1">Logotipo</label>
                        <div className="border-2 border-dashed border-gray-600 rounded p-4 text-center cursor-pointer hover:border-blue-500 transition-colors" onClick={() => document.getElementById('logo-in').click()}>
                            {companyInfo.logo ? <img src={companyInfo.logo} className="h-12 mx-auto object-contain" /> : <p className="text-xs text-gray-500">Clique para carregar</p>}
                            <input type="file" id="logo-in" hidden accept="image/*" onChange={handleLogoChange} />
                        </div>
                    </div>

                    <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded mt-4 flex items-center justify-center gap-2">
                        <Save size={18} /> Salvar Configurações
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-2">Os dados serão refletidos nas novas faturas.</p>
                </form>

            </div>
        </div>
    );
};
const QRCodeDisplay = ({ value }) => <QRCodeSVG value={value} size={256} className="bg-white p-2 rounded" />;
export default Settings;
