const resultItem = require("./lib/ResultItem.js");
const DataType = require("./lib/DataType.js");
const rpcTools = require('./lib/rpcTools.js');
const coinTool = require('./lib/coinTool.js');
const neo = require("./lib/neo-ts.js");
const scrypt = require("./lib/scrypt-async.js");

module.exports = {

    /**
     * 初始化sdk
     * @param api 全局资产api
     * @param apiaggr nep5资产api
     */
    init: function(api){
        if(api){
            rpcTools.api = api;
            rpcTools.api_aggr = api;
        }

        // 初始化全局变量
        global.ThinNeo = neo.ThinNeo;
        global.Neo = neo.Neo;
        global.scrypt = scrypt;
    },


    /**
     * 创建钱包账号
     * @param passwd
     * @returns {Promise<unknown>}
     */
    createWallet: async function(passwd = '123456') {
        console.log("[Easy]", '[SDK]', 'Create ...');
        let array = new Uint8Array(32);
        let key = Neo.Cryptography.RandomNumberGenerator.getRandomValues(array);
        let pubkey = ThinNeo.Helper.GetPublicKeyFromPrivateKey(key);
        let addr = ThinNeo.Helper.GetAddressFromPublicKey(pubkey);

        let scrypt = new ThinNeo.nep6ScryptParameters();
        scrypt.N = 16384;
        scrypt.r = 8;
        scrypt.p = 8;
        return await new Promise((resove, reject)=>{
            ThinNeo.Helper.GetNep2FromPrivateKey(key, passwd, scrypt.N, scrypt.r, scrypt.p, (info, result) => {
                if (info == "finish") {
                    console.log("[Easy]", '[SDK]', 'Create Done');
                    let wif = ThinNeo.Helper.GetWifFromPrivateKey(key);
                    resove({addr: addr, wif: wif, nep2: result, pubkey: pubkey.toString(), prikey: key.toString()});
                }else{
                    reject();
                }
            });
        })
    },

    /**
     * 查询资产总量
     * @param assetId 资产ID，也是合约的hash
     * @returns {Promise<*>}
     */
    getTotalSupply: async function(assetId){
        let res = await rpcTools.getNep5Asset(assetId);
        let totalsupply = res['totalsupply'];
        return parseFloat(totalsupply);
    },

    /**
     * 调用合约查询接口
     * @param assetId 资产ID，也是合约的hash
     * @param method 合约的指令名
     * @param addr 用户neo地址
     * @returns {Promise<*>}
     */
    getContractBalances: async function(assetId, addr , method = 'balanceOf') {
        let asid = Neo.Uint160.parse(assetId.replace("0x", ""));
        addr = `(address)${addr}`;
        let res = await coinTool.contractInvokeScript(asid, method, addr);
        let stackArr = res["stack"];
        let stack = resultItem.FromJson(DataType.Array, stackArr).subItem[0];
        let balances = (stack.AsInteger() / 100000000).toFixed(8);
        return parseFloat(balances);
    },

    /**
     * 销毁币
     * @param assetID 资产ID，也是合约的hash
     * @param addr 用户neo地址
     * @param amount 数量
     * @returns {Promise<*>}
     */
    burn: async function(assetId, addr, amount, pubkey, prikey) {
        let value = parseFloat(amount);
        let res = await coinTool.nep5Transaction(assetId, addr, null, value, pubkey, prikey, 'burn');
        return res;
    },

    /**
     * 查询余额
     * @param addr 用户neo地址
     * @returns {Promise<void>}
     */
    getBalances: async function(addr) {
        let bal = {};
        let [balances, claims, claims2, nep5balances, height] = await Promise.all([
            rpcTools.api_getBalance(addr),
            rpcTools.api_getclaimgas(addr, 0),
            rpcTools.api_getclaimgas(addr, 1),
            rpcTools.api_getnep5Balance(addr),
            rpcTools.api_getHeight()
        ]);

        if (balances) {
            let sum1 = Neo.Fixed8.parse(claims["gas"].toFixed(8));
            let sum2 = Neo.Fixed8.parse(claims2["gas"].toFixed(8));
            let sum = sum1.add(sum2).toString();
            bal.claim = sum;
            balances.forEach(balance => {
                if (balance.asset == coinTool.ID_NEO) {
                    bal.neo = balance.balance;
                }
                if (balance.asset == coinTool.ID_GAS) {
                    bal.gas = balance.balance;
                }
            });
        }
        if (nep5balances) {
            const ect = '0x' + coinTool.ID_ECT;
            console.log("Keys:", ect);
            Object.keys(nep5balances).filter((keys) => {
                if (nep5balances[keys].assetId == ect) {
                    bal.ectBalance = nep5balances[keys].balance;
                    return true;
                }
                return false;
            });
        }
        bal.height = height;
        return bal;
    },

    /**
     * nep5交易
     * @param assetId 资产ID，也是合约的hash
     * @param addr 当前用户neo地址
     * @param to 目标用户neo地址
     * @param amount 数量
     * @param pubkey 公钥
     * @param prikey 私钥
     * @returns {Promise<string>}
     */
    transferNep5: async function(assetId, addr, to, amount, pubkey, prikey) {
        let value = parseFloat(amount);
        let res = await coinTool.nep5Transaction(assetId, addr, to, value, pubkey, prikey);
        return res;
    },

    /**
     * 链上交易
     * @param data 交易数据
     * @returns {Promise<void>}
     */
    postRawTransaction: async function(data){
        let res = {};
        try {
            let result = await rpcTools.api_postRawTransaction(data);
            res.err = !result["sendrawtransactionresult"];
        }
        catch (error) {
            res.err = true;
        }
        return res;
    },

    /**
     * 全局资产交易，如neo gas
     * @param assetId 资产ID，也是合约的hash
     * @param addr 当前用户neo地址
     * @param to 目标用户neo地址
     * @param amount 数量
     * @param pubkey 公钥
     * @param prikey 私钥
     * @returns {Promise<string>}
     */
    transferGlobalAsset: async function(assetId, addr, to, amount, pubkey, prikey) {
        let res = await coinTool.rawTransaction(addr, to, assetId, amount, pubkey, prikey);
        return JSON.stringify(res);
    },

    /**
     * 根据wif获取公/私钥
     * @param wif
     * @returns {{prikey: *, pubkey: *}}
     */
    getKeyFromWif(wif){
        let prikey = ThinNeo.Helper.GetPrivateKeyFromWIF(wif);
        let pubkey = ThinNeo.Helper.GetPublicKeyFromPrivateKey(prikey);
        return {pubkey, prikey};
    }
};
