import { BigNumber, ethers } from "ethers";
import { L2PublicResolver } from "../../../typechain";
export async function getSlotForContentHash(l2PublicResolver: L2PublicResolver, context: string, node: string): Promise<{ slot: string, version: BigNumber }> {
    //The storage slot within the particular contract
    const CONTENTHASH_SLOT_NAME = 3;
    const version = await l2PublicResolver.recordVersions(context, node);

    const slot = getStorageSlotForContentHash(CONTENTHASH_SLOT_NAME, version.toNumber(), context, node);
    return { slot, version };
}

function getStorageSlotForContentHash(slot: number, versionNumber: number, context: string, node: string,) {
    const innerHash = ethers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
    const contextHash = ethers.utils.solidityKeccak256(["bytes", "bytes32"], [context, innerHash]);
    const outerHash = ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, contextHash]);
    return outerHash;
}
