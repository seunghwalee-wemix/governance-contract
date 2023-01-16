
// const addr = require('../mainnet_gov.json');

const fs = require('fs');

async function impersonateMember(hre, addrPath, newMemberAddr){
    const ethers = hre.ethers;
    const addr_file = fs.readFileSync(addrPath);
    const addr = JSON.parse(addr_file);
    const signers = await ethers.getSigners();
    const sender = signers[0];
    /* hardhat and ethers.js console command */
    //test account open (hardhat feat)
    const newNode = await ethers.getImpersonatedSigner(newMemberAddr)

    //send to balance for deposit
    await sender.sendTransaction({to: newNode.address, value:'1501000'+'0'.repeat(18), gasPrice : '110'+'0'.repeat(9)})

    //use util function : string -> bytes32 encoding
    const B322S = ethers.utils.formatBytes32String;

    //open contract
    registry = await ethers.getContractAt('Registry', addr.REGISTRY_ADDRESS)
    gov = await ethers.getContractAt('GovImp', await registry.getContractAddress(B322S('GovernanceContract')))
    staking = await ethers.getContractAt('StakingImp', await registry.getContractAddress(B322S('Staking')))

    //deposit
    await staking.connect(newNode).deposit({value:'1500000'+'0'.repeat(18)})
}

module.exports = { impersonateMember };