import { expect } from "chai";
import { ethers } from "hardhat";
import TestLogger from "../scripts/testLogger";

describe("Comprehensive ChainIndexed Test Suite", function () {
  let logger: TestLogger;
  let owner: any;
  let author1: any;
  let author2: any;
  let author3: any;
  let researcher1: any;
  let researcher2: any;
  let user1: any;
  let user2: any;

  // Contract instances
  let helloWorld: any;
  let researcherRegistry: any;
  let walletAuth: any;
  let paperSubmission: any;

  before(async function () {
    logger = new TestLogger();
    logger.log({
      testName: "SETUP",
      eventType: "TEST_START",
      details: { description: "Initializing comprehensive test suite" }
    });
  });

  beforeEach(async function () {
    // Get signers (wallets)
    [owner, author1, author2, author3, researcher1, researcher2, user1, user2] = await ethers.getSigners();
    
    // Log wallet creation
    logger.logWalletCreated("SETUP", owner.address);
    logger.logWalletCreated("SETUP", author1.address);
    logger.logWalletCreated("SETUP", author2.address);
    logger.logWalletCreated("SETUP", author3.address);
    logger.logWalletCreated("SETUP", researcher1.address);
    logger.logWalletCreated("SETUP", researcher2.address);
    logger.logWalletCreated("SETUP", user1.address);
    logger.logWalletCreated("SETUP", user2.address);

    // Deploy contracts with logging
    const HelloWorld = await ethers.getContractFactory("HelloWorld");
    const helloWorldDeployment = await HelloWorld.deploy();
    const helloWorldReceipt = await helloWorldDeployment.deploymentTransaction()?.wait();
    
    if (helloWorldReceipt) {
      logger.logContractDeployed(
        "SETUP",
        "HelloWorld",
        await helloWorldDeployment.getAddress(),
        helloWorldReceipt.blockNumber || 0,
        Number(helloWorldReceipt.gasUsed) || 0,
        helloWorldReceipt.hash
      );
    }
    helloWorld = helloWorldDeployment;

    const ResearcherRegistry = await ethers.getContractFactory("ResearcherRegistry");
    const researcherRegistryDeployment = await ResearcherRegistry.deploy();
    const researcherRegistryReceipt = await researcherRegistryDeployment.deploymentTransaction()?.wait();
    
    if (researcherRegistryReceipt) {
      logger.logContractDeployed(
        "SETUP",
        "ResearcherRegistry",
        await researcherRegistryDeployment.getAddress(),
        researcherRegistryReceipt.blockNumber || 0,
        Number(researcherRegistryReceipt.gasUsed) || 0,
        researcherRegistryReceipt.hash
      );
    }
    researcherRegistry = researcherRegistryDeployment;

    const WalletAuth = await ethers.getContractFactory("WalletAuth");
    const walletAuthDeployment = await WalletAuth.deploy();
    const walletAuthReceipt = await walletAuthDeployment.deploymentTransaction()?.wait();
    
    if (walletAuthReceipt) {
      logger.logContractDeployed(
        "SETUP",
        "WalletAuth",
        await walletAuthDeployment.getAddress(),
        walletAuthReceipt.blockNumber || 0,
        Number(walletAuthReceipt.gasUsed) || 0,
        walletAuthReceipt.hash
      );
    }
    walletAuth = walletAuthDeployment;

    const PaperSubmission = await ethers.getContractFactory("PaperSubmission");
    const paperSubmissionDeployment = await PaperSubmission.deploy();
    const paperSubmissionReceipt = await paperSubmissionDeployment.deploymentTransaction()?.wait();
    
    if (paperSubmissionReceipt) {
      logger.logContractDeployed(
        "SETUP",
        "PaperSubmission",
        await paperSubmissionDeployment.getAddress(),
        paperSubmissionReceipt.blockNumber || 0,
        Number(paperSubmissionReceipt.gasUsed) || 0,
        paperSubmissionReceipt.hash
      );
    }
    paperSubmission = paperSubmissionDeployment;
  });

  describe("HelloWorld Contract Tests", function () {
    it("Should return the correct message", async function () {
      const testName = "HelloWorld - Get Message";
      logger.logTestStart(testName);
      const startTime = Date.now();

      try {
        const message = await helloWorld.getMessage();
        expect(message).to.equal("Hello World!");
        
        logger.logContractInteraction(
          testName,
          "HelloWorld",
          "getMessage",
          {},
          0,
          0,
          "view-function"
        );

        logger.logTestEnd(testName, true, Date.now() - startTime);
      } catch (error) {
        logger.logError(testName, error);
        logger.logTestEnd(testName, false, Date.now() - startTime);
        throw error;
      }
    });

    it("Should allow setting a new message", async function () {
      const testName = "HelloWorld - Set Message";
      logger.logTestStart(testName);
      const startTime = Date.now();

      try {
        const newMessage = "Hello, ChainIndexed!";
        const tx = await helloWorld.setMessage(newMessage);
        const receipt = await tx.wait();
        
        logger.logContractInteraction(
          testName,
          "HelloWorld",
          "setMessage",
          { newMessage },
          receipt?.blockNumber || 0,
          receipt?.gasUsed || 0,
          receipt?.hash || ""
        );

        const updatedMessage = await helloWorld.getMessage();
        expect(updatedMessage).to.equal(newMessage);

        logger.logTestEnd(testName, true, Date.now() - startTime);
      } catch (error) {
        logger.logError(testName, error);
        logger.logTestEnd(testName, false, Date.now() - startTime);
        throw error;
      }
    });
  });

  describe("ResearcherRegistry Contract Tests", function () {
    it("Should allow a researcher to register", async function () {
      const testName = "ResearcherRegistry - Register Researcher";
      logger.logTestStart(testName);
      const startTime = Date.now();

      try {
        const name = "Dr. Alice Johnson";
        
        const tx = await researcherRegistry.connect(researcher1).registerResearcher(name);
        const receipt = await tx.wait();
        
        logger.logResearcherRegistered(
          testName,
          researcher1.address,
          name,
          "MIT", // Institution not stored in contract, but logged for reference
          receipt?.blockNumber || 0,
          receipt?.gasUsed || 0,
          receipt?.hash || ""
        );

        const registeredName = await researcherRegistry.getResearcherName(researcher1.address);
        expect(registeredName).to.equal(name);

        logger.logTestEnd(testName, true, Date.now() - startTime);
      } catch (error) {
        logger.logError(testName, error);
        logger.logTestEnd(testName, false, Date.now() - startTime);
        throw error;
      }
    });

    it("Should prevent registration with empty name", async function () {
      const testName = "ResearcherRegistry - Empty Name Validation";
      logger.logTestStart(testName);
      const startTime = Date.now();

      try {
        await expect(
          researcherRegistry.connect(researcher2).registerResearcher("")
        ).to.be.revertedWith("Name cannot be empty");

        logger.logTestEnd(testName, true, Date.now() - startTime);
      } catch (error) {
        logger.logError(testName, error);
        logger.logTestEnd(testName, false, Date.now() - startTime);
        throw error;
      }
    });
  });

  describe("WalletAuth Contract Tests", function () {
    it("Should allow a user to register with their wallet", async function () {
      const testName = "WalletAuth - User Registration";
      logger.logTestStart(testName);
      const startTime = Date.now();

      try {
        const name = "Bob Smith";
        const email = "bob@example.com";
        
        const tx = await walletAuth.connect(user1).registerUser(name, email);
        const receipt = await tx.wait();
        
        logger.logContractInteraction(
          testName,
          "WalletAuth",
          "registerUser",
          { name, email },
          receipt?.blockNumber || 0,
          receipt?.gasUsed || 0,
          receipt?.hash || ""
        );

        const isRegistered = await walletAuth.isAuthenticated(user1.address);
        expect(isRegistered).to.be.true;

        logger.logTestEnd(testName, true, Date.now() - startTime);
      } catch (error) {
        logger.logError(testName, error);
        logger.logTestEnd(testName, false, Date.now() - startTime);
        throw error;
      }
    });

    it("Should prevent duplicate registration", async function () {
      const testName = "WalletAuth - Duplicate Registration Prevention";
      logger.logTestStart(testName);
      const startTime = Date.now();

      try {
        // First registration
        await walletAuth.connect(user2).registerUser("Carol Davis", "carol@example.com");
        
        // Attempt duplicate registration
        await expect(
          walletAuth.connect(user2).registerUser("Carol Davis", "carol@example.com")
        ).to.be.revertedWith("User already registered");

        logger.logTestEnd(testName, true, Date.now() - startTime);
      } catch (error) {
        logger.logError(testName, error);
        logger.logTestEnd(testName, false, Date.now() - startTime);
        throw error;
      }
    });
  });

  describe("PaperSubmission Contract Tests", function () {
    it("Should allow an author to submit a paper", async function () {
      const testName = "PaperSubmission - Submit Paper";
      logger.logTestStart(testName);
      const startTime = Date.now();

      try {
        const ipfsHash = "QmX1234567890abcdef";
        const title = "Blockchain in Academic Research";
        const doi = "10.1000/blockchain-paper-2024";
        const abstract = "This paper explores the use of blockchain in academic research.";
        const publicationYear = 2024;
        const keywords = ["blockchain", "academia", "research"];
        const authors = [author1.address, author2.address];
        const version = "1.0.0";

        // Log IPFS reference
        logger.logIpfsReferenced(testName, ipfsHash, "academic-paper", "Research paper content stored on IPFS");

        const tx = await paperSubmission.connect(author1).submitPaper(
          ipfsHash,
          title,
          doi,
          abstract,
          publicationYear,
          keywords,
          authors,
          version
        );
        const receipt = await tx.wait();
        
        logger.logPaperSubmitted(
          testName,
          1, // paperId
          ipfsHash,
          title,
          doi,
          authors,
          keywords,
          receipt?.blockNumber || 0,
          receipt?.gasUsed || 0,
          receipt?.hash || ""
        );

        const paper = await paperSubmission.getPaper(1);
        expect(paper.ipfsHash).to.equal(ipfsHash);
        expect(paper.title).to.equal(title);
        expect(paper.doi).to.equal(doi);

        logger.logTestEnd(testName, true, Date.now() - startTime);
      } catch (error) {
        logger.logError(testName, error);
        logger.logTestEnd(testName, false, Date.now() - startTime);
        throw error;
      }
    });

    it("Should prevent submission with duplicate IPFS hash", async function () {
      const testName = "PaperSubmission - Duplicate IPFS Prevention";
      logger.logTestStart(testName);
      const startTime = Date.now();

      try {
        const ipfsHash = "QmDuplicateHash123";
        
        // First submission
        await paperSubmission.connect(author1).submitPaper(
          ipfsHash,
          "First Paper",
          "10.1000/first-paper",
          "Abstract 1",
          2024,
          ["keyword1"],
          [author1.address],
          "1.0.0"
        );

        logger.logIpfsReferenced(testName, ipfsHash, "academic-paper", "First paper with this IPFS hash");

        // Attempt duplicate submission
        await expect(
          paperSubmission.connect(author2).submitPaper(
            ipfsHash,
            "Second Paper",
            "10.1000/second-paper",
            "Abstract 2",
            2024,
            ["keyword2"],
            [author2.address],
            "1.0.0"
          )
        ).to.be.revertedWith("IPFS hash already exists");

        logger.logTestEnd(testName, true, Date.now() - startTime);
      } catch (error) {
        logger.logError(testName, error);
        logger.logTestEnd(testName, false, Date.now() - startTime);
        throw error;
      }
    });

    it("Should allow author to update paper", async function () {
      const testName = "PaperSubmission - Update Paper";
      logger.logTestStart(testName);
      const startTime = Date.now();

      try {
        // Submit initial paper
        const initialIpfsHash = "QmInitialPaper123";
        await paperSubmission.connect(author1).submitPaper(
          initialIpfsHash,
          "Initial Paper",
          "10.1000/initial-paper",
          "Initial abstract",
          2024,
          ["initial"],
          [author1.address],
          "1.0.0"
        );

        logger.logIpfsReferenced(testName, initialIpfsHash, "academic-paper", "Initial paper version");

        // Update paper
        const newIpfsHash = "QmUpdatedPaper456";
        const newVersion = "2.0.0";
        
        const tx = await paperSubmission.connect(author1).updatePaper(1, newIpfsHash, newVersion);
        const receipt = await tx.wait();
        
        logger.logContractInteraction(
          testName,
          "PaperSubmission",
          "updatePaper",
          { paperId: 1, newIpfsHash, newVersion },
          receipt?.blockNumber || 0,
          receipt?.gasUsed || 0,
          receipt?.hash || ""
        );

        logger.logIpfsReferenced(testName, newIpfsHash, "academic-paper", "Updated paper version");

        const updatedPaper = await paperSubmission.getPaper(1);
        expect(updatedPaper.ipfsHash).to.equal(newIpfsHash);
        expect(updatedPaper.version).to.equal(newVersion);

        logger.logTestEnd(testName, true, Date.now() - startTime);
      } catch (error) {
        logger.logError(testName, error);
        logger.logTestEnd(testName, false, Date.now() - startTime);
        throw error;
      }
    });

    it("Should retrieve papers by author", async function () {
      const testName = "PaperSubmission - Get Papers By Author";
      logger.logTestStart(testName);
      const startTime = Date.now();

      try {
        // Submit papers by author1
        const ipfsHash1 = "QmAuthor1Paper1";
        const ipfsHash2 = "QmAuthor1Paper2";
        
        await paperSubmission.connect(author1).submitPaper(
          ipfsHash1,
          "Author1 Paper 1",
          "10.1000/author1-paper1",
          "Abstract 1",
          2024,
          ["keyword1"],
          [author1.address],
          "1.0.0"
        );

        await paperSubmission.connect(author1).submitPaper(
          ipfsHash2,
          "Author1 Paper 2",
          "10.1000/author1-paper2",
          "Abstract 2",
          2024,
          ["keyword2"],
          [author1.address, author2.address],
          "1.0.0"
        );

        logger.logIpfsReferenced(testName, ipfsHash1, "academic-paper", "First paper by author1");
        logger.logIpfsReferenced(testName, ipfsHash2, "academic-paper", "Second paper by author1");

        const authorPapers = await paperSubmission.getPapersByAuthor(author1.address);
        expect(authorPapers.length).to.be.greaterThan(0);

        logger.logContractInteraction(
          testName,
          "PaperSubmission",
          "getPapersByAuthor",
          { author: author1.address },
          0,
          0,
          "view-function"
        );

        logger.logTestEnd(testName, true, Date.now() - startTime);
      } catch (error) {
        logger.logError(testName, error);
        logger.logTestEnd(testName, false, Date.now() - startTime);
        throw error;
      }
    });
  });

  after(async function () {
    logger.log({
      testName: "CLEANUP",
      eventType: "TEST_END",
      details: { description: "Comprehensive test suite completed" }
    });
    
    // Save the complete log
    const logFilePath = logger.saveLog();
    console.log(`\n🎯 Comprehensive test log saved to: ${logFilePath}`);
  });
}); 