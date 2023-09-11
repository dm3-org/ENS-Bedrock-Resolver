// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
import {BedrockCcipVerifier} from "ccip-resolver/contracts/verifier/optimism-bedrock/BedrockCcipVerifier.sol";
import {IBedrockProofVerifier} from "ccip-resolver/contracts/verifier/optimism-bedrock/IBedrockProofVerifier.sol";
import {IResolverService} from "ccip-resolver/contracts/IExtendedResolver.sol";

import {BytesLib} from "solidity-bytes-utils/contracts/BytesLib.sol";

/**
 * @dev This contract allowas to overwrite the resolveWithProof function to handle data type that are not bytes
 */
abstract contract L2PublicResolverVerifier is BedrockCcipVerifier {
    constructor(
        address _owner,
        string memory _graphqlUrl,
        string memory _name,
        uint256 _chainId,
        IBedrockProofVerifier _bedrockProofVerifier,
        address _target
    ) BedrockCcipVerifier(_owner, _graphqlUrl, _name, _chainId, _bedrockProofVerifier, _target) {}

    /**
     * @dev The default resolveWithProof function
     * @param response The response data obtained from resolving the ENS name with the proof.
     * @param extraData The calldata the gateway was called with
     * @return The decoded response data as a byte array.
     */
    function resolveWithProof(bytes calldata response, bytes calldata extraData, bytes calldata verifierData) public view override returns (bytes memory) {
        /**
         * Resolve with proof returns bytes. Because resolveWithProof is called via static call the data will
         * implicitly encoded as bytes again.
         * So if we would just return the super.resolveWithProof(response, extraData) the data would be encoded twice.
         * Because client libraries like ethers expect the data to be just encoded once, we have to decode the data.
         */
        bytes memory encodedResponse = super.resolveWithProof(response, extraData, verifierData);
        bytes memory decodedResponse = abi.decode(encodedResponse, (bytes));
        return decodedResponse;
    }

    /**
     * @param response The response bytes received from the AddrResolver.
     * @return The Ethereum address resolved from the response bytes.
     * @dev The AddrResolver stores addresses as bytes instead of Ethereum addresses.
     * This is done to support other blockchain addresses, not just EVM addresses.
     * However, the return type of `addr(bytes32)` is `address`,
     * which means the client library expects an Ethereum address to be returned.
     * To meet this expectation, we convert the bytes into an Ethereum address and return it.
     */
    function resolveWithAddress(bytes calldata response, bytes calldata extraData, bytes calldata verifierData) public view returns (address) {
        bytes memory res = super.resolveWithProof(response, extraData, verifierData);
        /**
         * The AddrResolver stores addresses as bytes instead of Ethereum addresses.
         * This is to support other blockchain addresses and not just EVM addresses.
         * However, the return type of `addr(bytes32)` is `address`,
         * so the client library expects an Ethereum address to be returned.
         * For that reason, we have to convert the bytes into an address.
         */
        return address(bytes20(res));
    }

    /**
     * @dev Resolves the content from the response bytes using the AddrResolver.
     * @param response The response bytes received from the AddrResolver.
     * (uint256, bytes)
     * @return The resolved content as bytes.
     * @dev The return type of ABI(bytes32 node, uint256 contentType) is (uint256, bytes),
     * so the caller not just expects
     * the ABI but also the corresponding content type. So we're proving that the ABI is stored in the slot and then
     * return it along with the content type
     */
    function resolveWithAbi(bytes calldata response, bytes calldata extraData, bytes calldata , bytes calldata verifierData) public view returns (bytes memory) {
        bytes memory encodedResponse = super.resolveWithProof(response, extraData, verifierData);

        (, bytes memory data) = abi.decode(extraData[4:], (bytes, bytes));
        /**
         * Exctract the content type from the calldata
         */
        (, uint contentType) = abi.decode(BytesLib.slice(data, 4, data.length - 4), (bytes32, uint));
        /**
         * Return the content type and the ABI
         *To avoid encoding the data twice, we decode the data return from the super function
         */
        return abi.encode(contentType, abi.decode(encodedResponse, (bytes)));
    }

    /**
     * @dev Can be called to determine what function to use to handle resolveWithProof. Returns the selector that then can be called via staticcall
     * @return The four-byte function selector of the corresponding resolution function..
     */
    function onResolveWithProof(bytes calldata, bytes calldata data) public pure override returns (bytes4) {
        /**
         * if the function addr(bytes32) is called, return the selector of resolveWithAddress.
         */
        if (bytes4(data) == 0x3b3b57de) {
            return this.resolveWithAddress.selector;
        }
        /**
         * if the function ABI(bytes32 node, uint256 contentType) is called, return the selector of resolveWithAbi.
         */
        if (bytes4(data) == 0x2203ab56) {
            return this.resolveWithAbi.selector;
        }
        /**
         * any other selector will be handled by the default resolveWithProof function.
         */
        return this.resolveWithProof.selector;
    }
}
