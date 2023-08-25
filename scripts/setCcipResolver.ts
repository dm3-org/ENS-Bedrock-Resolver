import hre, { ethers } from "hardhat";

const ENS_NAME = process.env.ENS_NAME;

const ERC3668_RESOLVER_ADDRESS = process.env.ERC3668_RESOLVER_ADDRESS
const NAME_WRAPPER = "0x114D4603199df73e7D157787f8778E21fCd13066";

export const setCcipResolver = async () => {
    const [signer] = await hre.ethers.getSigners();
    const node = ethers.utils.namehash(ENS_NAME);

    const registryInterface = new ethers.utils.Interface(["function setResolver(bytes32 node, address resolver) external"]);
    console.log({ENS_NAME, node, ERC3668_RESOLVER_ADDRESS})
    const data = registryInterface.encodeFunctionData("setResolver", [node, ERC3668_RESOLVER_ADDRESS]);

    const tx = await signer.sendTransaction({
        to: NAME_WRAPPER,
        data,
        gasLimit: 56631,
    });
    console.log("Transaction hash: ", tx.hash);
    const rec = await tx.wait();
    console.log(`CCIP resolver for domain ${ENS_NAME} set to ${ERC3668_RESOLVER_ADDRESS} `);
};

setCcipResolver();
