// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import "hardhat/console.sol";

/**
 * @title VRFConsumer
 * @dev This contract uses Chainlink VRF for random paper review assignments
 */
contract VRFConsumer is VRFConsumerBaseV2, ConfirmedOwner {
    // VRF Coordinator
    VRFCoordinatorV2Interface COORDINATOR;

    // Your subscription ID.
    uint64 s_subscriptionId;

    // The gas lane to use, which specifies the maximum gas price to bump to.
    bytes32 s_keyHash;

    // Depends on the number of requested values that you want sent to the
    // fulfillRandomWords() function. Storing each word costs about 20,000 gas,
    // so 2,500,000 is a safe default for debugging.
    uint32 s_callbackGasLimit = 2500000;

    // The default is 3, but you can set this higher.
    uint16 s_requestConfirmations = 3;

    // For this example, retrieve 2 random values in one request.
    // Cannot exceed VRFCoordinatorV2.MAX_NUM_WORDS.
    uint32 s_numWords = 1;

    // PaperSubmission contract address
    address public paperSubmissionContract;

    // Map request ID to paper ID
    mapping(uint256 => uint256) public requestToPaperId;
    
    // Map paper ID to assigned reviewer
    mapping(uint256 => uint256) public paperReviewer;
    
    // Available reviewers (simplified as numbers 1-10)
    uint256[] public availableReviewers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // Events
    event RandomWordsRequested(uint256 indexed paperId, uint256 indexed requestId);
    event ReviewerAssigned(uint256 indexed paperId, uint256 indexed reviewerId, uint256 indexed requestId);

    // Errors
    error UnexpectedRequestID(uint256 requestId);

    // Modifiers
    modifier onlyPaperSubmission() {
        require(msg.sender == paperSubmissionContract, "Only PaperSubmission contract can call this");
        _;
    }

    /**
     * @notice Constructor inherits VRFConsumerBaseV2
     * @param vrfCoordinator The address of the VRF Coordinator
     * @param subscriptionId The subscription ID for billing
     * @param keyHash The gas lane to use
     */
    constructor(
        address vrfCoordinator,
        uint64 subscriptionId,
        bytes32 keyHash
    ) VRFConsumerBaseV2(vrfCoordinator) ConfirmedOwner(msg.sender) {
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        s_keyHash = keyHash;
        s_subscriptionId = subscriptionId;
    }

    /**
     * @notice Requests random words from VRF
     * @param paperId The ID of the paper to assign a reviewer to
     * @return requestId The request ID
     */
    function requestRandomWords(uint256 paperId) external onlyPaperSubmission returns (uint256) {
        uint256 requestId = COORDINATOR.requestRandomWords(
            s_keyHash,
            s_subscriptionId,
            s_requestConfirmations,
            s_callbackGasLimit,
            s_numWords
        );
        
        requestToPaperId[requestId] = paperId;
        emit RandomWordsRequested(paperId, requestId);
        return requestId;
    }

    /**
     * @notice Callback function used by VRF Coordinator
     * @param requestId The request ID for fulfillment
     * @param randomWords Array of random words
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        console.log("fulfillRandomWords called with requestId:", requestId);
        uint256 paperId = requestToPaperId[requestId];
        if (paperId == 0) {
            revert UnexpectedRequestID(requestId);
        }
        require(availableReviewers.length > 0, "No reviewers available");
        // Use the random word to select a reviewer
        uint256 randomIndex = randomWords[0] % availableReviewers.length;
        uint256 reviewerId = availableReviewers[randomIndex];
        // Assign the reviewer to the paper
        paperReviewer[paperId] = reviewerId;
        emit ReviewerAssigned(paperId, reviewerId, requestId);
        
        // Update the PaperSubmission contract with the reviewer assignment
        if (paperSubmissionContract != address(0)) {
            (bool success, bytes memory result) = paperSubmissionContract.call(abi.encodeWithSignature("updatePaperWithReviewer(uint256)", paperId));
            if (!success) {
                console.log("Failed to update PaperSubmission:", string(result));
            } else {
                console.log("PaperSubmission updated with reviewer for paper:", paperId);
            }
        }
    }

    /**
     * @notice Get the assigned reviewer for a paper
     * @param paperId The ID of the paper
     * @return reviewerId The ID of the assigned reviewer
     */
    function getAssignedReviewer(uint256 paperId) external view returns (uint256) {
        return paperReviewer[paperId];
    }

    /**
     * @notice Update the subscription ID
     * @param subscriptionId New subscription ID
     */
    function setSubscriptionId(uint64 subscriptionId) external onlyOwner {
        s_subscriptionId = subscriptionId;
    }

    /**
     * @notice Update the key hash
     * @param keyHash New key hash
     */
    function setKeyHash(bytes32 keyHash) external onlyOwner {
        s_keyHash = keyHash;
    }

    /**
     * @notice Update the callback gas limit
     * @param callbackGasLimit New callback gas limit
     */
    function setCallbackGasLimit(uint32 callbackGasLimit) external onlyOwner {
        s_callbackGasLimit = callbackGasLimit;
    }

    /**
     * @notice Update the request confirmations
     * @param requestConfirmations New request confirmations
     */
    function setRequestConfirmations(uint16 requestConfirmations) external onlyOwner {
        s_requestConfirmations = requestConfirmations;
    }

    /**
     * @notice Set the PaperSubmission contract address
     * @param _paperSubmissionContract The address of the PaperSubmission contract
     */
    function setPaperSubmissionContract(address _paperSubmissionContract) external onlyOwner {
        paperSubmissionContract = _paperSubmissionContract;
    }

    /**
     * @notice Get the PaperSubmission contract address
     * @return The address of the PaperSubmission contract
     */
    function getPaperSubmissionContract() external view returns (address) {
        return paperSubmissionContract;
    }
    
    /**
     * @notice Get the VRF Coordinator address
     * @return The address of the VRF Coordinator
     */
    function getVRFCoordinator() external view returns (address) {
        return address(COORDINATOR);
    }
} 