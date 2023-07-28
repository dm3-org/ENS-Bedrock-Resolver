// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ResolverBase, BytesUtils} from "../ResolverBase.sol";
import {IContentHashResolver} from "./IContentHashResolver.sol";

abstract contract ContentHashResolver is IContentHashResolver, ResolverBase {
    using BytesUtils for bytes;
    mapping(uint64 => mapping(bytes => mapping(bytes32 => bytes))) contenthash_with_context;

    /**
     * @dev Sets a content hash for a given name.
     * @param name The DNS encoded domain name.
     * @param hash The content hash to be set for the specified name, represented as a byte array.
     *
     * This function allows the caller to set a content hash for a specific name.
     * The caller provides the `name`, which represents the name associated with the content hash record.
     * The `hash` parameter is the actual content hash that needs to be associated with the specified name.
     *
     * The function computes the node hash for the provided `name` using the `namehash` function.
     * It then encodes the caller's address as `context` using the `abi.encodePacked` function.
     * The function sets the `hash` for the specified `name` in the `contenthash_with_context` mapping,
     * using the version number associated with the caller's `context` and node.
     *
     * The function also emits a `ContenthashChanged` event to notify listeners about the change in the content hash record.
     *
     */
    function setContenthash(bytes calldata name, bytes calldata hash) external virtual {
        bytes32 node = name.namehash(0);
        bytes memory context = abi.encodePacked(msg.sender);
        contenthash_with_context[recordVersions[context][node]][context][node] = hash;
        emit ContenthashChanged(context, name, node, hash);
    }

    /**
     * @dev Retrieves the content hash associated with a given context and ENS node.
     * @param context The context representing the owner of the content hash, provided as a byte array.
     * @param node The node representing the ENS node for which the content hash is being retrieved.
     * @return A byte array representing the content hash associated with the context and node.
     *
     * This function allows anyone to retrieve the content hash associated with a specific context and ENS node.
     * The caller provides the `context`, which should match the context used when setting the content hash record
     * (in the `setContenthash` function). Additionally, the `node` parameter specifies the ENS node for which the
     * content hash is being retrieved.
     *
     * The function retrieves the mapping `contenthash_with_context` from storage using the version number associated with the
     * caller's `context` and node. The `contenthash_with_context` mapping contains the content hashes for different versions.
     * The function then looks up the content hash associated with the provided context and node in the mapping.
     *
     * If a content hash is found for the provided context and node, the function returns it as a byte array.
     * If no content hash is found, the function returns an empty byte array.
     */
    function contenthash(bytes calldata context, bytes32 node) external view virtual override returns (bytes memory) {
        return contenthash_with_context[recordVersions[context][node]][context][node];
    }

    function supportsInterface(bytes4 interfaceID) public view virtual override returns (bool) {
        return interfaceID == type(IContentHashResolver).interfaceId || super.supportsInterface(interfaceID);
    }
}
