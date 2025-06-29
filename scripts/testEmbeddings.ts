import { ethers } from "hardhat";
import EmbeddingService from "./embeddingService";

async function main() {
    console.log("🚀 Testing Embedding and Search Functionality");
    console.log("=============================================");

    // Get signers
    const [owner, author1, author2] = await ethers.getSigners();
    
    console.log("Owner address:", owner.address);
    console.log("Author 1 address:", author1.address);
    console.log("Author 2 address:", author2.address);

    // Deploy contract
    console.log("\n📄 Deploying PaperSubmission contract...");
    const PaperSubmission = await ethers.getContractFactory("PaperSubmission");
    const paperContract = await PaperSubmission.deploy();
    await paperContract.waitForDeployment();
    
    const contractAddress = await paperContract.getAddress();
    console.log("Contract deployed to:", contractAddress);

    // Initialize embedding service
    console.log("\n🔍 Initializing embedding service...");
    const embeddingService = new EmbeddingService(contractAddress);
    await embeddingService.initialize(contractAddress);

    // Submit some test papers
    console.log("\n📝 Submitting test papers...");
    
    // Paper 1: Blockchain Research
    const tx1 = await paperContract.connect(author1).submitPaper(
        "QmBlockchainPaper123",
        "Decentralized Consensus Mechanisms in Blockchain Networks",
        "10.1000/blockchain-consensus-2024",
        "This paper explores various consensus mechanisms used in blockchain networks, including Proof of Work, Proof of Stake, and their variants. We analyze their security properties, energy efficiency, and scalability characteristics.",
        2024,
        ["blockchain", "consensus", "proof of work", "proof of stake", "decentralization"],
        [author1.address],
        "1.0"
    );
    await tx1.wait();
    console.log("✅ Paper 1 submitted: Blockchain consensus research");

    // Paper 2: AI Research
    const tx2 = await paperContract.connect(author2).submitPaper(
        "QmAIResearch456",
        "Machine Learning Approaches for Natural Language Processing",
        "10.1000/ml-nlp-2024",
        "We present a comprehensive survey of machine learning techniques applied to natural language processing tasks. The study covers transformer architectures, attention mechanisms, and their applications in text generation and understanding.",
        2024,
        ["machine learning", "natural language processing", "transformers", "attention", "text generation"],
        [author2.address],
        "1.0"
    );
    await tx2.wait();
    console.log("✅ Paper 2 submitted: AI/ML research");

    // Paper 3: Cryptography
    const tx3 = await paperContract.connect(author1).submitPaper(
        "QmCryptoPaper789",
        "Post-Quantum Cryptography: A Survey of Lattice-Based Schemes",
        "10.1000/post-quantum-crypto-2024",
        "This survey examines lattice-based cryptographic schemes that are resistant to quantum attacks. We analyze the security assumptions, key sizes, and performance characteristics of various lattice-based constructions.",
        2024,
        ["cryptography", "post-quantum", "lattice-based", "quantum-resistant", "security"],
        [author1.address, author2.address],
        "1.0"
    );
    await tx3.wait();
    console.log("✅ Paper 3 submitted: Cryptography research");

    // Generate embeddings for all papers
    console.log("\n🧠 Generating embeddings for all papers...");
    await embeddingService.generateAllMissingEmbeddings();

    // Get embedding statistics
    console.log("\n📊 Embedding Statistics:");
    const stats = await embeddingService.getEmbeddingStats();
    console.log(`Total papers: ${stats.totalPapers}`);
    console.log(`Papers with embeddings: ${stats.papersWithEmbeddings}`);
    console.log(`Papers without embeddings: ${stats.papersWithoutEmbeddings}`);

    // Test search functionality
    console.log("\n🔍 Testing search functionality...");
    
    const searchQueries = [
        "blockchain consensus mechanisms",
        "machine learning and AI",
        "cryptography and security",
        "quantum computing",
        "natural language processing"
    ];

    for (const query of searchQueries) {
        console.log(`\nSearching for: "${query}"`);
        const results = await embeddingService.searchPapers(query, 3);
        
        console.log("Top results:");
        results.forEach((result, index) => {
            console.log(`${index + 1}. Paper ${result.paperId}: "${result.title}"`);
            console.log(`   Similarity: ${(result.similarity * 100).toFixed(2)}%`);
            console.log(`   DOI: ${result.doi}`);
            console.log(`   Abstract: ${result.abstract.substring(0, 100)}...`);
        });
    }

    // Test specific paper search
    console.log("\n🎯 Testing specific paper search...");
    const blockchainResults = await embeddingService.searchPapers("proof of work consensus", 1);
    if (blockchainResults.length > 0) {
        console.log("Found blockchain paper:", blockchainResults[0].title);
        console.log("Similarity:", (blockchainResults[0].similarity * 100).toFixed(2) + "%");
    }

    console.log("\n✅ Embedding and search test completed successfully!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    }); 