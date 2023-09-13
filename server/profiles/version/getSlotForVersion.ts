import { ethers } from "ethers";

export function getSlotForVersion(context: string, node: string) {
    const ADDR_SLOT_NAME = 0;
    const innerHash = ethers.utils.solidityKeccak256(["bytes", "uint256"], [context, ADDR_SLOT_NAME]);
    const nodeHash = ethers.utils.solidityKeccak256(["bytes32", "bytes32"], [node, innerHash]);

    return nodeHash;
}

