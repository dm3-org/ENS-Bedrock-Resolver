// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
import {BedrockCcipVerifier} from "ccip-resolver/contracts/verifier/optimism-bedrock/BedrockCcipVerifier.sol";
import {IBedrockProofVerifier} from "ccip-resolver/contracts/verifier/optimism-bedrock/IBedrockProofVerifier.sol";
import {IResolverService} from "ccip-resolver/contracts/IExtendedResolver.sol";

contract L2PublicResolverVerifier is BedrockCcipVerifier {
    constructor(IBedrockProofVerifier _bedrockProofVerifier, address _target) BedrockCcipVerifier(_bedrockProofVerifier, _target) {}

    function resolveWithProof(bytes calldata response, bytes calldata extraData) public view override returns (bytes memory) {
        bytes memory encodedResponse = super.resolveWithProof(response, extraData);
        bytes memory decodedResponse = abi.decode(encodedResponse, (bytes));
        return decodedResponse;
    }

    function resolveWithAddress(bytes calldata response, bytes calldata extraData) public view returns (address) {
        bytes memory res = super.resolveWithProof(response, extraData);
        return address(bytes20(res));
    }

    function onResolveWithProof(bytes calldata, bytes calldata data) public pure override returns (bytes4) {
        if (bytes4(data) == 0x3b3b57de) {
            return this.resolveWithAddress.selector;
        }
        return this.resolveWithProof.selector;
    }
}
