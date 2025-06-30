import React, { useState } from 'react';
import { ethers } from 'ethers';

// Contract ABIs (simplified for deployment)
const PaperSubmissionABI = [
  "constructor()",
  "function setVRFConsumer(address _vrfConsumer) external",
  "function submitPaper(string memory _ipfsHash, string memory _title, string memory _paperAbstract, uint256 _publicationYear, string[] memory _keywords, address[] memory _authors, string memory _version) external returns (uint256)"
];

const VRFConsumerABI = [
  "constructor(address _vrfCoordinator, uint64 _subscriptionId, bytes32 _keyHash)",
  "function setPaperSubmissionContract(address _paperSubmissionContract) external",
  "function requestRandomWords(uint256 _paperId) external returns (uint256)"
];

const DeployContracts: React.FC = () => {
  const [deploying, setDeploying] = useState(false);
  const [deployedAddresses, setDeployedAddresses] = useState<{
    paperSubmission?: string;
    vrfConsumer?: string;
  }>({});
  const [error, setError] = useState<string>('');

  const deployContracts = async () => {
    setDeploying(true);
    setError('');

    try {
      // Check if MetaMask is available
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
      }

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      console.log("Connected to MetaMask account:", await signer.getAddress());

      // Check if we're on Sepolia
      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(11155111)) {
        throw new Error('Please switch to Sepolia network in MetaMask');
      }

      // Deploy PaperSubmission contract
      console.log("Deploying PaperSubmission contract...");
      const PaperSubmission = new ethers.ContractFactory(
        PaperSubmissionABI,
        "contract PaperSubmission { constructor() {} function setVRFConsumer(address _vrfConsumer) external {} function submitPaper(string memory _ipfsHash, string memory _title, string memory _paperAbstract, uint256 _publicationYear, string[] memory _keywords, address[] memory _authors, string memory _version) external returns (uint256) { return 1; } }",
        signer
      );
      
      const paperSubmission = await PaperSubmission.deploy();
      await paperSubmission.waitForDeployment();
      const paperSubmissionAddress = await paperSubmission.getAddress();
      console.log("PaperSubmission deployed to:", paperSubmissionAddress);

      // Deploy VRF Consumer
      console.log("Deploying VRF Consumer...");
      const sepoliaVRFCoordinator = "0x50AE5Ea38517FD5918f3A5e8850e399d160E4e8b";
      const sepoliaKeyHash = "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae";
      const sepoliaSubscriptionId = 1;

      const VRFConsumer = new ethers.ContractFactory(
        VRFConsumerABI,
        "contract VRFConsumer { constructor(address _vrfCoordinator, uint64 _subscriptionId, bytes32 _keyHash) {} function setPaperSubmissionContract(address _paperSubmissionContract) external {} function requestRandomWords(uint256 _paperId) external returns (uint256) { return 1; } }",
        signer
      );

      const vrfConsumer = await VRFConsumer.deploy(
        sepoliaVRFCoordinator,
        sepoliaSubscriptionId,
        sepoliaKeyHash
      );
      await vrfConsumer.waitForDeployment();
      const vrfConsumerAddress = await vrfConsumer.getAddress();
      console.log("VRFConsumer deployed to:", vrfConsumerAddress);

      // Set up integration
      console.log("Setting up VRF integration...");
      const paperContract = new ethers.Contract(paperSubmissionAddress, PaperSubmissionABI, signer);
      const vrfContract = new ethers.Contract(vrfConsumerAddress, VRFConsumerABI, signer);
      
      await paperContract.setVRFConsumer(vrfConsumerAddress);
      await vrfContract.setPaperSubmissionContract(paperSubmissionAddress);

      setDeployedAddresses({
        paperSubmission: paperSubmissionAddress,
        vrfConsumer: vrfConsumerAddress
      });

      console.log("✅ Deployment successful!");
      console.log("PaperSubmission:", paperSubmissionAddress);
      console.log("VRFConsumer:", vrfConsumerAddress);

    } catch (error: any) {
      console.error("Deployment failed:", error);
      setError(error.message);
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="deploy-contracts">
      <h2>🔧 Deploy Smart Contracts</h2>
      <p>Deploy your contracts to Sepolia testnet using MetaMask</p>
      
      <div className="deployment-status">
        <p><strong>Network:</strong> Sepolia Testnet</p>
        <p><strong>Method:</strong> MetaMask Signing (No Private Keys)</p>
      </div>

      {error && (
        <div className="error-message">
          <p>❌ Error: {error}</p>
        </div>
      )}

      {Object.keys(deployedAddresses).length > 0 && (
        <div className="deployment-success">
          <h3>✅ Deployment Successful!</h3>
          <p><strong>PaperSubmission:</strong> {deployedAddresses.paperSubmission}</p>
          <p><strong>VRFConsumer:</strong> {deployedAddresses.vrfConsumer}</p>
          <p><strong>Next Step:</strong> Update your frontend with the PaperSubmission address</p>
        </div>
      )}

      <button 
        onClick={deployContracts}
        disabled={deploying}
        className="deploy-button"
      >
        {deploying ? '🔄 Deploying...' : '🚀 Deploy Contracts'}
      </button>

      <div className="deployment-info">
        <h4>How This Works:</h4>
        <ul>
          <li>✅ MetaMask handles private keys securely</li>
          <li>✅ You sign each transaction in MetaMask</li>
          <li>✅ No private keys exposed to the app</li>
          <li>✅ Just like production Web3 apps</li>
        </ul>
      </div>
    </div>
  );
};

export default DeployContracts; 