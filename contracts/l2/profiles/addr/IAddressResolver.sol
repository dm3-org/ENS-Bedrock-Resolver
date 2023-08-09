// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/**
 * Interface for the new (multicoin) addr function.
 */
interface IAddressResolver {
    event AddressChanged(bytes context, bytes name, bytes32 indexed node, uint256 coinType, bytes newAddress);

    /**
     * Returns the blockchain address associated with an ENS node.
     * @param node The ENS node to query.
     * @param coinType The coin type to query.
     * @return The associated address.
     */
    function addr(bytes calldata context, bytes32 node, uint256 coinType) external view returns (bytes memory);
}
