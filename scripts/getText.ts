import hre, { ethers } from "hardhat";

export const getText = async () => {
    const [signer] = await hre.ethers.getSigners();
    const resolver = await ethers.provider.getResolver(process.env.ENS_NAME);

    console.log("start getTEXT", process.env.TEXT_KEY);
    const text = await resolver.getText(process.env.TEXT_KEY);

    console.log(text);
};

getText();
