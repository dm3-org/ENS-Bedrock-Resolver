import { ethers } from "ethers";
import { OwnedResolver } from "../../../typechain/contracts/resolvers";

export async function getSlotForAbi(l2PublicResolver: OwnedResolver, node: string, contentType: number): Promise<string> {
    //The storage slot within the particular contract
    const ABI_SLOT_NAME = 2;
    const version = await l2PublicResolver.recordVersions(node);

    return getStorageSlotForAbi(ABI_SLOT_NAME, version.toNumber(), node, contentType);

}

function getStorageSlotForAbi(slot: number, versionNumber: number, node: string, contentType: number) {
    const innerHash = ethers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
    const nodeHash = ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, innerHash]);
    const outerHash = ethers.utils.solidityKeccak256(["uint256", "bytes32"], [contentType, nodeHash]);
    return outerHash;
}
