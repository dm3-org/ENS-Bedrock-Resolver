// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {BytesUtils} from "@ensdomains/ens-contracts/contracts/wrapper/BytesUtils.sol";

interface IVersionableResolver {
    event VersionChanged(bytes context, bytes name, bytes32 indexed node, uint64 newVersion);

    function recordVersions(bytes calldata context, bytes32 node) external view returns (uint64);
}

abstract contract ResolverBase is ERC165, IVersionableResolver {
    using BytesUtils for bytes;
    //[context][node] => version_number
    mapping(bytes => mapping(bytes32 => uint64)) public recordVersions;

    /**
     * @dev Checks whether the sender is authorized to perform an action on a specific record within a given context and name.
     * @param context The context associated with the record.
     * @param name The name of the record being checked.
     * @return A boolean indicating whether the sender is authorized to perform the action.
     * @notice This function is internal, view-only, and is meant to be overridden by derived contracts.
     */
    function isAuthorised(bytes memory context, bytes calldata name) internal view virtual returns (bool);

    /**
     * @dev Modifier to check whether the sender is authorized to perform an action on a specific record within a given context and name.
     * @param context The context associated with the record.
     * @param name The name of the record being checked.
     * @notice If the sender is not authorized, the function call will revert with "Not authorised" error message.
     */
    modifier authorised(bytes memory context, bytes calldata name) {
        require(isAuthorised(context, name), "Not authorised");
        _;
    }

    /**
     * Increments the record version associated with an ENS node.
     * May only be called by the owner of that node in the ENS registry.
     * @param name The name to update.
     */
    function clearRecords(bytes calldata name) public virtual {
        bytes32 node = name.namehash(0);
        bytes memory context = abi.encodePacked(msg.sender);
        recordVersions[context][node]++;
        emit VersionChanged(context, name, node, recordVersions[context][node]);
    }

    /**
     * @dev Checks if the contract supports a specific interface.
     * @param interfaceID The interface identifier being checked.
     * @return A boolean indicating whether the contract supports the specified interface.
     * @notice This function is public, view-only, and is meant to determine interface support for ERC-165.
     * @notice It checks for support of the IVersionableResolver interface and delegates to the parent contract's supportsInterface function if not recognized.
     */
    function supportsInterface(bytes4 interfaceID) public view virtual override returns (bool) {
        return interfaceID == type(IVersionableResolver).interfaceId || super.supportsInterface(interfaceID);
    }
}
