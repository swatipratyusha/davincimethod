import { ethers } from "hardhat";
import EmbeddingService from "./embeddingService";
import * as readline from "readline";

class EmbeddingCLI {
    private embeddingService!: EmbeddingService;
    private contract: any;
    private rl: readline.Interface;

    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async initialize(contractAddress: string) {
        this.embeddingService = new EmbeddingService(contractAddress);
        await this.embeddingService.initialize(contractAddress);
        
        const PaperSubmission = await ethers.getContractFactory("PaperSubmission");
        this.contract = PaperSubmission.attach(contractAddress);
        
        console.log("🔍 Embedding CLI initialized!");
    }

    private question(prompt: string): Promise<string> {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }

    async showMenu() {
        console.log("\n📚 ChainIndexed Embedding CLI");
        console.log("=============================");
        console.log("1. Generate embeddings for all papers");
        console.log("2. Generate embeddings for specific paper");
        console.log("3. Search papers");
        console.log("4. Show embedding statistics");
        console.log("5. List all papers");
        console.log("6. Exit");
        console.log("=============================");
    }

    async generateAllEmbeddings() {
        console.log("\n🧠 Generating embeddings for all papers...");
        try {
            await this.embeddingService.generateAllMissingEmbeddings();
            console.log("✅ All embeddings generated successfully!");
        } catch (error) {
            console.error("❌ Error generating embeddings:", error);
        }
    }

    async generateSpecificEmbeddings() {
        const paperIdStr = await this.question("Enter paper ID: ");
        const paperId = parseInt(paperIdStr);
        
        if (isNaN(paperId)) {
            console.log("❌ Invalid paper ID");
            return;
        }

        try {
            console.log(`\n🧠 Generating embeddings for paper ${paperId}...`);
            const embeddingHash = await this.embeddingService.generatePaperEmbeddings(paperId);
            console.log(`✅ Embeddings generated! IPFS hash: ${embeddingHash}`);
        } catch (error) {
            console.error("❌ Error generating embeddings:", error);
        }
    }

    async searchPapers() {
        const query = await this.question("Enter search query: ");
        const limitStr = await this.question("Enter number of results (default 5): ");
        const limit = limitStr ? parseInt(limitStr) : 5;

        if (!query.trim()) {
            console.log("❌ Query cannot be empty");
            return;
        }

        try {
            console.log(`\n🔍 Searching for: "${query}"`);
            const results = await this.embeddingService.searchPapers(query, limit);
            
            if (results.length === 0) {
                console.log("No results found.");
                return;
            }

            console.log(`\n📄 Found ${results.length} results:`);
            results.forEach((result, index) => {
                console.log(`\n${index + 1}. Paper ${result.paperId}: "${result.title}"`);
                console.log(`   Similarity: ${(result.similarity * 100).toFixed(2)}%`);
                console.log(`   DOI: ${result.doi}`);
                console.log(`   Abstract: ${result.abstract.substring(0, 150)}...`);
            });
        } catch (error) {
            console.error("❌ Error searching papers:", error);
        }
    }

    async showStats() {
        try {
            const stats = await this.embeddingService.getEmbeddingStats();
            console.log("\n📊 Embedding Statistics:");
            console.log(`Total papers: ${stats.totalPapers}`);
            console.log(`Papers with embeddings: ${stats.papersWithEmbeddings}`);
            console.log(`Papers without embeddings: ${stats.papersWithoutEmbeddings}`);
            console.log(`Coverage: ${((stats.papersWithEmbeddings / stats.totalPapers) * 100).toFixed(2)}%`);
        } catch (error) {
            console.error("❌ Error getting statistics:", error);
        }
    }

    async listAllPapers() {
        try {
            const totalPapers = await this.contract.getTotalPapers();
            console.log(`\n📚 All Papers (${totalPapers} total):`);
            
            for (let i = 1; i <= totalPapers; i++) {
                try {
                    const paper = await this.contract.getPaper(i);
                    const hasEmbeddings = paper.embeddingsGenerated ? "✅" : "❌";
                    console.log(`${i}. ${hasEmbeddings} "${paper.title}" (DOI: ${paper.doi})`);
                } catch (error) {
                    console.log(`${i}. ❌ Error loading paper`);
                }
            }
        } catch (error) {
            console.error("❌ Error listing papers:", error);
        }
    }

    async run() {
        while (true) {
            await this.showMenu();
            const choice = await this.question("\nEnter your choice (1-6): ");

            switch (choice) {
                case "1":
                    await this.generateAllEmbeddings();
                    break;
                case "2":
                    await this.generateSpecificEmbeddings();
                    break;
                case "3":
                    await this.searchPapers();
                    break;
                case "4":
                    await this.showStats();
                    break;
                case "5":
                    await this.listAllPapers();
                    break;
                case "6":
                    console.log("👋 Goodbye!");
                    this.rl.close();
                    return;
                default:
                    console.log("❌ Invalid choice. Please enter 1-6.");
            }

            await this.question("\nPress Enter to continue...");
        }
    }
}

async function main() {
    const contractAddress = process.argv[2];
    
    if (!contractAddress) {
        console.error("❌ Please provide contract address as argument");
        console.log("Usage: npx hardhat run scripts/embeddingCLI.ts <contract-address>");
        process.exit(1);
    }

    const cli = new EmbeddingCLI();
    await cli.initialize(contractAddress);
    await cli.run();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    }); 