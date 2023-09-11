import { ethers } from "ethers";
import { OwnedResolver } from "../../../typechain/contracts/resolvers";
export async function getSlotForText(l2PublicResolver: OwnedResolver, node: string, recordName: string): Promise<string> {
    //The storage slot within the particular contract
    const TEXTS_SLOT_NAME = 11;
    // const TEXTS_SLOT_NAME = 3;
    const version = await l2PublicResolver.recordVersions(node);
    return getStorageSlotForText(TEXTS_SLOT_NAME, version.toNumber(), node, recordName);
}

function getStorageSlotForText(slot: number, versionNumber: number, node: string, recordName: string) {
    const innerHash = ethers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
    const middleHash = ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, innerHash]);
    const outerHash = ethers.utils.solidityKeccak256(["string", "bytes32"], [recordName, middleHash]);
    return outerHash;

}
