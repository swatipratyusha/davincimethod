# ChainIndexed: Decentralized Academic Reputation System

## Problem Statement

Academic reputation systems face significant challenges in the digital age:

- **Centralized Control**: Traditional H-index calculations are controlled by private companies (Google Scholar, Web of Science, Scopus)
- **Lack of Transparency**: Citation verification processes are opaque and subject to manipulation
- **Limited Accessibility**: High costs and paywalls restrict access to citation data
- **Exorbitant Publishing Costs**: Researchers pay thousands of dollars to publish in prestigious journals
- **Paywall Barriers**: Published research is locked behind expensive subscriptions, limiting global access to knowledge
- **Verification Bottlenecks**: Manual review processes create delays and inconsistencies
- **Trust Issues**: Researchers must trust third-party platforms without verifiable proof

## Solution Overview

ChainIndexed is a decentralized academic reputation system that leverages blockchain technology, AI-powered citation verification, and Chainlink's verifiable randomness to create a transparent, trustless platform for academic reputation management.

## Current MVP Features

### Core Smart Contract Functionality
- **Paper Submission System**: Researchers can submit academic papers with comprehensive metadata
- **IPFS Integration**: Decentralized storage of paper content and metadata
- **AI-Powered Embeddings**: Automated generation of paper embeddings for similarity analysis
- **Chainlink VRF Integration**: Verifiable random assignment of peer reviewers
- **Researcher Registry**: On-chain researcher profiles and verification

### Technical Architecture

#### Smart Contracts
- `PaperSubmission.sol`: Core paper management and submission logic
- `ResearcherRegistry.sol`: Researcher profile and verification system
- `VRFConsumer.sol`: Chainlink VRF integration for random reviewer assignment
- `MockVRFCoordinator.sol`: Local development VRF coordinator

#### Frontend Application
- **React-based UI**: Modern, responsive interface with Da Vinci-inspired design
- **Web3 Integration**: MetaMask wallet connection and transaction management
- **PDF Processing**: Client-side PDF text extraction and analysis
- **Real-time Updates**: Live status updates for paper submission and review processes

## Chainlink Integration

### Verifiable Randomness (VRF)
ChainIndexed uses Chainlink VRF to ensure fair and transparent peer reviewer assignment:

- **Random Reviewer Selection**: Each paper is assigned a random reviewer from the pool
- **Verifiable Fairness**: All randomness is cryptographically verifiable
- **Prevention of Manipulation**: No single entity can influence reviewer selection
- **Audit Trail**: Complete transparency in the assignment process

### Implementation Details
- **VRF Request Flow**: Paper submission triggers VRF request for reviewer assignment
- **Callback Mechanism**: Smart contract receives random number and assigns reviewer
- **Gas Optimization**: Efficient handling of VRF callbacks and state updates

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- MetaMask wallet
- Sepolia testnet ETH (for deployment)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd chainlinkChromion'25
   ```

2. **Install dependencies**:
   ```bash
   npm install
   cd frontend && npm install
   ```

3. **Environment setup**:
   ```bash
   # Root directory (.env)
   cp .env.example .env
   # Add your private keys and API keys
   
   # Frontend directory (.env)
   cd frontend
   cp .env.example .env
   # Add frontend-specific environment variables
   ```

   **Root Directory Environment Variables:**
   ```env
   # Blockchain Configuration
   PRIVATE_KEY=your_private_key_here
   SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id
   
   # Local Development VRF (MockVRFCoordinator)
   # Note: For production, replace with real Chainlink VRF subscription
   MOCK_VRF_COORDINATOR_ADDRESS=0x610178dA211FEF7D417bC0e6FeD39F05609AD788
   
   # IPFS Configuration
   IPFS_PROJECT_ID=your_ipfs_project_id
   IPFS_PROJECT_SECRET=your_ipfs_project_secret
   
   # OpenAI Configuration (for embeddings)
   OPENAI_API_KEY=your_openai_api_key
   ```

   **Frontend Environment Variables:**
   ```env
   # Contract Addresses (update after deployment)
   REACT_APP_PAPER_SUBMISSION_CONTRACT=deployed_contract_address
   REACT_APP_RESEARCHER_REGISTRY_CONTRACT=deployed_contract_address
   REACT_APP_VRF_CONSUMER_CONTRACT=deployed_contract_address
   REACT_APP_MOCK_VRF_COORDINATOR=0x610178dA211FEF7D417bC0e6FeD39F05609AD788
   
   # Blockchain Configuration
   REACT_APP_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id
   
   # IPFS Configuration
   REACT_APP_IPFS_PROJECT_ID=your_ipfs_project_id
   REACT_APP_IPFS_PROJECT_SECRET=your_ipfs_project_secret
   
   # OpenAI Configuration
   REACT_APP_OPENAI_API_KEY=your_openai_api_key
   ```

   **Note:** This MVP uses MockVRFCoordinator for local development. For production deployment with real Chainlink VRF, you would need:
   - Chainlink VRF subscription on Sepolia
   - Real VRF coordinator address
   - VRF key hash and subscription ID

4. **Compile contracts**:
   ```bash
   npx hardhat compile
   ```

5. **Deploy to Sepolia**:
   ```bash
   npx hardhat run scripts/deploy.ts --network sepolia
   ```

6. **Start frontend**:
   ```bash
   cd frontend
   npm start
   ```

## Usage Guide

### For Researchers

1. **Connect Wallet**: Use MetaMask to connect your wallet
2. **Submit Paper**: Upload PDF and provide metadata
3. **Generate Embeddings**: AI processes paper content for similarity analysis
4. **Review Assignment**: Chainlink VRF automatically assigns peer reviewer

## Technical Specifications

- **Blockchain**: Ethereum (Sepolia testnet)
- **Smart Contracts**: Solidity 0.8.19
- **Frontend**: React 18 with TypeScript
- **Web3**: ethers.js v6
- **Storage**: IPFS for decentralized content storage
- **AI**: OpenAI embeddings for paper similarity
- **VRF**: Chainlink VRF v2 for random reviewer assignment

## Future Roadmap

### Phase 2: Enhanced Verification
- **Multi-AI Verification**: Integration with multiple AI models for citation verification
- **Cross-Chain Compatibility**: Support for multiple blockchain networks
- **Advanced Analytics**: Detailed citation analysis and impact metrics
- **Reputation Tokens**: ERC-20 tokens for academic reputation

### Phase 3: Decentralized Governance
- **DAO Governance**: Community-driven platform management
- **Staking Mechanisms**: Economic incentives for quality reviews
- **Dispute Resolution**: On-chain arbitration for citation disputes
- **Institutional Integration**: University and research institution partnerships

## Contributing

We welcome contributions from the academic and blockchain communities:

1. **Fork the repository**
2. **Create a feature branch**
3. **Implement your changes**
4. **Add comprehensive tests**
5. **Submit a pull request**

### Development Guidelines
- Follow Solidity best practices and security patterns
- Ensure all tests pass before submitting
- Document new features and API changes
- Maintain code quality and readability

## Security Considerations

- **Smart Contract Audits**: All contracts undergo security review
- **Access Control**: Proper role-based permissions and ownership management
- **Input Validation**: Comprehensive validation of all user inputs
- **Gas Optimization**: Efficient contract design for cost-effective operations

## Acknowledgments

- **Chainlink**: For providing verifiable randomness infrastructure
- **IPFS**: For decentralized storage solutions
- **OpenAI**: For AI-powered content analysis

## Contact

For questions, suggestions, or collaboration opportunities:
- **GitHub Issues**: [Repository Issues](https://github.com/swatipratyusha/davincimethod.git/issues)
- **Email**: [Your Email]
- **Discord**: [Your Discord Server]

*ChainIndexed: Revolutionizing academic reputation through blockchain technology and verifiable randomness.*