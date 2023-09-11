import { ethers } from "ethers";
import { OwnedResolver } from "../../../typechain/contracts/resolvers";

export async function getSlotForZoneHash(l2PublicResolver: OwnedResolver, node: string,): Promise<string> {
    //The storage slot within the particular contract
    const NAME_SLOT_NAME = 5;
    const version = await l2PublicResolver.recordVersions(node);
    return getStorageSlotForZonehash(NAME_SLOT_NAME, version.toNumber(), node);
}

function getStorageSlotForZonehash(slot: number, versionNumber: number, node: string,) {
    const innerHash = ethers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
    const nodeHash = ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, innerHash]);
    return nodeHash;
}
