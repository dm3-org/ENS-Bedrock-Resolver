import {
    BedrockCcipVerifier,
    BedrockCcipVerifier__factory,
    BedrockProofVerifier,
    BedrockProofVerifier__factory,
    CcipResolver,
    CcipResolver__factory
} from "ccip-resolver-js/dist/typechain";
import { ethers } from "ethers";
import { dnsEncode, keccak256, toUtf8Bytes } from "ethers/lib/utils";
import { ethers as hreEthers } from "hardhat";
import request from "supertest";
import { L2PublicResolver, L2PublicResolver__factory } from "../../typechain";
import { dnsWireFormat } from "../helper/encodednsWireFormat";
import { getGateWayUrl } from "../helper/getGatewayUrl";
const { expect } = require("chai");

describe("E2E Test", () => {
    const provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:8545", {
        name: "optimismGoerli",
        chainId: 900,
    });
    const l2provider = new ethers.providers.StaticJsonRpcProvider("http://localhost:9545")
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
        it("ccip gateway resolves existing profile using ethers.provider.getAddress()", async () => {
            const resolver = new ethers.providers.Resolver(provider, "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", "alice.eth");
            const addr = await resolver.getAddress();
            expect(addr).to.equal(alice.address);
        });

        it.skip("ccip gateway resolves existing abi using ethers.provider.getABI", async () => {
            const resolver = await provider.getResolver("alice.eth");

            const l2PublicResolverFactory = await hreEthers.getContractFactory("L2PublicResolver");
            const sig = l2PublicResolverFactory.interface.encodeFunctionData("ABI", [alice.address, ethers.utils.namehash("alice.eth"), 1]);

            const res = await resolver._fetch(sig);
            const [actualContextType, actualAbi] = l2PublicResolverFactory.interface.decodeFunctionResult("ABI", res);

            const expectedAbi = l2PublicResolverFactory.interface.format(ethers.utils.FormatTypes.json).toString();

            expect(actualContextType).to.equal(1);
            expect(Buffer.from(actualAbi.slice(2), "hex").toString()).to.equal(expectedAbi);
        });
        it.skip("ccip gateway resolves existing contenthash ethers.provider.getContenthash", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );
            const resolver = await provider.getResolver("alice.eth");
            const achtualhash = await resolver.getContentHash();

            expect(achtualhash).to.equal("ipfs://QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4");
        });

        it.skip("ccip gateway resolves existing name ", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );
            const resolver = await provider.getResolver("alice.eth");
            const l2PublicResolverFactory = await hreEthers.getContractFactory("L2PublicResolver");

            const sig = l2PublicResolverFactory.interface.encodeFunctionData("name", [alice.address, ethers.utils.namehash("alice.eth")]);

            const [responseBytes] = l2PublicResolverFactory.interface.decodeFunctionResult("name", await resolver._fetch(sig));

            const responseString = Buffer.from(responseBytes.slice(2), "hex").toString();

            expect(responseString).to.equal("alice");
        });
        it.skip("ccip gateway resolves existing pubkey ", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );
            const resolver = await provider.getResolver("alice.eth");
            const l2PublicResolverFactory = await hreEthers.getContractFactory("L2PublicResolver");

            const sig = l2PublicResolverFactory.interface.encodeFunctionData("pubkey", [alice.address, ethers.utils.namehash("alice.eth")]);

            const [x, y] = l2PublicResolverFactory.interface.decodeFunctionResult("pubkey", await resolver._fetch(sig));
            expect(x).to.equal(ethers.utils.formatBytes32String("foo"));
            expect(y).to.equal(ethers.utils.formatBytes32String("bar"));
        });
        it.skip("ccip gateway resolves dnsRecord ", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );
            const resolver = await provider.getResolver("alice.eth");
            const l2PublicResolverFactory = await hreEthers.getContractFactory("L2PublicResolver");

            const record = dnsWireFormat("a.example.com", 3600, 1, 1, "1.2.3.4");

            const sig = l2PublicResolverFactory.interface.encodeFunctionData("dnsRecord", [
                alice.address,
                ethers.utils.namehash("alice.eth"),
                keccak256("0x" + record.substring(0, 30)),
                1,
            ]);

            const [response] = l2PublicResolverFactory.interface.decodeFunctionResult("dnsRecord", await resolver._fetch(sig));
            //await require("hardhat").storageLayout.export()
            // await require("hardhat").storageLayout.export()
            expect(response).to.equal("0x161076578616d706c6503636f6d000001000100000e100004010203040");
        });
        it.skip("ccip gateway resolves hasDnsRecords", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );
            const resolver = await provider.getResolver("alice.eth");
            const l2PublicResolverFactory = await hreEthers.getContractFactory("L2PublicResolver");

            const record = dnsWireFormat("a.example.com", 3600, 1, 1, "1.2.3.4");

            const sig = l2PublicResolverFactory.interface.encodeFunctionData("hasDNSRecords", [
                alice.address,
                ethers.utils.namehash("alice.eth"),
                keccak256("0x" + record.substring(0, 30)),
            ]);

            const [response] = l2PublicResolverFactory.interface.decodeFunctionResult("hasDNSRecords", await resolver._fetch(sig));
            // await require("hardhat").storageLayout.export()
            expect(response).to.equal(true);
        });
        it.skip("ccip gateway resolves zonehash", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );
            const resolver = await provider.getResolver("alice.eth");
            const l2PublicResolverFactory = await hreEthers.getContractFactory("L2PublicResolver");

            const sig = l2PublicResolverFactory.interface.encodeFunctionData("zonehash", [
                alice.address,
                ethers.utils.namehash("alice.eth"),
            ]);

            const [response] = l2PublicResolverFactory.interface.decodeFunctionResult("zonehash", await resolver._fetch(sig));
            // await require("hardhat").storageLayout.export()
            expect(response).to.equal(keccak256(toUtf8Bytes("foo")));
        });

        it.skip("Returns empty string if record is empty", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );
            const resolver = await provider.getResolver("alice.eth");
            const text = await resolver.getText("unknown record");

            expect(text).to.be.null;
        });
        it.skip("use parents resolver if node has no subdomain", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );

            const resolver = await provider.getResolver("a.b.c.alice.eth");

            const text = await resolver.getText("my-slot");

            expect(text).to.equal("my-subdomain-record");
        });
        it.skip("reverts if resolver is unknown", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );

            const resolver = await provider.getResolver("bob.eth");

            await resolver
                .getText("my-slot")
                .then((res) => {
                    expect.fail("Should have thrown an error");
                })
                .catch((e) => {
                    expect(e).to.be.instanceOf(Error);
                });
        });
        it.skip("resolves namewrapper profile", async () => {
            const provider = new MockProvider(hreEthers.provider, fetchRecordFromCcipGateway, ccipResolver);
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("namewrapper.alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );

            const resolver = await provider.getResolver("namewrapper.alice.eth");

            const text = await resolver.getText("namewrapper-slot");

            expect(text).to.equal("namewrapper-subdomain-record");
        });
    });

    describe.skip("resolveWithProof", () => {
        it("proof is valid onchain", async () => {
            console.log("start proof");
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );
            const { callData, sender } = await getGateWayUrl("alice.eth", "network.dm3.eth", ccipResolver);
            const { body, status } = await request(ccipApp).get(`/${sender}/${callData}`).send();
            console.log(status);

            const responseBytes = await ccipResolver.resolveWithProof(body.data, callData);
            const responseString = Buffer.from(responseBytes.slice(2), "hex").toString();

            const profile = {
                publicSigningKey: "0ekgI3CBw2iXNXudRdBQHiOaMpG9bvq9Jse26dButug=",
                publicEncryptionKey: "Vrd/eTAk/jZb/w5L408yDjOO5upNFDGdt0lyWRjfBEk=",
                deliveryServices: ["foo.dm3"],
            };
            expect(responseString).to.eql(JSON.stringify(profile));
        });
        it("rejects proofs from contracts other than l2Resolver", async () => {
            process.env = {
                ...process.env,
                L2_PUBLIC_RESOLVER_ADDRESS: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
            };
            await ccipResolver
                .connect(alice)
                .setResolverForDomain(
                    ethers.utils.namehash("alice.eth"),
                    bedrockCcipVerifier.address,
                    "http://localhost:8080/{sender}/{data}"
                );

            const { callData, sender } = await getGateWayUrl("alice.eth", "network.dm3.eth", ccipResolver);
            const { body, status } = await request(ccipApp).get(`/${sender}/${callData}`).send();

            await ccipResolver
                .resolveWithProof(body.data, callData)
                .then((res) => {
                    expect.fail("Should have thrown an error");
                })
                .catch((e) => {
                    expect(e.reason).to.equal("proof target does not match resolver");
                });
        });
    });


    const fetchRecordFromCcipGateway = async (url: string, json?: string) => {
        const [sender, data] = url.split("/").slice(3);
        const response = await request(ccipApp).get(`/${sender}/${data}`).send();
        return response;
    };
});
