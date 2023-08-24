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

    function isAuthorised(bytes calldata context, bytes calldata name) internal view virtual returns (bool);

    modifier authorised(bytes calldata context, bytes calldata name) {
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

    function supportsInterface(bytes4 interfaceID) public view virtual override returns (bool) {
        return interfaceID == type(IVersionableResolver).interfaceId || super.supportsInterface(interfaceID);
    }
}
