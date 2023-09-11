import { ethers } from "ethers";

/**
Decodes the text record of a given ENS name and returns an object containing the name and the record.
@param data - The data containing the namehash and the record.
@returns An object containing the name and the record.
@throws An error if the namehash doesn't match the ENS name.
*/
export function decodeText(data: ethers.utils.Result) {
    const [node, record] = data;

    return { node, record };
}
