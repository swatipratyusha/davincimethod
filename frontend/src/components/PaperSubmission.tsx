import React, { useState } from 'react';
import { ethers } from 'ethers';
import IPFSService from '../services/ipfsService';

interface PaperSubmissionProps {
  contract: ethers.Contract;
  onPaperSubmitted: () => void;
  setError: (error: string) => void;
  connectedAddress: string;
}

const PaperSubmission: React.FC<PaperSubmissionProps> = ({ 
  contract, 
  onPaperSubmitted, 
  setError, 
  connectedAddress 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    paperAbstract: '',
    keywords: '',
    authors: connectedAddress, // Auto-populate with connected wallet
    version: '1.0'
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  
  const ipfsService = new IPFSService();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setSelectedFile(file);
        setError('');
      } else {
        setError('Please select a PDF file');
        setSelectedFile(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (!selectedFile) {
        setError('Please select a PDF file');
        return;
      }

      // Step 1: Process PDF and upload to IPFS
      setProcessingStatus('Extracting text from PDF...');
      const keywords = formData.keywords.split(',').map(k => k.trim()).filter(k => k);
      const authors = formData.authors.split(',').map(a => a.trim()).filter(a => a);
      
      if (authors.length === 0) {
        setError('At least one author is required');
        return;
      }

      setProcessingStatus('Generating embeddings...');
      const uploadResult = await ipfsService.processPaperUpload(selectedFile, {
        title: formData.title,
        abstract: formData.paperAbstract,
        keywords,
        authors
      });

      // Step 2: Submit to smart contract
      setProcessingStatus('Submitting to blockchain...');
      const currentYear = new Date().getFullYear();

      // Convert author strings to addresses
      const authorAddresses = authors.map(author => author as `0x${string}`);

      // Debug: Log the exact parameters being passed
      console.log('=== SUBMIT PAPER DEBUG ===');
      console.log('Contract:', contract);
      console.log('Contract methods:', Object.keys(contract));
      console.log('submitPaper method exists:', typeof contract.submitPaper);
      console.log('Parameters being passed:');
      console.log('- ipfsHash:', uploadResult.contentHash);
      console.log('- title:', formData.title);
      console.log('- paperAbstract:', formData.paperAbstract);
      console.log('- currentYear:', currentYear);
      console.log('- keywords:', keywords);
      console.log('- authorAddresses:', authorAddresses);
      console.log('- version:', formData.version);

      // Debug: Show the function signature
      try {
        const functionFragment = contract.interface.getFunction('submitPaper');
        console.log('Function fragment:', functionFragment);
        if (functionFragment) {
          console.log('Function signature:', functionFragment.format());
        }
        
        // Encode the function call to see what's being sent
        const encodedData = contract.interface.encodeFunctionData('submitPaper', [
          uploadResult.contentHash,
          formData.title,
          formData.paperAbstract,
          currentYear,
          keywords,
          authorAddresses,
          formData.version
        ]);
        console.log('Encoded function data:', encodedData);
      } catch (error) {
        console.error('Error getting function details:', error);
      }

      const tx = await contract.submitPaper(
        uploadResult.contentHash,
        formData.title,
        formData.paperAbstract,
        currentYear,
        keywords,
        authorAddresses,
        formData.version
      );

      await tx.wait();

      // Step 3: Store embeddings hash (commented out since we don't have getTotalPapers)
      // setProcessingStatus('Storing embeddings...');
      // const paperId = await contract.getTotalPapers();
      // const embeddingTx = await contract.storeEmbeddings(paperId, uploadResult.embeddingHash);
      // await embeddingTx.wait();

      onPaperSubmitted();
      
      // Reset form
      setFormData({
        title: '',
        paperAbstract: '',
        keywords: '',
        authors: connectedAddress,
        version: '1.0'
      });
      setSelectedFile(null);
      setProcessingStatus('');
      
    } catch (error: any) {
      setError('Failed to submit paper: ' + error.message);
      setProcessingStatus('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="paper-submission">
      <h2>Submit Paper</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Paper File (PDF):</label>
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            required
          />
          {selectedFile && (
            <p className="file-info">Selected: {selectedFile.name}</p>
          )}
        </div>
        
        <div>
          <label>Title:</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Paper title"
            required
          />
        </div>
        
        <div>
          <label>Abstract:</label>
          <textarea
            name="paperAbstract"
            value={formData.paperAbstract}
            onChange={handleChange}
            placeholder="Paper abstract"
            required
          />
        </div>
        
        <div>
          <label>Keywords (comma-separated):</label>
          <input
            type="text"
            name="keywords"
            value={formData.keywords}
            onChange={handleChange}
            placeholder="blockchain, research, academia"
          />
        </div>
        
        <div>
          <label>Authors (comma-separated addresses):</label>
          <input
            type="text"
            name="authors"
            value={formData.authors}
            onChange={handleChange}
            placeholder="0x123..., 0x456..."
            required
          />
          <small>Your wallet address is auto-populated as the first author</small>
        </div>
        
        <div>
          <label>Version:</label>
          <input
            type="text"
            name="version"
            value={formData.version}
            onChange={handleChange}
            placeholder="1.0"
            required
          />
        </div>
        
        {processingStatus && (
          <div className="processing-status">
            <p>{processingStatus}</p>
          </div>
        )}
        
        <button type="submit" disabled={submitting}>
          {submitting ? 'Processing...' : 'Submit Paper'}
        </button>
      </form>
    </div>
  );
};

export default PaperSubmission; 