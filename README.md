# ENS-Bedrock-Resolver

This repository contains an app specific handler allowing to store ENS records on Optimism.
This repository contains contract that have to be deployed on Optimism and Ethereum aswell as a Gateway to resolve CCIP request.
Everything is configured already so in order to set it up you just have to follow the config Setup section

# L2PubicResolver

The L2PublicResolver is a Smart Contract derived from the ENS PublicResolver implementation. The functionality for setting records remains consistent with the original implementation. However, when retrieving a record, the caller is required to provide context, specifically the address of the record as per the ENS registry.

This feature empowers record owners to securely set their records without needing direct access to the ENS Registry contract deployed on the Ethereum mainnet. By incorporating this mechanism, record owners can confidently manage their records in a trustless manner on Layer 2 solutions.

## Context

The L2PublicResolver introduces a novel approach to record management by utilizing an arbitrary bytes string called "context" to define the namespace to which a record belongs. Specifically, in the context of the L2PublicResolver, this "context" refers to the address of the entity that has set a particular record.

This allows for a more flexible and secure record-setting process, enabling record owners to establish records within their respective namespaces without direct access to the ENS Registry contract on the Ethereum mainnet. By associating records with specific addresses, users can confidently manage their records in a trustless manner on Layer 2 solutions.

### Set record

The following example shows how a record can be set. Note that the contract will store both records regardless of them being dedicated to the same domain address and key.

This behavior varies from the original PublicResolver implementation, which would revert if msg.sender is not the owner.

```solidity
address owner = 0x1;
address rando = 0x2

//Called by 0x1
L2Publicresolver.setText("alice.eth","my-key","foo");

//Called by 0x2
L2Publicresolver.setText("alice.eth","my-key","bar");

```

### Read record

When retrieving the record from L2, the context field includes the owner's address according to the ENS registry. This makes it possible to get the right value back from the resolver.

```solidity
bytes memory owner = 0x1;

bytes memory value = L2Publicresolver.text(owner,"alice.eth","my-key","foo");

//value ==foo

```

## Profiles

The L2PublicResolver supports the following profiles

-   address
-   text
-   abi
-   contentHash
-   dns
-   name

# Setup Gateway

## Install

1. Clone the repo `git clone git@github.com:corpus-io/ENS-Bedrock-Resolver.git`
2. run `yarn install`
3. Create an Env file using `cp env.example .env`

## Prepare environment

To deploy a new contract or run a script that sets a verifier on L1 (Layer 1), you'll need to provide a `DEPLOYER_PRIVATE_KEY` to sign your transactions.

If you want to use Hardhat validation, you can also provide an `OPTIMISTIC_ETHERSCAN_API_KEY`. This API key enables Hardhat to validate transactions using Etherscan.

To run the gateway, you'll need to provide the following information:

-   `L2_RESOLVER_ADDRESS`: This address represents the Resolver used by the gateway to resolve requested records.
-   `L1_PROVIDER_URL`: The RPC provider address for L1 (Layer 1).
-   `L2_PROVIDER_URL`: The RPC provider address for L2 (Layer 2).

Make sure you have the necessary `DEPLOYER_PRIVATE_KEY`, `OPTIMISTIC_ETHERSCAN_API_KEY`, `L2_RESOLVER_ADDRESS`, `L1_PROVIDER_URL`, and `L2_PROVIDER_URL` when deploying a contract, running a script, or running the gateway.

# Setup Resolver

**To use the ENS-Bedrock-Resolver for your ENS name, you need to complete 2 transactions on the mainnet to set it up.**

1. Set the CCIP-Resolver contract as your resolver:

- You can either use the ENS Frontend or the script `setCcipResolver.ts`.
- When using the script, replace the `ENS_NAME` constant with your ENS name and run the following command:
        ```
        npx hardhat run ./scripts/setCcipResolver.ts --network goerli
        ```

2. Deploy a L2PublicResolverContract

This step may be omitted when using an instance already deployed. You can find their address in the deployments section.
If you decide to deploy a new instance of the L2PublicResolver, you have to deploy a new L2PublicResolverContract as well.

-   Currently, there is no Frontend available to do this directly.
-   You can use the script `setVerifierForDomain.ts` to perform the transaction.
-   Adjust the script by specifying the l2 Contract you want to store your data, and then run the following command:
    `npx hardhat run ./deploy/L1/01_L2Public_Resolver_Verifier.ts --network goerli`

3. Set the BedrockCcipVerifier and the gateway URL for your ENS name:
- Currently, there is no Frontend available to do this directly.
- You can use the script `setVerifierForDomain.ts` to perform the transaction.
- Adjust the script by specifying your ENS name and URL, and then run the following command:
        ```
        npx hardhat run ./scripts/setVerifierForDomain.ts --network goerli
        ```

Please make sure to replace `ENS_NAME` with your actual ENS name and adjust the URL accordingly. When running the scripts, specify the correct network (`goerli` in this example).

By following these steps, you'll successfully set up the ENS-Bedrock-Resolver for your ENS name.

# Setup Gateway

To run a gateway perform the following steps

1. Deploy and L2PublicResolver or use an instance already deployed
2. Create a .env file and copy the content of env.example. If you want to use an instance already deployed you can omit DEPLOYER_PRIVATE_KEY and OPTIMISTIC_ETHERSCAN_API_KEY
3. Run `yarn start`

# Deployments

## Goerli

CCIP Resolver : 0x491316b83fDb7dC1370b0815775C8d2D2d0b6428

L2PublicResolverVerifier : 0x4b0eb86177BffeB62e74b14c89d8817B3762BF14

## Optimsim Goerli

L2PublicResolver: 0xc1C2b9dD2D15045D52640e120a2d1F16dA3bBb48
