import { dnsEncode } from "ethers/lib/utils";
import { ethers } from "hardhat";

export const getContentHash = async () => {
    const resolver = await ethers.provider.getResolver(process.env.ENS_NAME);

    console.log("start getContentHash");
    const addr = await resolver.getContentHash();
    console.log(addr);
};

getContentHash();
