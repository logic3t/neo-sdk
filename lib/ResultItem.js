const DataType = require("./DataType.js");

class ResultItem {
    static FromJson(type, value) {
        let item = new ResultItem();
        if (type === DataType.Array) {
            item.subItem = [];
            for (let i = 0; i < value.length; i++) {
                let subjson = value[i];
                let subtype = subjson["type"];
                item.subItem.push(ResultItem.FromJson(subtype, subjson["value"]));
            }
        }
        else if (type === DataType.ByteArray) {
            item.data = value.hexToBytes();
        }
        else if (type === DataType.Integer) {
            item.data = Neo.BigInteger.parse(value).toUint8Array();
        }
        else if (type === DataType.Boolean) {
            if (value != 0)
                item.data = new Uint8Array(0x01);
            else
                item.data = new Uint8Array(0x00);
        }
        else if (type === DataType.String) {
            item.data = ThinNeo.Helper.String2Bytes(value);
        }
        else {
            console.log("not support type:" + type);
        }
        return item;
    }
    AsHexString() {
        return (this.data).toHexString();
    }
    AsHashString() {
        return "0x" + this.data.reverse().toHexString();
    }
    AsString() {
        return ThinNeo.Helper.Bytes2String(this.data);
    }
    AsHash160() {
        if (this.data.length === 0)
            return null;
        return new Neo.Uint160(this.data.buffer);
    }
    AsHash256() {
        if (this.data.length === 0)
            return null;
        return new Neo.Uint256(this.data.buffer);
    }
    AsBoolean() {
        if (this.data.length === 0 || this.data[0] === 0)
            return false;
        return true;
    }
    AsInteger() {
        return new Neo.BigInteger(this.data);
    }
}

module.exports = ResultItem;