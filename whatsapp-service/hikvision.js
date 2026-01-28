const DigestFetch = require('digest-fetch');
// Polyfill manual caso a lib precise
const fetch = require('node-fetch');

class HikvisionService {
    constructor(ip, user, password) {
        this.baseUrl = `http://${ip}`;
        // Correção para importar corretamente a classe dependendo da versão
        const DigestAuthFetch = DigestFetch.default || DigestFetch;
        this.client = new DigestAuthFetch(user, password);
    }

    async testConnection() {
        try {
            // Tenta obter informações do dispositivo
            const response = await this.client.fetch(`${this.baseUrl}/ISAPI/System/deviceInfo`, { method: 'GET' });
            if (response.ok) {
                const text = await response.text();
                // Simples check XML ou JSON
                return { success: true, data: text };
            }
            return { success: false, status: response.status };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Abrir porta remotamente
    async remoteOpenDoor(doorId = 1) {
        const xmlBody = `<RemoteControlDoor><cmd>open</cmd></RemoteControlDoor>`;
        try {
            const response = await this.client.fetch(`${this.baseUrl}/ISAPI/AccessControl/RemoteControl/door/${doorId}`, {
                method: 'PUT',
                body: xmlBody,
                headers: { 'Content-Type': 'application/xml' }
            });
            return response.ok;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    // Adicionar Utilizador (Sincronizar base de dados com catraca)
    async addUser(userId, name, userType = 'normal') {
        const body = JSON.stringify({
            UserInfo: {
                employeeNo: userId.toString(),
                name: name,
                userType: userType,
                Valid: {
                    enable: true,
                    beginTime: "2024-01-01T00:00:00",
                    endTime: "2030-01-01T00:00:00" // A gestão de validade será feita bloqueando o user, não mudando datas
                }
            }
        });

        const response = await this.client.fetch(`${this.baseUrl}/ISAPI/AccessControl/UserInfo/Record?format=json`, {
            method: 'POST',
            body: body
        });
        return response.json();
    }
}

module.exports = HikvisionService;
