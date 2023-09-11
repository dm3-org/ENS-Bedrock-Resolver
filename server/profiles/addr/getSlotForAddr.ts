import { ethers } from "ethers";
import { OwnedResolver } from "../../../typechain/contracts/resolvers";

export async function getSlotForAddr(l2PublicResolver: OwnedResolver, node: string, coinType: number): Promise<string> {
    //The storage slot within the particular contract
    // Determined by the inheritance order of the resolver profile
    // contract OwnedResolver (https://goerli.basescan.org/address/0xfdf30e5e06d728704a42bac6e0326538e659a67b) is
    // using https://www.npmjs.com/package/hardhat-storage-layout?activeTab=readme
    // │        recordVersions        │      1       │
    // │       versionable_abis       │      2       │
    // │    versionable_addresses     │      3       │
    // │      versionable_hashes      │      4       │
    // │    versionable_zonehashes    │      5       │
    // │     versionable_records      │      6       │
    // │ versionable_nameEntriesCount │      7       │
    // │    versionable_interfaces    │      8       │
    // │      versionable_names       │      9       │
    // │     versionable_pubkeys      │      10      │
    // │      versionable_texts       │      11      │
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
