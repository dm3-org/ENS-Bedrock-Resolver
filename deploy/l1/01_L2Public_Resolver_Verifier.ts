import hre, { ethers } from "hardhat";

const L2_PUBLIC_RESOLVER_ADDRESS = "0x39Dc8A3A607970FA9F417D284E958D4cA69296C8";
const BEDROCK_PROOF_VERIFIER_ADDRESS = "0x49FA2e3dc397d6AcA8e2DAe402eB2fD6164EebAC";

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
