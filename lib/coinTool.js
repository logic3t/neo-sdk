const rpcTools = require('./rpcTools.js');
const UTXO = require('./UTXO.js');
const OldUTXO = require('./OldUTXO.js');

module.exports = {
    ID_GAS: "0x602c79718b16e442de58778e148d0b1084e3b2dffd5de6b7b16cee7969282de7",
    ID_NEO: "0xc56f33fc6ecfcd0c225c4ab356fee59390af8560be0e930faebe74a6daff7c9b",
    ID_SGAS: '74f2dc36a68fdc4682034178eb2220729231db76',
    ID_NNC: 'fc732edee1efdf968c23c20a9628eaa5a6ccb934',
    DAPP_NNC: "fc732edee1efdf968c23c20a9628eaa5a6ccb934",
    ID_ECT: 'e41bf464feedae9409f19671a773860ceafcd300',

    initAllAsset: async function(){
        let allassets = await rpcTools.api_getAllAssets();
        for (let a in allassets) {
            let asset = allassets[a];
            let names = asset.name;
            let id = asset.id;
            let name = "";
            if (id == this.ID_GAS) {
                name = "GAS";
            }
            else if (id == this.ID_NEO) {
                name = "NEO";
            }
            else if (id == this.ID_SGAS) {
                name = "CGAS";
            }
            else if (id == this.ID_ECT) {
                name = "ECT";
            }
            else {
                for (let i in names) {
                    name = names[i].name;
                    if (names[i].lang == "en")
                        break;
                }
            }
            this.assetID2name[id] = name;
            this.name2assetID[name] = id;
        }
    },

    getassets: async function(addr) {
        let height = await rpcTools.api_getHeight();
        let utxos = await rpcTools.api_getUTXO(addr);
        let olds = OldUTXO.getOldutxos();
        let olds2 = [];
        for (let n = 0; n < olds.length; n++) {
            const old = olds[n];
            let findutxo = false;
            for (let i = 0; i < utxos.length; i++) {
                let utxo = utxos[i];
                if (utxo.txid == old.txid) {
                    console.log(old);
                    console.log(utxo);
                    console.log(height - old.height);
                }
                if (utxo.txid + "".includes(old.txid) && old.n == utxo.n && height - old.height < 3) {
                    findutxo = true;
                    utxos.splice(i, 1);
                }
            }
            if (findutxo) {
                olds2.push(old);
            }
        }
        OldUTXO.setOldutxos(olds2);
        let assets = {};
        for (let i in utxos) {
            let item = utxos[i];
            let asset = item.asset;
            if (assets[asset] == undefined || assets[asset] == null) {
                assets[asset] = [];
            }
            let utxo = new UTXO();
            utxo.addr = item.addr;
            utxo.asset = item.asset;
            utxo.n = item.n;
            utxo.txid = item.txid;
            utxo.count = Neo.Fixed8.parse(item.value);
            assets[asset].push(utxo);
        }
        return assets;
    },

    makeTran: function(utxos, targetaddr, assetid, sendcount, payfee = false) {
        let res = {};
        let us = utxos[assetid];
        let gasutxos = utxos[this.ID_GAS];
        if (us == undefined) {
            throw new Error("no enough money.");
        }
        let tran = new ThinNeo.Transaction();
        tran.type = ThinNeo.TransactionType.ContractTransaction;
        tran.version = 0;
        tran.extdata = null;
        tran.attributes = [];
        utxos[assetid].sort((a, b) => {
            return b.count.compareTo(a.count);
        });
        let old = [];
        tran.outputs = [];
        tran.inputs = [];
        let fee = Neo.Fixed8.parse('0.001');
        let sumcount = Neo.Fixed8.Zero;
        if (gasutxos) {
            for (let i = 0; i < gasutxos.length; i++) {
                sumcount.add(gasutxos[i].count);
            }
        }
        if (gasutxos && this.ID_GAS == assetid) {
            let tranRes = this.creatInuptAndOutup(gasutxos, sendcount, targetaddr);
            tran.inputs = tranRes.inputs;
            tran.outputs = tranRes.outputs;
            if (payfee && tran.outputs && tran.outputs.length > 1) {
                tran.outputs[1].value = tran.outputs[1].value.subtract(fee);
            }
        }
        else {
            if (payfee && gasutxos) {
                let feeRes = this.creatInuptAndOutup(gasutxos, fee);
                tran.inputs = tran.inputs.concat(feeRes.inputs);
                tran.outputs = tran.outputs.concat(feeRes.outputs);
            }
            let tranRes = this.creatInuptAndOutup(us, sendcount, targetaddr);
            tran.inputs = tran.inputs.concat(tranRes.inputs);
            tran.outputs = tran.outputs.concat(tranRes.outputs);
        }
        if (tran.witnesses == null)
            tran.witnesses = [];
        for (const i in tran.inputs) {
            const input = tran.inputs[i];
            old.push(new OldUTXO(input.hash.reverse().toHexString(), input.index));
        }
        res.err = false;
        res.info = { "tran": tran, "oldarr": old };
        return res;
    },

    creatInuptAndOutup: function(utxos, sendcount, target) {
        let count = Neo.Fixed8.Zero;
        let res = {};
        res["inputs"] = [];
        res["outputs"] = [];
        res["oldutxo"] = [];
        let scraddr = "";
        let assetId;
        for (let i = 0; i < utxos.length; i++) {
            let input = new ThinNeo.TransactionInput();
            input.hash = utxos[i].txid.hexToBytes();
            input.index = utxos[i].n;
            input["_addr"] = utxos[i].addr;
            res.inputs.push(input);
            count = count.add(utxos[i].count);
            scraddr = utxos[i].addr;
            assetId = utxos[i].asset.hexToBytes().reverse();
            let old = new OldUTXO(utxos[i].txid, utxos[i].n);
            res.oldutxo.push(old);
            if (count.compareTo(sendcount) > 0) {
                break;
            }
        }
        if (count.compareTo(sendcount) >= 0) {
            if (target) {
                if (sendcount.compareTo(Neo.Fixed8.Zero) > 0) {
                    let output = new ThinNeo.TransactionOutput();
                    output.assetId = assetId;
                    output.value = sendcount;
                    output.toAddress = ThinNeo.Helper.GetPublicKeyScriptHash_FromAddress(target);
                    res.outputs.push(output);
                }
            }
            let change = count.subtract(sendcount);
            if (change.compareTo(Neo.Fixed8.Zero) > 0) {
                let outputchange = new ThinNeo.TransactionOutput();
                outputchange.toAddress = ThinNeo.Helper.GetPublicKeyScriptHash_FromAddress(scraddr);
                outputchange.value = change;
                outputchange.assetId = assetId;
                res.outputs.push(outputchange);
            }
            return res;
        }
        else {
            throw "You don't have enough utxo;";
        }
    },

    signData: async function(tran, addr, pubkey, prikey) {
        try {
            let msg = tran.GetMessage().clone();
            let signdata = ThinNeo.Helper.Sign(msg, prikey);
            tran.AddWitness(signdata, pubkey);
            let data = tran.GetRawData();
            return data;
        }
        catch (error) {
            throw "Signature interrupt";
        }
    },

    rawTransaction: async function(addr, targetaddr, asset, count, pubkey, prikey) {
        let _count = Neo.Fixed8.parse(count + "");
        let utxos = await this.getassets();
        try {
            let tranres = this.makeTran(utxos, targetaddr, asset, _count);
            let tran = tranres.info['tran'];
            if (tran.witnesses == null)
                tran.witnesses = [];
            let txid = tran.GetTxid();
            let data;
            let res = {};
            try {
                data = await this.signData(tran, addr, pubkey, prikey);
                let height = await rpcTools.api_getHeight();
                let olds = tranres.info['oldarr'];
                olds.map(old => old.height = height);
                OldUTXO.oldutxosPush(olds);
                let result = await rpcTools.api_postRawTransaction(data);
                if (result["sendrawtransactionresult"]) {
                    res.err = !result;
                    res.info = txid;
                }
                return res;
            }
            catch (error) {
                res.err = true;
                res.info = txid;
                return res;
            }
        }
        catch (error) {
            console.log("error  input");
            throw error;
        }
    },

    claimgas: async function(addr, pubkey, prikey) {
        let claimtxhex = await rpcTools.api_getclaimtxhex(addr);
        let tran = new ThinNeo.Transaction();
        let buf = claimtxhex.hexToBytes();
        tran.Deserialize(new Neo.IO.BinaryReader(new Neo.IO.MemoryStream(buf.buffer, 0, buf.byteLength)));
        let data = await this.signData(tran, addr, pubkey, prikey);
        let result = await rpcTools.api_postRawTransaction(data);
        return result;
    },

    contractInvokeTrans: async function(script, addr, pubkey, prikey) {
        let assetid = this.ID_GAS;
        let utxos = await this.getassets(addr);
        let tranmsg = this.makeTran(utxos, addr, assetid, Neo.Fixed8.Zero);
        let tran = tranmsg.info['tran'];
        tran.type = ThinNeo.TransactionType.InvocationTransaction;
        tran.extdata = new ThinNeo.InvokeTransData();
        tran.extdata.script = script;
        if (tran.witnesses == null)
            tran.witnesses = [];
        let data = await this.signData(tran, addr, pubkey, prikey);
        let res = {};
        let result = await rpcTools.api_postRawTransaction(data);
        res.err = !result;
        res.info = "成功";
        return res;
    },

    nep5Transaction: async function(asset, address, tatgeraddr, amount, pubkey, prikey, method = 'transfer') {
        let intv = amount.toFixed(8).replace(".", "");
        let sb = new ThinNeo.ScriptBuilder();
        let scriptaddress = asset.hexToBytes().reverse();
        let random_uint8 = Neo.Cryptography.RandomNumberGenerator.getRandomValues(new Uint8Array(32));
        let random_int = Neo.BigInteger.fromUint8Array(random_uint8);
        let params = [];
        if(address){
            params.push('(address)' + address);
        }
        if(tatgeraddr){
            params.push('(address)' + tatgeraddr);
        }
        if(intv){
            params.push('(integer)' + intv);
        }
        sb.EmitPushNumber(random_int);
        sb.Emit(ThinNeo.OpCode.DROP);
        sb.EmitParamJson(params);
        sb.EmitPushString(method);
        sb.EmitAppCall(scriptaddress);
        let result = await this.contractInvokeTrans_attributes(sb.ToArray(), address, pubkey, prikey);
        return result;
    },

    getavailableutxos: async function(count, cur_addr) {
        let utxos = await rpcTools.getavailableutxos(cur_addr, count);
        let assets = {};
        let addr = ThinNeo.Helper.GetAddressFromScriptHash(Neo.Uint160.parse(this.ID_SGAS));
        let asset = this.ID_GAS;
        assets[asset] = [];
        for (let i in utxos) {
            let item = utxos[i];
            let utxo = new UTXO();
            utxo.addr = addr;
            utxo.asset = asset;
            utxo.n = item.n;
            utxo.txid = item.txid;
            utxo.count = Neo.Fixed8.parse(item.value);
            assets[asset].push(utxo);
        }
        return assets;
    },

    buildScript: function(appCall, method, param) {
        let sb = new ThinNeo.ScriptBuilder();
        sb.EmitParamJson(param);
        sb.EmitPushString(method);
        sb.EmitAppCall(appCall);
        return sb.ToArray();
    },

    contractInvokeScript: async function(appCall, method, ...param) {
        let data = this.buildScript(appCall, method, param);
        return await rpcTools.rpc_getInvokescript(data);
    },

    contractInvokeTrans_attributes: async function(script, addr, pubkey, prikey, payfee = false) {
        let utxos = await this.getassets(addr);
        let gass = utxos[this.ID_GAS];
        let tran = new ThinNeo.Transaction();
        tran.inputs = [];
        tran.outputs = [];
        tran.type = ThinNeo.TransactionType.InvocationTransaction;
        tran.extdata = new ThinNeo.InvokeTransData();
        tran.extdata.script = script;
        tran.attributes = new Array(1);
        tran.attributes[0] = new ThinNeo.Attribute();
        tran.attributes[0].usage = ThinNeo.TransactionAttributeUsage.Script;
        tran.attributes[0].data = ThinNeo.Helper.GetPublicKeyScriptHash_FromAddress(addr);
        let feeres;
        if (gass && payfee) {
            feeres = this.creatInuptAndOutup(gass, Neo.Fixed8.fromNumber(0.001));
            tran.inputs = feeres.inputs.map(input => {
                input.hash = input.hash.reverse();
                return input;
            });
            tran.outputs = feeres.outputs;
        }
        if (tran.witnesses == null)
            tran.witnesses = [];
        let data = await this.signData(tran, addr, pubkey, prikey);
        let txid = tran.GetTxid();
        let res = {
            data: data.toHexString(),
            txid: txid
        };
        if (feeres && feeres.oldutxo) {
            OldUTXO.oldutxosPush(feeres.oldutxo);
        }
        return res;
    },

    contractInvokeTrans: async function(...param) {
        let script = param[0];
        let have = param.length > 1;
        let addr = have ? param[1] : null;
        let assetid = have ? param[2] : this.ID_GAS;
        let count = have ? param[3] : Neo.Fixed8.Zero;
        let pubkey = have ? param[4] : null;
        let prikey = have ? param[5] : null;
        if(!addr || !pubkey || !prikey){
            return ;
        }
        let utxos = await this.getassets();
        let tranmsg = this.makeTran(utxos, addr, assetid, count);
        let tran = tranmsg.info['tran'];
        tran.type = ThinNeo.TransactionType.InvocationTransaction;
        tran.extdata = new ThinNeo.InvokeTransData();
        tran.extdata.script = script;
        tran.extdata.gas = Neo.Fixed8.fromNumber(0);
        try {
            let data = await this.signData(tran, addr, pubkey, prikey);
            let height = await rpcTools.api_getHeight();
            let result = await rpcTools.api_postRawTransaction(data);
            if (result["sendrawtransactionresult"]) {
                let olds = tranmsg.info['oldarr'];
                olds.map(old => old.height = height);
                OldUTXO.oldutxosPush(olds);
                return result["txid"];
            }
            else {
                throw "Transaction send failure";
            }
        }
        catch (error) {
        }
    },
};
