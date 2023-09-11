import { ethers } from "ethers";
import { OwnedResolver } from "../../../typechain/contracts/resolvers";

export async function getSlotForContentHash(l2PublicResolver: OwnedResolver, node: string): Promise<string> {
    //The storage slot within the particular contract
    const CONTENTHASH_SLOT_NAME = 4;
    const version = await l2PublicResolver.recordVersions(node);

    return getStorageSlotForContentHash(CONTENTHASH_SLOT_NAME, version.toNumber(), node);
}

function getStorageSlotForContentHash(slot: number, versionNumber: number, node: string,) {
    const innerHash = ethers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
    const outerHash = ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, innerHash]);
    return outerHash;
}


