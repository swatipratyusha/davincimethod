// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MockVRFCoordinator
 * @dev Mock implementation of Chainlink VRF Coordinator for local testing
 */
contract MockVRFCoordinator {
    // Map request ID to callback details
    mapping(uint256 => RequestDetails) public requests;
    
    // Counter for request IDs
    uint256 private requestIdCounter = 1;
    
    // Events
    event RandomWordsRequested(
        bytes32 indexed keyHash,
        uint256 requestId,
        uint256 preSeed,
        uint64 indexed subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords,
        address indexed sender
    );
    
    event RandomWordsFulfilled(
        uint256 indexed requestId,
        uint256 outputSeed,
        uint96 payment,
        bool success
    );
    
    struct RequestDetails {
        address consumer;
        uint256 requestId;
        uint32 numWords;
        bool fulfilled;
    }
    
    /**
     * @notice Request random words (mock implementation)
     * @param keyHash The gas lane key hash
     * @param subId The subscription ID
     * @param requestConfirmations The number of confirmations
     * @param callbackGasLimit The gas limit for the callback
     * @param numWords The number of random words to request
     * @return requestId The request ID
     */
    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 requestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external returns (uint256) {
        uint256 requestId = requestIdCounter++;
        
        // Store request details
        requests[requestId] = RequestDetails({
            consumer: msg.sender,
            requestId: requestId,
            numWords: numWords,
            fulfilled: false
        });
        
        emit RandomWordsRequested(
            keyHash,
            requestId,
            0, // preSeed
            subId,
            requestConfirmations,
            callbackGasLimit,
            numWords,
            msg.sender
        );
        
        // Remove immediate fulfillment - let it be called manually later
        // _fulfillRandomWords(requestId);
        
        return requestId;
    }
    
    /**
     * @notice Fulfill random words (internal)
     * @param requestId The request ID to fulfill
     */
    function _fulfillRandomWords(uint256 requestId) internal {
        RequestDetails storage request = requests[requestId];
        require(!request.fulfilled, "Request already fulfilled");
        require(request.consumer != address(0), "Request not found");
        
        // Generate mock random words
        uint256[] memory randomWords = new uint256[](request.numWords);
        for (uint32 i = 0; i < request.numWords; i++) {
            // Use block data for pseudo-randomness
            randomWords[i] = uint256(keccak256(abi.encodePacked(
                block.timestamp,
                block.prevrandao,
                requestId,
                i
            )));
        }
        
        // Mark as fulfilled
        request.fulfilled = true;
        
        // Call the consumer's fulfillRandomWords function
        // We'll use a low-level call to avoid interface issues
        (bool success, ) = request.consumer.call(
            abi.encodeWithSignature(
                "rawFulfillRandomWords(uint256,uint256[])",
                requestId,
                randomWords
            )
        );
        
        require(success, "Failed to fulfill random words");
        
        emit RandomWordsFulfilled(requestId, 0, 0, true);
    }
    
    /**
     * @notice Manually fulfill a request (for testing)
     * @param requestId The request ID to fulfill
     */
    function fulfillRequest(uint256 requestId) external {
        _fulfillRandomWords(requestId);
    }
    
    /**
     * @notice Get the current request ID counter
     * @return The current request ID counter value
     */
    function getRequestIdCounter() external view returns (uint256) {
        return requestIdCounter;
    }
    
    /**
     * @notice Get request details
     * @param requestId The request ID
     * @return consumer The consumer address
     * @return numWords The number of words requested
     * @return fulfilled Whether the request was fulfilled
     */
    function getRequest(uint256 requestId) external view returns (
        address consumer,
        uint32 numWords,
        bool fulfilled
    ) {
        RequestDetails memory request = requests[requestId];
        return (request.consumer, request.numWords, request.fulfilled);
    }
} 