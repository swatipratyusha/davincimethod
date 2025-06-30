import React, { useState, useEffect } from 'react';
import './App.css';
import PaperSubmission from './components/PaperSubmission';
import PaperSearch from './components/PaperSearch';
import PaperList from './components/PaperList';
import { ethers } from 'ethers';

// Import the contract ABI
const CONTRACT_ABI = require('./contractABI.json');

// Extend Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Paper {
  id: number;
  ipfsHash: string;
  title: string;
  paperAbstract: string;
  publicationYear: number;
  keywords: string[];
  authors: string[];
  submissionDate: number;
  submitter: string;
  version: string;
  isActive: boolean;
  embeddingHash: string;
  embeddingsGenerated: boolean;
  assignedReviewer: number;
  reviewerAssigned: boolean;
}

function App() {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string>('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Update these addresses to match the latest deployment
  const CONTRACT_ADDRESS = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
  const VRF_CONSUMER_ADDRESS = "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e";

  useEffect(() => {
    connectWallet();
  }, []);

  // Add effect to reload papers when account changes
  useEffect(() => {
    if (contract && account) {
      console.log('Account or contract changed, reloading papers...');
      loadPapers();
    }
  }, [contract, account]);

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // Check if already connected
        const accounts = await provider.listAccounts();
        if (accounts.length === 0) {
          // Request account access
          await provider.send("eth_requestAccounts", []);
        }
        
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        
        setProvider(provider);
        setSigner(signer);
        setAccount(address);
        
        // Debug: Log the ABI being used
        console.log('Using ABI:', CONTRACT_ABI);
        console.log('ABI length:', CONTRACT_ABI.length);
        console.log('submitPaper function in ABI:', CONTRACT_ABI.find((item: any) => item.name === 'submitPaper'));
        
        // Only create contract if we have a valid address
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        console.log('Contract created with address:', CONTRACT_ADDRESS);
        console.log('Contract interface:', contract.interface);
        console.log('Contract timestamp:', Date.now()); // Force refresh
        
        setContract(contract);
        // loadPapers() will be called by useEffect when contract and account are set
      } else {
        setError('Please install MetaMask!');
      }
    } catch (error: any) {
      // Don't show connection errors if already connected
      if (!account) {
        setError('Failed to connect wallet: ' + error.message);
      }
    }
  };

  const loadPapers = async () => {
    if (!contract || !account) return;
    
    try {
      setLoading(true);
      const papersList: Paper[] = [];
      
      // First, try to get papers by the connected author
      try {
        const authorPaperIds = await contract.getPapersByAuthor(account);
        console.log(`Found ${authorPaperIds.length} papers for author ${account}`);
        
        // Load each paper by ID
        for (const paperId of authorPaperIds) {
          try {
            const paper = await contract.getPaper(paperId);
            console.log(`Paper ${paperId} raw data:`, paper);
            
            // Destructure the Proxy(Result) into named properties
            const paperData = {
              id: Number(paperId),
              ipfsHash: paper[0],
              title: paper[1],
              paperAbstract: paper[2],
              publicationYear: paper[3],
              keywords: paper[4] || [],
              authors: paper[5] || [],
              submissionDate: paper[6],
              submitter: paper[7],
              version: paper[8],
              isActive: paper[9],
              embeddingHash: paper[10],
              embeddingsGenerated: paper[11],
              assignedReviewer: paper[12],
              reviewerAssigned: paper[13]
            };
            
            papersList.push(paperData);
          } catch (error) {
            console.error(`Error loading paper ${paperId}:`, error);
          }
        }
      } catch (error) {
        console.error('Error getting papers by author:', error);
        // Fallback: try to load all papers (old method)
        let paperId = 1;
        const maxAttempts = 100;
        
        for (let i = 0; i < maxAttempts; i++) {
          try {
            const paper = await contract.getPaper(paperId);
            
            // Destructure the Proxy(Result) into named properties
            const paperData = {
              id: paperId,
              ipfsHash: paper[0],
              title: paper[1],
              paperAbstract: paper[2],
              publicationYear: paper[3],
              keywords: paper[4] || [],
              authors: paper[5] || [],
              submissionDate: paper[6],
              submitter: paper[7],
              version: paper[8],
              isActive: paper[9],
              embeddingHash: paper[10],
              embeddingsGenerated: paper[11],
              assignedReviewer: paper[12],
              reviewerAssigned: paper[13]
            };
            
            papersList.push(paperData);
            paperId++;
          } catch (error) {
            break;
          }
        }
      }
      
      console.log(`Loaded ${papersList.length} papers total`);
      setPapers(papersList);
    } catch (error) {
      console.error('Failed to load papers:', error);
      setError('Failed to load papers: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaperSubmitted = () => {
    loadPapers();
  };

  return (
    <div 
      className="App" 
      style={{
        backgroundImage: `linear-gradient(
          rgba(245, 241, 232, 0.85),
          rgba(245, 241, 232, 0.85)
        ), url('/Uomo_Vitruviano.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <header className="App-header">
        <h1>ChainIndexed</h1>
        <p>On-Chain H-Index with AI Citation Verification</p>
        
        {!account ? (
          <button onClick={connectWallet} className="connect-button">
            Connect Wallet
          </button>
        ) : (
          <div className="wallet-info">
            <p>Connected: {account.substring(0, 6)}...{account.substring(38)}</p>
          </div>
        )}
      </header>

      <main className="App-main">
        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}
        
        {success && (
          <div className="success-banner">
            <p>{success}</p>
            <button onClick={() => setSuccess('')}>✕</button>
          </div>
        )}
        
        {account && contract && (
          <>
            <PaperSubmission 
              contract={contract} 
              onPaperSubmitted={handlePaperSubmitted}
              setError={setError}
              connectedAddress={account}
            />
            
            <PaperSearch 
              contract={contract}
              setError={setError}
            />
            
            <PaperList 
              papers={papers} 
              loading={loading} 
              contract={contract}
              signer={signer}
              onEmbeddingsGenerated={loadPapers}
              setError={setError}
              setSuccess={setSuccess}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;