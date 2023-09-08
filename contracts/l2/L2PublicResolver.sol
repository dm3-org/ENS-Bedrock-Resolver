// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {Multicallable} from "@ensdomains/ens-contracts/contracts/resolvers/Multicallable.sol";
import {AddrResolver} from "./profiles/addr/AddrResolver.sol";
import {TextResolver} from "./profiles/text/TextResolver.sol";
import {ContentHashResolver} from "./profiles/contentHash/ContentHashResolver.sol";

/**
 * This contract is a fork of the ENS Public Resolver contract. Despite the PublicResolver, it has no authorized
 * function anymore.
 * Instead, anybody can set a record for a node using their address as context.
 * This solves the problem of the PublicResolver not having access to the ENSRegistry on L2 but still being able to
 * ensure that a link between the owner and the node is established.
 @dev Find the original contract here: https://github.com/ensdomains/resolvers/blob/master/contracts/PublicResolver.sol
 */
contract L2PublicResolver is Multicallable, AddrResolver, TextResolver, ContentHashResolver {
    /**
     * A mapping of delegates. A delegate that is authorised for a context
     * for a name may make changes to the record.
     * (context, name, delegate) => approved
     */
    mapping(bytes => mapping(bytes => mapping(address => bool))) private _approvals;

    event Approved(bytes context, bytes name, address indexed delegate, bool indexed approved);

    /**
     * @dev Grants or revokes approval status for a delegate.
     * @param name The name for which the approval status is being set.
     * @param delegate The address of the delegate whose status is being set.
     * @param approved A boolean indicating whether the delegate's approval status is being granted or revoked.
     * @notice Only the owner of this approval can perform this action.
     * @notice Setting delegate status for self is not allowed.
     */
    function approve(bytes calldata name, address delegate, bool approved) external {
        require(msg.sender != delegate, "Setting delegate status for self");

        // The context is used to differentiate different approval contexts.
        bytes memory context = abi.encodePacked(msg.sender);
        // Set the delegate's approval status for the given name and context.
        _approvals[context][name][delegate] = approved;
        // Emit an event to log the approval status change.
        emit Approved(context, name, delegate, approved);
    }

    /**
     * @dev Checks whether a delegate is approved for a specific context and name.
     * @param context The context associated with the approval.
     * @param name The name for which the approval status is being checked.
     * @param delegate The address of the delegate whose approval status is being checked.
     * @return A boolean indicating whether the delegate is approved for the given context and name.
     * @notice This function is view-only and does not modify the contract's state.
     */
    function isApprovedFor(bytes memory context, bytes calldata name, address delegate) public view returns (bool) {
        return _approvals[context][name][delegate];
    }

    /**
     * @dev Checks whether the sender is authorized to edit a specific record within a given context and name.
     * @param context The context associated with the record.
     * @param name The name of the record being checked.
     * @return A boolean indicating whether the sender is authorized to edit the record.
     * @notice The sender is authorized to edit all records within their own context.
     */
    function isAuthorised(bytes memory context, bytes calldata name) internal view override returns (bool) {
        bytes memory senderContext = abi.encodePacked(msg.sender);

        // Sender is authorized to edit all of their records
        if (keccak256(senderContext) == keccak256(context)) {
            return true;
        }
        // If the sender is not the owner, they must be approved to edit the record
        return isApprovedFor(context, name, msg.sender);
    }

    /**
     * @dev Checks if the contract supports a specific interface.
     * @param interfaceID The interface identifier being checked.
     * @return A boolean indicating whether the contract supports the specified interface.
     * @notice This function is public, view-only, and is meant to determine interface support for ERC-165.
     * @notice It checks for support of the IVersionableResolver interface and delegates to the parent contract's supportsInterface function if not recognized.
     */
    function supportsInterface(
        bytes4 interfaceID
    ) public view override(Multicallable, AddrResolver, TextResolver, ContentHashResolver) returns (bool) {
        return super.supportsInterface(interfaceID);
    }
}
