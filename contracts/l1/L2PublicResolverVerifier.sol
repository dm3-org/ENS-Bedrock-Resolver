// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
import {BedrockCcipVerifier} from "ccip-resolver/contracts/verifier/optimism-bedrock/BedrockCcipVerifier.sol";
import {IBedrockProofVerifier} from "ccip-resolver/contracts/verifier/optimism-bedrock/IBedrockProofVerifier.sol";
import {IResolverService} from "ccip-resolver/contracts/IExtendedResolver.sol";

import {BytesLib} from "solidity-bytes-utils/contracts/BytesLib.sol";
import {RLPReader} from "@eth-optimism/contracts-bedrock/contracts/libraries/rlp/RLPReader.sol";

/**
 * @dev This contract allowas to overwrite the resolveWithProof function to handle data type that are not bytes
 */
contract L2PublicResolverVerifier is BedrockCcipVerifier {
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
    function resolveWithProof(bytes calldata response, bytes calldata extraData) public view override returns (bytes memory) {
        revert("resolveWithProof has to be handled by delegated functions");
    }

    function resolveText(bytes calldata response, bytes calldata extraData) public view returns (bytes memory) {
        bytes memory proofsEncoded = super.resolveWithProof(response, extraData);
        bytes[] memory responses = abi.decode(proofsEncoded, (bytes[]));
        bytes[] memory proofs = abi.decode(response, (bytes[]));

        (, IBedrockProofVerifier.BedrockStateProof memory proof) = abi.decode(proofs[1], (bytes, IBedrockProofVerifier.BedrockStateProof));

        (string memory name, bytes memory data, bytes memory context) = abi.decode(extraData[4:], (string, bytes, bytes));
        /**
         * Exctract the content type from the calldata
         */
        (bytes32 node, string memory record) = abi.decode(BytesLib.slice(data, 4, data.length - 4), (bytes32, string));

        uint versionNumber = hexBytesToUint(responses[0]);

        bytes32 expectedKey = getStorageSlotForText(versionNumber, context, node, record);

        //single slot
        if (proof.length <= 31) {
            require(proof.storageProofs.length == 1, "invalid single slot response length");
            require(proof.storageProofs[0].key == expectedKey, "invalid storage slot");
        } else {
            bytes32 hashedKey = keccak256(abi.encodePacked(expectedKey));
            for (uint256 i = 0; i < proof.storageProofs.length; i++) {
                require(proof.storageProofs[i].key == bytes32(uint256(hashedKey) + i), "invalid storage slot");
            }
        }

        /**
         * Resolve with proof returns bytes. Because resolveWithProof is called via static call the data will
         * implicitly encoded as bytes again.
         * So if we would just return the super.resolveWithProof(response, extraData) the data would be encoded twice.
         * Because client libraries like ethers expect the data to be just encoded once, we have to decode the data.
         */
        bytes memory decodedResponse = abi.decode(responses[1], (bytes));
        return decodedResponse;
    }

    function resolveAddress(bytes calldata response, bytes calldata extraData) public view returns (address) {
        bytes memory proofsEncoded = super.resolveWithProof(response, extraData);
        bytes[] memory responses = abi.decode(proofsEncoded, (bytes[]));
        bytes[] memory proofs = abi.decode(response, (bytes[]));

        (, IBedrockProofVerifier.BedrockStateProof memory proof) = abi.decode(proofs[1], (bytes, IBedrockProofVerifier.BedrockStateProof));

        (string memory name, bytes memory data, bytes memory context) = abi.decode(extraData[4:], (string, bytes, bytes));
        /**
         * Exctract the content type from the calldata
         */
        bytes32 node = abi.decode(BytesLib.slice(data, 4, data.length - 4), (bytes32));

        require(proof.storageProofs.length == 1, "invalid address response length");

        uint versionNumber = uint256(bytes32(responses[0]));
        bytes32 actualKey = getStorageSlotForAddr(versionNumber, context, node, 60);

        require(proof.storageProofs[0].key == actualKey, "invalid storage slot");

        /**
         * The AddrResolver stores addresses as bytes instead of Ethereum addresses.
         * This is to support other blockchain addresses and not just EVM addresses.
         * However, the return type of `addr(bytes32)` is `address`,
         * so the client library expects an Ethereum address to be returned.
         * For that reason, we have to convert the bytes into an address.
         */
        return address(bytes20(responses[1]));
    }

    function resolveContentHash(bytes calldata response, bytes calldata extraData) public view returns (bytes memory) {
        bytes memory proofsEncoded = super.resolveWithProof(response, extraData);
        bytes[] memory responses = abi.decode(proofsEncoded, (bytes[]));
        bytes[] memory proofs = abi.decode(response, (bytes[]));

        (, IBedrockProofVerifier.BedrockStateProof memory proof) = abi.decode(proofs[1], (bytes, IBedrockProofVerifier.BedrockStateProof));

        (string memory name, bytes memory data, bytes memory context) = abi.decode(extraData[4:], (string, bytes, bytes));
        /**
         * Exctract the content type from the calldata
         */
        bytes32 node = abi.decode(BytesLib.slice(data, 4, data.length - 4), (bytes32));

        uint versionNumber = uint256(bytes32(responses[0]));
        bytes32 expectedKey = getStorageSlotForContentHash(versionNumber, context, node);

        if (proof.length <= 31) {
            require(proof.storageProofs.length == 1, "invalid single slot response length");
            require(proof.storageProofs[0].key == expectedKey, "invalid storage slot");
        } else {
            bytes32 hashedKey = keccak256(abi.encodePacked(expectedKey));
            for (uint256 i = 0; i < proof.storageProofs.length; i++) {
                require(proof.storageProofs[i].key == bytes32(uint256(hashedKey) + i), "invalid storage slot");
            }
        }

        bytes memory decodedResponse = abi.decode(responses[1], (bytes));
        return decodedResponse;
    }

    function resolveBlockchainAddress(bytes calldata response, bytes calldata extraData) public view returns (bytes memory) {
        bytes memory proofsEncoded = super.resolveWithProof(response, extraData);
        bytes[] memory responses = abi.decode(proofsEncoded, (bytes[]));
        bytes[] memory proofs = abi.decode(response, (bytes[]));

        (, IBedrockProofVerifier.BedrockStateProof memory proof) = abi.decode(proofs[1], (bytes, IBedrockProofVerifier.BedrockStateProof));

        (string memory name, bytes memory data, bytes memory context) = abi.decode(extraData[4:], (string, bytes, bytes));
        /**
         * Exctract the content type from the calldata
         */
        (bytes32 node, uint coinType) = abi.decode(BytesLib.slice(data, 4, data.length - 4), (bytes32, uint));

        uint versionNumber = uint256(bytes32(responses[0]));
        bytes32 expectedKey = getStorageSlotForAddr(versionNumber, context, node, coinType);

        if (proof.length <= 31) {
            require(proof.storageProofs.length == 1, "invalid single slot response length");
            require(proof.storageProofs[0].key == expectedKey, "invalid storage slot");
        } else {
            bytes32 hashedKey = keccak256(abi.encodePacked(expectedKey));
            for (uint256 i = 0; i < proof.storageProofs.length; i++) {
                require(proof.storageProofs[i].key == bytes32(uint256(hashedKey) + i), "invalid storage slot");
            }
        }

        bytes memory decodedResponse = abi.decode(responses[1], (bytes));
        return decodedResponse;
    }

    function hexBytesToUint(bytes memory hexData) internal view returns (uint256 result) {
        for (uint256 i = 0; i < hexData.length; i++) {
            result = result * 256 + uint8(hexData[i]);
        }
        return result;
    }

    function getStorageSlotForAddr(
        uint256 versionNumber,
        bytes memory context,
        bytes32 node,
        uint256 coinType
    ) internal pure returns (bytes32) {
        uint slot = 1;
        bytes32 innerHash = keccak256(abi.encodePacked(versionNumber, slot));
        bytes32 contextHash = keccak256(abi.encodePacked(context, innerHash));
        bytes32 nodeHash = keccak256(abi.encodePacked(node, contextHash));
        bytes32 outerHash = keccak256(abi.encodePacked(coinType, nodeHash));
        return outerHash;
    }

    function getStorageSlotForText(
        uint256 versionNumber,
        bytes memory context,
        bytes32 node,
        string memory recordName
    ) internal pure returns (bytes32) {
        uint slot = 2;
        bytes32 innerHash = keccak256(abi.encodePacked(versionNumber, slot));
        bytes32 contextHash = keccak256(abi.encodePacked(context, innerHash));
        bytes32 middleHash = keccak256(abi.encodePacked(node, contextHash));
        bytes32 outerHash = keccak256(abi.encodePacked(recordName, middleHash));
        return outerHash;
    }

    function getStorageSlotForContentHash(uint256 versionNumber, bytes memory context, bytes32 node) internal pure returns (bytes32) {
        uint slot = 3;
        bytes32 innerHash = keccak256(abi.encodePacked(versionNumber, slot));
        bytes32 contextHash = keccak256(abi.encodePacked(context, innerHash));
        bytes32 outerHash = keccak256(abi.encodePacked(node, contextHash));
        return outerHash;
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
            return this.resolveAddress.selector;
        }

        if (bytes4(data) == 0xf1cb7e06) {
            return this.resolveBlockchainAddress.selector;
        }

        if (bytes4(data) == 0xbc1c58d1) {
            return this.resolveContentHash.selector;
        }
        if (bytes4(data) == 0x59d1d43c) {
            return this.resolveText.selector;
        }
        revert("unsupported selector");
    }
}
