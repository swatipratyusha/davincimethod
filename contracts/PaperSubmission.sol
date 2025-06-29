// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PaperSubmission is Ownable, ReentrancyGuard {
    // Paper struct to store metadata
    struct Paper {
        string ipfsHash;           // IPFS content hash
        string title;              // Paper title
        string paperAbstract;      // Paper abstract
        uint256 publicationYear;   // Publication year
        string[] keywords;         // Keywords/tags
        address[] authors;         // Author addresses
        uint256 submissionDate;    // When submitted
        address submitter;         // Who submitted
        string version;            // Paper version
        bool isActive;             // Paper status
        string embeddingHash;      // IPFS hash of embeddings (title, abstract, keywords, authors)
        bool embeddingsGenerated;  // Whether embeddings have been generated
    }
    
    // Author struct
    struct Author {
        address walletAddress;
        string name;
        string institution;
        string contribution;       // "lead author", "co-author", etc.
        bool isVerified;
    }
    
    // State variables
    uint256 private _paperIds;
    mapping(uint256 => Paper) public papers;
    mapping(address => uint256[]) public authorPapers; // Author address to paper IDs
    mapping(string => bool) public ipfsHashExists;     // Track used IPFS hashes
    
    // Events
    event PaperSubmitted(
        uint256 indexed paperId,
        string ipfsHash,
        string title,
        address indexed submitter,
        uint256 submissionDate
    );
    
    event PaperUpdated(
        uint256 indexed paperId,
        string newIpfsHash,
        string newVersion
    );
    
    event PaperDeactivated(
        uint256 indexed paperId,
        address indexed deactivatedBy
    );
    
    event EmbeddingsGenerated(
        uint256 indexed paperId,
        string embeddingHash,
        address indexed generatedBy
    );
    
    // Modifiers
    modifier onlyPaperAuthor(uint256 paperId) {
        require(paperId > 0 && paperId <= _paperIds, "Paper does not exist");
        require(papers[paperId].submitter == msg.sender, "Not the paper submitter");
        _;
    }
    
    modifier onlyVerifiedAuthor() {
        // In a real implementation, you'd check if the author is verified
        // For now, we'll allow any registered user
        _;
    }
    
    modifier onlyOwnerOrAuthor(uint256 paperId) {
        require(paperId > 0 && paperId <= _paperIds, "Paper does not exist");
        require(
            papers[paperId].submitter == msg.sender || msg.sender == owner(),
            "Not authorized"
        );
        _;
    }
    
    // Constructor
    constructor() Ownable(msg.sender) {}
    
    /**
     * @dev Submit a new paper
     * @param ipfsHash IPFS hash of the paper content
     * @param title Paper title
     * @param paperAbstract Paper abstract
     * @param publicationYear Publication year
     * @param keywords Array of keywords
     * @param authors Array of author addresses
     * @param version Paper version
     */
    function submitPaper(
        string memory ipfsHash,
        string memory title,
        string memory paperAbstract,
        uint256 publicationYear,
        string[] memory keywords,
        address[] memory authors,
        string memory version
    ) external onlyVerifiedAuthor nonReentrant {
        // Validation
        require(bytes(ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(title).length > 0, "Title cannot be empty");
        require(publicationYear > 1900 && publicationYear <= block.timestamp, "Invalid publication year");
        require(authors.length > 0, "Must have at least one author");
        require(authors.length <= 10, "Too many authors");
        require(keywords.length <= 20, "Too many keywords");
        require(!ipfsHashExists[ipfsHash], "IPFS hash already exists");
        
        // Increment paper ID
        _paperIds += 1;
        uint256 paperId = _paperIds;
        
        // Create paper
        papers[paperId] = Paper({
            ipfsHash: ipfsHash,
            title: title,
            paperAbstract: paperAbstract,
            publicationYear: publicationYear,
            keywords: keywords,
            authors: authors,
            submissionDate: block.timestamp,
            submitter: msg.sender,
            version: version,
            isActive: true,
            embeddingHash: "",
            embeddingsGenerated: false
        });
        
        // Update mappings
        ipfsHashExists[ipfsHash] = true;
        
        // Add paper to author mappings
        for (uint256 i = 0; i < authors.length; i++) {
            authorPapers[authors[i]].push(paperId);
        }
        
        emit PaperSubmitted(paperId, ipfsHash, title, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Update paper content (new version)
     * @param paperId ID of the paper to update
     * @param newIpfsHash New IPFS hash
     * @param newVersion New version string
     */
    function updatePaper(
        uint256 paperId,
        string memory newIpfsHash,
        string memory newVersion
    ) external onlyPaperAuthor(paperId) {
        require(bytes(newIpfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(newVersion).length > 0, "Version cannot be empty");
        require(!ipfsHashExists[newIpfsHash], "IPFS hash already exists");
        require(papers[paperId].isActive, "Paper is not active");
        
        // Update paper
        papers[paperId].ipfsHash = newIpfsHash;
        papers[paperId].version = newVersion;
        // Reset embeddings since content changed
        papers[paperId].embeddingHash = "";
        papers[paperId].embeddingsGenerated = false;
        
        // Update mappings
        ipfsHashExists[newIpfsHash] = true;
        
        emit PaperUpdated(paperId, newIpfsHash, newVersion);
    }
    
    /**
     * @dev Deactivate a paper
     * @param paperId ID of the paper to deactivate
     */
    function deactivatePaper(uint256 paperId) external onlyPaperAuthor(paperId) {
        require(papers[paperId].isActive, "Paper is already deactivated");
        
        papers[paperId].isActive = false;
        
        emit PaperDeactivated(paperId, msg.sender);
    }
    
    /**
     * @dev Store embeddings IPFS hash for a paper
     * @param paperId ID of the paper
     * @param embeddingHash IPFS hash of the embeddings
     */
    function storeEmbeddings(
        uint256 paperId,
        string memory embeddingHash
    ) external onlyOwnerOrAuthor(paperId) {
        require(bytes(embeddingHash).length > 0, "Embedding hash cannot be empty");
        require(papers[paperId].isActive, "Paper is not active");
        
        papers[paperId].embeddingHash = embeddingHash;
        papers[paperId].embeddingsGenerated = true;
        
        emit EmbeddingsGenerated(paperId, embeddingHash, msg.sender);
    }
    
    /**
     * @dev Get paper by ID
     * @param paperId ID of the paper
     * @return paper The Paper struct
     */
    function getPaper(uint256 paperId) external view returns (Paper memory paper) {
        require(paperId > 0 && paperId <= _paperIds, "Paper does not exist");
        return papers[paperId];
    }
    
    /**
     * @dev Get papers by author
     * @param author Author address
     * @return Array of paper IDs
     */
    function getPapersByAuthor(address author) external view returns (uint256[] memory) {
        return authorPapers[author];
    }
    
    /**
     * @dev Get embedding hash for a specific paper
     * @param paperId ID of the paper
     * @return embeddingHash IPFS hash of embeddings
     * @return embeddingsGenerated Whether embeddings have been generated
     */
    function getPaperEmbeddings(uint256 paperId) external view returns (
        string memory embeddingHash,
        bool embeddingsGenerated
    ) {
        require(paperId > 0 && paperId <= _paperIds, "Paper does not exist");
        return (papers[paperId].embeddingHash, papers[paperId].embeddingsGenerated);
    }
    
    /**
     * @dev Get all papers that have embeddings generated
     * @return Array of paper IDs with embeddings
     */
    function getPapersWithEmbeddings() external view returns (uint256[] memory) {
        uint256[] memory papersWithEmbeddings = new uint256[](_paperIds);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= _paperIds; i++) {
            if (papers[i].embeddingsGenerated && papers[i].isActive) {
                papersWithEmbeddings[count] = i;
                count++;
            }
        }
        
        // Resize array to actual count
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = papersWithEmbeddings[i];
        }
        
        return result;
    }
} 