import { getResolverInterface, getIResolverServiceInterface } from "../utils/getResolverInterface";

import { ethers } from "ethers";
import { OwnedResolver } from "../../typechain/contracts/resolvers";
import { OwnedResolver__factory } from "../../typechain/factories/contracts/resolvers";
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

const iface = new ethers.utils.Interface([
    'function addr(bytes32 node) external view returns (address)',
]);

export async function handleBedrockCcipRequest(provider: ethers.providers.StaticJsonRpcProvider, calldata: string) {
    console.log(1, {calldata})
    try {
        const l2Resolverinterface = getResolverInterface();
        const iResolverServiceInterface = getIResolverServiceInterface();
        console.log(11, iResolverServiceInterface.getSighash('resolve'))
        const [name, data, verifierData] = iResolverServiceInterface.decodeFunctionData('resolve', calldata)
        console.log(3, {name, data, verifierData})
        const { signature, args } = l2Resolverinterface.parseTransaction({
            data,
        });
        console.log(4, {signature, args})
        const l2PublicResolver = new ethers.Contract(
            verifierData,
            OwnedResolver__factory.createInterface(),
            provider
        ) as OwnedResolver

        switch (signature) {
            case "text(bytes32,string)":
                {
                    const { node, record } = decodeText(args);
                    const slot = await getSlotForText(l2PublicResolver, node, record)
                    const result = await l2PublicResolver.text(node, record)
                    return {
                        slot, target: l2PublicResolver.address, layout: StorageLayout.DYNAMIC,
                        result: l2Resolverinterface.encodeFunctionResult("text(bytes32,string)", [result])
                    }
                }
            case "addr(bytes32)":
                {
                    const { node } = decodeAddr(args);
                    const slot = await getSlotForAddr(l2PublicResolver, node, 60);
                    const result = await l2PublicResolver.provider.getStorageAt(l2PublicResolver.address, slot)
                    const resolver = new ethers.Contract(l2PublicResolver.address, iface, l2PublicResolver.provider);
                    return {
                        slot, target: l2PublicResolver.address, layout: StorageLayout.FIXED,
                        result
                    }
                }
            case "addr(bytes32,uint256)": {
                const { node, coinType } = args;
                const slot = await getSlotForAddr(l2PublicResolver, node, coinType);
                const result = await l2PublicResolver["addr(bytes32,uint256)"](node, coinType)
                return {
                    slot, target: l2PublicResolver.address, layout: StorageLayout.DYNAMIC,
                    result: l2Resolverinterface.encodeFunctionResult("addr(bytes32,uint256)", [result])
                }
            }
            case "ABI(bytes32,uint256)":
                {
                    const { node, contentTypes } = args;
                    const [contentType, Abi] = await l2PublicResolver.ABI(node, contentTypes)
                    const slot = await getSlotForAbi(l2PublicResolver, node, contentType.toNumber());
                    return {
                        slot, target: l2PublicResolver.address, layout: StorageLayout.DYNAMIC,
                        result: ethers.utils.defaultAbiCoder.encode(["bytes"], [Abi])
                    }
            }
            case "contenthash(bytes32)":
                {
                    const { node } = args;
                    const slot = await getSlotForContentHash(l2PublicResolver, node);
                    const result = await l2PublicResolver.contenthash(node)
                    return {
                        slot, target: l2PublicResolver.address, layout: StorageLayout.DYNAMIC,
                        result: l2Resolverinterface.encodeFunctionResult("contenthash(bytes32)", [result])
                    }
                }

            // case "dnsRecord(bytes32,bytes32,uint16)":
            //     {
            //         const { node, name, resource } = decodeDNSRecord(args)
            //         const slot = await getSlotForDnsRecord(l2PublicResolver, node, name, resource)
            //         const result = await l2PublicResolver.dnsRecord(node, name, resource)

            //         return {
            //             slot, target: l2PublicResolver.address, layout: StorageLayout.DYNAMIC,
            //             result: l2Resolverinterface.encodeFunctionResult("dnsRecord(bytes32,bytes32,uint16)", [result])
            //         }
            //     }
            // case "zonehash(bytes32)":
            //     {
            //         const { node } = decodeZonehash(args)
            //         const slot = await getSlotForZoneHash(l2PublicResolver, node)
            //         const result = await l2PublicResolver.zonehash(node)
            //         return {
            //             slot, target: l2PublicResolver.address, layout: StorageLayout.DYNAMIC,
            //             result: l2Resolverinterface.encodeFunctionResult("zonehash(bytes32)", [result])
            //         }
            //     }
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
