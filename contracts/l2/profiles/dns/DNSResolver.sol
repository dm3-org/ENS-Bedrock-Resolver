// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {ResolverBase, BytesUtils as EnsBytesUtils} from "../ResolverBase.sol";
import {RRUtils, BytesUtils} from "@ensdomains/ens-contracts/contracts/dnssec-oracle/RRUtils.sol";
import {IDNSRecordResolver} from "./IDNSRecordResolver.sol";
import {IDNSZoneResolver} from "./IDNSZoneResolver.sol";

abstract contract DNSResolver is IDNSRecordResolver, IDNSZoneResolver, ResolverBase {
    using RRUtils for *;
    using BytesUtils for bytes;
    using EnsBytesUtils for bytes;

    // Zone hashes for the domains.
    // A zone hash is an EIP-1577 content hash in binary format that should point to a
    // resource containing a single zonefile.
    //[version_number][context][node] => zonehash
    mapping(uint64 => mapping(bytes => mapping(bytes32 => bytes))) private zonehash_with_context;

    // The records themselves.  Stored as binary RRSETs
    //[version_number][context][node][namehash] => records
    mapping(uint64 => mapping(bytes => mapping(bytes32 => mapping(bytes32 => mapping(uint16 => bytes))))) private records_with_context;

    // Count of number of entries for a given name.  Required for DNS resolvers
    // when resolving wildcards.
    //[version_number][context][node][namehash] => name_entry
    mapping(uint64 => mapping(bytes => mapping(bytes32 => mapping(bytes32 => uint16)))) private nameEntries_with_context;

    /**
     * Set one or more DNS records.  Records are supplied in wire-format.
     * Records with the same node/name/resource must be supplied one after the
     * other to ensure the data is updated correctly. For example, if the data
     * was supplied:
     *     a.example.com IN A 1.2.3.4
     *     a.example.com IN A 5.6.7.8
     *     www.example.com IN CNAME a.example.com.
     * then this would store the two A records for a.example.com correctly as a
     * single RRSET, however if the data was supplied:
     *     a.example.com IN A 1.2.3.4
     *     www.example.com IN CNAME a.example.com.
     *     a.example.com IN A 5.6.7.8
     * then this would store the first A record, the CNAME, then the second A
     * record which would overwrite the first.
     *
     * @param ensName The DNS encoded domain name.
     * @param data the DNS wire format records to set
     */
    function _setDNSRecordsFor(bytes memory context, bytes calldata ensName, bytes calldata data) internal virtual {
        bytes32 node = ensName.namehash(0);
        uint16 resource = 0;
        uint256 offset = 0;
        bytes memory name;
        bytes memory value;
        bytes32 nameHash;

        uint64 version = recordVersions[context][node];

        // Iterate over the data to add the resource records
        for (RRUtils.RRIterator memory iter = data.iterateRRs(0); !iter.done(); iter.next()) {
            if (resource == 0) {
                resource = iter.dnstype;
                name = iter.name();

                nameHash = keccak256(abi.encodePacked(name));
                value = bytes(iter.rdata());
            } else {
                bytes memory newName = iter.name();
                if (resource != iter.dnstype || !name.equals(newName)) {
                    setDNSRRSet(context, node, name, resource, data, offset, iter.offset - offset, value.length == 0, version);
                    resource = iter.dnstype;
                    offset = iter.offset;
                    name = newName;
                    nameHash = keccak256(name);
                    value = bytes(iter.rdata());
                }
            }
        }
        if (name.length > 0) {
            uint size = data.length - offset; //Prevent stack to deep error
            setDNSRRSet(context, node, name, resource, data, offset, size, value.length == 0, version);
        }
    }

    function setDNSRecordsFor(
        bytes memory context,
        bytes calldata ensName,
        bytes calldata data
    ) public virtual authorised(context, ensName) {
        _setDNSRecordsFor(context, ensName, data);
    }

    function setDNSRecords(bytes calldata ensName, bytes calldata data) external virtual {
        bytes memory context = abi.encodePacked(msg.sender);
        setDNSRecordsFor(context, ensName, data);
    }

    /**
     * Obtain a DNS record.
     * @param node the namehash of the node for which to fetch the record
     * @param name the keccak-256 hash of the fully-qualified name for which to fetch the record
     * @param resource the ID of the resource as per https://en.wikipedia.org/wiki/List_of_DNS_record_types
     * @return the DNS record in wire format if present, otherwise empty
     */
    function dnsRecord(
        bytes calldata context,
        bytes32 node,
        bytes32 name,
        uint16 resource
    ) public view virtual override returns (bytes memory) {
        return records_with_context[recordVersions[context][node]][context][node][name][resource];
    }

    /**
     * Check if a given node has records.
     * @param node the namehash of the node for which to check the records
     * @param name the namehash of the node for which to check the records
     */
    function hasDNSRecords(bytes calldata context, bytes32 node, bytes32 name) public view virtual returns (bool) {
        return (nameEntries_with_context[recordVersions[context][node]][context][node][name] != 0);
    }

    /**
     * setZonehash sets the hash for the zone.
     * May only be called by the owner of that node in the ENS registry.
     * @param name The DNS encoded domain name.
     * @param hash The zonehash to set
     */
    function setZonehash(bytes calldata name, bytes calldata hash) external virtual {
        bytes memory context = abi.encodePacked(msg.sender);
        setZonehashFor(context, name, hash);
    }

    function setZonehashFor(bytes memory context, bytes calldata name, bytes calldata hash) public virtual authorised(context, name) {
        bytes32 node = name.namehash(0);
        uint64 currentRecordVersion = recordVersions[context][node];
        bytes memory oldhash = zonehash_with_context[currentRecordVersion][context][node];
        zonehash_with_context[currentRecordVersion][context][node] = hash;
        emit DNSZonehashChanged(context, node, oldhash, hash);
    }

    /**
     * zonehash obtains the hash for the zone.
     * @param node The ENS node to query.
     * @return The associated contenthash.
     */
    function zonehash(bytes calldata context, bytes32 node) external view virtual override returns (bytes memory) {
        return zonehash_with_context[recordVersions[context][node]][context][node];
    }

    function supportsInterface(bytes4 interfaceID) public view virtual override returns (bool) {
        return
            interfaceID == type(IDNSRecordResolver).interfaceId ||
            interfaceID == type(IDNSZoneResolver).interfaceId ||
            super.supportsInterface(interfaceID);
    }

    function setDNSRRSet(
        bytes memory context,
        bytes32 node,
        bytes memory name,
        uint16 resource,
        bytes memory data,
        uint256 offset,
        uint256 size,
        bool deleteRecord,
        uint64 version
    ) private {
        bytes32 nameHash = keccak256(name);
        bytes memory rrData = data.substring(offset, size);

        if (deleteRecord) {
            if (records_with_context[version][context][node][nameHash][resource].length != 0) {
                nameEntries_with_context[version][context][node][nameHash]--;
            }
            delete (records_with_context[version][context][node][nameHash][resource]);
            emit DNSRecordDeleted(context, node, name, resource);
        } else {
            if (records_with_context[version][context][node][nameHash][resource].length == 0) {
                nameEntries_with_context[version][context][node][nameHash]++;
            }
            records_with_context[version][context][node][nameHash][resource] = rrData;
            emit DNSRecordChanged(context, node, name, resource, rrData);
        }
    }
}
