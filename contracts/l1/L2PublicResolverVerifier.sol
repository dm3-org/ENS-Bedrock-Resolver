// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
import {BedrockCcipVerifier} from "ccip-resolver/contracts/verifier/optimism-bedrock/BedrockCcipVerifier.sol";
import {IBedrockProofVerifier} from "ccip-resolver/contracts/verifier/optimism-bedrock/IBedrockProofVerifier.sol";
import {IResolverService} from "ccip-resolver/contracts/IExtendedResolver.sol";

import "hardhat/console.sol";

contract L2PublicResolverVerifier is BedrockCcipVerifier {
    constructor(IBedrockProofVerifier _bedrockProofVerifier, address _target) BedrockCcipVerifier(_bedrockProofVerifier, _target) {}

    function resolveWithProof(bytes calldata response, bytes calldata extraData) public view override returns (bytes memory) {
        bytes memory encodedResponse = super.resolveWithProof(response, extraData);
        bytes memory decodedResponse = abi.decode(encodedResponse, (bytes));
        return decodedResponse;
    }

    function resolveWithAddress(bytes calldata response, bytes calldata extraData) public view returns (address) {
        return 0x8111DfD23B99233a7ae871b7c09cCF0722847d89;
    }

    function onResolveWithProof(bytes calldata name, bytes calldata data) public pure override returns (bytes4) {
        if (bytes4(data) == 0x3b3b57de) {
            return this.resolveWithAddress.selector;
        }
        return this.resolveWithProof.selector;
    }

    function bytesToAddress(bytes memory b) internal pure returns (address a) {
        require(b.length == 20);
        assembly {
            a := div(mload(add(b, 32)), exp(256, 12))
        }
    }

    function addressToBytes(address a) internal pure returns (bytes memory b) {
        b = new bytes(20);
        assembly {
            mstore(add(b, 32), mul(a, exp(256, 12)))
        }
    }

    function addr() public view returns (address) {
        return address(this);
    }
}
