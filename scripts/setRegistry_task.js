// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.

const { LedgerSigner } = require("@anders-t/ethers-ledger");
const fs = require("fs");
const GL = 30000000; //21000 * 1500;
// const {LedgerHelper} = require('./LedgerUtils');

const { largeToString } = require("./utils");

async function setRegistry(hre, configPath) {
    const deploy_config_file = fs.readFileSync(configPath);
    const deploy_config = JSON.parse(deploy_config_file);
    const ethers = hre.ethers;

    const B322S = ethers.utils.formatBytes32String;

    deployer = new LedgerSigner(ethers.provider, null);
    // deployer = deployer.connect(ethers.provider);
    const deployerAddress = await deployer.getAddress();

    let txs = [];

    // const signer0 = (await hre.ethers.getSigners())[0];
    // await signer0.sendTransaction({to:deployerAddress, value:'1600000'+'0'.repeat(18)})
    // deployer = deployer.connect(ethers.provider);
    console.log("deployer ", deployerAddress);
    

    const registry = await ethers.getContractAt('Registry', deploy_config.REGISTRY_ADDRESS);
    console.log("Registry address : ",registry.address);

    const txParam = {gasLimit : GL, gasPrice : '110'+'0'.repeat(9)};
    console.log("before staking reward :",await registry.getContractAddress(B322S("StakingReward")))
    console.log("set staking reward", deploy_config.staker);
    tx = await registry
        .connect(deployer)
        .setContractDomain(B322S("StakingReward"), deploy_config.staker, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice });
    txs.push(tx);
    await tx.wait();
    console.log("after staking reward :",await registry.getContractAddress(B322S("StakingReward")))
    console.log("end");

    let txFile = {};
    txFile.txs = txs;
    let receiptFile = {};
    fs.writeFileSync("./setStaking_tx.json", JSON.stringify(txFile, null, 2), "utf-8");
    receipts = [];
    for (i = 0; i < txs.length; i++) {
        hash = txs[i].hash;
        receipt = await ethers.provider.getTransactionReceipt(hash);
        receipts.push(receipt);
        if (receipt == null || receipt.status == 0) {
            console.log(i, "is not ok");
        } else {
            console.log(i, "is ok");
        }
    }
    receiptFile.receipts = receipts;

    fs.writeFileSync("./setStaking_tx_receipts.json", JSON.stringify(receiptFile, null, 2), "utf-8");
    console.log("write setStaking_tx_receipts.json end");

}



module.exports = { setRegistry };
