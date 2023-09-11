import { dnsEncode } from "ethers/lib/utils";
import { ethers } from "hardhat";

export const getAddress = async () => {
    const resolver = await ethers.provider.getResolver(process.env.ENS_NAME);

    console.log("start getAddr");
    const addr = await resolver.getAddress(process.env.COIN_TYPE);
    console.log(addr);
};

getAddress();
