import { ethers } from "ethers";

export function decodeDNSRecord(data: ethers.utils.Result) {
    const { node, name, resource } = data;
    return { node, name, resource };
}
