import { dnsEncode } from "ethers/lib/utils";
import hre from "hardhat";
import { L2PublicResolver__factory } from "typechain";

const l2ResolverAddress = process.env.L2_RESOLVER_ADDRESS;
const ENS_NAME = process.env.ENS_NAME;
const DELEGATE = process.env.DELEGATE;
console.log({l2ResolverAddress, ENS_NAME})
export async function setAddr() {
    if(!(l2ResolverAddress && ENS_NAME && DELEGATE)){ throw "Set L2_RESOLVER_ADDRESS, ENS_NAME and DELEGATE"}
    const [signer] = await hre.ethers.getSigners();
    const L2PublicResolverFactory = (await hre.ethers.getContractFactory("L2PublicResolver")) as L2PublicResolver__factory;

    const L2PublicResolver = L2PublicResolverFactory.attach(l2ResolverAddress);

    const tx1 = await L2PublicResolver["approve(bytes,address,bool)"](dnsEncode(ENS_NAME), DELEGATE, true, {
        // gasPrice: "900000",
        // gasLimit: 500000,
    });
    const rec1 = await tx1.wait();
    console.log('approve', rec1.transactionHash);
    // const tx2 = await L2PublicResolver["setAddrFor(bytes,bytes,address)"](signer.address, dnsEncode(ENS_NAME), DELEGATE, {
    //     // gasPrice: "900000",
    //     // gasLimit: 500000,
    // });
    // const rec2 = await tx2.wait();

    // console.log('setAddrFor', rec2.transactionHash);
}

setAddr();
