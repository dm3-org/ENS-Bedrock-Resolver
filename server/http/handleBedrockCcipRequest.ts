import { getResolverInterface } from "../utils/getResolverInterface";

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
import { decodeHasDNSRecords } from "../profiles/dns/hasDnsRecord/decodeHasDnsRecords";
import { getSlotForHasDnsRecords } from "../profiles/dns/hasDnsRecord/getSlotForHasDnsRecord";
import { decodeZonehash } from "../profiles/dns/zonehash/decodeZonehash";
import { getSlotForZoneHash } from "../profiles/dns/zonehash/getSlotForZonehash";
import { decodeName } from "../profiles/name/decodeName";
import { getSlotForName } from "../profiles/name/getSlotForName";
import { decodePubkey } from "../profiles/pubkey/decodePubKey";
import { getSlotForPubkeyX } from "../profiles/pubkey/getStorageSlotForPubkey";
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

                    console.log("slot for text : ", slot)
                    console.log("result for text : ", result)
                    return {
                        slot, target: l2PubicResolver.address, layout: StorageLayout.DYNAMIC,
                        result: l2Resolverinterface.encodeFunctionResult("text(bytes32,string)", [result])
                    }
                }
            case "addr(bytes32)":
                {
                    const { node } = decodeAddr(context, args);
                    const slot = await getSlotForAddr(l2PubicResolver, context, node, 60);
                    const result = await l2PubicResolver.provider.getStorageAt(l2PubicResolver.address, slot)

                    console.log("slot for address : ", slot)
                    console.log("result for address : ", result)


                    return {
                        slot, target: l2PubicResolver.address, layout: StorageLayout.FIXED,
                        result
                    }
                }
            case "ABI(bytes,bytes32,uint256)":
                {
                    const { node, contentTypes } = decodeAbi(context, args);
                    const slot = await getSlotForAbi(l2PubicResolver, context, node, contentTypes);
                    return { slot, target: l2PubicResolver.address, layout: StorageLayout.DYNAMIC }
                }
            case "contenthash(bytes32)":
                {
                    const { node } = decodeContentHash(context, args);
                    const slot = await getSlotForContentHash(l2PubicResolver, context, node);
                    return { slot, target: l2PubicResolver.address, layout: StorageLayout.DYNAMIC }

                }
            case "name(bytes,bytes32)":
                {
                    const { node } = decodeName(context, args);
                    const slot = await getSlotForName(l2PubicResolver, context, node);
                    return { slot, target: l2PubicResolver.address, layout: StorageLayout.DYNAMIC }

                }
            case "pubkey(bytes,bytes32)":
                {
                    const { node } = decodePubkey(context, args);
                    const slot = await getSlotForPubkeyX(l2PubicResolver, context, node);
                    return { slot, target: l2PubicResolver.address, layout: StorageLayout.DYNAMIC }
                }
            case "dnsRecord(bytes,bytes32,bytes32,uint16)":
                {
                    const { node, name, resource } = decodeDNSRecord(context, args)
                    const slot = getSlotForDnsRecord(l2PubicResolver, context, node, name, resource)
                    return { slot, target: l2PubicResolver.address, layout: StorageLayout.DYNAMIC }

                }
            case "hasDNSRecords(bytes,bytes32,bytes32)":
                {
                    const { node, name } = decodeHasDNSRecords(context, args)
                    const slot = await getSlotForHasDnsRecords(l2PubicResolver, context, node, name)
                    return { slot, target: l2PubicResolver.address, layout: StorageLayout.DYNAMIC }
                }
            case "zonehash(bytes,bytes32)":
                {
                    const { node, name } = decodeZonehash(context, args)
                    const slot = await getSlotForZoneHash(l2PubicResolver, context, node, name)
                    return { slot, target: l2PubicResolver.address, layout: StorageLayout.DYNAMIC }
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
