// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
import {BedrockCcipVerifier} from "ccip-resolver/contracts/verifier/optimism-bedrock/BedrockCcipVerifier.sol";
import {IBedrockProofVerifier} from "ccip-resolver/contracts/verifier/optimism-bedrock/IBedrockProofVerifier.sol";
import {IResolverService} from "ccip-resolver/contracts/IExtendedResolver.sol";

import {BytesLib} from "solidity-bytes-utils/contracts/BytesLib.sol";


contract L2PublicResolverVerifier is BedrockCcipVerifier {
    constructor(
        address _owner,
        string memory _graphqlUrl,
        IBedrockProofVerifier _bedrockProofVerifier,
        address _target
    ) BedrockCcipVerifier(_owner, _graphqlUrl, _bedrockProofVerifier, _target) {}

    function resolveWithProof(bytes calldata response, bytes calldata extraData) public view override returns (bytes memory) {
        bytes memory encodedResponse = super.resolveWithProof(response, extraData);
        bytes memory decodedResponse = abi.decode(encodedResponse, (bytes));
        return decodedResponse;
    }

    function resolveWithAddress(bytes calldata response, bytes calldata extraData) public view returns (address) {
        bytes memory res = super.resolveWithProof(response, extraData);
        return address(bytes20(res));
    }

    function resolveWithAbi(bytes calldata response, bytes calldata extraData) public view returns (bytes memory) {
        bytes memory encodedResponse = super.resolveWithProof(response, extraData);

        (, bytes memory data) = abi.decode(extraData[4:], (bytes, bytes));
        (, uint contentType) = abi.decode(BytesLib.slice(data, 4, data.length - 4), (bytes32, uint));

        return abi.encode(contentType, abi.decode(encodedResponse, (bytes)));
    }

    function onResolveWithProof(bytes calldata, bytes calldata data) public pure override returns (bytes4) {
        if (bytes4(data) == 0x3b3b57de) {
            return this.resolveWithAddress.selector;
        }
        if (bytes4(data) == 0x2203ab56) {
            return this.resolveWithAbi.selector;
        }
        return this.resolveWithProof.selector;
    }
}
