# README
   neo 钱包SDK

## SDK 使用

### 初始化
    sdk.init(api);
       api neo节点地址

### 创建钱包       
    sdk.createWallet(passwd);
        passwd 钱包密码
        返回 
            addr 钱包地址
            wif  wif
            nep2 nep2
            pubkey 公钥
            prikey  私钥

### 区块链交易           
    sdk.transferNep5(assetId, addr, to, amount, pubkey, prikey);
        assetId 合约id
        addr 转出地址
        to 转入地址
        amount 数量
        pubkey 公钥
        prikey 私钥
