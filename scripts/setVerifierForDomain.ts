import hre, { ethers } from "hardhat";

const ENS_NAME = "alice123.eth";
const URL = "http://localhost:8081/{sender}/{data}";

const CCIP_RESOLVER = "0x49e0AeC78ec0dF50852E99116E524a43bE91B789";
const L2_PUBLIC_RESOLVER_VERIFIER = "0x67AfD6d796d9212541016A2D10b28CC55021Cade";

export const setVerifierForDomain = async () => {
    const [signer] = await hre.ethers.getSigners();
    const node = ethers.utils.namehash(ENS_NAME);

    const registryInterface = new ethers.utils.Interface([
        "function setVerifierForDomain(bytes32 node, address resolverAddress, string[] memory urls) external ",
    ]);

    const data = registryInterface.encodeFunctionData("setVerifierForDomain", [node, L2_PUBLIC_RESOLVER_VERIFIER, [URL]]);

    const tx = await signer.sendTransaction({
        to: CCIP_RESOLVER,
        data,
        gasLimit: 500000,
    });

    console.log("Transaction hash: ", tx.hash);
    await tx.wait();
    console.log(`verifier set to ${L2_PUBLIC_RESOLVER_VERIFIER}, url set to ${URL}`);
};
setVerifierForDomain();
