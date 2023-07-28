// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ResolverBase, BytesUtils} from "../ResolverBase.sol";
import {IAddrResolver} from "./IAddrResolver.sol";
import {IAddressResolver} from "./IAddressResolver.sol";

abstract contract AddrResolver is IAddrResolver, IAddressResolver, ResolverBase {
    using BytesUtils for bytes;
    uint256 private constant COIN_TYPE_ETH = 60;

    mapping(uint64 => mapping(bytes => mapping(bytes32 => mapping(uint256 => bytes)))) public addresses_with_context;

    /**
     * @dev Sets an Ethereum address record for a given name.
     * @param name The DNS encoded domain name.
     * @param a The Ethereum address value to be set.
     *
     * This function allows the caller to set an Ethereum address record for a specific name.
     * The caller provides the `name`, which represents the name associated with the address record.
     * The `a` parameter is the Ethereum address that needs to be associated with the provided name.
     *
     * The function internally calls the `setAddr` function with the default `COIN_TYPE_ETH`
     * (assuming it's Ethereum) and the `addressToBytes` utility to convert the address to a byte array.
     * It sets the address record for the specified name and the Ethereum coin type (COIN_TYPE_ETH).
     */
    function setAddr(bytes calldata name, address a) external virtual {
        setAddr(name, COIN_TYPE_ETH, addressToBytes(a));
    }

    /**
     * @dev Retrieves the address record associated with a given context and node.
     * @param context The context representing the owner of the address record, provided as a byte array.
     * @param node The node representing the ENS node for which the address record is being retrieved.
     * @return `address payable` representing the stored address associated with the context and node.
     *
     * This function allows anyone to retrieve the address record associated with a specific context and ENS node.
     * The caller provides the `context`, which should match the context used when setting the address record
     * (in the `setAddr` function). Additionally, the `node` parameter specifies the ENS node for which the address
     * record is being retrieved.
     *
     * The function first calls the internal function `addr(context, node, COIN_TYPE_ETH)` to retrieve the address record
     * for the specified context and node with the default `COIN_TYPE_ETH` (assuming it's Ethereum). If the retrieved
     * address is empty (zero-length), the function returns a zero address (address payable(0)). Otherwise, it converts
     * the retrieved byte array address to an `address payable` type and returns it
     */
    function addr(bytes calldata context, bytes32 node) public view virtual override returns (address payable) {
        bytes memory a = addr(context, node, COIN_TYPE_ETH);
        if (a.length == 0) {
            return payable(0);
        }
        return bytesToAddress(a);
    }

    /**
     * @dev Sets an address record for a given name and coin type associated with the caller's context.
     * @param name The DNS encoded domain name
     * @param coinType The coin type identifier for the address (e.g., 60 for Ethereum).
     * @param a The Blockchain address encoded in bytes.
     *
     * This function allows the caller to set an address record for a specific name and coin type. The caller's
     * context is used to determine ownership of the record, meaning only the owner of the context can set a record
     * for a particular name. The caller's address is used as the context for setting the record.
     *
     * The function emits an `AddressChanged` event with information about the context, name, node, coin type, and the
     * new address value. Additionally, if the `coinType` is set to COIN_TYPE_ETH (60 for Ethereum), it also emits
     * an `AddrChanged` event with the same information as the `AddressChanged` event, but only for Ethereum addresses.
     *
     * The function stores the address record in the `addresses_with_context` mapping using the version number associated
     * with the caller's context and node. The version number can be obtained from the `recordVersions` mapping.
     *
     */
    function setAddr(bytes calldata name, uint256 coinType, bytes memory a) public virtual {
        bytes32 node = name.namehash(0);
        bytes memory context = abi.encodePacked(msg.sender);
        emit AddressChanged(context, name, node, coinType, a);
        if (coinType == COIN_TYPE_ETH) {
            emit AddrChanged(context, name, node, bytesToAddress(a));
        }
        addresses_with_context[recordVersions[context][node]][context][node][coinType] = a;
    }

    /**
     * @dev Retrieves the address record associated with a given context, ENS node, and coin type.
     * @param context The context representing the owner of the address record, provided as a byte array.
     * @param node The node representing the ENS node for which the address record is being retrieved.
     * @param coinType The coin type identifier for the address (e.g., 60 for Ethereum).
     * @return A byte array representing the stored Blockchain address associated with the context, node, and coin type.
     *
     * This function allows anyone to retrieve the address record associated with a specific context, ENS node,
     * and coin type. The caller provides the `context`, which should match the context used when setting the address
     * record (in the `setAddr` function). Additionally, the `node` parameter specifies the ENS node for which the address
     * record is being retrieved, and the `coinType` parameter specifies the coin type for the address (e.g., 60 for Ethereum).
     *
     * The function looks up the address record in the `addresses_with_context` mapping using the version number associated
     * with the caller's context and node. It then returns the stored address as a byte array.
     */
    function addr(bytes calldata context, bytes32 node, uint256 coinType) public view virtual override returns (bytes memory) {
        return addresses_with_context[recordVersions[context][node]][context][node][coinType];
    }

    function supportsInterface(bytes4 interfaceID) public view virtual override returns (bool) {
        return
            interfaceID == type(IAddrResolver).interfaceId ||
            interfaceID == type(IAddressResolver).interfaceId ||
            super.supportsInterface(interfaceID);
    }

    /**
     * @dev Converts a byte array into an Ethereum address representation.
     * @param b The byte array (bytes) to be converted into an Ethereum address.
     * @return a `address payable` representing the Ethereum address converted from the byte array.
     *
     * This internal function converts the provided byte array `b` into an Ethereum address.
     */
    function bytesToAddress(bytes memory b) internal pure returns (address payable a) {
        require(b.length == 20);
        assembly {
            a := div(mload(add(b, 32)), exp(256, 12))
        }
    }

    /**
     * @dev Converts an Ethereum address into a byte array representation.
     * @param a The Ethereum address to be converted.
     * @return b byte array (bytes) representation of the Ethereum address.
     *
     * This internal function converts the provided Ethereum address `a` into a byte array of size 20 bytes.
     */
    function addressToBytes(address a) internal pure returns (bytes memory b) {
        b = new bytes(20);
        assembly {
            mstore(add(b, 32), mul(a, exp(256, 12)))
        }
    }
}
