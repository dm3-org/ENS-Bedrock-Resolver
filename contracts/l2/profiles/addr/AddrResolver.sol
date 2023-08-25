// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ResolverBase, BytesUtils} from "../ResolverBase.sol";
import {IAddrResolver} from "./IAddrResolver.sol";
import {IAddressResolver} from "./IAddressResolver.sol";

abstract contract AddrResolver is IAddrResolver, IAddressResolver, ResolverBase {
    using BytesUtils for bytes;
    uint256 private constant COIN_TYPE_ETH = 60;

    //[version_number][context][node][content_type] => addr
    mapping(uint64 => mapping(bytes => mapping(bytes32 => mapping(uint256 => bytes)))) public addresses_with_context;

    /**
     * @dev Sets an address value associated with a specific name for the caller's context.
     * @param name The DNS encoded domain name.
     * @param a The address value to be set.
     * @notice This function allows the caller to set an address value for a specific name within their context.
     * @notice The `COIN_TYPE_ETH` constant is used to specify the coin type for Ethereum addresses.
     */
    function setAddr(bytes calldata name, address a) external virtual {
        bytes memory context = abi.encodePacked(msg.sender);
        setAddrFor(context, name, COIN_TYPE_ETH, addressToBytes(a));
    }

    /**
     * @dev Sets an address value associated with a specific name and coin type for the caller's context.
     * @param name The DNS encoded domain name.
     * @param coinType The type of coin for which the address value is being set.
     * @param a The address value to be set, represented as bytes.
     * @notice This function allows the caller to set an address value for a specific name and coin type within their context.
     */
    function setAddr(bytes calldata name, uint256 coinType, bytes memory a) public virtual {
        bytes memory context = abi.encodePacked(msg.sender);
        setAddrFor(context, name, coinType, a);
    }

    /**
     * @dev Sets an address value associated with a specific context, name, and Ethereum address.
     * @param context The context under which the address value is being set.
     * @param name The DNS encoded domain name.
     * @param a The Ethereum address value to be set.
     * @notice This function allows the caller to set an Ethereum address value for a specific context and name.
     * @notice The `COIN_TYPE_ETH` constant is used to specify the coin type for Ethereum addresses.
     */
    function setAddrFor(bytes calldata context, bytes calldata name, address a) external virtual {
        setAddrFor(context, name, COIN_TYPE_ETH, addressToBytes(a));
    }

    /**
     * @dev Sets an address value associated with a specific context, name, and coin type.
     * @param context The context under which the address value is being set.
     * @param name The DNS encoded domain name.
     * @param coinType The type of coin for which the address value is being set.
     * @param a The address value to be set, represented as bytes.
     * @notice This function allows the caller to set an address value for a specific context, name, and coin type.
     * @notice If the coin type is `COIN_TYPE_ETH`, an `AddrChanged` event is emitted to log the Ethereum address change.
     */
    function setAddrFor(
        bytes memory context,
        bytes calldata name,
        uint256 coinType,
        bytes memory a
    ) public virtual authorised(context, name) {
        bytes32 node = name.namehash(0);
        emit AddressChanged(context, name, node, coinType, a);
        if (coinType == COIN_TYPE_ETH) {
            emit AddrChanged(context, name, node, bytesToAddress(a));
        }
        addresses_with_context[recordVersions[context][node]][context][node][coinType] = a;
    }

    /**
     * @dev Retrieves the address record associated with a given context and node.
     * @param context The context representing the owner of the address record, provided as a byte array.
     * @param node The node representing the ENS node for which the address record is being retrieved.
     * @return `address payable` representing the stored address associated with the context and node.
     */
    function addr(bytes calldata context, bytes32 node) public view virtual override returns (address payable) {
        bytes memory a = addr(context, node, COIN_TYPE_ETH);
        if (a.length == 0) {
            return payable(0);
        }
        return bytesToAddress(a);
    }

    /**
     * @dev Retrieves the address record associated with a given context, ENS node, and coin type.
     * @param context The context representing the owner of the address record, provided as a byte array.
     * @param node The node representing the ENS node for which the address record is being retrieved.
     * @param coinType The coin type identifier for the address (e.g., 60 for Ethereum).
     * @return A byte array representing the stored Blockchain address associated with the context, node, and coin type.
     */
    function addr(bytes calldata context, bytes32 node, uint256 coinType) public view virtual override returns (bytes memory) {
        return addresses_with_context[recordVersions[context][node]][context][node][coinType];
    }

    /**
     * @dev Checks if the contract supports a specific interface.
     * @param interfaceID The interface identifier being checked.
     * @return A boolean indicating whether the contract supports the specified interface.
     * @notice This function is public, view-only, and is meant to determine interface support for ERC-165.
     * @notice It checks for support of the IVersionableResolver interface and delegates to the parent contract's supportsInterface function if not recognized.
     */
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
