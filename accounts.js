const fetch = require('node-fetch');
const https = require("https");
const Transactions = require("./transactions");

class Account {
    constructor(session, accountRaw) {
        this.accountRaw = accountRaw;

        this.session = session;
        this.balance = accountRaw.montantEpargne || this.accountRaw.solde;
        this.number = accountRaw.numeroCompte;
        this.product = { short: accountRaw.libelleUsuelProduit.trim(), long: accountRaw.libelleProduit };
        this.currency = { id: accountRaw.idDevise, word: accountRaw.libelleDevise };
        this.ownerName = accountRaw.libellePartenaire.trim();
        this.index = accountRaw.index;
        this.type = accountRaw.grandeFamilleProduitCode;

        delete this.accountRaw;
    }

    /**
     * Get the transactions of the account.
     * @param dateFrom
     * @param dateTo
     * @param count
     * @returns {Promise<Transactions>}
     */
    async getTransactions(dateFrom = undefined, dateTo = undefined, count = 100) {
        if (dateTo === undefined) {
            const currentDate = new Date();

            const previousDateDelta = 30;
            const previousDate = (
                d => new Date(d.setDate(d.getDate()-previousDateDelta))
            )(new Date);

            dateFrom = previousDate.toISOString().split('T')[0];
            dateTo = currentDate.toISOString().split('T')[0];
        }

        return await Transactions.build(this.session, this.index, this.type, this.currency, dateFrom, dateTo, count);
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

    static async getAccounts(session) {
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
        for (const accountRaw of accounts) {
            yield await new Account(this.session, accountRaw);
        }
    }

    getAccount(accountNumber) {
        return this.accountList.find(account => account.number === accountNumber);
    }

    getTotalBalance() {
        const totalBalance = this.accountList.reduce((total, account) => total + account.getBalance(), 0);
        return totalBalance.toFixed(2);
    }
}

module.exports = Accounts;