import React, { useState, useEffect } from 'react';
import { Smartphone, RefreshCw, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const WhatsAppConnect = () => {
    const [status, setStatus] = useState('loading'); // loading, disconnected, qr_ready, ready
    const [qrCode, setQrCode] = useState(null);
    const [testNumber, setTestNumber] = useState('');
    const [logs, setLogs] = useState([]);

    const BOT_API = '/api/whatsapp';

    const checkStatus = async () => {
        try {
            const res = await fetch(`${BOT_API}/status`);
            if (!res.ok) throw new Error('Falha no pedido');

            const data = await res.json();

            if (data.connected) {
                setStatus('ready');
                setQrCode(null);
            } else if (data.qr) {
                setStatus('qr_ready');
                setQrCode(data.qr);
            } else {
                setStatus('disconnected');
            }
        } catch (error) {
            setStatus('error');
            // Silencia erro na consola para nao spammar
        }
    };

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 3000); // Poll every 3 seconds
        return () => clearInterval(interval);
    }, []);

    const sendTestMessage = async () => {
        if (!testNumber) return alert('Introduza um número');
        try {
            const res = await fetch(`${BOT_API}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: testNumber,
                    message: 'Olá! Esta é uma mensagem de teste do Hefel Gym System. 🏋️‍♂️'
                })
            });

            if (res.ok) {
                const result = await res.json();
                alert('Mensagem enviada com sucesso!');
                setLogs(prev => [`[${new Date().toLocaleTimeString()}] Enviado para ${testNumber}`, ...prev]);
            } else {
                const err = await res.json();
                alert('Erro: ' + (err.error || 'Falha ao enviar'));
            }
        } catch (e) {
            alert('Erro de conexão com o bot.');
        }
    };

    return (
        <div className="whatsapp-page animate-fade-in">
            <div className="page-header">
                <div className="header-title">
                    <h2>Integração WhatsApp</h2>
                    <p>Conecte o sistema ao seu telemóvel para envio automático</p>
                </div>
                <div className={`status-badge ${status}`}>
                    {status === 'ready' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span>{status === 'ready' ? 'SISTEMA ONLINE' : status === 'qr_ready' ? 'AGUARDANDO LEITURA' : 'DESCONECTADO'}</span>
                </div>
            </div>

            <div className="grid-2">
                <div className="card">
                    <h3 className="card-title mb-4">Estado da Conexão</h3>

                    <div className="connection-area">
                        {status === 'error' && (
                            <div className="error-box">
                                <p>⚠️ O Servidor do Bot não está a correr.</p>
                                <p className="text-sm mt-2">Por favor abra um terminal na pasta <code>hefelgym/whatsapp-service</code> e execute:</p>
                                <code className="block mt-2 p-2 bg-dark rounded">npm start</code>
                            </div>
                        )}

                        {status === 'qr_ready' && qrCode && (
                            <div className="qr-container">
                                <p className="mb-4">Abra o WhatsApp no telemóvel {'>'} Menu {'>'} Aparelhos conectados {'>'} Conectar</p>
                                <QRCodeSVG value={qrCode} size={256} className="qr-image bg-white p-2" />
                            </div>
                        )}

                        {status === 'ready' && (
                            <div className="success-box">
                                <Smartphone size={48} className="text-success mb-2" />
                                <h3>Tudo Pronto!</h3>
                                <p className="text-muted">O seu WhatsApp está conectado e pronto para enviar mensagens.</p>
                            </div>
                        )}

                        {status === 'loading' || (status === 'disconnected' && !qrCode) && (
                            <div className="loading-box">
                                <RefreshCw className="spin" size={32} />
                                <p>A carregar estado...</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <h3 className="card-title mb-4">Teste de Envio</h3>
                    <div className="form-group mb-4">
                        <label>Número de Destino (Moçambique)</label>
                        <input
                            type="text"
                            className="input w-full"
                            placeholder="Ex: 841234567"
                            value={testNumber}
                            onChange={e => setTestNumber(e.target.value)}
                        />
                    </div>
                    <button
                        className="btn btn-primary w-full"
                        disabled={status !== 'ready'}
                        onClick={sendTestMessage}
                    >
                        <Send size={18} style={{ marginRight: '8px' }} /> Enviar Teste
                    </button>

                    <div className="logs-area mt-6">
                        <h4>Histórico Recente</h4>
                        <div className="logs-list">
                            {logs.length === 0 && <p className="text-sm text-muted">Nenhum envio nesta sessão.</p>}
                            {logs.map((log, i) => <div key={i} className="log-item">{log}</div>)}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .whatsapp-page { max-width: 1000px; margin: 0 auto; }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
                .card { background: var(--bg-card); padding: 2rem; border-radius: var(--radius); border: 1px solid var(--border); height: 100%; }
                .status-badge { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 20px; font-weight: bold; font-size: 0.9rem; }
                .status-badge.ready { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
                .status-badge.error, .status-badge.disconnected { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
                .status-badge.qr_ready { background: rgba(234, 179, 8, 0.2); color: #eab308; }
                
                .connection-area { min-height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
                .qr-image { width: 250px; height: 250px; border: 10px solid white; border-radius: 8px; }
                .error-box { color: var(--danger); }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                
                .logs-area { margin-top: 2rem; border-top: 1px solid var(--border); padding-top: 1rem; }
                .log-item { font-size: 0.85rem; color: var(--text-muted); padding: 0.25rem 0; border-bottom: 1px dashed var(--border); }
            `}</style>
        </div>
    );
};

export default WhatsAppConnect;
