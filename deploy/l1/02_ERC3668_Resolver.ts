import {
    ERC3668Resolver__factory
} from "ccip-resolver/dist/typechain/";
import hre from 'hardhat';


const NAMEWRAPPER_GOERLI = '0x114D4603199df73e7D157787f8778E21fCd13066';
const NAMEWRAPPER_MAINNET = '0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401';
const ENS_REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';

const DEFAULT_VERIFIER_ADDRESS = process.env.L2_PUBLIC_RESOLVER_VERIFIER_ADDRESS;
const DEFAULT_VERIFIER_URL = process.env.DEFAULT_VERIFIER_URL;

async function main() {
    if(!(DEFAULT_VERIFIER_ADDRESS && DEFAULT_VERIFIER_URL)){throw("Must set DEFAULT_VERIFIER_ADDRESS and DEFAULT_VERIFIER_URL")}
    const [deployer] = await hre.ethers.getSigners();

    const namewrapper = NAMEWRAPPER_GOERLI;
    console.log({ENS_REGISTRY, namewrapper, DEFAULT_VERIFIER_ADDRESS, DEFAULT_VERIFIER_URL})
    const deployTx = await
        new ERC3668Resolver__factory()
            .connect(deployer)
            .deploy(
                ENS_REGISTRY, namewrapper, DEFAULT_VERIFIER_ADDRESS, [DEFAULT_VERIFIER_URL],
                {gasLimit: 5000000}
            );

    await deployTx.deployed();

    console.log('ERC3668Resolver deployed to:', deployTx.address);
    console.log(`Run export ERC3668_RESOLVER_ADDRESS=${deployTx.address}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
module.exports.default = main;
