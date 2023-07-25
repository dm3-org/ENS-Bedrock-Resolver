import { getResolverInterface } from "../utils/getResolverInterface";

import { ethers } from "ethers";
import { L2PublicResolver } from "../../typechain";
import { StorageLayout } from "../profiles/StorageLayout";
import { decodeAbi } from "../profiles/abi/decodeAbi";
import { getSlotForAbi } from "../profiles/abi/getSlotForAbi";
import { decodeAddr } from "../profiles/addr/decodeAddr";
import { getSlotForAddr } from "../profiles/addr/getSlotForAddr";
import { decodeContentHash } from "../profiles/contentHash/decodeContentHash";
import { getSlotForContentHash } from "../profiles/contentHash/getSlotForContentHash";
import { decodeDNSRecord } from "../profiles/dns/dnsRecord/decodeDnsRecord";
import { getSlotForDnsRecord } from "../profiles/dns/dnsRecord/getSlotForDnsRecord";
import { decodeZonehash } from "../profiles/dns/zonehash/decodeZonehash";
import { getSlotForZoneHash } from "../profiles/dns/zonehash/getSlotForZonehash";
import { decodeName } from "../profiles/name/decodeName";
import { getSlotForName } from "../profiles/name/getSlotForName";
import { decodeText } from "../profiles/text/decodeText";
import { getSlotForText } from "../profiles/text/getSlotForText";

export async function handleBedrockCcipRequest(l2PubicResolver: L2PublicResolver, calldata: string) {
    try {
        const l2Resolverinterface = getResolverInterface();

        //Parse the calldata returned by the contract
        const [name, data, context] = l2Resolverinterface.parseTransaction({
            data: calldata,
        }).args;

        const { signature, args } = l2Resolverinterface.parseTransaction({
            data,
        });

        switch (signature) {
            case "text(bytes32,string)":
                {
                    const { node, record } = decodeText(context, args);
                    const slot = await getSlotForText(l2PubicResolver, context, node, record)
                    const result = await l2PubicResolver.text(context, node, record)

                    return {
                        slot, target: l2PubicResolver.address, layout: StorageLayout.DYNAMIC,
                        result: l2Resolverinterface.encodeFunctionResult("text(bytes32,string)", [result])
                    }
                }
            case "name(bytes,bytes32)":
                {
                    const { node } = decodeName(context, args);
                    const slot = await getSlotForName(l2PubicResolver, context, node);
                    const result = await l2PubicResolver.name(context, node)
                    return {
                        slot, target: l2PubicResolver.address, layout: StorageLayout.DYNAMIC,
                        result: l2Resolverinterface.encodeFunctionResult("name(bytes,bytes32)", [result])
                    }
                }
            case "addr(bytes32)":
                {
                    const { node } = decodeAddr(context, args);
                    const slot = await getSlotForAddr(l2PubicResolver, context, node, 60);
                    const result = await l2PubicResolver.provider.getStorageAt(l2PubicResolver.address, slot)
                    return {
                        slot, target: l2PubicResolver.address, layout: StorageLayout.FIXED,
                        result
                    }
                }
            case "ABI(bytes32,uint256)":
                {
                    const { node, contentTypes } = decodeAbi(context, args);
                    const [contentType, Abi] = await l2PubicResolver.ABI(context, node, contentTypes)
                    const slot = await getSlotForAbi(l2PubicResolver, context, node, contentType.toNumber());

                    console.log("ABI", Abi)

                    const res = {
                        slot, target: l2PubicResolver.address, layout: StorageLayout.DYNAMIC,
                        result: ethers.utils.defaultAbiCoder.encode(["bytes"], [Abi])
                    }
                    return res
                }
            case "contenthash(bytes32)":
                {
                    const { node } = decodeContentHash(context, args);
                    const slot = await getSlotForContentHash(l2PubicResolver, context, node);
                    const result = await l2PubicResolver.contenthash(context, node)
                    return {
                        slot, target: l2PubicResolver.address, layout: StorageLayout.DYNAMIC,
                        result: l2Resolverinterface.encodeFunctionResult("contenthash(bytes32)", [result])
                    }
                }

            case "dnsRecord(bytes,bytes32,bytes32,uint16)":
                {
                    const { node, name, resource } = decodeDNSRecord(context, args)
                    const slot = await getSlotForDnsRecord(l2PubicResolver, context, node, name, resource)
                    const result = await l2PubicResolver.dnsRecord(context, node, name, resource)

                    return {
                        slot, target: l2PubicResolver.address, layout: StorageLayout.DYNAMIC,
                        result: l2Resolverinterface.encodeFunctionResult("dnsRecord(bytes,bytes32,bytes32,uint16)", [result])
                    }
                }
            case "zonehash(bytes,bytes32)":
                {
                    const { node } = decodeZonehash(context, args)
                    const slot = await getSlotForZoneHash(l2PubicResolver, context, node)
                    const result = await l2PubicResolver.zonehash(context, node)
                    return {
                        slot, target: l2PubicResolver.address, layout: StorageLayout.DYNAMIC,
                        result: l2Resolverinterface.encodeFunctionResult("zonehash(bytes,bytes32)", [result])
                    }
                }
            default:
                //Unsupported signature
                return null
        }
    } catch (err: any) {
        console.log("[Handle Bedrock request ] Cant resolve request ");
        console.log(err);
        throw err;
    }
}
