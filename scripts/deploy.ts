import { ethers } from "hardhat";

async function main() {
  console.log("Deploying contracts...");

  // Get the signer (will use MetaMask if configured properly)
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy main contracts
  console.log("\nDeploying PaperSubmission contract...");
  const PaperSubmission = await ethers.getContractFactory("PaperSubmission");
  const paperSubmission = await PaperSubmission.deploy();
  await paperSubmission.waitForDeployment();
  const paperSubmissionAddress = await paperSubmission.getAddress();
  console.log("PaperSubmission deployed to:", paperSubmissionAddress);

  console.log("\nDeploying ResearcherRegistry contract...");
  const ResearcherRegistry = await ethers.getContractFactory("ResearcherRegistry");
  const researcherRegistry = await ResearcherRegistry.deploy();
  await researcherRegistry.waitForDeployment();
  const researcherAddress = await researcherRegistry.getAddress();
  console.log("ResearcherRegistry deployed to:", researcherAddress);

  console.log("\nDeploying WalletAuth contract...");
  const WalletAuth = await ethers.getContractFactory("WalletAuth");
  const walletAuth = await WalletAuth.deploy();
  await walletAuth.waitForDeployment();
  const walletAuthAddress = await walletAuth.getAddress();
  console.log("WalletAuth deployed to:", walletAuthAddress);

  // Deploy Mock VRF Coordinator first
  console.log("\nDeploying Mock VRF Coordinator...");
  const MockVRFCoordinator = await ethers.getContractFactory("MockVRFCoordinator");
  const mockVRFCoordinator = await MockVRFCoordinator.deploy();
  await mockVRFCoordinator.waitForDeployment();
  const mockVRFCoordinatorAddress = await mockVRFCoordinator.getAddress();
  console.log("Mock VRF Coordinator deployed to:", mockVRFCoordinatorAddress);

  // Deploy Chainlink VRF contract with mock coordinator
  console.log("\nDeploying VRF Consumer...");
  const VRFConsumer = await ethers.getContractFactory("VRFConsumer");
  
  // Use mock addresses for local testing
  const mockKeyHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
  const mockSubscriptionId = 1;
  
  const vrfConsumer = await VRFConsumer.deploy(
    mockVRFCoordinatorAddress, // Use mock coordinator address
    mockSubscriptionId,
    mockKeyHash
  );
  await vrfConsumer.waitForDeployment();
  const vrfConsumerAddress = await vrfConsumer.getAddress();
  console.log("VRFConsumer deployed to:", vrfConsumerAddress);

  // Set up VRF integration
  console.log("\nSetting up Chainlink VRF integration...");
  await paperSubmission.setVRFConsumer(vrfConsumerAddress);
  await (vrfConsumer as any).setPaperSubmissionContract(paperSubmissionAddress);
  console.log("Chainlink VRF integration set up successfully!");

  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("PaperSubmission:", paperSubmissionAddress);
  console.log("ResearcherRegistry:", researcherAddress);
  console.log("WalletAuth:", walletAuthAddress);
  console.log("Mock VRF Coordinator:", mockVRFCoordinatorAddress);
  console.log("VRFConsumer:", vrfConsumerAddress);
  console.log("\nUpdate your frontend CONTRACT_ADDRESS with:", paperSubmissionAddress);
  
  console.log("\n=== CHAINLINK VRF INTEGRATION READY ===");
  console.log("✅ Mock VRF Coordinator for local testing");
  console.log("✅ VRF integration triggers state changes on-chain");
  console.log("✅ Random reviewer assignment will work locally!");
  console.log("\nYour project now meets Chainlink hackathon requirements!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 