import {
    BedrockCcipVerifier,
    BedrockCcipVerifier__factory,
    BedrockProofVerifier,
    BedrockProofVerifier__factory,
    ERC3668Resolver,
    ERC3668Resolver__factory,
} from "ccip-resolver/dist/typechain";
import { BigNumber, ethers } from "ethers";
import { dnsEncode, keccak256, namehash, toUtf8Bytes } from "ethers/lib/utils";
import { ethers as hreEthers } from "hardhat";
import { dnsWireFormat } from "../helper/encodednsWireFormat";
const { expect } = require("chai");

describe.only("E2E Test", () => {
    const provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:8545", {
        name: "optimismGoerli",
        chainId: 900,
    });
    const l2provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:9545");
    //Ccip Resolver
    let ccipResolver: ERC3668Resolver;
    //Bedrock Proof Verifier
    let bedrockProofVerifier: BedrockProofVerifier;
    //Bedrock CCIP resolver
    let bedrockCcipVerifier: BedrockCcipVerifier;
    //Gateway
    let ccipApp;
    //0x8111DfD23B99233a7ae871b7c09cCF0722847d89
    const alice = new ethers.Wallet("0xfd9f3842a10eb01ccf3109d4bd1c4b165721bf8c26db5db7570c146f9fad6014").connect(provider);

    beforeEach(async () => {
        bedrockProofVerifier = await new BedrockProofVerifier__factory()
            .attach("0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512")
            .connect(provider);
        bedrockCcipVerifier = new BedrockCcipVerifier__factory().attach("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0");
        ccipResolver = await new ERC3668Resolver__factory().attach("0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9");
    });
    describe("resolve", () => {
        it.only("ccip gateway resolves existing profile using ethers.provider.getText()", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9", "alice.eth");

            const profile = {
                publicSigningKey: "0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=",
                publicEncryptionKey: "Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=",
                deliveryServices: ["foo.dm3"],
            };

            const text = await resolver.getText("network.dm3.eth");
            console.log(text);
            expect(text).to.eql(JSON.stringify(profile));
        });
        it("ccip gateway resolves sort text ethers.provider.getText()", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9", "alice.eth");

            const text = await resolver.getText("foo");

            expect(text).to.eql("bar");
        });
        it("ccip gateway resolves existing address using ethers.provider.getAddress()", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9", "alice.eth");
            const addr = await resolver.getAddress();
            expect(addr).to.equal(alice.address);
        });
        it("ccip gateway resolves existing blockchain address using ethers.provider.getAddress()", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9", "alice.eth");
            const addr = await resolver.getAddress(0);

            expect(addr).to.equal("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
        });
        it("ccip gateway resolves existing contenthash ethers.provider.getContenthash", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9", "alice.eth");

            const achtualhash = await resolver.getContentHash();

            expect(achtualhash).to.equal("ipfs://QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4");
        });
        it.skip("ccip gateway resolves existing abi using ethers.provider.getABI", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9", "alice.eth");

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

        it.skip("ccip gateway resolves dnsRecord ", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9", "alice.eth");

            const iface = new ethers.utils.Interface([
                "function dnsRecord(bytes32 node,bytes32 name,uint16 resource) public view  returns(bytes memory)",
            ]);

            const record = dnsWireFormat("a.example.com", 3600, 1, 1, "1.2.3.4");
            const sig = iface.encodeFunctionData("dnsRecord", [
                ethers.utils.namehash("alice.eth"),
                keccak256("0x" + record.substring(0, 30)),
                1,
            ]);

            const [response] = iface.decodeFunctionResult("dnsRecord", await resolver._fetch(sig));
            expect(response).to.equal("0x0161076578616d706c6503636f6d000001000100000e10000401020304");
        });
        it.skip("ccip gateway resolves zonehash", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9", "alice.eth");
            const iface = new ethers.utils.Interface(["function zonehash(bytes32 node) external view  returns (bytes memory)"]);

            const sig = iface.encodeFunctionData("zonehash", [ethers.utils.namehash("alice.eth")]);

            const [response] = iface.decodeFunctionResult("zonehash", await resolver._fetch(sig));
            expect(response).to.equal(keccak256(toUtf8Bytes("foo")));
        });

        it("ccip gateway resolves record with increased version", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9", "bob.eth");

            const text = await resolver.getText("vRec");

            expect(text).to.eql("my-version");
        });
        it("Returns empty string if record is empty", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9", "alice.eth");
            const text = await resolver.getText("unknown record");

            expect(text).to.be.null;
        });
        it("use parents resolver if node has no subdomain", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9", "a.alice.eth");

            const text = await resolver.getText("my-slot");

            expect(text).to.equal("my-subdomain-record");
        });
    });
});
