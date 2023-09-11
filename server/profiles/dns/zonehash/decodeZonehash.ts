import { ethers } from "ethers";

export function decodeZonehash(data: ethers.utils.Result) {
    const { node, name } = data;
    return { node, name };
}
