// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ResolverBase, BytesUtils} from "../ResolverBase.sol";
import {ITextResolver} from "./ITextResolver.sol";

abstract contract TextResolver is ITextResolver, ResolverBase {
    using BytesUtils for bytes;
    mapping(uint64 => mapping(bytes => mapping(bytes32 => mapping(string => string)))) public texts_with_context;

    /**
     * @dev Sets a text record for a given name, associated with a specific key and value.
     * @param name The DNS encoded domain name.
     * @param key The key under which the text record is being set, represented as a string.
     * @param value The value of the text record being set, represented as a string.
     *
     * This function allows the caller to set a text record for a specific name, associated with a given key and value.
     * The caller provides the `name`, which represents the name associated with the text record.
     * The `key` parameter is a string under which the text record is being set, and the `value` parameter is the actual
     * text value that needs to be associated with the specified name and key.
     *
     * The function internally computes the node hash for the provided `name` using the `namehash` function.
     * It then encodes the caller's address as `context` using the `abi.encodePacked` function.
     * The function sets the `value` for the specified `key` in the `texts_with_context` mapping, using the version number
     * associated with the caller's `context` and node.
     *
     * The function also emits a `TextChanged` event to notify listeners about the change in the text record.
     */
    function setText(bytes calldata name, string calldata key, string calldata value) external virtual {
        bytes32 node = name.namehash(0);
        bytes memory context = abi.encodePacked(msg.sender);
        texts_with_context[recordVersions[context][node]][context][node][key] = value;
        emit TextChanged(context, name, node, key, key, value);
    }

    /**
     * @dev Retrieves the text record associated with a given context, ENS node, and key.
     * @param context The address of the owner of the text record, provided as a byte array.
     * @param node The node representing the ENS node for which the text record is being retrieved.
     * @param key The key under which the text record is stored, represented as a string.
     * @return A string representing the text value associated with the context, node, and key.
     *
     * This function allows anyone to retrieve the text record associated with a specific context, ENS node,
     * and key. The caller provides the `context`, which should match the context used when setting the text record
     * (in the `setText` function). Additionally, the `node` parameter specifies the ENS node for which the text
     * record is being retrieved, and the `key` parameter represents the key under which the text record is stored.
     *
     * The function looks up the text record in the `texts_with_context` mapping using the version number associated
     * with the caller's context and node, as well as the provided `key`. If the text record exists, the function
     * returns the associated text value as a string.
     */
    function text(bytes calldata context, bytes32 node, string calldata key) external view virtual override returns (string memory) {
        return texts_with_context[recordVersions[context][node]][context][node][key];
    }

    function supportsInterface(bytes4 interfaceID) public view virtual override returns (bool) {
        return interfaceID == type(ITextResolver).interfaceId || super.supportsInterface(interfaceID);
    }
}
