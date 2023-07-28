// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Multicallable} from "@ensdomains/ens-contracts/contracts/resolvers/Multicallable.sol";
import {AddrResolver} from "./profiles/addr/AddrResolver.sol";
import {TextResolver} from "./profiles/text/TextResolver.sol";
import {ABIResolver} from "./profiles/abi/ABIResolver.sol";
import {ContentHashResolver} from "./profiles/contentHash/ContentHashResolver.sol";
import {DNSResolver} from "./profiles/dns/DNSResolver.sol";
import {NameResolver} from "./profiles/name/NameResolver.sol";

/**
 * This contract is a fork of the ENS Public Resolver contract. Despite the PublicResolver, it has no authorized
 * function anymore.
 * Instead, anybody can set a record for a node using their address as context.
 * This solves the problem of the PublicResolver not having access to the ENSRegistry on L2 but still being able to
 * ensure that a link between the owner and the node is established.
 @dev Find the original contract here: https://github.com/ensdomains/resolvers/blob/master/contracts/PublicResolver.sol
 */
contract L2PublicResolver is Multicallable, AddrResolver, TextResolver, ABIResolver, ContentHashResolver, DNSResolver, NameResolver {
    /**
     * @dev Checks whether the contract supports a specific interface by its identifier.
     * @param interfaceID The identifier of the interface to check, represented as a bytes4 value.
     * @return A boolean value indicating whether the contract supports the given interface.
     *
     * This function allows the contract to be queried for the support of specific interfaces defined
     * by their unique four-byte identifier. It serves as an override for the same function in several
     * parent contracts (Multicallable, AddrResolver, TextResolver, ABIResolver, ContentHashResolver, DNSResolver, NameResolver).
     *
     * The contract inheriting this function should implement the `supportsInterface` function
     * in all the parent contracts and return true if any of them supports the specified interface.
     * Otherwise, it returns false if none of the parent contracts support the interface.
     *
     * Example Usage:
     * ```
     * // Assuming `contractInstance` is an instance of the contract containing this function
     * bytes4 interfaceId =  L2PublicResolver.supportsInterface.selector
     * bool isSupported = contractInstance.supportsInterface(interfaceId);
     * ```
     */
    function supportsInterface(
        bytes4 interfaceID
    )
        public
        view
        override(Multicallable, AddrResolver, TextResolver, ABIResolver, ContentHashResolver, DNSResolver, NameResolver)
        returns (bool)
    {
        return super.supportsInterface(interfaceID);
    }
}
