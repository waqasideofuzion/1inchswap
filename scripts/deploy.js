const hre = require("hardhat")
const ethers = hre.ethers

async function main() {

    [this.deployer] = await ethers.getSigners();

    const OneInchSwapFactory = await hre.ethers.getContractFactory("OneInchSwapV5");

    //deploy  admin registry smart contract
    const deploy1InchSwapProxy = await OneInchSwapFactory.deploy("0x1111111254EEB25477B68fb85Ed929f73A960582");
    await deploy1InchSwapProxy.deployed()

    console.log('One 1inch Contract Address: ', deploy1InchSwapProxy.address);

    await new Promise((resolve) => setTimeout(resolve, 20000));

    await hre.run("verify:verify", {
        address: deploy1InchSwapProxy.address,
        constructorArguments: ["0x1111111254EEB25477B68fb85Ed929f73A960582"],
    });


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })