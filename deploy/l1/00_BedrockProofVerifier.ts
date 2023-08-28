import {
    BedrockProofVerifier__factory
} from "ccip-resolver/dist/typechain/";
import hre from 'hardhat';

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
module.exports.default = main;

async function main() {
    const L2_OUTPUT_ORALCE_GOERLI = process.env.L2_OUTPUT_ORALCE_GOERLI;
    const L2_OUTPUT_ORALCE_MAINNET = process.env.L2_OUTPUT_ORALCE_MAINNET
    const l2OutputOracleAddress = hre.network.name === 'mainnet' ? L2_OUTPUT_ORALCE_MAINNET : L2_OUTPUT_ORALCE_GOERLI;
    if (!l2OutputOracleAddress) {
        throw ("l2OutputOracleAddress must be set")
    }

    console.log({ l2OutputOracleAddress })
    const [deployer] = await hre.ethers.getSigners();
    const deployTx = await
        new BedrockProofVerifier__factory()
            .connect(deployer)
            .deploy(l2OutputOracleAddress, {
                gasLimit: 5000000,
            });

    await deployTx.deployed();

    console.log(`BedrockProofVerifier deployed at  ${deployTx.address}`);
    console.log(`Run export BEDROCK_PROOF_VERIFIER_ADDRESS=${deployTx.address}`)
    console.log(
        `Verify the contract using  npx hardhat verify --network ${hre.network.name} ${deployTx.address} ${l2OutputOracleAddress} `,
    );
}
