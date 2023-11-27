const { getWeth, Amount } = require("./getWeth");
const { ethers, getNamedAccounts } = require("hardhat");


async function main() {
    // get Wrapped ETH from WETH mainnet contract
    await getWeth();

    // intercating with aave protocol
    const signer = await ethers.provider.getSigner();

    const pool = await getPool(signer);
    const WethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    await approveERC20(WethTokenAddress, pool.runner.address, Amount, signer);

    console.log("Depositing...");
    await pool.deposit(WethTokenAddress, Amount, signer.address, 0);
    console.log("Tokens succesfully deployed!");

    let { availableBorrowsETH, totalDebtETH } = await getBorrowUserData(pool, signer)
    const daiPrice = await getDaiPrice()
    const amountDaiToBorrow = availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toNumber())
    const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString())
    console.log(`You can borrow ${amountDaiToBorrow.toString()} DAI`)
    await borrowDai(
        networkConfig[network.config.chainId].daiToken,
        pool,
        amountDaiToBorrowWei,
        signer
    )
    await getBorrowUserData(pool, signer)
    await repay(
        amountDaiToBorrowWei,
        networkConfig[network.config.chainId].daiToken,
        pool,
        signer
    )
    await getBorrowUserData(pool, signer)
}

async function getBorrowUserData(pool, account) {
    const {
        totalCollateralETH,
        totalDebtETH,
        availableBorrowsETH
    } = await pool.getUserAccountData(account)
    console.log(`You have ${totalCollateralETH} worth of ETH deposited.`)
    console.log(`You have ${totalDebtETH} worth of ETH borrowed.`)
    console.log(`You can borrow ${availableBorrowsETH} worth of ETH.`)
    return { availableBorrowsETH, totalDebtETH }
}

async function borrowDai(daiAddress, pool, amountDaiToBorrow, account) {
    const borrowTx = await pool.borrow(daiAddress, amountDaiToBorrow, 1, 0, account)
    await borrowTx.wait(1)
    console.log("You've borrowed!")
}

async function repay(amount, daiAddress, pool, account) {
    await approveErc20(daiAddress, pool.address, amount, account)
    const repayTx = await pool.repay(daiAddress, amount, 1, account)
    await repayTx.wait(1)
    console.log("Repaid!")
}

async function getDaiPrice() {
    const daiEthPriceFeed = await ethers.getContractAt(
        "AggregatorV3Interface",
        networkConfig[network.config.chainId].daiEthPriceFeed
    )
    const price = (await daiEthPriceFeed.latestRoundData())[1]
    console.log(`The DAI/ETH price is ${price.toString()}`)
    return price
}

async function approveERC20(contractAddress, spenderAddress, amountToSpend, account) {
    const erc20Token = await ethers.getContractAt("IERC20", contractAddress, account);
    const tx = await erc20Token.approve(spenderAddress, amountToSpend);
    await tx.wait(1);

    console.log("Approved");
}

async function getPool(account) {
    const poolAddress = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";
    const pool = await ethers.getContractAt("IPool", poolAddress, account);
    return pool;
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })