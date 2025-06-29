# ChainIndexed - On-Chain H-Index with AI Citation Verification

## Overview

ChainIndexed is a blockchain-based academic citation verification system that calculates H-Index scores for researchers using AI-powered citation verification. This MVP focuses on the core smart contract functionality without a frontend.

## Features

### Core Functionality
- **Researcher Registration**: Researchers can register with their name and institution
- **Paper Submission**: Registered researchers can submit academic papers with metadata
- **Citation Management**: Track citations between papers with DOI references
- **H-Index Calculation**: On-chain calculation of H-Index based on verified citations
- **AI Citation Verification**: Framework for AI-powered citation verification (owner-controlled)

### Smart Contract Architecture

The `ChainIndexed.sol` contract includes:

1. **Researcher Management**
   - Registration with name and institution
   - Verification status tracking
   - H-Index and citation statistics

2. **Paper Management**
   - Paper submission with title, DOI, authors, and publication year
   - Citation count tracking
   - Verification status

3. **Citation System**
   - Citation creation between papers
   - Verification framework for AI integration
   - Prevention of self-citations

4. **H-Index Calculation**
   - Algorithmic calculation based on citation counts
   - Owner-controlled updates
   - Real-time score updates

## Project Structure

```
chainlinkChromion'25/
├── contracts/
│   └── ChainIndexed.sol          # Main smart contract
├── scripts/
│   ├── deploy.ts                 # Deployment script
│   └── utils.ts                  # Utility functions
├── test/
│   └── ChainIndexed.test.ts      # Test suite
├── hardhat.config.ts             # Hardhat configuration
├── package.json                  # Dependencies
└── README.md                     # This file
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Compile the smart contract**:
   ```bash
   npx hardhat compile
   ```

3. **Run tests**:
   ```bash
   npx hardhat test
   ```

4. **Start local blockchain**:
   ```bash
   npx hardhat node
   ```

5. **Deploy to local network**:
   ```bash
   npx hardhat run scripts/deploy.ts --network localhost
   ```

## Smart Contract Functions

### Researcher Functions
- `registerResearcher(string name, string institution)` - Register as a researcher
- `getResearcher(address researcherAddress)` - Get researcher information

### Paper Functions
- `submitPaper(string title, string doi, string authors, uint256 publicationYear)` - Submit a new paper
- `getPaper(uint256 paperId)` - Get paper information
- `getResearcherPapers(address researcherAddress)` - Get all papers by a researcher

### Citation Functions
- `addCitation(string citingPaperDoi, string citedPaperDoi)` - Add a citation
- `verifyCitation(uint256 citationId)` - Verify a citation (owner only)
- `getPaperCitations(string doi)` - Get all citations for a paper

### H-Index Functions
- `calculateHIndex(address researcherAddress)` - Calculate H-Index (owner only)

## AI Integration Framework

The contract provides a framework for AI citation verification:

1. **Citation Submission**: Citations are initially unverified
2. **AI Verification**: Owner (AI system) can verify citations
3. **H-Index Updates**: Verified citations update H-Index calculations
4. **Audit Trail**: All verification actions are logged on-chain

## Next Steps for MVP

1. **Complete Testing**: Implement comprehensive test suite
2. **AI Integration**: Connect AI verification system to the contract
3. **Gas Optimization**: Optimize contract for cost efficiency
4. **Security Audit**: Conduct smart contract security review
5. **Deployment**: Deploy to testnet for validation

## Technical Specifications

- **Solidity Version**: 0.8.19
- **Framework**: Hardhat with TypeScript
- **Testing**: Chai + Mocha
- **Security**: OpenZeppelin contracts for access control and security

## License

MIT License - see LICENSE file for details

## Contributing

This is an MVP implementation. For contributions, please follow standard development practices and ensure all tests pass before submitting changes.
