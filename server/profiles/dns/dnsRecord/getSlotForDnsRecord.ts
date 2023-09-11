import { ethers } from "ethers";
import { OwnedResolver } from "../../../typechain/contracts/resolvers";
export async function getSlotForDnsRecord(l2PublicResolver: OwnedResolver, node: string, name: string, resource: string): Promise<string> {
    //The storage slot within the particular contract
    const NAME_SLOT_NAME = 6;
    const version = await l2PublicResolver.recordVersions(node);
    return getStorageSlotForDnsRecord(NAME_SLOT_NAME, version.toNumber(), node, name, resource);
}

function getStorageSlotForDnsRecord(slot: number, versionNumber: number, context: string, node: string, name: string, resource: string) {
    const innerHash = ethers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
    const nodeHash = ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, innerHash]);
    const nameHash = ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [name, nodeHash]);
    const resourceHash = ethers.utils.solidityKeccak256(["uint256", "bytes32"], [resource, nameHash]);
    return resourceHash;
}
