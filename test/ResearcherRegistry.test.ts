import { expect } from "chai";
import { ethers } from "hardhat";

describe("ResearcherRegistry", function () {
  let researcherRegistry: any;
  let owner: any;
  let researcher1: any;
  let researcher2: any;

  beforeEach(async function () {
    [owner, researcher1, researcher2] = await ethers.getSigners();
    
    const ResearcherRegistry = await ethers.getContractFactory("ResearcherRegistry");
    researcherRegistry = await ResearcherRegistry.deploy();
  });

  it("Should allow a researcher to register", async function () {
    await researcherRegistry.connect(researcher1).registerResearcher("Dr. Alice Smith");
    
    expect(await researcherRegistry.getResearcherName(researcher1.address)).to.equal("Dr. Alice Smith");
    expect(await researcherRegistry.isRegistered(researcher1.address)).to.be.true;
  });

  it("Should prevent registration with empty name", async function () {
    await expect(
      researcherRegistry.connect(researcher1).registerResearcher("")
    ).to.be.revertedWith("Name cannot be empty");
  });

  it("Should allow multiple researchers to register", async function () {
    await researcherRegistry.connect(researcher1).registerResearcher("Dr. Alice Smith");
    await researcherRegistry.connect(researcher2).registerResearcher("Dr. Bob Johnson");
    
    expect(await researcherRegistry.getResearcherName(researcher1.address)).to.equal("Dr. Alice Smith");
    expect(await researcherRegistry.getResearcherName(researcher2.address)).to.equal("Dr. Bob Johnson");
  });

  it("Should return empty string for unregistered researcher", async function () {
    expect(await researcherRegistry.getResearcherName(researcher1.address)).to.equal("");
    expect(await researcherRegistry.isRegistered(researcher1.address)).to.be.false;
  });
}); 