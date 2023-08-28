// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {IABIResolver} from "./IABIResolver.sol";
import {ResolverBase, BytesUtils} from "../ResolverBase.sol";

abstract contract ABIResolver is IABIResolver, ResolverBase {
    using BytesUtils for bytes;
    //[version_number][context][node][content_type] => abi
    mapping(uint64 => mapping(bytes => mapping(bytes32 => mapping(uint256 => bytes)))) abi_with_context;

    /**
     * @dev Sets an ABI (Application Binary Interface) record for a given name, associated with a specific content type.
     * @param name The DNS encoded domain name.
     * @param contentType The content type identifier for the ABI (must be a power of 2).
     * @param data The ABI data to be set for the specified name and content type, represented as a byte array.
     *
     * This function allows the caller to set an ABI record for a specific name and content type.
     *
     * The function then computes the node hash for the provided `name` using the `namehash` function.
     * It encodes the caller's address as `context` using the `abi.encodePacked` function.
     * The function sets the `data` for the specified `contentType` in the `abi_with_context` mapping,
     * using the version number associated with the caller's `context` and node.
     *
     * The function also emits an `ABIChanged` event to notify listeners about the change in the ABI record.
     */
    function setABI(bytes calldata name, uint256 contentType, bytes calldata data) external virtual {
        bytes memory context = abi.encodePacked(msg.sender);
        setABIFor(context, name, contentType, data);
    }

    /**
     * @dev Sets the ABI data for a specific context, name, and content type.
     * @param context The context identifier under which the ABI data is being set.
     * @param name The name of the entity for which ABI data is being set.
     * @param contentType The type of content for which the ABI data is being set.
     * @param data The ABI data to be set for the specified context, name, and content type.
     */
    function setABIFor(
        bytes memory context,
        bytes calldata name,
        uint256 contentType,
        bytes calldata data
    ) public virtual authorised(context, name) {
        // Content types must be powers of 2
        require(((contentType - 1) & contentType) == 0);
        bytes32 node = name.namehash(0);
        abi_with_context[recordVersions[context][node]][context][node][contentType] = data;
        emit ABIChanged(context, name, node, contentType);
    }

    /**
     * @dev Retrieves the ABI (Application Binary Interface) record associated with a given context, ENS node, and content type.
     * @param context The context representing the owner of the ABI record, provided as a byte array.
     * @param node The node representing the ENS node for which the ABI record is being retrieved.
     * @param contentTypes The content types to check for in the ABI records, represented as a bitmask (uint256).
     * @return A tuple containing the content type (if found) and the ABI data associated with the context, node, and content type.
     * This function allows anyone to retrieve the ABI record associated with a specific context, ENS node,
     * and content type(s). The caller provides the `context`, which should match the context used when setting the
     * ABI record
     * (in the `setABI` function). Additionally, the `node` parameter specifies the ENS node for which the ABI
     * record is being retrieved.
     * The `contentTypes` parameter is a bitmask representing the content types to check in the ABI records.
     *
     * The function first retrieves the mapping `abiset` from the `abi_with_context` storage using the version number
     * associated with the caller's `context` and node. The `abiset` mapping contains the ABI data for different
     * content types.
     *
     * Then, the function iterates through each content type using bitwise shifting, starting from 1, and checks if the * content type
     * is present in the `contentTypes` bitmask and if the corresponding ABI data exists in the `abiset` mapping. If a * matching ABI record
     * is found, the function returns a tuple containing the content type and the associated ABI data.
     *
     * If no matching ABI record is found for any content type in the provided bitmask, the function returns a tuple
     * with content type 0
     * and an empty byte array as the ABI data.
     *
     */
    function ABI(
        bytes calldata context,
        bytes32 node,
        uint256 contentTypes
    ) external view virtual override returns (uint256, bytes memory) {
        mapping(uint256 => bytes) storage abiset = abi_with_context[recordVersions[context][node]][context][node];

        for (uint256 contentType = 1; contentType <= contentTypes; contentType <<= 1) {
            if ((contentType & contentTypes) != 0 && abiset[contentType].length > 0) {
                return (contentType, abiset[contentType]);
            }
        }

        return (0, bytes(""));
    }

    function supportsInterface(bytes4 interfaceID) public view virtual override returns (bool) {
        return interfaceID == type(IABIResolver).interfaceId || super.supportsInterface(interfaceID);
    }
}
