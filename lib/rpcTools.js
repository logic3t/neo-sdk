const fetch = require("node-fetch");

module.exports = {
    api: 'https://api.nel.group/api/testnet',
    apiaggr: 'https://apiwallet.nel.group/api/testnet',

    makeRpcUrl: function(url, method, ..._params) {
        if (url[url.length - 1] != '/')
            url = url + "/";
        let urlout = url + "?jsonrpc=2.0&id=1&method=" + method + "&params=[";
        for (let i = 0; i < _params.length; i++) {
            urlout += JSON.stringify(_params[i]);
            if (i != _params.length - 1)
                urlout += ",";
        }
        urlout += "]";
        return urlout;
    },

    makeRpcPostBody: function(method, ..._params) {
        let body = {};
        body["jsonrpc"] = "2.0";
        body["id"] = 1;
        body["method"] = method;
        let params = [];
        for (let i = 0; i < _params.length; i++) {
            params.push(_params[i]);
        }
        body["params"] = params;
        return body;
    },

    gettransbyaddress: async function(address, pagesize, pageindex) {
        let postdata = this.makeRpcPostBody("gettransbyaddress", address, pagesize, pageindex);
        let result = await fetch(this.apiaggr, { "method": "post", "body": JSON.stringify(postdata) });
        let json = await result.json();
        let r = json["result"];
        return r;
    },

    gettransbyaddressnew: async function(address, pagesize, pageindex) {
        let postdata = this.makeRpcPostBody("gettransbyaddressNew", address, pagesize, pageindex);
        let result = await fetch(this.apiaggr, { "method": "post", "body": JSON.stringify(postdata) });
        let json = await result.json();
        let r = json["result"];
        return r ? r : [];
    },

    api_getHeight: async function() {
        let str = this.makeRpcUrl(this.api, "getblockcount");
        let result = await fetch(str, { "method": "get" });
        let json = await result.json();
        let r = json["result"];
        let height = parseInt(r[0]["blockcount"]) - 1;
        return height;
    },

    api_getBlockInfo: async function(index) {
        let str = this.makeRpcUrl(this.api, "getblocktime", index);
        let result = await fetch(str, { "method": "get" });
        let json = await result.json();
        let r = json["result"];
        let time = parseInt(r[0]["time"]);
        return time;
    },

    api_getAllAssets: async function() {
        let str = this.makeRpcUrl(this.api, "getallasset");
        let result = await fetch(str, { "method": "get" });
        let json = await result.json();
        let r = json["result"];
        return r;
    },

    api_getUTXO: async function(address) {
        let str = this.makeRpcUrl(this.api, "getutxo", address);
        let result = await fetch(str, { "method": "get" });
        let json = await result.json();
        let r = json["result"];
        return r;
    },

    api_hasclaimgas: async function(address) {
        let postdata = this.makeRpcPostBody("hasclaimgas", address);
        let result = await fetch(this.apiaggr, { "method": "post", "body": JSON.stringify(postdata) });
        let json = await result.json();
        let r = json["result"];
        return r;
    },

    api_claimgas: async function(address, num) {
            let postdata = this.makeRpcPostBody("claimgas", address, num);
            let result = await fetch(this.apiaggr, { "method": "post", "body": JSON.stringify(postdata) });
            let json = await result.json();
            let r = json["result"];
            return r;
    },

    api_getnep5Balance: async function(address) {
        let str = this.makeRpcUrl(this.api, "getallnep5assetofaddress", address, 1);
        let result = await fetch(str, { "method": "get" });
        let json = await result.json();
        let r = json["result"];
        return r;
    },

    api_getBalance: async function(address) {
        let str = this.makeRpcUrl(this.api, "getbalance", address);
        let value = await fetch(str, { "method": "get" });
        let json = await value.json();
        let r = json["result"];
        return r;
    },

    getNep5Asset: async function(asset) {
        let postdata = this.makeRpcPostBody("getnep5asset", asset);
        console.log('postdata: ', postdata);
        let result = await fetch(this.api, { "method": "post", "body": JSON.stringify(postdata) });
        let json = await result.json();
        if (json["result"]) {
            let r = json["result"][0];
            return r;
        }
        else {
            throw "not data";
        }
    },

    getnep5balanceofaddress: async function(asset, address) {
        let postdata = this.makeRpcPostBody("getnep5balanceofaddress", asset, address);
        let result = await fetch(this.api, { "method": "post", "body": JSON.stringify(postdata) });
        let json = await result.json();
        let r = json["result"][0];
        return r;
    },

    api_getAddressTxs: async function(address, size, page) {
        let postdata = this.makeRpcPostBody("getaddresstxs", address, size, page);
        let result = await fetch(this.api, { "method": "post", "body": JSON.stringify(postdata) });
        let json = await result.json();
        let r = json["result"];
        return r;
    },

    api_postRawTransaction: async function(data) {
        console.log("===================================这里是交易体的 Hex========" + data);
        let postdata = this.makeRpcPostBody("sendrawtransaction", data);
        let result = await fetch(this.api, { "method": "post", "body": JSON.stringify(postdata) });
        let json = await result.json();
        if (json["result"]) {
            let r = json["result"][0];
            return r;
        }
        else {
            throw json['error'];
        }
    },

    api_getclaimgas: async function(address, type = 0) {
        let str = this.makeRpcUrl(this.api, "getclaimgas", address, type);
        let result = await fetch(str, { "method": "get" });
        let json = await result.json();
        let r = json["result"];
        if (r == undefined)
            return { gas: 0 };
        return r[0];
    },

    api_getclaimtxhex: async function(address) {
        let str = this.makeRpcUrl(this.api, "getclaimtxhex", address);
        let result = await fetch(str, { "method": "get" });
        let json = await result.json();
        let r = json["result"];
        if (r == undefined)
            return "";
        return r[0]["claimtxhex"];
    },

    rpc_getHeight: async function() {
        let str = this.makeRpcUrl(this.api, "getblockcount");
        let result = await fetch(str, { "method": "get" });
        let json = await result.json();
        let r = json["result"];
        let height = parseInt(r) - 1;
        return height;
    },

    rpc_getStorage: async function(scripthash, key) {
        let str = this.makeRpcUrl(this.api, "getstorage", scripthash.toHexString(), key.toHexString());
        let result = await fetch(str, { "method": "get" });
        let json = await result.json();
        if (json["result"] == null)
            return null;
        let r = json["result"];
        return r;
    },

    rpc_getInvokescript: async function(scripthash) {
        let str = this.makeRpcUrl(this.api, "invokescript", scripthash.toHexString());
        console.log(str);
        let result = await fetch(str, { "method": "get" });
        let json = await result.json();
        if (json["result"] == null)
            return null;
        let r = json["result"][0];
        return r;
    },

    getrawtransaction: async function(txid) {
        let str = this.makeRpcUrl(this.api, "getrawtransaction", txid);
        let result = await fetch(str, { "method": "get" });
        let json = await result.json();
        if (!json["result"])
            return null;
        let r = json["result"][0];
        return r;
    },

    getnep5transferbytxid: async function(txid) {
        let str = this.makeRpcUrl(this.api, "getnep5transferbytxid", txid);
        let result = await fetch(str, { "method": "get" });
        let json = await result.json();
        if (!json["result"])
            return null;
        let r = json["result"][0];
        return r;
    },

    api_getcontractstate: async function(scriptaddr) {
        let str = this.makeRpcUrl(this.api, "getcontractstate", scriptaddr);
        let value = await fetch(str, { "method": "get" });
        let json = await value.json();
        let r = json["result"][0];
        return r;
    },

    api_getbonushistbyaddress: async function(address, currentpage, pagesize) {
        let postdata = this.makeRpcPostBody("getbonushistbyaddress", address, currentpage, pagesize);
        let result = await fetch(this.apiaggr, { "method": "post", "body": JSON.stringify(postdata) });
        let json = await result.json();
        let r = json["result"][0];
        return r;
    },

    getavailableutxos: async function(address, count) {
        let postdata = this.makeRpcPostBody("getavailableutxos", address, count);
        let result = await fetch(this.apiaggr, { "method": "post", "body": JSON.stringify(postdata) });
        let json = await result.json();
        let r = json["result"];
        return r;
    },

    rechargeandtransfer: async function(data1, data2) {
        let postdata = this.makeRpcPostBody("rechargeandtransfer", data1.toHexString(), data2.toHexString());
        let result = await fetch(this.apiaggr, { "method": "post", "body": JSON.stringify(postdata) });
        let json = await result.json();
        let r = json["result"][0];
        return r;
    },

    getrechargeandtransfer: async function(txid) {
        let postdata = this.makeRpcPostBody("getrechargeandtransfer", txid);
        let result = await fetch(this.apiaggr, { "method": "post", "body": JSON.stringify(postdata) });
        let json = await result.json();
        let r = json["result"][0];
        return r;
    },

    getNotify: async function(txid) {
        let postdata = this.makeRpcPostBody("getnotify", txid);
        let result = await fetch(this.api, { "method": "post", "body": JSON.stringify(postdata) });
        let json = await result.json();
        let r = json["result"][0];
        return r;
    },

    hastx: async function(txid) {
        let postdata = this.makeRpcPostBody("hastx", txid);
        let result = await fetch(this.apiaggr, { "method": "post", "body": JSON.stringify(postdata) });
        let json = await result.json();
        let r = json["result"][0];
        return r;
    },

    hascontract: async function(txid) {
        let postdata = this.makeRpcPostBody("hascontract", txid);
        let result = await fetch(this.apiaggr, { "method": "post", "body": JSON.stringify(postdata) });
        let json = await result.json();
        let r = json["result"][0];
        return r;
    },

    getbonushistbyaddress: async function(address, page, pagesize) {
        let postdata = this.makeRpcPostBody("getbonushistbyaddress", address, page, pagesize);
        let result = await fetch(this.apiaggr, { "method": "post", "body": JSON.stringify(postdata) });
        let json = await result.json();
        if (json["result"]) {
            let r = json["result"][0];
            return r;
        }
        else {
            throw "not data";
        }
    },

    getbonusbyaddress: async function(address, page, pagesize) {
        let postdata = this.makeRpcPostBody("getbonusbyaddress", address, page, pagesize);
        let result = await fetch(this.apiaggr, { "method": "post", "body": JSON.stringify(postdata) });
        let json = await result.json();
        if (json["result"]) {
            let r = json["result"][0];
            return r;
        }
        else {
            throw "not data";
        }
    },

    getcurrentbonus: async function(addr) {
        let postdata = this.makeRpcPostBody("getcurrentbonus", addr);
        let result = await fetch(this.apiaggr, { "method": "post", "body": JSON.stringify(postdata) });
        let json = await result.json();
        if (json["result"]) {
            let r = json["result"][0];
            return r;
        }
        else {
            throw "not data";
        }
    },

    applybonus: async function(addr) {
        let postdata = this.makeRpcPostBody("applybonus", addr);
        let result = await fetch(this.apiaggr, { "method": "post", "body": JSON.stringify(postdata) });
        let json = await result.json();
        if (json["result"]) {
            let r = json["result"][0];
            return r;
        }
        else {
            throw "not data";
        }
    }
};
