import hre, { ethers } from "hardhat";

const L2_PUBLIC_RESOLVER_ADDRESS = "0xc1C2b9dD2D15045D52640e120a2d1F16dA3bBb48";
const BEDROCK_PROOF_VERIFIER_ADDRESS = "0x37c75DaE09e82Cd0211Baf95DE18f069F64Cb069";

const GRAPHQL_ADDRESS = "http://localhost:8081/graphql"

async function main() {

    const [owner] = await ethers.getSigners();
    const L2PublicResolverVerifier = await ethers.getContractFactory("L2PublicResolverVerifier");
    const deployTx = await L2PublicResolverVerifier.deploy(owner.address, GRAPHQL_ADDRESS, BEDROCK_PROOF_VERIFIER_ADDRESS, L2_PUBLIC_RESOLVER_ADDRESS);
    await deployTx.deployed();

    console.log(`L2PublicResolverVerifier deployed at  ${deployTx.address}`);
    console.log(
        `Verify the contract using  npx hardhat verify --network ${hre.network.name} ${deployTx.address} ${owner.address} ${GRAPHQL_ADDRESS} ${BEDROCK_PROOF_VERIFIER_ADDRESS} ${L2_PUBLIC_RESOLVER_ADDRESS} `
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
module.exports.default = main;
