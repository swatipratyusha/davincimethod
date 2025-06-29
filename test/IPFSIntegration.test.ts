import { expect } from "chai";
import { ethers } from "hardhat";
import { IPFSService, MockIPFSService } from "../scripts/ipfsService";

describe("IPFS Integration Tests", function () {
  let owner: any;
  let author1: any;
  let author2: any;
  let paperSubmission: any;
  let mockIPFS: MockIPFSService;
  let realIPFS: IPFSService | null = null;

  before(async function () {
    [owner, author1, author2] = await ethers.getSigners();
    
    // Initialize IPFS services
    mockIPFS = new MockIPFSService();
    
    // Check if real Pinata credentials are available
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretKey = process.env.PINATA_SECRET_KEY;
    
    if (pinataApiKey && pinataSecretKey) {
      realIPFS = new IPFSService(pinataApiKey, pinataSecretKey);
    }
  });

  beforeEach(async function () {
    // Deploy fresh contract for each test
    const PaperSubmission = await ethers.getContractFactory("PaperSubmission");
    paperSubmission = await PaperSubmission.deploy();
    await paperSubmission.waitForDeployment();
  });

  describe("Mock IPFS Integration", function () {
    it("Should upload paper content and metadata to mock IPFS", async function () {
      const paperContent = "This is a test research paper about blockchain technology in academia.";
      const metadata = {
        title: "Blockchain in Academic Publishing",
        authors: ["Dr. Alice", "Prof. Bob"],
        abstract: "This paper explores the potential of blockchain technology to revolutionize academic publishing.",
        keywords: ["blockchain", "academia", "publishing", "decentralization"],
        submissionDate: new Date().toISOString(),
        paperId: 1
      };

      const result = await mockIPFS.uploadPaper(paperContent, metadata);
      
      expect(result.contentHash).to.be.a("string");
      expect(result.contentHash).to.include("QmMockHash");
      expect(result.metadataHash).to.be.a("string");
      expect(result.metadataHash).to.include("QmMockMetadataHash");
    });

    it("Should submit paper to smart contract with IPFS hash", async function () {
      // First upload to IPFS
      const paperContent = "Research findings on blockchain applications.";
      const metadata = {
        title: "Research on Blockchain Applications",
        authors: ["Dr. Alice"],
        abstract: "A comprehensive study of blockchain applications.",
        keywords: ["blockchain", "applications"],
        submissionDate: new Date().toISOString(),
        paperId: 1
      };

      const ipfsResult = await mockIPFS.uploadPaper(paperContent, metadata);
      
      // Submit paper to smart contract (no author registration needed)
      const submitTx = await paperSubmission.connect(owner).submitPaper(
        ipfsResult.contentHash,
        metadata.title,
        "10.1000/test.2025.001",
        metadata.abstract,
        2025,
        metadata.keywords,
        [owner.address],
        "1.0.0"
      );

      const receipt = await submitTx.wait();
      expect(receipt?.status).to.equal(1);

      // Verify paper was stored correctly
      const paper = await paperSubmission.getPaper(1);
      expect(paper.ipfsHash).to.equal(ipfsResult.contentHash);
      expect(paper.title).to.equal(metadata.title);
      expect(paper.paperAbstract).to.equal(metadata.abstract);
    });

    it("Should handle multiple paper submissions with different IPFS hashes", async function () {
      // Submit first paper
      const paper1Content = "First research paper content.";
      const metadata1 = {
        title: "First Research Paper",
        authors: ["Dr. Alice"],
        abstract: "First paper abstract.",
        keywords: ["research", "first"],
        submissionDate: new Date().toISOString(),
        paperId: 1
      };

      const ipfsResult1 = await mockIPFS.uploadPaper(paper1Content, metadata1);
      
      await paperSubmission.connect(owner).submitPaper(
        ipfsResult1.contentHash,
        metadata1.title,
        "10.1000/test.2025.001",
        metadata1.abstract,
        2025,
        metadata1.keywords,
        [owner.address],
        "1.0.0"
      );

      // Submit second paper
      const paper2Content = "Second research paper content.";
      const metadata2 = {
        title: "Second Research Paper",
        authors: ["Dr. Alice"],
        abstract: "Second paper abstract.",
        keywords: ["research", "second"],
        submissionDate: new Date().toISOString(),
        paperId: 2
      };

      const ipfsResult2 = await mockIPFS.uploadPaper(paper2Content, metadata2);
      
      await paperSubmission.connect(owner).submitPaper(
        ipfsResult2.contentHash,
        metadata2.title,
        "10.1000/test.2025.002",
        metadata2.abstract,
        2025,
        metadata2.keywords,
        [owner.address],
        "1.0.0"
      );

      // Verify both papers
      const paper1 = await paperSubmission.getPaper(1);
      const paper2 = await paperSubmission.getPaper(2);
      
      expect(paper1.ipfsHash).to.equal(ipfsResult1.contentHash);
      expect(paper2.ipfsHash).to.equal(ipfsResult2.contentHash);
      expect(paper1.ipfsHash).to.not.equal(paper2.ipfsHash);
    });

    it("Should generate correct gateway URLs", async function () {
      const contentHash = "QmTestHash123";
      const gatewayUrl = mockIPFS.getGatewayUrl(contentHash);
      
      expect(gatewayUrl).to.equal("https://mock-gateway.pinata.cloud/ipfs/QmTestHash123");
    });
  });

  describe("Real IPFS Integration (if credentials available)", function () {
    it("Should connect to real Pinata service", async function () {
      if (!realIPFS) {
        this.skip(); // Skip if no real credentials
      }

      const connection = await realIPFS.testConnection();
      expect(connection).to.be.true;
    });

    it("Should upload to real IPFS and submit to smart contract", async function () {
      if (!realIPFS) {
        this.skip(); // Skip if no real credentials
      }

      // Test real IPFS upload
      const paperContent = "Real research paper content for IPFS testing.";
      const metadata = {
        title: "Real IPFS Test Paper",
        authors: ["Dr. Alice"],
        abstract: "Testing real IPFS integration with smart contracts.",
        keywords: ["ipfs", "blockchain", "testing"],
        submissionDate: new Date().toISOString(),
        paperId: 1
      };

      const ipfsResult = await realIPFS.uploadPaper(paperContent, metadata);
      
      expect(ipfsResult.contentHash).to.be.a("string");
      expect(ipfsResult.contentHash).to.not.include("Mock");
      expect(ipfsResult.metadataHash).to.be.a("string");
      expect(ipfsResult.metadataHash).to.not.include("Mock");

      // Submit to smart contract
      const submitTx = await paperSubmission.connect(owner).submitPaper(
        ipfsResult.contentHash,
        metadata.title,
        "10.1000/real.2025.001",
        metadata.abstract,
        2025,
        metadata.keywords,
        [owner.address],
        "1.0.0"
      );

      const receipt = await submitTx.wait();
      expect(receipt?.status).to.equal(1);

      // Verify in smart contract
      const paper = await paperSubmission.getPaper(1);
      expect(paper.ipfsHash).to.equal(ipfsResult.contentHash);
      
      // Test gateway URL
      const gatewayUrl = realIPFS.getGatewayUrl(ipfsResult.contentHash);
      expect(gatewayUrl).to.include("gateway.pinata.cloud");
      expect(gatewayUrl).to.include(ipfsResult.contentHash);
    });
  });

  describe("IPFS Hash Validation", function () {
    it("Should reject duplicate IPFS hashes", async function () {
      const duplicateHash = "QmDuplicateHash123";
      
      // Submit first paper
      await paperSubmission.connect(owner).submitPaper(
        duplicateHash,
        "First Paper",
        "10.1000/test.2025.001",
        "First abstract",
        2025,
        ["keyword1"],
        [owner.address],
        "1.0.0"
      );

      // Try to submit second paper with same hash
      await expect(
        paperSubmission.connect(owner).submitPaper(
          duplicateHash,
          "Second Paper",
          "10.1000/test.2025.002",
          "Second abstract",
          2025,
          ["keyword2"],
          [owner.address],
          "1.0.0"
        )
      ).to.be.revertedWith("IPFS hash already exists");
    });

    it("Should validate IPFS hash format", async function () {
      // Try to submit with empty IPFS hash
      await expect(
        paperSubmission.connect(owner).submitPaper(
          "",
          "Test Paper",
          "10.1000/test.2025.001",
          "Test abstract",
          2025,
          ["keyword1"],
          [owner.address],
          "1.0.0"
        )
      ).to.be.revertedWith("IPFS hash cannot be empty");
    });
  });

  describe("Paper Updates with New IPFS Hash", function () {
    it("Should allow paper updates with new IPFS hash", async function () {
      // Submit initial paper
      const initialHash = "QmInitialHash123";
      await paperSubmission.connect(owner).submitPaper(
        initialHash,
        "Initial Paper",
        "10.1000/test.2025.001",
        "Initial abstract",
        2025,
        ["keyword1"],
        [owner.address],
        "1.0.0"
      );

      // Upload updated content to IPFS
      const updatedContent = "Updated research paper content.";
      const updatedMetadata = {
        title: "Updated Paper",
        authors: ["Dr. Alice"],
        abstract: "Updated abstract",
        keywords: ["updated", "research"],
        submissionDate: new Date().toISOString(),
        paperId: 1
      };

      const updatedIpfsResult = await mockIPFS.uploadPaper(updatedContent, updatedMetadata);
      
      // Update paper with new IPFS hash
      const updateTx = await paperSubmission.connect(owner).updatePaper(
        1,
        updatedIpfsResult.contentHash,
        "2.0.0"
      );

      const receipt = await updateTx.wait();
      expect(receipt?.status).to.equal(1);

      // Verify update
      const updatedPaper = await paperSubmission.getPaper(1);
      expect(updatedPaper.ipfsHash).to.equal(updatedIpfsResult.contentHash);
      expect(updatedPaper.version).to.equal("2.0.0");
      expect(updatedPaper.ipfsHash).to.not.equal(initialHash);
    });
  });
}); 