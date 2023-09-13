import hre, { ethers } from "hardhat";

const BEDROCK_PROOF_VERIFIER_ADDRESS = process.env.BEDROCK_PROOF_VERIFIER_ADDRESS
const CHAIN_NAME = process.env.L2_CHAIN_NAME
const CHAIN_ID = process.env.L2_CHAIN_ID
const GRAPHQL_URL = process.env.GRAPHQL_URL

async function main() {
    const [owner] = await ethers.getSigners();
    const L2PublicResolverVerifier = await ethers.getContractFactory("L2PublicResolverVerifier");
    console.log({
        ownerAddress:owner.address, GRAPHQL_URL,CHAIN_NAME, CHAIN_ID, BEDROCK_PROOF_VERIFIER_ADDRESS
    })     
    const deployTx = await L2PublicResolverVerifier
        .deploy(
            owner.address, GRAPHQL_URL, CHAIN_NAME, CHAIN_ID,BEDROCK_PROOF_VERIFIER_ADDRESS
            ,{gasLimit: 5000000}
        );
    await deployTx.deployed();

    console.log(`L2PublicResolverVerifier deployed at  ${deployTx.address}`);
    console.log(
        `Verify the contract using  npx hardhat verify --network ${hre.network.name} ${deployTx.address} ${owner.address} ${GRAPHQL_URL} "${CHAIN_NAME}" ${CHAIN_ID} ${BEDROCK_PROOF_VERIFIER_ADDRESS} `
    );
    console.log(`Run export L2_PUBLIC_RESOLVER_VERIFIER_ADDRESS=${deployTx.address}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
module.exports.default = main;
