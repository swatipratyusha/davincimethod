import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker to use local file
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface IPFSUploadResult {
  contentHash: string;
  embeddingHash: string;
}

interface EmbeddingData {
  paperId: number;
  title: string;
  abstract: string;
  keywords: string[];
  authors: string[];
  extractedText: string;
  embeddingHash: string;
}

class IPFSService {
  private pinataApiKey: string;
  private pinataSecretKey: string;
  private openaiApiKey: string;

  constructor() {
    this.pinataApiKey = process.env.REACT_APP_PINATA_API_KEY || '';
    this.pinataSecretKey = process.env.REACT_APP_PINATA_SECRET_KEY || '';
    this.openaiApiKey = process.env.REACT_APP_OPENAI_API_KEY || '';
    
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      console.warn('Pinata API keys not configured. Using mock uploads.');
    }
    
    if (!this.openaiApiKey) {
      console.warn('OpenAI API key not configured. Using mock embeddings.');
    }
  }

  /**
   * Extract text content from PDF file
   */
  private async extractTextFromPDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let text = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + '\n';
      }
      
      return text.trim();
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Generate embeddings using OpenAI API
   */
  private async generateEmbeddings(text: string): Promise<number[]> {
    if (!this.openaiApiKey) {
      // Mock embeddings if no API key
      return new Array(1536).fill(0).map(() => Math.random() - 0.5);
    }

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          input: text,
          model: 'text-embedding-3-small'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.data[0].embedding;
    } catch (error: any) {
      console.error('Error generating embeddings:', error.response?.data || error.message);
      throw new Error('Failed to generate embeddings');
    }
  }

  /**
   * Upload file to IPFS using Pinata
   */
  private async uploadToPinata(file: File, metadata?: any): Promise<string> {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      // Mock upload if no API keys
      await new Promise(resolve => setTimeout(resolve, 2000));
      return `QmMock${file.name.replace(/[^a-zA-Z0-9]/g, '')}${Date.now()}`;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (metadata) {
        formData.append('pinataMetadata', JSON.stringify(metadata));
      }

      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinFileToIPFS',
        formData,
        {
          headers: {
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return response.data.IpfsHash;
    } catch (error: any) {
      console.error('Error uploading to Pinata:', error.response?.data || error.message);
      throw new Error('Failed to upload to IPFS');
    }
  }

  /**
   * Upload JSON data to IPFS using Pinata
   */
  private async uploadJSONToPinata(data: any, metadata?: any): Promise<string> {
    if (!this.pinataApiKey || !this.pinataSecretKey) {
      // Mock upload if no API keys
      await new Promise(resolve => setTimeout(resolve, 1000));
      return `QmMockJSON${Date.now()}`;
    }

    try {
      const response = await axios.post(
        'https://api.pinata.cloud/pinning/pinJSONToIPFS',
        {
          pinataContent: data,
          pinataMetadata: metadata || {
            name: 'ChainIndexed Data',
            keyvalues: {
              type: 'academic-paper-data'
            }
          }
        },
        {
          headers: {
            'pinata_api_key': this.pinataApiKey,
            'pinata_secret_api_key': this.pinataSecretKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.IpfsHash;
    } catch (error: any) {
      console.error('Error uploading JSON to Pinata:', error.response?.data || error.message);
      throw new Error('Failed to upload JSON to IPFS');
    }
  }

  /**
   * Main function to process PDF and upload to IPFS
   * This is the cost-effective approach: upload to IPFS first, then submit to blockchain
   */
  async processPaperUpload(
    file: File,
    paperData: {
      title: string;
      abstract: string;
      keywords: string[];
      authors: string[];
    }
  ): Promise<IPFSUploadResult> {
    try {
      // Step 1: Extract text from PDF
      const extractedText = await this.extractTextFromPDF(file);
      
      // Step 2: Generate embeddings from combined text
      const combinedText = [
        paperData.title,
        paperData.abstract,
        extractedText.substring(0, 2000), // Limit text for embedding
        ...paperData.keywords,
        ...paperData.authors
      ].join(' ');
      
      const embeddings = await this.generateEmbeddings(combinedText);
      
      // Step 3: Upload PDF content to IPFS
      const contentHash = await this.uploadToPinata(file, {
        name: `Paper: ${paperData.title}`,
        keyvalues: {
          type: 'academic-paper',
          title: paperData.title,
          authors: paperData.authors.join(', '),
          keywords: paperData.keywords.join(', ')
        }
      });
      
      // Step 4: Create embedding data and upload to IPFS
      const embeddingData: EmbeddingData = {
        paperId: 0, // Will be set by contract
        title: paperData.title,
        abstract: paperData.abstract,
        keywords: paperData.keywords,
        authors: paperData.authors,
        extractedText: extractedText.substring(0, 1000), // Store first 1000 chars
        embeddingHash: contentHash // Reference to content
      };
      
      const embeddingHash = await this.uploadJSONToPinata(embeddingData, {
        name: `Embeddings: ${paperData.title}`,
        keyvalues: {
          type: 'paper-embeddings',
          contentHash: contentHash,
          embeddingModel: 'text-embedding-3-small',
          dimensions: embeddings.length.toString()
        }
      });
      
      return {
        contentHash,
        embeddingHash
      };
      
    } catch (error) {
      console.error('Error processing paper upload:', error);
      throw error;
    }
  }

  /**
   * Get IPFS gateway URL
   */
  getGatewayURL(hash: string): string {
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }
}

export default IPFSService; 