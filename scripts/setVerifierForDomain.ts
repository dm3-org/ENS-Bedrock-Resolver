import hre, { ethers } from "hardhat";

const ENS_NAME = "alice123.eth";
const URL = "http://localhost:8081/{sender}/{data}";

const ERC3668_RESOLVER_ADDRESS = process.env.ERC3668_RESOLVER_ADDRESS
const L2_PUBLIC_RESOLVER_VERIFIER_ADDRESS=process.env.L2_PUBLIC_RESOLVER_VERIFIER_ADDRESS


export const setVerifierForDomain = async () => {
    const [signer] = await hre.ethers.getSigners();
    const node = ethers.utils.namehash(process.env.ENS_NAME);
    const VERIFIER_DATA = process.env.L2_RESOLVER_ADDRESS
    if(!(node && ERC3668_RESOLVER_ADDRESS && VERIFIER_DATA)) throw("ENS_NAME, ERC3668_RESOLVER_ADDRESS and L2_RESOLVER_ADDRESS must be set")
    const registryInterface = new ethers.utils.Interface([
        "function setVerifierForDomain(bytes32 node, address resolverAddress, string[] memory urls, bytes memory verifierData) external ",
    ]);

    const data = registryInterface.encodeFunctionData("setVerifierForDomain", [node, L2_PUBLIC_RESOLVER_VERIFIER_ADDRESS, [URL], VERIFIER_DATA]);

    const tx = await signer.sendTransaction({
        to: ERC3668_RESOLVER_ADDRESS,
        data,
        gasLimit: 5000000,
    });

    console.log("Transaction hash: ", tx.hash);
    await tx.wait();
    console.log(`verifier set to ${L2_PUBLIC_RESOLVER_VERIFIER_ADDRESS}, url set to ${URL}, verifierData set to ${VERIFIER_DATA}`);
};
setVerifierForDomain();
