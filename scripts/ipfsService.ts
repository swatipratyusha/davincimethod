interface IPFSResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface IPFSMetadata {
  name: string;
  description: string;
  image?: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

export class IPFSService {
  private apiKey: string;
  private secretKey: string;
  private baseUrl = 'https://api.pinata.cloud';

  constructor(apiKey: string, secretKey: string) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
  }

  /**
   * Upload a file to IPFS via Pinata
   * @param file File to upload
   * @param name Name for the file
   * @returns IPFS hash (CID)
   */
  async uploadFile(file: File | Buffer | string, name: string): Promise<string> {
    const formData = new FormData();
    
    if (typeof file === 'string') {
      const blob = new Blob([file], { type: 'text/plain' });
      formData.append('file', blob, name);
    } else if (Buffer.isBuffer(file)) {
      const blob = new Blob([file], { type: 'application/octet-stream' });
      formData.append('file', blob, name);
    } else {
      formData.append('file', file, name);
    }

    const response = await fetch(`${this.baseUrl}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'pinata_api_key': this.apiKey,
        'pinata_secret_api_key': this.secretKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.statusText}`);
    }

    const result: IPFSResponse = await response.json();
    return result.IpfsHash;
  }

  /**
   * Upload JSON metadata to IPFS
   * @param metadata JSON metadata object
   * @param name Name for the metadata file
   * @returns IPFS hash (CID)
   */
  async uploadMetadata(metadata: IPFSMetadata, name: string): Promise<string> {
    const jsonBlob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: 'application/json',
    });

    const formData = new FormData();
    formData.append('file', jsonBlob, `${name}.json`);

    const response = await fetch(`${this.baseUrl}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'pinata_api_key': this.apiKey,
        'pinata_secret_api_key': this.secretKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`IPFS metadata upload failed: ${response.statusText}`);
    }

    const result: IPFSResponse = await response.json();
    return result.IpfsHash;
  }

  /**
   * Upload paper content and metadata to IPFS
   * @param paperContent Paper content as string or buffer
   * @param metadata Paper metadata
   * @returns Object with content hash and metadata hash
   */
  async uploadPaper(
    paperContent: string | Buffer,
    metadata: {
      title: string;
      authors: string[];
      abstract: string;
      keywords: string[];
      submissionDate: string;
      paperId: number;
    }
  ): Promise<{ contentHash: string; metadataHash: string }> {
    // Upload paper content
    const contentBuffer = typeof paperContent === 'string' 
      ? Buffer.from(paperContent, 'utf-8') 
      : paperContent;
    
    const contentHash = await this.uploadFile(
      contentBuffer,
      `paper_${metadata.paperId}.pdf`
    );

    // Create and upload metadata
    const ipfsMetadata: IPFSMetadata = {
      name: metadata.title,
      description: metadata.abstract,
      attributes: [
        { trait_type: 'Authors', value: metadata.authors.join(', ') },
        { trait_type: 'Keywords', value: metadata.keywords.join(', ') },
        { trait_type: 'Submission Date', value: metadata.submissionDate },
        { trait_type: 'Paper ID', value: metadata.paperId.toString() },
        { trait_type: 'Content Hash', value: contentHash },
      ],
    };

    const metadataHash = await this.uploadMetadata(
      ipfsMetadata,
      `metadata_${metadata.paperId}`
    );

    return { contentHash, metadataHash };
  }

  /**
   * Get IPFS gateway URL for a hash
   * @param hash IPFS hash (CID)
   * @returns Gateway URL
   */
  getGatewayUrl(hash: string): string {
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }

  /**
   * Test connection to Pinata API
   * @returns True if connection successful
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/data/testAuthentication`, {
        method: 'GET',
        headers: {
          'pinata_api_key': this.apiKey,
          'pinata_secret_api_key': this.secretKey,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('IPFS connection test failed:', error);
      return false;
    }
  }
}

// Mock IPFS service for testing (when no API keys are provided)
export class MockIPFSService {
  private counter = 0;

  async uploadFile(file: File | Buffer | string, name: string): Promise<string> {
    this.counter++;
    return `QmMockHash${this.counter}${Date.now()}`;
  }

  async uploadMetadata(metadata: IPFSMetadata, name: string): Promise<string> {
    this.counter++;
    return `QmMockMetadataHash${this.counter}${Date.now()}`;
  }

  async uploadPaper(
    paperContent: string | Buffer,
    metadata: any
  ): Promise<{ contentHash: string; metadataHash: string }> {
    const contentHash = await this.uploadFile(paperContent, `paper_${metadata.paperId}.pdf`);
    const metadataHash = await this.uploadMetadata(metadata, `metadata_${metadata.paperId}`);
    
    return { contentHash, metadataHash };
  }

  getGatewayUrl(hash: string): string {
    return `https://mock-gateway.pinata.cloud/ipfs/${hash}`;
  }

  async testConnection(): Promise<boolean> {
    return true; // Mock always returns true
  }
} 