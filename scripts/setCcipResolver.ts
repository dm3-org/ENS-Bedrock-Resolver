import hre, { ethers } from "hardhat";

const ENS_NAME = "alice123.eth";

const CCIP_RESOLVER_ADDRESS = "0xaeB973dA621Ed58F0D8bfD6299031E8a2Ac39FD4";
const NAME_WRAPPER = "0x114D4603199df73e7D157787f8778E21fCd13066";

export const setCcipResolver = async () => {
    const [signer] = await hre.ethers.getSigners();
    const node = ethers.utils.namehash(ENS_NAME);

    const registryInterface = new ethers.utils.Interface(["function setResolver(bytes32 node, address resolver) external"]);

    const data = registryInterface.encodeFunctionData("setResolver", [node, CCIP_RESOLVER_ADDRESS]);

    const tx = await signer.sendTransaction({
        to: NAME_WRAPPER,
        data,
        gasLimit: 56631,
    });
    console.log("Transaction hash: ", tx.hash);
    const rec = await tx.wait();
    console.log(`CCIP resolver for domain ${ENS_NAME} set to ${CCIP_RESOLVER_ADDRESS} `);
};

setCcipResolver();
