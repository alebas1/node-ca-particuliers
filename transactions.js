const https = require("https");
const fetch = require("node-fetch");
const transactionType = require("./transactionType");

function guessCategory() {
    return undefined;
}

class Transaction {
    constructor(transactionRaw) {
        this.transactionRaw = transactionRaw;

        const dateRaw = new Date(transactionRaw.dateOperation);
        this.date = new Date(
            new Date(dateRaw.setDate(dateRaw.getDate()))
                .setHours(24)
        ).toISOString().split("T")[0];
        this.id = transactionRaw.fitid;
        this.title = transactionRaw.libelleOperation;
        this.amount = transactionRaw.montant;
        this.type = transactionType.codeToTransactionTypeName(transactionRaw.codeTypeOperation);
        this.category = guessCategory();

        delete this.transactionRaw;
    }

    json() {
        return JSON.stringify(this);
    }

}

class Transactions {
    constructor(session, accountIndex, accountType, accountCurrency, dateFrom, dateTo, count) {
        this.session = session;
        this.accountIndex = accountIndex;
        this.accountType = accountType;
        this.accountCurrency = accountCurrency;
        this.dateFrom = dateFrom;
        this.dateTo = dateTo;
        this.count = count;

        this.transactionsList = [];
    }

    json() {
        return JSON.stringify(this);
    }

    [Symbol.iterator]() {
        let index = 0;
        let data = this.transactionsList;
        return { next: () => ({ value: data[index], done: index++ >= data.length }) }
    }

    static async build(session, accountIndex, accountType, accountCurrency, dateFrom, dateTo, count) {
        const transactions = new Transactions(session, accountIndex, accountType, accountCurrency, dateFrom, dateTo, count);
        await transactions.loadTransactions();
        return transactions;
    }

    async loadTransactions() {
        const dateFrom = new Date(this.dateFrom);
        const dateTo = new Date(this.dateTo);

        const tzDateFrom = new Date(dateFrom.setDate(dateFrom.getDate() - 1)).setHours(24);
        const tzDateTo = new Date(dateTo.setDate(dateTo.getDate() - 1)).setHours(24);

        const operationsUrl = `${this.session.url}/operations/synthese/detail-comptes/jcr:content.n3.operations.json`
        const operationsParams = {
            grandeFamilleCode: this.accountType,
            compteIdx: this.accountIndex,
            idDevise: this.accountCurrency.id,
            dateDebut: tzDateFrom,
            dateFin: tzDateTo,
            count: this.count
        }

        const operationsParamsString = Object.keys(operationsParams).map(key => key + '=' + operationsParams[key]).join('&');
        const operationsUrlWithParams = `${operationsUrl}?${operationsParamsString}`;
        const transactionsRes = await fetch(operationsUrlWithParams, {
            method: 'GET',
            headers: {
                'Cookie': this.session.cookies
            },
            agent: new https.Agent({
                rejectUnauthorized: true
            })
        });
        if (transactionsRes.status !== 200) {
            throw new Error(`Error loading operations: ${transactionsRes.status}`);
        }

        const transactions = await transactionsRes.json();
        const transactionsList = transactions['listeOperations'];

        for (const transactionRaw of transactionsList) {
            this.transactionsList.push(new Transaction(transactionRaw));
        }
    }

}

module.exports = Transactions;