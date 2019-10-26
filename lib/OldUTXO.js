
let oldUtxos = null;

class OldUTXO {

    constructor(txid, n) {
        this.n = n;
        this.txid = txid;
        // todo
        this.height = 0;
    }

    static oldutxosPush(olds) {
        let arr = this.getOldutxos();
        oldUtxos = JSON.stringify(arr.concat(olds));
    }

    static setOldutxos(olds) {
        oldUtxos = JSON.stringify(olds);
    }

    static getOldutxos() {
        let arr = [];
        let str = oldUtxos;
        if (str)
            arr = JSON.parse(str);
        return arr;
    }

    compareUtxo(utxo) {
        return this.txid == utxo.txid && this.n == utxo.n;
    }
}

module.exports = OldUTXO;