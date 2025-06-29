import { expect } from "chai";
import { ethers } from "hardhat";

describe("HelloWorld", function () {
  it("Should return the correct message", async function () {
    const HelloWorld = await ethers.getContractFactory("HelloWorld");
    const helloWorld = await HelloWorld.deploy();

    expect(await helloWorld.getMessage()).to.equal("Hello World!");
  });

  it("Should allow setting a new message", async function () {
    const HelloWorld = await ethers.getContractFactory("HelloWorld");
    const helloWorld = await HelloWorld.deploy();

    await helloWorld.setMessage("New Message!");
    expect(await helloWorld.getMessage()).to.equal("New Message!");
  });
}); 