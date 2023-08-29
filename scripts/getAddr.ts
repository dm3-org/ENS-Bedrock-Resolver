import { dnsEncode } from "ethers/lib/utils";
import { ethers } from "hardhat";

export const getAddr = async () => {
    const resolver = await ethers.provider.getResolver(process.env.ENS_NAME);

    console.log("start getAddr");
    const addr = await resolver.getAddress();
    console.log(addr);
};

getAddr();
