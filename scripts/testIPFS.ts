import { ethers } from "hardhat";
import { IPFSService, MockIPFSService } from "./ipfsService";

async function main() {
  console.log("🚀 Testing IPFS Integration for ChainIndexed\n");

  // Test with mock service first (no API keys needed)
  console.log("📋 Testing with Mock IPFS Service...");
  const mockIPFS = new MockIPFSService();
  
  // Test connection
  const mockConnection = await mockIPFS.testConnection();
  console.log(`✅ Mock connection test: ${mockConnection ? 'SUCCESS' : 'FAILED'}`);

  // Test file upload
  const mockFileHash = await mockIPFS.uploadFile(
    Buffer.from("This is a test paper content"),
    "test_paper.pdf"
  );
  console.log(`📄 Mock file upload hash: ${mockFileHash}`);

  // Test metadata upload
  const mockMetadata = {
    name: "Test Paper",
    description: "A test paper for IPFS integration",
    attributes: [
      { trait_type: "Author", value: "Test Author" },
      { trait_type: "Year", value: "2025" }
    ]
  };
  
  const mockMetadataHash = await mockIPFS.uploadMetadata(mockMetadata, "test_metadata");
  console.log(`📊 Mock metadata upload hash: ${mockMetadataHash}`);

  // Test paper upload
  const mockPaperResult = await mockIPFS.uploadPaper(
    "This is the full paper content with research findings...",
    {
      title: "Research on Blockchain in Academia",
      authors: ["Dr. Alice", "Prof. Bob"],
      abstract: "This paper explores the use of blockchain technology in academic publishing.",
      keywords: ["blockchain", "academia", "publishing"],
      submissionDate: new Date().toISOString(),
      paperId: 1
    }
  );
  console.log(`📚 Mock paper upload:`);
  console.log(`   Content hash: ${mockPaperResult.contentHash}`);
  console.log(`   Metadata hash: ${mockPaperResult.metadataHash}`);

  // Test gateway URL
  const mockGatewayUrl = mockIPFS.getGatewayUrl(mockPaperResult.contentHash);
  console.log(`🔗 Mock gateway URL: ${mockGatewayUrl}\n`);

  // Test with real Pinata service (if API keys are provided)
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecretKey = process.env.PINATA_SECRET_KEY;

  if (pinataApiKey && pinataSecretKey) {
    console.log("🔐 Testing with Real Pinata IPFS Service...");
    const realIPFS = new IPFSService(pinataApiKey, pinataSecretKey);
    
    try {
      // Test connection
      const realConnection = await realIPFS.testConnection();
      console.log(`✅ Real connection test: ${realConnection ? 'SUCCESS' : 'FAILED'}`);

      if (realConnection) {
        // Test file upload
        const realFileHash = await realIPFS.uploadFile(
          Buffer.from("This is a real test paper content"),
          "real_test_paper.pdf"
        );
        console.log(`📄 Real file upload hash: ${realFileHash}`);

        // Test paper upload
        const realPaperResult = await realIPFS.uploadPaper(
          "This is the real paper content uploaded to IPFS...",
          {
            title: "Real Research on Blockchain in Academia",
            authors: ["Dr. Alice", "Prof. Bob"],
            abstract: "This paper explores the use of blockchain technology in academic publishing with real IPFS storage.",
            keywords: ["blockchain", "academia", "publishing", "ipfs"],
            submissionDate: new Date().toISOString(),
            paperId: 2
          }
        );
        console.log(`📚 Real paper upload:`);
        console.log(`   Content hash: ${realPaperResult.contentHash}`);
        console.log(`   Metadata hash: ${realPaperResult.metadataHash}`);

        // Test gateway URL
        const realGatewayUrl = realIPFS.getGatewayUrl(realPaperResult.contentHash);
        console.log(`🔗 Real gateway URL: ${realGatewayUrl}`);
      }
    } catch (error) {
      console.error("❌ Real IPFS test failed:", error);
    }
  } else {
    console.log("⚠️  No Pinata API keys found. Set PINATA_API_KEY and PINATA_SECRET_KEY environment variables to test real IPFS integration.");
    console.log("💡 You can get free API keys from: https://app.pinata.cloud/developers/api-keys");
  }

  // Test integration with smart contracts
  console.log("\n🔗 Testing Smart Contract Integration...");
  
  try {
    const [owner] = await ethers.getSigners();
    console.log(`👤 Using account: ${owner.address}`);

    // Deploy PaperSubmission contract
    const PaperSubmission = await ethers.getContractFactory("PaperSubmission");
    const paperSubmission = await PaperSubmission.deploy();
    await paperSubmission.waitForDeployment();
    
    const contractAddress = await paperSubmission.getAddress();
    console.log(`📄 PaperSubmission deployed to: ${contractAddress}`);

    // Simulate paper submission with IPFS hash
    const testIPFSHash = mockPaperResult.contentHash;
    const testMetadataHash = mockPaperResult.metadataHash;
    
    console.log(`📤 Submitting paper with IPFS hash: ${testIPFSHash}`);
    
    const submitTx = await paperSubmission.submitPaper(
      testIPFSHash,
      "Test Paper Title",
      "10.1000/test.2025.001",
      "This is a test abstract",
      2025,
      ["keyword1", "keyword2"],
      [owner.address],
      "1.0.0"
    );
    
    const receipt = await submitTx.wait();
    console.log(`✅ Paper submitted! Transaction hash: ${receipt?.hash}`);
    console.log(`⛽ Gas used: ${receipt?.gasUsed?.toString()}`);

    // Retrieve paper details
    const paper = await paperSubmission.getPaper(1);
    console.log(`📖 Retrieved paper:`);
    console.log(`   Title: ${paper.title}`);
    console.log(`   IPFS Hash: ${paper.ipfsHash}`);
    console.log(`   DOI: ${paper.doi}`);
    console.log(`   Authors: ${paper.authors.join(', ')}`);
    console.log(`   Version: ${paper.version}`);

  } catch (error) {
    console.error("❌ Smart contract integration test failed:", error);
  }

  console.log("\n🎉 IPFS Integration Test Complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 