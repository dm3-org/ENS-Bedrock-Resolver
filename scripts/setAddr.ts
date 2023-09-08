import { dnsEncode } from "ethers/lib/utils";
import hre from "hardhat";
import { L2PublicResolver__factory } from "typechain";

const l2ResolverAddress = process.env.L2_RESOLVER_ADDRESS;
const ENS_NAME = process.env.ENS_NAME;
console.log({l2ResolverAddress, ENS_NAME})
export async function setAddr() {
    const [signer] = await hre.ethers.getSigners();
    const L2PublicResolverFactory = (await hre.ethers.getContractFactory("L2PublicResolver")) as L2PublicResolver__factory;

    const L2PublicResolver = L2PublicResolverFactory.attach(l2ResolverAddress);

    const tx = await L2PublicResolver["setAddr(bytes,address)"](dnsEncode(ENS_NAME), signer.address, {
        // gasPrice: "900000",
        // gasLimit: 500000,
    });
    const rec = await tx.wait();

    console.log(rec.transactionHash);
}

setAddr();
