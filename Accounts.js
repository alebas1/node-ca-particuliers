const fetch = require('node-fetch');
const https = require("https");

class Account {
    constructor(session, accountDescription) {
        this.session = session;
        this.accountDescription = accountDescription;
    }

    getBalance() {
        // if there is a field called "montantEpargne"
        if (this.accountDescription.montantEpargne) {
            return this.accountDescription.montantEpargne;
        }
        return this.accountDescription.solde;
    }

}

class Accounts {
    static accountTypes = [
        {"code": 1, "familleProduit": "COMPTES"},
        {"code": 3, "familleProduit": "EPARGNE_DISPONIBLE"},
        {"code": 7, "familleProduit": "EPARGNE_AUTRE"},
    ]

    constructor(session) {
        this.session = session;
        this.accountList = [];
    }

    [Symbol.iterator]() {
        let index = 0;
        let data = this.accountList;
        return { next: () => ({ value: data[index], done: index++ >= data.length }) }
    }

    static async build(session) {
        const accounts = new Accounts(session);
        await accounts.loadAccounts();
        return accounts;
    }

    async loadAccounts() {
        for (const accountType of Accounts.accountTypes) {
            for await (const account of this.loadAccount(accountType)) {
                this.accountList.push(account);
            }
        }
    }

    async *loadAccount(accountType) {
        console.log('loading an account')
        const operationsUrl = `${this.session.url}/operations/synthese/jcr:content.produits-valorisation.json/${accountType.code}`;
        const sslVerify = true;

        const headers = { 'Cookie': this.session.cookies }

        const res = await fetch(operationsUrl, {
            method: 'GET',
            headers: headers,
            agent: new https.Agent({
                rejectUnauthorized: sslVerify
            })
        });

        if (res.status !== 200) {
            throw new Error(`Account loading failed: ${res.status} - ${res.statusText}`);
        }

        const accounts = await res.json();
        for (const accountDescription of accounts) {
            yield await new Account(this.session, accountDescription);
        }
    }

    getTotalBalance() {
        const totalBalance = this.accountList.reduce((total, account) => total + account.getBalance(), 0);
        return totalBalance.toFixed(2);
    }
}

(async () => {
    const Authenticator = require('./Authenticator');
    const session = await Authenticator.createSession('53941101042', '594565', 'norddefrance');

    const accounts = await Accounts.build(session);
    console.log('accountList length  ::  ' + accounts.accountList.length);

    for (const account of accounts) {
        console.log(account.getBalance());
    }

    await session.logout();
})();