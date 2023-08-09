// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ResolverBase, BytesUtils} from "../ResolverBase.sol";
import {INameResolver} from "./INameResolver.sol";

abstract contract NameResolver is INameResolver, ResolverBase {
    using BytesUtils for bytes;

    //[version_number][context][node]=> name
    mapping(uint64 => mapping(bytes => mapping(bytes32 => string))) public names_with_context;

    /**
     * @dev Sets a new name for a given ENS node.
     * @param nodeName The DNS encoded domain name.
     * @param newName The new name to be set for the specified ENS node, represented as a string.
     *
     * This function allows the caller to set a new name for a specific ENS node.
     * The caller provides the `nodeName`, which represents the ENS node associated with the new name.
     * The `newName` parameter is the actual new name that needs to be associated with the specified ENS node.
     *
     * The function computes the node hash for the provided `nodeName` using the `namehash` function.
     * It then encodes the caller's address as `context` using the `abi.encodePacked` function.
     * The function sets the `newName` for the specified `node` in the `names_with_context` mapping,
     * using the version number associated with the caller's `context` and node.
     *
     * The function also emits a `NameChanged` event to notify listeners about the change in the ENS node's name.
     */
    function setName(bytes calldata nodeName, string calldata newName) external virtual {
        bytes32 node = nodeName.namehash(0);
        bytes memory context = abi.encodePacked(msg.sender);
        names_with_context[recordVersions[context][node]][context][node] = newName;
        emit NameChanged(context, nodeName, node, newName);
    }

    /**
     * @dev Retrieves the name associated with a given context and ENS node.
     * @param context The context representing the owner of the name, provided as a byte array.
     * @param node The node representing the ENS node for which the name is being retrieved.
     * @return A string representing the name associated with the context and node.
     *
     * This function allows anyone to retrieve the name associated with a specific context and ENS node.
     * The caller provides the `context`, which should match the context used when setting the name
     * (in the `setName` function). Additionally, the `node` parameter specifies the ENS node for which the name
     * is being retrieved.
     *
     * The function retrieves the mapping `names_with_context` from storage using the version number associated
     * with the caller's `context` and node. The `names_with_context` mapping contains the names for different versions.
     * The function then looks up the name associated with the provided context and node in the mapping.
     *
     * If a name is found for the provided context and node, the function returns it as a string.
     * If no name is found, the function returns an empty string.
     */
    function name(bytes calldata context, bytes32 node) external view returns (string memory) {
        return names_with_context[recordVersions[context][node]][context][node];
    }

    function supportsInterface(bytes4 interfaceID) public view virtual override returns (bool) {
        return interfaceID == type(INameResolver).interfaceId || super.supportsInterface(interfaceID);
    }
}
