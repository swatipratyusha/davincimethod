# Sepolia Deployment Setup for Real Chainlink VRF

## Step 1: Get Sepolia Access

### 1.1 Get Infura/Alchemy Account
- Go to [Infura](https://infura.io/) or [Alchemy](https://alchemy.com/)
- Create free account
- Create new project
- Copy your project ID

### 1.2 Get Sepolia ETH
- Go to [Sepolia Faucet](https://sepoliafaucet.com/)
- Enter your wallet address
- Get free Sepolia ETH

### 1.3 Get Your Private Key
- In MetaMask: Settings → Security → Export Private Key
- **⚠️ Never share this key!**

## Step 2: Configure Environment

Create a `.env` file in the project root:

```bash
# Sepolia Testnet Configuration
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR-PROJECT-ID
PRIVATE_KEY=your_wallet_private_key_here

# Frontend Environment Variables
REACT_APP_PINATA_API_KEY=your_pinata_api_key
REACT_APP_PINATA_SECRET_KEY=your_pinata_secret_key
REACT_APP_OPENAI_API_KEY=your_openai_api_key
```

## Step 3: Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

## Step 4: Update Frontend

After deployment, update the contract address in `frontend/src/App.tsx`:

```typescript
const CONTRACT_ADDRESS = "NEW_SEPOLIA_CONTRACT_ADDRESS";
```

## Real Chainlink VRF Benefits

✅ **Verifiable randomness** on-chain  
✅ **Meets hackathon requirements**  
✅ **Free on Sepolia testnet**  
✅ **Production-ready code**  
✅ **Real Chainlink integration**  

## How VRF Works

1. User clicks "Assign Random Reviewer"
2. Contract calls Chainlink VRF coordinator
3. VRF coordinator generates cryptographically secure random number
4. Callback assigns reviewer to paper
5. User sees randomly assigned reviewer

This is **real Chainlink VRF** - no mocking, no shortcuts! 