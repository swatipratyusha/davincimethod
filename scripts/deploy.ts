import { ethers } from "hardhat";

async function main() {
  console.log("Deploying PaperSubmission contract...");

  const PaperSubmission = await ethers.getContractFactory("PaperSubmission");
  const paperSubmission = await PaperSubmission.deploy();

  await paperSubmission.waitForDeployment();

  const address = await paperSubmission.getAddress();
  console.log("PaperSubmission deployed to:", address);

  // Also deploy other contracts if needed
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

  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("PaperSubmission:", address);
  console.log("ResearcherRegistry:", researcherAddress);
  console.log("WalletAuth:", walletAuthAddress);
  console.log("\nUpdate your frontend CONTRACT_ADDRESS with:", address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 