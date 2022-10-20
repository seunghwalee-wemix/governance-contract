// We require the Buidler Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `buidler run <script>` you'll find the Buidler
// Runtime Environment's members available in the global scope.

// const { LedgerSigner } = require("@anders-t/ethers-ledger");
const fs = require("fs");
const GL = 30000000; //21000 * 1500;

const { largeToString } = require("./utils");

async function deployGov(hre) {
    const ethers = hre.ethers;

    const BigNumber = ethers.BigNumber; //require('bignumber.js');

    const U2B = ethers.utils.toUtf8Bytes;
    const U2S = ethers.utils.toUtf8String;

    const B322S = ethers.utils.formatBytes32String;
    const amount = "1500000000000000000000000";//largeToString(fakeData.members[0].stake);

    // deployer = await ethers.Wallet.fromEncryptedJson(JSON.stringify(accs[0]), pw); //accs[0];
    // deployer = deployer.connect(ethers.provider);
    // // deployer = deployer.connect(ethers.provider);
    // const deployerAddress = deployer.address; //await deployer.getAddress();

    // let accounts = await Promise.all(
    //     accs.map((acc) => {
    //         return ethers.Wallet.fromEncryptedJson(JSON.stringify(acc), pw).then();
    //     })
    // );
    // console.log("unlock accounts fin");
    // for (i = 0; i < accounts.length; i++) {
    //     accounts[i] = accounts[i].connect(ethers.provider);
    // }

    let signers = await ethers.getSigners();
    let deployer = signers.shift();
    let accounts = signers;

    let fakeData ={};
    fakeData.staker = deployer.address;
    fakeData.ecosystem = deployer.address;
    fakeData.maintenance = deployer.address;
    fakeData.members = [];

    let member = {
        "addr": deployer.address,
        "staker": deployer.address,
        "voter": deployer.address,
        "reward": deployer.address,
        "stake": amount,
        "name": "nxt-"+0,
        "id": "0x20055aa3c3b31fa73fa989972070dff5a66e19e764c3aed9f8e741dd49637af2d3190961b20417fc71b3f98a2a11c45e04afaf4111a46ef8b3089df9f9a7520"+0,
        "ip": "10.29.2.1"+0,
        "port": 9101,
        "bootnode": true
      }
      fakeData.members.push(member)
      console.log(accounts.length)
    for(let i = 0;i<accounts.length;i++){
        let member = {
            "addr": accounts[i].address,
            "staker": accounts[i].address,
            "voter": accounts[i].address,
            "reward": accounts[i].address,
            "stake": amount,
            "name": "nxt-"+(i+1),
            "id": "0x"+(i+1)+"20055aa3c3b31fa73fa989972070dff5a66e19e764c3aed9f8e741dd49637af2d3190961b20417fc71b3f98a2a11c45e04afaf4111a46ef8b3089df9f9a7520000",
            "ip": "10.29.2.1"+(i+1),
            "port": 9101,
            "bootnode": false
          }
          fakeData.members.push(member)
    }


    let txs = [];

    // const signer0 = (await hre.ethers.getSigners())[0];
    // await signer0.sendTransaction({to:deployerAddress, value:'1600000'+'0'.repeat(18)})
    // deployer = deployer.connect(ethers.provider);
    deployerAddress = deployer.address
    console.log("deployer ", deployerAddress);
    // console.log("acc1 ", accounts[1].address);
    // console.log("acc2 ", accounts[2].address);
    // console.log("acc3 ", accounts[3].address);
    let txParam = { gasLimit: GL, gasPrice: "110" + "0".repeat(9) };
    let Registry = await hre.ethers.getContractFactory("Registry", deployer);
    let EnvStorageImp = await hre.ethers.getContractFactory("EnvStorageImp", deployer);
    let Staking = await hre.ethers.getContractFactory("Staking", deployer);
    let BallotStorage = await hre.ethers.getContractFactory("BallotStorage", deployer);
    let EnvStorage = await hre.ethers.getContractFactory("EnvStorage", deployer);
    let GovImp = await hre.ethers.getContractFactory("GovImp", deployer);
    let StakingImp = await hre.ethers.getContractFactory("StakingImp", deployer);
    console.log("deploy reg, envimp");
    // const [registry, envStorageImp, stakingImp] = await Promise.all([
    const registry = await Registry.connect(deployer).deploy({ gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice });
    const envStorageImp = await EnvStorageImp.connect(deployer).deploy({ gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice }); //await EnvStorageImp.new();
    const stakingImp = await StakingImp.connect(deployer).deploy({ gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice }); //await EnvStorageImp.new();
    // ]);
    // console.log("Waiting reg, envimp")
    // await Promise.all([ registry.connect(deployer).deployed(), envStorageImp.connect(deployer).deployed()])
    console.log("registry", registry.address, "envStorageImp", envStorageImp.address, "stakingImp", stakingImp.address);

    console.log("deploy staking, ballotStorage, envStorage, govImp");
    // const [staking, ballotStorage, envStorage, govImp] = await Promise.all([
    const staking = await Staking.connect(deployer).deploy(stakingImp.address, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice }); //await Staking.new(registry.address,"");
    const ballotStorage = await BallotStorage.connect(deployer).deploy(registry.address, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice }); //await BallotStorage.new(registry.address);
    const envStorage = await EnvStorage.connect(deployer).deploy(envStorageImp.address, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice });
    const govImp = await GovImp.connect(deployer).deploy({ gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice });
    // ]);
    // console.log(staking)
    // let receipt = await txParam
    console.log("staking", staking.address, "ballotStorage", ballotStorage.address, "envStorage", envStorage.address, "govImp", govImp.address);

    let Gov = await hre.ethers.getContractFactory("Gov", deployer);
    const gov = await Gov.connect(deployer).deploy(govImp.address, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice });

    console.log("Gov", gov.address);
    const stakingDelegator = await hre.ethers.getContractAt("StakingImp", staking.address, deployer);

    // console.log("Waiting for receipt...")
    // await Promise.all([staking.connect(deployer).deployed(), ballotStorage.connect(deployer).deployed(), envStorage.connect(deployer).deployed(), govImp.connect(deployer).deployed(), gov.connect(deployer).deployed()]);

    // Initialize environment storage
    envDelegator = await hre.ethers.getContractAt("EnvStorageImp", envStorage.address, deployer); //EnvStorageImp.at(envStorage.address);

    console.log("stakingamout", amount);
    const envParams = {
        blocksPer: 1,
        ballotDurationMin: 86400, // 1 day
        ballotDurationMax: 604800, // 7 days
        stakingMin: amount, // 1,500,000 wemix
        stakingMax: amount, // 1,500,000 wemix
        MaxIdleBlockInterval: 5,
        blockCreationTime: 1000, // 1000 ms = 1 sec
        blockRewardAmount: "1000000000000000000", // 1 wemix
        maxPriorityFeePerGas: "100000000000", // 100 gwei
        blockRewardDistributionBlockProducer: 4000, // 40%
        blockRewardDistributionStakingReward: 1000, // 10%
        blockRewardDistributionEcosystem: 2500, // 25%
        blockRewardDistributionMaintenance: 2500, // 25%
        maxBaseFee: "5000000000000", // 50000 gwei
        blockGasLimit: "1050000000", // 21000 gas/tx * 5000 tx
        baseFeeMaxChangeRate: 55,
        gasTargetPercentage: 30,
    };

    // const envParams2 = {
    //     blockRewardDistributionBlockProducer: 4000, // 40%
    //     blockRewardDistributionStakingReward: 1000, // 10%
    //     blockRewardDistributionEcosystem: 2500, // 25%
    //     blockRewardDistributionMaintenance: 2500, // 25%
    //     maxBaseFee: "5000000000000", // 50000 gwei
    //     blockGasLimit: "1050000000", // 21000 gas/tx * 5000 tx
    //     baseFeeMaxChangeRate: 55,
    //     gasTargetPercentage: 30,
    // };

    // const txs = await Promise.all([
    console.log("set reg", staking.address);
    tx = await registry.connect(deployer).setContractDomain(B322S("Staking"), staking.address, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice });
    
    console.log("set reg", envStorage.address);
    tx = await registry
        .connect(deployer)
        .setContractDomain(B322S("EnvStorage"), envStorage.address, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice });
    
    console.log("set reg", ballotStorage.address);
    tx = await registry
        .connect(deployer)
        .setContractDomain(B322S("BallotStorage"), ballotStorage.address, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice });
    
    console.log("set reg", gov.address);
    tx = await registry
        .connect(deployer)
        .setContractDomain(B322S("GovernanceContract"), gov.address, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice });
    
    console.log("set reg", fakeData.staker);
    tx = await registry
        .connect(deployer)
        .setContractDomain(B322S("StakingReward"), fakeData.staker, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice });
    
    console.log("set reg", fakeData.ecosystem);
    tx = await registry
        .connect(deployer)
        .setContractDomain(B322S("Ecosystem"), fakeData.ecosystem, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice });
    
    console.log("set reg", fakeData.maintenance);
    tx = await registry.connect(deployer).setContractDomain(B322S("Maintenance"), fakeData.maintenance, {
        gasLimit: txParam.gasLimit,
        gasPrice: txParam.gasPrice,
    });

    await registry.transferOwnership('0xFe4dEedf067209864FC387D160f233c66664fC59')
    await deployer.sendTransaction({to:'0xFe4dEedf067209864FC387D160f233c66664fC59',value:"100"+'0'.repeat(18)})
    console.log("reg owner :",await registry.owner())
    
    console.log("reg end");
    // ]);

    const envNames = Object.keys(envParams);
    let envNamesBytes = [];

    for (let i = 0; i < envNames.length; i++) {
        envNamesBytes.push(ethers.utils.keccak256(U2B(envNames[i])));
    }
    const envVariables = Object.values(envParams);

    // const envNames2 = Object.keys(envParams2);
    // let envNamesBytes2 = [];

    // for (let i = 0; i < envNames2.length; i++) {
    //     envNamesBytes2.push(ethers.utils.keccak256(U2B(envNames2[i])));
    // }
    // const envVariables2 = Object.values(envParams2);
    txParam = { gasLimit: GL, gasPrice: "110" + "0".repeat(9) };
    console.log("Init env storage");
    // console.log(registry.address, envNamesBytes, envVariables);

    tx = await envDelegator
        .connect(deployer)
        .initialize(registry.address, envNamesBytes, envVariables, { gasLimit: txParam.gasLimit, gasPrice: "110" + "0".repeat(9) });
    // console.log(tx);
    // tx = await envDelegator.connect(deployer).initialize2(envNamesBytes2, envVariables2, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice});
    // console.log(tx);
    
    // // Initialize for staking
    // console.log("staking amount ", amount.toString());
    // txParam = { gasLimit: GL, gasPrice: "110" + "0".repeat(9) };
    tx = await stakingDelegator.connect(deployer).init(registry.address, "0x", { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice });
    
    tx = await stakingDelegator.connect(deployer).deposit({ value: amount, gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice });
    

    for(let i=0;i<accounts.length;i++){
        tx = await stakingDelegator.connect(accounts[i]).deposit({ value: amount, gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice });
    }
    // Initialize governance
    txParam = { gasLimit: GL, gasPrice: "110" + "0".repeat(9) };

    govDelegator = await hre.ethers.getContractAt("GovImp", gov.address, deployer); //await GovImp.at(govDelegator.address);
    // Initialize governance
    console.log("init gov", registry.address);
    // let data = getInitOnceData(fakeData, ethers);
    

    let data = getInitOnceData(fakeData, ethers, 1, 40);
    console.log("initonce")
    tx = await govDelegator.initOnce(registry.address, amount, data, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice });

    // data = getInitOnceData(fakeData, ethers, 10, 17);
    // console.log("initonce")
    // tx = await govDelegator.initOnce(amount, data, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice });

    // data = getInitOnceData(fakeData, ethers, 19, 28);
    // console.log("initonce")
    // tx = await govDelegator.initOnce(amount, data, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice });

    // data = getInitOnceData(fakeData, ethers, 28, 37);
    // console.log("initonce")
    // tx = await govDelegator.initOnce(amount, data, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice });

    // data = getInitOnceData(fakeData, ethers, 37, 40);
    // console.log("initonce")
    // tx = await govDelegator.initOnce(amount, data, { gasLimit: txParam.gasLimit, gasPrice: txParam.gasPrice });
    
    txs.push(registry.deployTransaction);
    txs.push(envStorage.deployTransaction);
    txs.push(envStorageImp.deployTransaction);
    txs.push(ballotStorage.deployTransaction);
    txs.push(staking.deployTransaction);
    txs.push(stakingImp.deployTransaction);
    txs.push(gov.deployTransaction);
    txs.push(govImp.deployTransaction);
    
}
function getInitOnceData(data, ethers, start, end) {
    const U2B = ethers.utils.toUtf8Bytes;
    var nodes = "0x";

    for (var i = start, l = end; i < l; i++) {
        var m = data.members[i],
            id,
            staker,
            voter,
            reward;
        if (m.id.length != 128 && m.id.length != 130) {
            m.id = m.id.substr(0, 130)
        }
        id = m.id.length == 128 ? m.id : m.id.substr(2);
        staker = m.staker; //.indexOf("0x") != 0 ? m.staker : m.staker.substr(2);
        voter = m.voter; //.indexOf("0x") != 0 ? m.voter : m.voter.substr(2);
        reward = m.reward; //.indexOf("0x") != 0 ? m.reward : m.reward.substr(2);

        nodes +=
            ethers.utils.hexZeroPad(staker, 32).substr(2) +
            ethers.utils.hexZeroPad(voter, 32).substr(2) +
            ethers.utils.hexZeroPad(reward, 32).substr(2) +
            packNum(m.name.length).substr(2) +
            ethers.utils.hexlify(U2B(m.name)).substr(2) +
            packNum(id.length / 2).substr(2) +
            id +
            packNum(m.ip.length).substr(2) +
            ethers.utils.hexlify(U2B(m.ip)).substr(2) +
            packNum(m.port).substr(2);
    }
    return nodes;
}

function packNum(num) {
    return ethers.utils.hexZeroPad(ethers.utils.hexlify(num), 32);
}

module.exports = { deployGov };
