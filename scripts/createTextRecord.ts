import { dnsEncode } from "ethers/lib/utils";
import hre from "hardhat";
import { L2PublicResolver__factory } from "typechain";

const l2ResolverAddress = process.env.L2_RESOLVER_ADDRESS
const ENS_NAME = process.env.ENS_NAME

export async function createTextRecord() {
    const L2PublicResolverFactory = (await hre.ethers.getContractFactory("L2PublicResolver")) as L2PublicResolver__factory;

    const L2PublicResolver = L2PublicResolverFactory.attach(l2ResolverAddress);

    const tx = await L2PublicResolver.setText(dnsEncode(ENS_NAME), "my-record", "my-record-value", {
        gasPrice: "900000",
        gasLimit: 500000,
    });

    const rec = await tx.wait();

    console.log(rec.transactionHash);
}

createTextRecord();
