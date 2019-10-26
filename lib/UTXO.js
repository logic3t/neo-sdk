class UTXO {
    static ArrayToString(utxos) {
        let str = "";
        let obj = [];
        for (let i = 0; i < utxos.length; i++) {
            obj.push({});
            obj[i].n = utxos[i].n;
            obj[i].addr = utxos[i].addr;
            obj[i].txid = utxos[i].txid;
            obj[i].asset = utxos[i].asset;
            obj[i].count = utxos[i].count.toString();
        }
        return obj;
    }
    static StringToArray(obj) {
        let utxos = new Array();
        for (let i = 0; i < obj.length; i++) {
            utxos.push(new UTXO());
            let str = obj[i].count;
            utxos[i].n = obj[i].n;
            utxos[i].addr = obj[i].addr;
            utxos[i].txid = obj[i].txid;
            utxos[i].asset = obj[i].asset;
            utxos[i].count = Neo.Fixed8.parse(str);
        }
        return utxos;
    }
    static setAssets(assets) {
        let obj = {};
        for (let asset in assets) {
            let arr = UTXO.ArrayToString(assets[asset]);
            obj[asset] = arr;
        }
        sessionStorage.setItem("current-assets-utxos", JSON.stringify(obj));
    }
    static getAssets() {
        let assets = null;
        let str = sessionStorage.getItem("current-assets-utxos");
        if (str !== null && str != undefined && str != '') {
            assets = JSON.parse(str);
            for (const asset in assets) {
                assets[asset] = UTXO.StringToArray(assets[asset]);
            }
        }
        return assets;
    }
}

module.exports = UTXO;