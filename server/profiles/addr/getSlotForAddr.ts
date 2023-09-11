import { ethers } from "ethers";
import { OwnedResolver } from "../../../typechain/contracts/resolvers";

export async function getSlotForAddr(l2PublicResolver: OwnedResolver, node: string, coinType: number): Promise<string> {
    //The storage slot within the particular contract
    // Determined by the inheritance order of the resolver profile
    // contract OwnedResolver is
    // 1: Ownable,
    // 2: ABIResolver,
    // 3: AddrResolver,
    // 4: ContentHashResolver,
    // 5,6,7: DNSResolver,
    // 8,9: InterfaceResolver,
    // 10: NameResolver,
    // 11,12,13: PubkeyResolver,
    // 14: TextResolver,
    const ADDR_SLOT_NAME = 3;
    const version = await l2PublicResolver.recordVersions(node);
    return getStorageSlotForAddr(ADDR_SLOT_NAME, version.toNumber(), node, coinType);
}

function getStorageSlotForAddr(slot: number, versionNumber: number, node: string, coinType: number) {
    const innerHash = ethers.utils.solidityKeccak256(["uint256", "uint256"], [versionNumber, slot]);
    const nodeHash = ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, innerHash]);
    const outerHash = ethers.utils.solidityKeccak256(["uint256", "bytes32"], [coinType, nodeHash]);
    return outerHash;
}
