import {
    BedrockCcipVerifier,
    BedrockCcipVerifier__factory,
    BedrockProofVerifier,
    BedrockProofVerifier__factory,
    CcipResolver,
    CcipResolver__factory,
} from "ccip-resolver-js/dist/typechain";
import { BigNumber, ethers } from "ethers";
import { keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { ethers as hreEthers } from "hardhat";
import { dnsWireFormat } from "../helper/encodednsWireFormat";
const { expect } = require("chai");

describe("E2E Test", () => {
    const provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:8545", {
        name: "optimismGoerli",
        chainId: 900,
    });
    const l2provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:9545");
    //Ccip Resolver
    let ccipResolver: CcipResolver;
    //Bedrock Proof Verifier
    let bedrockProofVerifier: BedrockProofVerifier;
    //Bedrock CCIP resolver
    let bedrockCcipVerifier: BedrockCcipVerifier;
    //Gateway
    let ccipApp;
    //0x8111DfD23B99233a7ae871b7c09cCF0722847d89
    const alice = new ethers.Wallet("0xfd9f3842a10eb01ccf3109d4bd1c4b165721bf8c26db5db7570c146f9fad6014").connect(hreEthers.provider);

    beforeEach(async () => {
        bedrockProofVerifier = await new BedrockProofVerifier__factory()
            .attach("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0")
            .connect(provider);
        bedrockCcipVerifier = new BedrockCcipVerifier__factory().attach("0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9");
        ccipResolver = new CcipResolver__factory().attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512");
    });
    describe("resolve", () => {
        it("ccip gateway resolves existing profile using ethers.provider.getText()", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", "alice.eth");

            const profile = {
                publicSigningKey: "0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=",
                publicEncryptionKey: "Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=",
                deliveryServices: ["foo.dm3"],
            };

            const text = await resolver.getText("network.dm3.eth");

            expect(text).to.eql(JSON.stringify(profile));
        });
        it("ccip gateway resolves sort text ethers.provider.getText()", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", "alice.eth");

            const text = await resolver.getText("foo");

            expect(text).to.eql("bar");
        });
        it("ccip gateway resolves existing profile using ethers.provider.getAddress()", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", "alice.eth");
            const addr = await resolver.getAddress();
            expect(addr).to.equal(alice.address);
        });
        it("ccip gateway resolves existing contenthash ethers.provider.getContenthash", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", "alice.eth");

            const achtualhash = await resolver.getContentHash();

            expect(achtualhash).to.equal("ipfs://QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4");
        });
        it("ccip gateway resolves existing abi using ethers.provider.getABI", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", "alice.eth");

            const iface = new ethers.utils.Interface([
                "function ABI(bytes32 node, uint256 contextType) external view returns (uint256, bytes memory)",
            ]);

            const sig = iface.encodeFunctionData("ABI", [ethers.utils.namehash("alice.eth"), 1]);

            const encodedRes = await resolver._fetch(sig);

            const [decodedRes] = ethers.utils.defaultAbiCoder.decode(["bytes"], encodedRes);

            const ress = iface.decodeFunctionResult("ABI", decodedRes);

            const [actualContextType, actualAbi] = ress;
            const expectedAbi = new BedrockProofVerifier__factory().interface.format(ethers.utils.FormatTypes.json);

            expect(BigNumber.from(actualContextType).toNumber()).to.equal(1);
            expect(Buffer.from(actualAbi.slice(2), "hex").toString()).to.equal(expectedAbi);
        });

        it("ccip gateway resolves existing name ", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", "namewrapper.alice.eth");
            const l2PublicResolverFactory = await hreEthers.getContractFactory("L2PublicResolver");

            const sig = l2PublicResolverFactory.interface.encodeFunctionData("name", [alice.address, ethers.utils.namehash("alice.eth")]);

            const [response] = l2PublicResolverFactory.interface.decodeFunctionResult("name", await resolver._fetch(sig));

            expect(response).to.equal("alice");
        });
        it("ccip gateway resolves dnsRecord ", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", "namewrapper.alice.eth");
            const l2PublicResolverFactory = await hreEthers.getContractFactory("L2PublicResolver");

            const record = dnsWireFormat("a.example.com", 3600, 1, 1, "1.2.3.4");

            const sig = l2PublicResolverFactory.interface.encodeFunctionData("dnsRecord", [
                alice.address,
                ethers.utils.namehash("alice.eth"),
                keccak256("0x" + record.substring(0, 30)),
                1,
            ]);

            const [response] = l2PublicResolverFactory.interface.decodeFunctionResult("dnsRecord", await resolver._fetch(sig));
            expect(response).to.equal("0x0161076578616d706c6503636f6d000001000100000e10000401020304");
        });
        it("ccip gateway resolves zonehash", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", "namewrapper.alice.eth");
            const l2PublicResolverFactory = await hreEthers.getContractFactory("L2PublicResolver");

            const sig = l2PublicResolverFactory.interface.encodeFunctionData("zonehash", [
                alice.address,
                ethers.utils.namehash("alice.eth"),
            ]);

            const [response] = l2PublicResolverFactory.interface.decodeFunctionResult("zonehash", await resolver._fetch(sig));
            // await require("hardhat").storageLayout.export()
            expect(response).to.equal(keccak256(toUtf8Bytes("foo")));
        });

        it("Returns empty string if record is empty", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", "alice.eth");
            const text = await resolver.getText("unknown record");

            expect(text).to.be.null;
        });
        it("use parents resolver if node has no subdomain", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", "a.b.c.alice.eth");

            const text = await resolver.getText("my-slot");

            expect(text).to.equal("my-subdomain-record");
        });

        it("resolves namewrapper profile", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", "namewrapper.alice.eth");

            const text = await resolver.getText("namewrapper-slot");

            expect(text).to.equal("namewrapper-subdomain-record");
        });
    });
});
