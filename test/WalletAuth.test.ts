import { expect } from "chai";
import { ethers } from "hardhat";

describe("WalletAuth", function () {
  let walletAuth: any;
  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const WalletAuth = await ethers.getContractFactory("WalletAuth");
    walletAuth = await WalletAuth.deploy();
  });

  describe("User Registration", function () {
    it("Should allow a user to register with their wallet", async function () {
      await walletAuth.connect(user1).registerUser("Alice", "alice@example.com");
      
      expect(await walletAuth.isAuthenticated(user1.address)).to.be.true;
      
      const profile = await walletAuth.getUserProfile(user1.address);
      expect(profile.name).to.equal("Alice");
      expect(profile.email).to.equal("alice@example.com");
      expect(profile.isActive).to.be.true;
    });

    it("Should prevent duplicate registration", async function () {
      await walletAuth.connect(user1).registerUser("Alice", "alice@example.com");
      
      await expect(
        walletAuth.connect(user1).registerUser("Alice2", "alice2@example.com")
      ).to.be.revertedWith("User already registered");
    });

    it("Should prevent registration with empty name", async function () {
      await expect(
        walletAuth.connect(user1).registerUser("", "alice@example.com")
      ).to.be.revertedWith("Name cannot be empty");
    });
  });

  describe("Profile Management", function () {
    beforeEach(async function () {
      await walletAuth.connect(user1).registerUser("Alice", "alice@example.com");
    });

    it("Should allow users to update their profile", async function () {
      await walletAuth.connect(user1).updateProfile("Alice Smith", "alice.smith@example.com");
      
      const profile = await walletAuth.getUserProfile(user1.address);
      expect(profile.name).to.equal("Alice Smith");
      expect(profile.email).to.equal("alice.smith@example.com");
    });

    it("Should prevent non-registered users from updating profile", async function () {
      await expect(
        walletAuth.connect(user2).updateProfile("Bob", "bob@example.com")
      ).to.be.revertedWith("User not registered");
    });

    it("Should allow users to deactivate their account", async function () {
      await walletAuth.connect(user1).deactivateAccount();
      
      const profile = await walletAuth.getUserProfile(user1.address);
      expect(profile.isActive).to.be.false;
    });

    it("Should allow users to reactivate their account", async function () {
      await walletAuth.connect(user1).deactivateAccount();
      await walletAuth.connect(user1).reactivateAccount();
      
      const profile = await walletAuth.getUserProfile(user1.address);
      expect(profile.isActive).to.be.true;
    });
  });

  describe("Authentication Checks", function () {
    it("Should return false for unregistered addresses", async function () {
      expect(await walletAuth.isAuthenticated(user1.address)).to.be.false;
    });

    it("Should return true for registered addresses", async function () {
      await walletAuth.connect(user1).registerUser("Alice", "alice@example.com");
      expect(await walletAuth.isAuthenticated(user1.address)).to.be.true;
    });
  });

  describe("Multiple Users", function () {
    it("Should handle multiple users independently", async function () {
      await walletAuth.connect(user1).registerUser("Alice", "alice@example.com");
      await walletAuth.connect(user2).registerUser("Bob", "bob@example.com");
      
      expect(await walletAuth.isAuthenticated(user1.address)).to.be.true;
      expect(await walletAuth.isAuthenticated(user2.address)).to.be.true;
      
      const aliceProfile = await walletAuth.getUserProfile(user1.address);
      const bobProfile = await walletAuth.getUserProfile(user2.address);
      
      expect(aliceProfile.name).to.equal("Alice");
      expect(bobProfile.name).to.equal("Bob");
    });
  });
}); 