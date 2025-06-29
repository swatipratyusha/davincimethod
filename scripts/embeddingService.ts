import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();

// Types for embedding data
interface EmbeddingData {
    paperId: number;
    title: string;
    abstract: string;
    keywords: string[];
    authors: string[];
    embeddingHash: string;
}

interface SearchResult {
    paperId: number;
    title: string;
    abstract: string;
    similarity: number;
    doi: string;
}

interface PaperMetadata {
    paperId: number;
    title: string;
    abstract: string;
    keywords: string[];
    authors: string[];
    doi: string;
}

class EmbeddingService {
    private contract: any;
    private embeddingsDir: string;
    private papersDir: string;

    constructor(contractAddress: string) {
        this.embeddingsDir = path.join(__dirname, "../embeddings");
        this.papersDir = path.join(__dirname, "../papers");
        this.ensureDirectories();
    }

    private ensureDirectories() {
        if (!fs.existsSync(this.embeddingsDir)) {
            fs.mkdirSync(this.embeddingsDir, { recursive: true });
        }
        if (!fs.existsSync(this.papersDir)) {
            fs.mkdirSync(this.papersDir, { recursive: true });
        }
    }

    async initialize(contractAddress: string) {
        const PaperSubmission = await ethers.getContractFactory("PaperSubmission");
        this.contract = PaperSubmission.attach(contractAddress);
        console.log("Embedding service initialized with contract:", contractAddress);
    }

    /**
     * Generate embeddings for a paper's content
     * Uses OpenAI's text-embedding-3-small model
     */
    private async generateEmbeddings(text: string): Promise<number[]> {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error("OPENAI_API_KEY not set in environment");
        try {
            const response = await axios.post(
                "https://api.openai.com/v1/embeddings",
                {
                    input: text,
                    model: "text-embedding-3-small"
                },
                {
                    headers: {
                        "Authorization": `Bearer ${apiKey}`,
                        "Content-Type": "application/json"
                    }
                }
            );
            return response.data.data[0].embedding;
        } catch (error: any) {
            console.error("Error generating embedding from OpenAI:", error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Calculate cosine similarity between two embeddings
     */
    private calculateSimilarity(embedding1: number[], embedding2: number[]): number {
        if (embedding1.length !== embedding2.length) {
            throw new Error("Embeddings must have the same dimension");
        }

        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < embedding1.length; i++) {
            dotProduct += embedding1[i] * embedding2[i];
            norm1 += embedding1[i] * embedding1[i];
            norm2 += embedding2[i] * embedding2[i];
        }

        norm1 = Math.sqrt(norm1);
        norm2 = Math.sqrt(norm2);

        if (norm1 === 0 || norm2 === 0) return 0;
        return dotProduct / (norm1 * norm2);
    }

    /**
     * Create embedding data for a paper
     */
    private async createEmbeddingData(paperId: number, metadata: PaperMetadata): Promise<EmbeddingData> {
        // Combine all text for embedding generation
        const combinedText = [
            metadata.title,
            metadata.abstract,
            ...metadata.keywords,
            ...metadata.authors
        ].join(" ");

        const embedding = await this.generateEmbeddings(combinedText);

        return {
            paperId,
            title: metadata.title,
            abstract: metadata.abstract,
            keywords: metadata.keywords,
            authors: metadata.authors,
            embeddingHash: `embedding_${paperId}_${Date.now()}`
        };
    }

    /**
     * Store embedding data to IPFS (mock implementation)
     */
    private async storeToIPFS(data: EmbeddingData): Promise<string> {
        // Mock IPFS storage - in production, use actual IPFS client
        const filename = `${data.embeddingHash}.json`;
        const filepath = path.join(this.embeddingsDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        
        // Return mock IPFS hash
        return `Qm${data.embeddingHash}${Date.now()}`;
    }

    /**
     * Generate and store embeddings for a paper
     */
    async generatePaperEmbeddings(paperId: number): Promise<string> {
        try {
            // Get paper data from contract
            const paper = await this.contract.getPaper(paperId);
            
            const metadata: PaperMetadata = {
                paperId,
                title: paper.title,
                abstract: paper.paperAbstract,
                keywords: paper.keywords,
                authors: paper.authors.map((addr: string) => addr), // In real implementation, get author names
                doi: paper.doi
            };

            // Create embedding data
            const embeddingData = await this.createEmbeddingData(paperId, metadata);
            
            // Store to IPFS
            const ipfsHash = await this.storeToIPFS(embeddingData);
            
            // Store embedding hash in contract
            const tx = await this.contract.storeEmbeddings(paperId, ipfsHash);
            await tx.wait();
            
            console.log(`Embeddings generated for paper ${paperId}, IPFS hash: ${ipfsHash}`);
            return ipfsHash;
            
        } catch (error) {
            console.error(`Error generating embeddings for paper ${paperId}:`, error);
            throw error;
        }
    }

    /**
     * Load embedding data from IPFS
     */
    private async loadFromIPFS(ipfsHash: string): Promise<EmbeddingData> {
        // Mock IPFS retrieval - in production, use actual IPFS client
        const filename = ipfsHash.replace('Qm', 'embedding_') + '.json';
        const filepath = path.join(this.embeddingsDir, filename);
        
        if (!fs.existsSync(filepath)) {
            throw new Error(`Embedding file not found: ${filepath}`);
        }
        
        const data = fs.readFileSync(filepath, 'utf8');
        return JSON.parse(data);
    }

    /**
     * Search papers by query
     */
    async searchPapers(query: string, limit: number = 10): Promise<SearchResult[]> {
        try {
            // Generate embedding for search query
            const queryEmbedding = await this.generateEmbeddings(query);
            
            // Get all papers with embeddings
            const papersWithEmbeddings = await this.contract.getPapersWithEmbeddings();
            
            const results: SearchResult[] = [];
            
            for (const paperId of papersWithEmbeddings) {
                try {
                    // Get paper metadata
                    const paper = await this.contract.getPaper(paperId);
                    
                    // Get embedding data
                    const embeddingData = await this.loadFromIPFS(paper.embeddingHash);
                    
                    // Generate embedding for this paper's content
                    const paperText = [
                        embeddingData.title,
                        embeddingData.abstract,
                        ...embeddingData.keywords,
                        ...embeddingData.authors
                    ].join(" ");
                    
                    const paperEmbedding = await this.generateEmbeddings(paperText);
                    
                    // Calculate similarity
                    const similarity = this.calculateSimilarity(queryEmbedding, paperEmbedding);
                    
                    results.push({
                        paperId: Number(paperId),
                        title: paper.title,
                        abstract: paper.paperAbstract,
                        similarity,
                        doi: paper.doi
                    });
                    
                } catch (error) {
                    console.warn(`Error processing paper ${paperId}:`, error);
                    continue;
                }
            }
            
            // Sort by similarity and return top results
            return results
                .sort((a, b) => b.similarity - a.similarity)
                .slice(0, limit);
                
        } catch (error) {
            console.error("Error searching papers:", error);
            throw error;
        }
    }

    /**
     * Batch generate embeddings for all papers without embeddings
     */
    async generateAllMissingEmbeddings(): Promise<void> {
        try {
            const totalPapers = await this.contract.getTotalPapers();
            console.log(`Total papers: ${totalPapers}`);
            
            for (let paperId = 1; paperId <= totalPapers; paperId++) {
                try {
                    const paper = await this.contract.getPaper(paperId);
                    
                    if (!paper.embeddingsGenerated && paper.isActive) {
                        console.log(`Generating embeddings for paper ${paperId}...`);
                        await this.generatePaperEmbeddings(paperId);
                        // Add delay to avoid rate limiting
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } catch (error) {
                    console.warn(`Error processing paper ${paperId}:`, error);
                    continue;
                }
            }
            
            console.log("Finished generating embeddings for all papers");
            
        } catch (error) {
            console.error("Error in batch embedding generation:", error);
            throw error;
        }
    }

    /**
     * Get statistics about embeddings
     */
    async getEmbeddingStats(): Promise<{
        totalPapers: number;
        papersWithEmbeddings: number;
        papersWithoutEmbeddings: number;
    }> {
        const totalPapers = await this.contract.getTotalPapers();
        const papersWithEmbeddings = await this.contract.getPapersWithEmbeddings();
        
        return {
            totalPapers: Number(totalPapers),
            papersWithEmbeddings: papersWithEmbeddings.length,
            papersWithoutEmbeddings: Number(totalPapers) - papersWithEmbeddings.length
        };
    }
}

export default EmbeddingService; 