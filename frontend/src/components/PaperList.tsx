import React, { useState } from 'react';
import { ethers } from 'ethers';

interface Paper {
  id: number;
  ipfsHash: string;
  title: string;
  paperAbstract: string;
  publicationYear: number | bigint;
  keywords: string[];
  authors: string[];
  submissionDate: number | bigint;
  submitter: string;
  version: string;
  isActive: boolean;
  embeddingHash: string;
  embeddingsGenerated: boolean;
  assignedReviewer: number | bigint;
  reviewerAssigned: boolean;
}

interface PaperListProps {
  papers: Paper[];
  loading: boolean;
  contract: ethers.Contract;
  signer: ethers.JsonRpcSigner | null;
  onEmbeddingsGenerated: () => void;
  setError: (error: string) => void;
  setSuccess?: (message: string) => void;
}

const PaperList: React.FC<PaperListProps> = ({ papers, loading, contract, signer, onEmbeddingsGenerated, setError, setSuccess }) => {
  const [generatingEmbeddings, setGeneratingEmbeddings] = useState<number | null>(null);
  const [assigningReviewer, setAssigningReviewer] = useState<number | null>(null);

  const generateEmbeddings = async (paperId: number) => {
    setGeneratingEmbeddings(paperId);
    setError('');

    try {
      // This would typically call your backend embedding service
      // For now, we'll just store a mock embedding hash
      const mockEmbeddingHash = `QmMockEmbedding${paperId}_${Date.now()}`;
      
      const tx = await contract.storeEmbeddings(paperId, mockEmbeddingHash);
      await tx.wait();
      
      onEmbeddingsGenerated();
    } catch (error: any) {
      setError('Failed to generate embeddings: ' + error.message);
    } finally {
      setGeneratingEmbeddings(null);
    }
  };

  const triggerReviewerAssignment = async (paperId: number) => {
    setAssigningReviewer(paperId);
    setError('');

    try {
      if (!contract || !signer) {
        setError('Contract or signer not initialized');
        setAssigningReviewer(null);
        return;
      }
      if (typeof contract.triggerReviewerAssignment !== 'function') {
        setError('triggerReviewerAssignment method missing from contract');
        setAssigningReviewer(null);
        return;
      }
      console.log(`Triggering VRF reviewer assignment for paper ${paperId}...`);
      
      // Step 1: Trigger the VRF request using the signer
      const tx = await (contract as any).connect(signer).triggerReviewerAssignment(paperId);
      const receipt = await tx.wait();
      console.log('VRF request submitted successfully!');
      
      // Step 2: Get the request ID - since MockVRFCoordinator uses a simple counter
      // We'll use the current request ID counter from the MockVRFCoordinator
      const mockCoordinatorAddress = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788";
      const mockCoordinatorABI = [
        "function getRequestIdCounter() external view returns (uint256)",
        "function fulfillRequest(uint256 requestId) external"
      ];
      const mockCoordinator = new ethers.Contract(mockCoordinatorAddress, mockCoordinatorABI, signer);
      
      // Get the current request ID counter
      const currentRequestId = await mockCoordinator.getRequestIdCounter();
      console.log('Current request ID counter:', currentRequestId.toString());
      
      // The request ID for this request will be the current counter value minus 1
      // because the counter is incremented after the request is created
      const requestId = currentRequestId - BigInt(1);
      console.log('Using request ID:', requestId.toString());
      
      // Step 3: Call the mock coordinator to fulfill the request
      console.log('Fulfilling VRF request...');
      const fulfillTx = await mockCoordinator.fulfillRequest(requestId);
      await fulfillTx.wait();
      console.log('VRF request fulfilled successfully!');
      
      if (setSuccess) {
        setSuccess('Reviewer assigned successfully via Chainlink VRF!');
      } else {
        setError('Reviewer assigned successfully via Chainlink VRF!');
      }
      // Refresh the papers list to show updated status
      setTimeout(() => {
        onEmbeddingsGenerated();
      }, 2000);
    } catch (error: any) {
      console.error('VRF assignment error:', error);
      setError('VRF assignment failed: ' + error.message);
    } finally {
      setAssigningReviewer(null);
    }
  };

  const formatDate = (timestamp: number | bigint) => {
    // Convert BigInt to number if needed
    const timestampNumber = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
    return new Date(timestampNumber * 1000).toLocaleDateString();
  };

  if (loading) {
    return <div className="paper-list">Loading papers...</div>;
  }

  return (
    <div className="paper-list">
      <h2>Papers Submitted by This Wallet ({papers.length})</h2>
      
      {papers.length === 0 ? (
        <div className="no-papers">
          <p>No papers submitted by this wallet yet.</p>
          <p><small>Submit your first paper using the form above!</small></p>
        </div>
      ) : (
        <div className="papers-grid">
          {papers.map((paper, index) => {
            console.log(`Rendering paper ${index}:`, paper);
            return (
              <div key={index} className="paper-card">
                <h3>{paper.title || 'Untitled'}</h3>
                <p><strong>Year:</strong> {typeof paper.publicationYear === 'bigint' ? Number(paper.publicationYear) : paper.publicationYear}</p>
                <p><strong>Authors:</strong> {Array.isArray(paper.authors) ? paper.authors.join(', ') : 'Unknown'}</p>
                <p><strong>Keywords:</strong> {Array.isArray(paper.keywords) ? paper.keywords.join(', ') : 'None'}</p>
                <p><strong>Abstract:</strong> {paper.paperAbstract ? paper.paperAbstract.substring(0, 150) + '...' : 'No abstract'}</p>
                <p><strong>Submitted:</strong> {formatDate(paper.submissionDate)}</p>
                <p><strong>Status:</strong> {paper.isActive ? 'Active' : 'Inactive'}</p>
                <p><strong>Embeddings:</strong> {paper.embeddingsGenerated ? '✅ Generated' : '❌ Not generated'}</p>
                
                {/* VRF Reviewer Assignment Section */}
                <div className="vrf-section">
                  <h4>🔗 Chainlink VRF Review Assignment</h4>
                  <p><strong>Reviewer Status:</strong> 
                    {paper.reviewerAssigned ? 
                      `✅ Assigned (Reviewer #${typeof paper.assignedReviewer === 'bigint' ? Number(paper.assignedReviewer) : paper.assignedReviewer})` : 
                      '❌ Not assigned'
                    }
                  </p>
                  
                  {!paper.reviewerAssigned && paper.isActive && (
                    <button 
                      onClick={() => triggerReviewerAssignment(paper.id)}
                      disabled={assigningReviewer === paper.id}
                      className="vrf-button"
                    >
                      {assigningReviewer === paper.id ? '🔄 Requesting VRF...' : '🎲 Assign Random Reviewer (VRF)'}
                    </button>
                  )}
                  
                  {paper.reviewerAssigned && (
                    <div className="reviewer-info">
                      <p>🎯 <strong>Random Reviewer #{typeof paper.assignedReviewer === 'bigint' ? Number(paper.assignedReviewer) : paper.assignedReviewer}</strong> assigned via Chainlink VRF</p>
                      <small>This reviewer was randomly selected using verifiable randomness</small>
                    </div>
                  )}
                </div>
                
                {!paper.embeddingsGenerated && paper.isActive && (
                  <button 
                    onClick={() => generateEmbeddings(paper.id)}
                    disabled={generatingEmbeddings === paper.id}
                  >
                    {generatingEmbeddings === paper.id ? 'Generating...' : 'Generate Embeddings'}
                  </button>
                )}
                
                <div className="paper-actions">
                  <a href={`https://ipfs.io/ipfs/${paper.ipfsHash}`} target="_blank" rel="noopener noreferrer">
                    View on IPFS
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PaperList; 