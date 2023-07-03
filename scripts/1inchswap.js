const hre = require("hardhat")
const ethers = hre.ethers
require('dotenv').config()
const fetch = require('isomorphic-fetch')
const { providers, BigNumber, Wallet } = require('ethers')
const { formatUnits, parseUnits } = require('ethers/lib/utils')

const priv = process.env.DEPLOYER_PRIVATE_KEY_1

const rpcUrls = {
    polygon: 'https://polygon.infura.io',
    xdai: 'https://xdai.infura.io',
    bnb: 'https://bsc-dataseed.binance.org/'
}

const slugToChainId = {
    ethereum: 1,
    polygon: 137,
    bnb: 56
}

const tokenDecimals = {
    USDC: 6,
    ONEINCH: 18,
    CHZ: 18,
    BUSD: 18,
    AAVE: 18,
    USDT: 18
}

const addresses = {
    ethereum: {
        USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        ONEINCH: '0x111111111117dC0aa78b770fA6A738034120C302',
        CHZ: '0x3506424F91fD33084466F402d5D97f05F8e3b4AF',
        AAVE: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    },
    bnb: {
        ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
        USDT: '0x55d398326f99059fF775485246999027B3197955'

    }

}

class OneInch {
    constructor() {
        this.baseUrl = 'https://api.1inch.io/v5.0'
    }

    async getQuote(config) {
        const { chainId, fromTokenAddress, toTokenAddress, amount } = config
        if (!chainId) {
            throw new Error('chainId is required')
        }
        if (!fromTokenAddress) {
            throw new Error('fromTokenAddrss is required')
        }
        if (!toTokenAddress) {
            throw new Error('toTokenAddress is required')
        }
        if (!amount) {
            throw new Error('amount is required')
        }
        const url = `${this.baseUrl}/${chainId}/quote?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}`
        console.log("url", url);
        const result = await this.getJson(url)
        if (!result.toTokenAmount) {
            console.log(result)
            throw new Error('expected tx data')
        }

        const { toTokenAmount } = result

        return toTokenAmount
    }

    async getAllowance(config) {
        const { chainId, tokenAddress, walletAddress } = config
        if (!chainId) {
            throw new Error('chainId is required')
        }
        if (!tokenAddress) {
            throw new Error('tokenAddress required')
        }
        if (!walletAddress) {
            throw new Error('walletAddress is required')
        }

        const url = `${this.baseUrl}/${chainId}/approve/allowance?tokenAddress=${tokenAddress}&walletAddress=${walletAddress}`
        const result = await this.getJson(url)
        if (result.allowance === undefined) {
            console.log(result)
            throw new Error('expected tx data')
        }

        return result.allowance
    }

    async getApproveTx(config) {
        const { chainId, tokenAddress, amount } = config
        if (!chainId) {
            throw new Error('chainId is required')
        }
        if (!tokenAddress) {
            throw new Error('tokenAddress required')
        }
        if (!amount) {
            throw new Error('amount is required')
        }

        const url = `${this.baseUrl}/${chainId}/approve/transaction?&amount=${amount}&tokenAddress=${tokenAddress}`
        const result = await this.getJson(url)
        if (!result.data) {
            console.log(result)
            throw new Error('expected tx data')
        }

        const { data, to, value } = result

        return {
            data,
            to,
            value
        }
    }

    async getSwapTx(config) {
        const { chainId, fromTokenAddress, toTokenAddress, fromAddress, amount, slippage } = config
        if (!chainId) {
            throw new Error('chainId is required')
        }
        if (!fromTokenAddress) {
            throw new Error('fromTokenAddrss is required')
        }
        if (!toTokenAddress) {
            throw new Error('toTokenAddress is required')
        }
        if (!fromAddress) {
            throw new Error('fromAddress is required')
        }
        if (!amount) {
            throw new Error('amount is required')
        }
        if (!slippage) {
            throw new Error('slippage is required')
        }
        const url = `${this.baseUrl}/${chainId}/swap?fromTokenAddress=${fromTokenAddress}&toTokenAddress=${toTokenAddress}&amount=${amount}&fromAddress=${fromAddress}&slippage=${slippage}`
        const result = await this.getJson(url)
        if (!result.tx) {
            console.log(result)
            throw new Error('expected tx data')
        }

        const { data, to, value } = result.tx

        return {
            data,
            to,
            value
        }
    }

    async getJson(url) {
        const res = await fetch(url)
        const json = await res.json()
        if (!json) {
            throw new Error('no response')
        }
        if (json.error) {
            console.log(json)
            throw new Error(json.description || json.error)
        }

        return json
    }
}

async function main() {

    const chain = 'bnb'
    const walletAddress = "0x4576EFfae0d9463591Bc66b4653baD8ce281C16B"

    const rpcUrl = rpcUrls[chain]
    const provider = new providers.StaticJsonRpcProvider(rpcUrl)
    const wallet = new Wallet(priv, provider)

    // const wallet = await ethers.getImpersonatedSigner(walletAddress);

    const oneInch = new OneInch()

    const chainId = slugToChainId[chain]
    const fromToken = 'ETH'
    const toToken = 'BUSD'
    const slippage = 1
    const formattedAmount = '0.0001'
    const amount = parseUnits(formattedAmount, tokenDecimals[fromToken]).toString()

    console.log('chain:', chain)
    console.log('fromToken:', fromToken)
    console.log('toToken:', toToken)
    console.log('amount:', formattedAmount)

    const fromTokenAddress = addresses[chain][fromToken]
    const toTokenAddress = addresses[chain][toToken]
    const toTokenAmount = await oneInch.getQuote({ chainId, fromTokenAddress, toTokenAddress, amount })
    const toTokenAmountFormatted = formatUnits(toTokenAmount, tokenDecimals[toToken])
    console.log(`toTokenAmount: ${toTokenAmountFormatted}`)

    const tokenAddress = fromTokenAddress
    const allowance = await oneInch.getAllowance({ chainId, tokenAddress, walletAddress })
    console.log('allowance:', allowance)
    if (BigNumber.from(allowance).lt(amount)) {
        const txData = await oneInch.getApproveTx({ chainId, tokenAddress, amount })
        console.log('approval data:', txData)

        const tx = await wallet.sendTransaction(txData)
        console.log('approval tx:', tx.hash)
        await tx.wait()
    }

    const fromAddress = walletAddress
    const txData = await oneInch.getSwapTx({ chainId, fromTokenAddress, toTokenAddress, fromAddress, amount, slippage })
    console.log('swap data:', txData)
    // const tx = await wallet.sendTransaction(txData)
    // console.log('swap tx:', tx.hash)
    // await tx.wait()

    console.log('done')


    const SwapFactory = await ethers.getContractFactory("AggregationRouterV5")
    const decodedData = SwapFactory.interface.decodeFunctionData(
        "swap",
        txData.data
    )

    console.log("decodedData.caller", decodedData.executor);
    console.log("decodedData.desc", decodedData.desc);
    console.log("decodedData.permit", decodedData.permit);
    console.log("decodedData.data", decodedData.data);


    const oneInchswap = await ethers.getContractAt('OneInchSwap', "0x4576EFfae0d9463591Bc66b4653baD8ce281C16B", wallet);


    // const deploy1InchSwap = await SwapFactory.deploy("0x1111111254fb6c44bAC0beD2854e76F90643097d");
    // await deploy1InchSwap.deployed()

    // const impersonatedSigner = await ethers.getImpersonatedSigner(walletAddress);

    //swap here
    // await oneInchswap.swap(decodedData.caller, decodedData.desc, decodedData.data, { value: ethers.utils.parseUnits("0.0001", 18) });




}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })







