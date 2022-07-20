/* codeTypeOperation
 * 26: virement
 * 00: virement en ma faveur
 * 50: prelevement
 * 78: cotisation
 * 52: paiement carte
 * 22: remboursement pret
 * 06: avoir
 */

const TransactionType = {
    PaymentTo: '26',
    PaymentFrom: '00',
    Debit: '50',
    Contribution: '78',
    CardPayment: '52',
    LoanRepayment: '22',
    Credit: '06',
    Unknown: null
}

const codeToTransactionType = (code) => {
    const key = Object.keys(TransactionType).find(key => TransactionType[key] === code);
    return key ? TransactionType[key] : TransactionType.Unknown;
}

const codeToTransactionTypeName = (code) => {
    const key = Object.keys(TransactionType).find(key => TransactionType[key] === code);
    return key ? key : 'Unknown';
}

module.exports = {
    TransactionType,
    codeToTransactionType,
    codeToTransactionTypeName
};