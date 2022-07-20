const fetch = require('node-fetch');
const FormData = require('form-data');
const https = require("https");

class Authenticator {
    constructor(username, password, region, cookies = '') {
        this.username = username;
        this.password = password;
        this.region = region;
        this.cookies = cookies;
        this.url = `https://www.credit-agricole.fr/ca-${this.region}/particulier`;
    }

    /**
     * Creates a session and loads the cookies
     * @param username
     * @param password
     * @param region
     * @returns {Promise<Authenticator>}
     */
    static async createSession(username, password, region) {
        const session = new Authenticator(username, password, region);
        await session.loadCookies();
        return session;
    }

    /**
     * Logging out the user and deleting the cookies
     * @returns {Promise<void>}
     */
    async logout() {
        const logoutUrl = `${this.url}.npc.logout.html?resource=/content/ca/cr866/npc/fr/particulier.html`;
        const sslVerify = true;

        const headers = { 'Cookie': this.cookies }

        const res = await fetch(logoutUrl, {
            method: 'GET',
            headers: headers,
            agent: new https.Agent({
                rejectUnauthorized: sslVerify
            })
        });

        if (res.status !== 200) {
            throw new Error(`Logout failed: ${res.status} - ${res.statusText}`)
        }

        this.cookies = '';
    }

    /**
     * Load the login cookies and the keypad cookies
     * @returns {Promise<void>}
     */
    async loadCookies() {
        if (this.cookies !== '') {
            throw new Error('Cookies already loaded');
        }

        const sslVerify = true;

        // password
        const authKeypadUrl = `${this.url}/acceder-a-mes-comptes.authenticationKeypad.json`;

        const res1 = await fetch(authKeypadUrl, {method: 'POST'});
        if (res1.status !== 200) {
            throw new Error(`Authentication failed: ${res1.status}`);
        }

        const data = await res1.json();
        const keypadId = data.keypadId;
        const mappedPassword = [...this.password].map(c => data.keyLayout.indexOf(c).toString());

        const authKeypadCookies = res1.headers.raw()['set-cookie'].map((entry) => {
            const parts = entry.split(';');
            return parts[0];
        }).join(';');

        // login
        const authUrl = `${this.url}/acceder-a-mes-comptes.html/j_security_check`;

        const payload = {
            'j_password': mappedPassword.join(','),
            'path': '/content/npc/start',
            'j_path_ressource': `%2Fca-${this.region}%2Fparticulier%2Foperations%2Fsynthese.html`,
            'j_username': this.username,
            'keypadId': keypadId,
            'j_validate': 'true',
        }
        const form = new FormData();
        for (const key in payload) {
            form.append(key, payload[key]);
        }

        const headers = {
            'Content-Type': 'multipart/form-data; boundary=' + form.getBoundary(),
            'Cookie': authKeypadCookies
        }

        const res2 = await fetch(authUrl, {
            method: 'POST',
            body: form,
            headers: headers,
            agent: new https.Agent({
                rejectUnauthorized: sslVerify
            })
        });

        if (res2.status !== 200) {
            throw new Error(`Authentication failed: ${res2.status} - ${res2.statusText}`)
        }

        const loginCookies = res2.headers.raw()['set-cookie'].map((entry) => {
            const parts = entry.split(';');
            return parts[0];
        }).join(';')

        // merge authKeyPadCookies and loginCookies
        this.cookies = authKeypadCookies + ';' + loginCookies;
    }
}

module.exports = Authenticator;

/*(async () => {
    const session = await Authenticator.createSession('53941101042', '594565', 'norddefrance');
    console.log(session);

    await session.logout();
    console.log(session)
})();*/