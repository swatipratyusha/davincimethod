import { expect } from "chai";
import { ethers } from "hardhat";

describe("PaperSubmission", function () {
  let paperSubmission: any;
  let owner: any;
  let author1: any;
  let author2: any;
  let author3: any;

  beforeEach(async function () {
    [owner, author1, author2, author3] = await ethers.getSigners();
    
    const PaperSubmission = await ethers.getContractFactory("PaperSubmission");
    paperSubmission = await PaperSubmission.deploy();
  });

  describe("Paper Submission", function () {
    it("Should allow an author to submit a paper", async function () {
      const ipfsHash = "QmX1234567890abcdef";
      const title = "Blockchain in Academic Research";
      const doi = "10.1000/blockchain-paper-2024";
      const abstract = "This paper explores the use of blockchain in academic research.";
      const publicationYear = 2024;
      const keywords = ["blockchain", "academia", "research"];
      const authors = [author1.address, author2.address];
      const version = "1.0.0";

      await paperSubmission.connect(author1).submitPaper(
        ipfsHash,
        title,
        doi,
        abstract,
        publicationYear,
        keywords,
        authors,
        version
      );

      const paper = await paperSubmission.getPaper(1);
      expect(paper.ipfsHash).to.equal(ipfsHash);
      expect(paper.title).to.equal(title);
      expect(paper.doi).to.equal(doi);
      expect(paper.paperAbstract).to.equal(abstract);
      expect(paper.publicationYear).to.equal(publicationYear);
      const paperKeywords = await paperSubmission.getPaperKeywords(1);
      expect(paperKeywords).to.deep.equal(keywords);
      const paperAuthors = await paperSubmission.getPaperAuthors(1);
      expect(paperAuthors).to.deep.equal(authors);
      expect(paper.submitter).to.equal(author1.address);
      expect(paper.version).to.equal(version);
      expect(paper.isActive).to.be.true;
    });

    it("Should prevent submission with empty IPFS hash", async function () {
      await expect(
        paperSubmission.connect(author1).submitPaper(
          "",
          "Title",
          "10.1000/test",
          "Abstract",
          2024,
          ["keyword"],
          [author1.address],
          "1.0.0"
        )
      ).to.be.revertedWith("IPFS hash cannot be empty");
    });

    it("Should prevent submission with empty title", async function () {
      await expect(
        paperSubmission.connect(author1).submitPaper(
          "QmX1234567890abcdef",
          "",
          "10.1000/test",
          "Abstract",
          2024,
          ["keyword"],
          [author1.address],
          "1.0.0"
        )
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("Should prevent submission with empty DOI", async function () {
      await expect(
        paperSubmission.connect(author1).submitPaper(
          "QmX1234567890abcdef",
          "Title",
          "",
          "Abstract",
          2024,
          ["keyword"],
          [author1.address],
          "1.0.0"
        )
      ).to.be.revertedWith("DOI cannot be empty");
    });

    it("Should prevent submission with invalid publication year", async function () {
      await expect(
        paperSubmission.connect(author1).submitPaper(
          "QmX1234567890abcdef",
          "Title",
          "10.1000/test",
          "Abstract",
          1800,
          ["keyword"],
          [author1.address],
          "1.0.0"
        )
      ).to.be.revertedWith("Invalid publication year");
    });

    it("Should prevent submission with no authors", async function () {
      await expect(
        paperSubmission.connect(author1).submitPaper(
          "QmX1234567890abcdef",
          "Title",
          "10.1000/test",
          "Abstract",
          2024,
          ["keyword"],
          [],
          "1.0.0"
        )
      ).to.be.revertedWith("Must have at least one author");
    });

    it("Should prevent submission with too many authors", async function () {
      const tooManyAuthors = Array(11).fill(author1.address);
      
      await expect(
        paperSubmission.connect(author1).submitPaper(
          "QmX1234567890abcdef",
          "Title",
          "10.1000/test",
          "Abstract",
          2024,
          ["keyword"],
          tooManyAuthors,
          "1.0.0"
        )
      ).to.be.revertedWith("Too many authors");
    });

    it("Should prevent submission with too many keywords", async function () {
      const tooManyKeywords = Array(21).fill("keyword");
      
      await expect(
        paperSubmission.connect(author1).submitPaper(
          "QmX1234567890abcdef",
          "Title",
          "10.1000/test",
          "Abstract",
          2024,
          tooManyKeywords,
          [author1.address],
          "1.0.0"
        )
      ).to.be.revertedWith("Too many keywords");
    });

    it("Should prevent duplicate IPFS hash submission", async function () {
      const ipfsHash = "QmX1234567890abcdef";
      
      await paperSubmission.connect(author1).submitPaper(
        ipfsHash,
        "Title 1",
        "10.1000/test1",
        "Abstract",
        2024,
        ["keyword"],
        [author1.address],
        "1.0.0"
      );

      await expect(
        paperSubmission.connect(author2).submitPaper(
          ipfsHash,
          "Title 2",
          "10.1000/test2",
          "Abstract",
          2024,
          ["keyword"],
          [author2.address],
          "1.0.0"
        )
      ).to.be.revertedWith("IPFS hash already exists");
    });

    it("Should prevent duplicate DOI submission", async function () {
      const doi = "10.1000/test";
      
      await paperSubmission.connect(author1).submitPaper(
        "QmX1234567890abcdef",
        "Title 1",
        doi,
        "Abstract",
        2024,
        ["keyword"],
        [author1.address],
        "1.0.0"
      );

      await expect(
        paperSubmission.connect(author2).submitPaper(
          "QmY1234567890abcdef",
          "Title 2",
          doi,
          "Abstract",
          2024,
          ["keyword"],
          [author2.address],
          "1.0.0"
        )
      ).to.be.revertedWith("DOI already exists");
    });
  });

  describe("Paper Retrieval", function () {
    beforeEach(async function () {
      await paperSubmission.connect(author1).submitPaper(
        "QmX1234567890abcdef",
        "Blockchain Research",
        "10.1000/blockchain-2024",
        "Abstract",
        2024,
        ["blockchain"],
        [author1.address, author2.address],
        "1.0.0"
      );
    });

    it("Should retrieve paper by ID", async function () {
      const paper = await paperSubmission.getPaper(1);
      expect(paper.title).to.equal("Blockchain Research");
      expect(paper.doi).to.equal("10.1000/blockchain-2024");
    });

    it("Should retrieve papers by author", async function () {
      const author1Papers = await paperSubmission.getPapersByAuthor(author1.address);
      const author2Papers = await paperSubmission.getPapersByAuthor(author2.address);
      
      expect(author1Papers).to.deep.equal([1]);
      expect(author2Papers).to.deep.equal([1]);
    });

    it("Should retrieve paper by DOI", async function () {
      const paperId = await paperSubmission.getPaperByDoi("10.1000/blockchain-2024");
      expect(paperId).to.equal(1);
    });

    it("Should check if IPFS hash is used", async function () {
      expect(await paperSubmission.isIpfsHashUsed("QmX1234567890abcdef")).to.be.true;
      expect(await paperSubmission.isIpfsHashUsed("QmY1234567890abcdef")).to.be.false;
    });

    it("Should get total paper count", async function () {
      expect(await paperSubmission.getTotalPapers()).to.equal(1);
      
      await paperSubmission.connect(author3).submitPaper(
        "QmY1234567890abcdef",
        "Another Paper",
        "10.1000/another-2024",
        "Abstract",
        2024,
        ["research"],
        [author3.address],
        "1.0.0"
      );
      
      expect(await paperSubmission.getTotalPapers()).to.equal(2);
    });
  });

  describe("Paper Updates", function () {
    beforeEach(async function () {
      await paperSubmission.connect(author1).submitPaper(
        "QmX1234567890abcdef",
        "Original Title",
        "10.1000/test",
        "Abstract",
        2024,
        ["keyword"],
        [author1.address],
        "1.0.0"
      );
    });

    it("Should allow author to update paper", async function () {
      await paperSubmission.connect(author1).updatePaper(
        1,
        "QmY1234567890abcdef",
        "2.0.0"
      );

      const paper = await paperSubmission.getPaper(1);
      expect(paper.ipfsHash).to.equal("QmY1234567890abcdef");
      expect(paper.version).to.equal("2.0.0");
    });

    it("Should prevent non-author from updating paper", async function () {
      await expect(
        paperSubmission.connect(author2).updatePaper(
          1,
          "QmY1234567890abcdef",
          "2.0.0"
        )
      ).to.be.revertedWith("Not the paper submitter");
    });

    it("Should prevent updating with empty IPFS hash", async function () {
      await expect(
        paperSubmission.connect(author1).updatePaper(
          1,
          "",
          "2.0.0"
        )
      ).to.be.revertedWith("IPFS hash cannot be empty");
    });

    it("Should prevent updating with empty version", async function () {
      await expect(
        paperSubmission.connect(author1).updatePaper(
          1,
          "QmY1234567890abcdef",
          ""
        )
      ).to.be.revertedWith("Version cannot be empty");
    });

    it("Should prevent updating with duplicate IPFS hash", async function () {
      await expect(
        paperSubmission.connect(author1).updatePaper(
          1,
          "QmX1234567890abcdef", // Same as original
          "2.0.0"
        )
      ).to.be.revertedWith("IPFS hash already exists");
    });
  });

  describe("Paper Deactivation", function () {
    beforeEach(async function () {
      await paperSubmission.connect(author1).submitPaper(
        "QmX1234567890abcdef",
        "Test Paper",
        "10.1000/test",
        "Abstract",
        2024,
        ["keyword"],
        [author1.address],
        "1.0.0"
      );
    });

    it("Should allow author to deactivate paper", async function () {
      await paperSubmission.connect(author1).deactivatePaper(1);
      
      const paper = await paperSubmission.getPaper(1);
      expect(paper.isActive).to.be.false;
    });

    it("Should prevent non-author from deactivating paper", async function () {
      await expect(
        paperSubmission.connect(author2).deactivatePaper(1)
      ).to.be.revertedWith("Not the paper submitter");
    });

    it("Should prevent deactivating already deactivated paper", async function () {
      await paperSubmission.connect(author1).deactivatePaper(1);
      
      await expect(
        paperSubmission.connect(author1).deactivatePaper(1)
      ).to.be.revertedWith("Paper is already deactivated");
    });
  });

  describe("Embedding Functionality", function () {
    beforeEach(async function () {
      // Submit a test paper first
      await paperSubmission.connect(author1).submitPaper(
        "QmTestPaper123",
        "Test Paper for Embeddings",
        "10.1000/test-embeddings-2024",
        "This is a test paper for testing embedding functionality.",
        2024,
        ["test", "embedding", "research"],
        [author1.address],
        "1.0"
      );
    });

    it("Should allow storing embeddings for a paper", async function () {
      const paperId = 1;
      const embeddingHash = "QmEmbeddingHash123";

      await paperSubmission.connect(author1).storeEmbeddings(paperId, embeddingHash);

      const paper = await paperSubmission.getPaper(paperId);
      expect(paper.embeddingHash).to.equal(embeddingHash);
      expect(paper.embeddingsGenerated).to.be.true;
    });

    it("Should allow owner to store embeddings for any paper", async function () {
      const paperId = 1;
      const embeddingHash = "QmOwnerEmbeddingHash123";

      await paperSubmission.connect(owner).storeEmbeddings(paperId, embeddingHash);

      const paper = await paperSubmission.getPaper(paperId);
      expect(paper.embeddingHash).to.equal(embeddingHash);
      expect(paper.embeddingsGenerated).to.be.true;
    });

    it("Should prevent non-author from storing embeddings", async function () {
      const paperId = 1;
      const embeddingHash = "QmUnauthorizedEmbeddingHash123";

      await expect(
        paperSubmission.connect(author2).storeEmbeddings(paperId, embeddingHash)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should prevent storing embeddings for non-existent paper", async function () {
      const paperId = 999;
      const embeddingHash = "QmNonExistentEmbeddingHash123";

      await expect(
        paperSubmission.connect(author1).storeEmbeddings(paperId, embeddingHash)
      ).to.be.revertedWith("Paper does not exist");
    });

    it("Should prevent storing empty embedding hash", async function () {
      const paperId = 1;

      await expect(
        paperSubmission.connect(author1).storeEmbeddings(paperId, "")
      ).to.be.revertedWith("Embedding hash cannot be empty");
    });

    it("Should prevent storing embeddings for inactive paper", async function () {
      const paperId = 1;
      
      // Deactivate the paper first
      await paperSubmission.connect(author1).deactivatePaper(paperId);
      
      const embeddingHash = "QmInactiveEmbeddingHash123";

      await expect(
        paperSubmission.connect(author1).storeEmbeddings(paperId, embeddingHash)
      ).to.be.revertedWith("Paper is not active");
    });

    it("Should reset embeddings when paper is updated", async function () {
      const paperId = 1;
      const initialEmbeddingHash = "QmInitialEmbeddingHash123";
      
      // Store initial embeddings
      await paperSubmission.connect(author1).storeEmbeddings(paperId, initialEmbeddingHash);
      
      // Update the paper
      const newIpfsHash = "QmUpdatedPaperHash123";
      const newVersion = "2.0";
      
      await paperSubmission.connect(author1).updatePaper(paperId, newIpfsHash, newVersion);
      
      // Check that embeddings are reset
      const paper = await paperSubmission.getPaper(paperId);
      expect(paper.embeddingHash).to.equal("");
      expect(paper.embeddingsGenerated).to.be.false;
    });

    it("Should get embedding information for a paper", async function () {
      const paperId = 1;
      const embeddingHash = "QmTestEmbeddingHash123";

      await paperSubmission.connect(author1).storeEmbeddings(paperId, embeddingHash);

      const [retrievedHash, embeddingsGenerated] = await paperSubmission.getPaperEmbeddings(paperId);
      expect(retrievedHash).to.equal(embeddingHash);
      expect(embeddingsGenerated).to.be.true;
    });

    it("Should get papers with embeddings", async function () {
      // Submit another paper
      await paperSubmission.connect(author2).submitPaper(
        "QmTestPaper456",
        "Another Test Paper",
        "10.1000/another-test-2024",
        "Another test paper for embeddings.",
        2024,
        ["another", "test"],
        [author2.address],
        "1.0"
      );

      // Store embeddings for both papers
      await paperSubmission.connect(author1).storeEmbeddings(1, "QmEmbedding1");
      await paperSubmission.connect(author2).storeEmbeddings(2, "QmEmbedding2");

      const papersWithEmbeddings = await paperSubmission.getPapersWithEmbeddings();
      expect(papersWithEmbeddings).to.have.length(2);
      expect(papersWithEmbeddings).to.include(1n);
      expect(papersWithEmbeddings).to.include(2n);
    });

    it("Should emit EmbeddingsGenerated event", async function () {
      const paperId = 1;
      const embeddingHash = "QmEventTestEmbeddingHash123";

      await expect(
        paperSubmission.connect(author1).storeEmbeddings(paperId, embeddingHash)
      ).to.emit(paperSubmission, "EmbeddingsGenerated")
        .withArgs(paperId, embeddingHash, author1.address);
    });
  });
});