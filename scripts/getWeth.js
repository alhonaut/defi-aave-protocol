const { ethers } = require("hardhat");

const Amount = ethers.parseEther("0.01");

async function getWeth() {
    const signer = await ethers.provider.getSigner();
    // 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
    const iWeth = await ethers.getContractAt("IWeth", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", signer);

    const tx = await iWeth.deposit({ value: Amount });
    await tx.wait(1);
    const wethBalance = await iWeth.balanceOf(signer.address);
    console.log(wethBalance.toString());
}

module.exports = { getWeth, Amount };