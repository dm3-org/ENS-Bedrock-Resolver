import { getResolverInterface } from "../utils/getResolverInterface";

import { L2PublicResolver } from "../../typechain";
import { StorageLayout } from "../profiles/StorageLayout";
import { decodeAddr } from "../profiles/addr/decodeAddr";
import { getSlotForAddr } from "../profiles/addr/getSlotForAddr";
import { decodeContentHash } from "../profiles/contentHash/decodeContentHash";
import { getSlotForContentHash } from "../profiles/contentHash/getSlotForContentHash";
import { decodeText } from "../profiles/text/decodeText";
import { getSlotForText } from "../profiles/text/getSlotForText";
import { getSlotForVersion } from "../profiles/version/getSlotForVersion";

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

                    const versionSlot = await getSlotForVersion(context, node);
                    const { slot, version } = await getSlotForText(l2PubicResolver, context, node, record)
                    const result = await l2PubicResolver.text(context, node, record)


                    const res = [
                        {
                            slot: versionSlot,
                            target: l2PubicResolver.address,
                            layout: StorageLayout.FIXED,
                            result: version.isZero() ? "0x" : version.toHexString()
                        },
                        {
                            slot,
                            target: l2PubicResolver.address,
                            layout: StorageLayout.DYNAMIC,
                            result: l2Resolverinterface.encodeFunctionResult("text(bytes32,string)", [result])
                        }
                    ]
                    return res
                }
            case "addr(bytes32)":
                {
                    const { node } = decodeAddr(context, args);

                    const versionSlot = await getSlotForVersion(context, node);
                    const { slot, version } = await getSlotForAddr(l2PubicResolver, context, node, 60);
                    const result = await l2PubicResolver.provider.getStorageAt(l2PubicResolver.address, slot)

                    return [
                        {
                            slot: versionSlot,
                            target: l2PubicResolver.address,
                            layout: StorageLayout.FIXED,
                            result: version.isZero() ? "0x" : version.toHexString()
                        },
                        {
                            slot,
                            target: l2PubicResolver.address,
                            layout: StorageLayout.FIXED,
                            result
                        }
                    ]
                }
            case "addr(bytes32,uint256)": {
                const { node, coinType } = decodeAddr(context, args);

                const versionSlot = await getSlotForVersion(context, node);
                const { slot, version } = await getSlotForAddr(l2PubicResolver, context, node, coinType);
                const result = await l2PubicResolver["addr(bytes,bytes32,uint256)"](context, node, coinType)
                return [
                    {
                        slot: versionSlot,
                        target: l2PubicResolver.address,
                        layout: StorageLayout.FIXED,
                        result: version.isZero() ? "0x" : version.toHexString()
                    },
                    {
                        slot,
                        target: l2PubicResolver.address,
                        layout: StorageLayout.DYNAMIC,
                        result: l2Resolverinterface.encodeFunctionResult("addr(bytes32,uint256)", [result])
                    }]

            }
            case "contenthash(bytes32)":
                {
                    const { node } = decodeContentHash(context, args);

                    const versionSlot = await getSlotForVersion(context, node);
                    const { slot, version } = await getSlotForContentHash(l2PubicResolver, context, node);
                    const result = await l2PubicResolver.contenthash(context, node)

                    return [
                        {
                            slot: versionSlot,
                            target: l2PubicResolver.address,
                            layout: StorageLayout.FIXED,
                            result: version.isZero() ? "0x" : version.toHexString()
                        },
                        {
                            slot,
                            target: l2PubicResolver.address,
                            layout: StorageLayout.DYNAMIC,
                            result: l2Resolverinterface.encodeFunctionResult("contenthash(bytes32)", [result])
                        }
                    ]

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
