// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ResearcherRegistry {
    mapping(address => string) public researchers;
    
    event ResearcherRegistered(address indexed researcher, string name);
    
    function registerResearcher(string memory name) public {
        require(bytes(name).length > 0, "Name cannot be empty");
        researchers[msg.sender] = name;
        emit ResearcherRegistered(msg.sender, name);
    }
    
    function getResearcherName(address researcher) public view returns (string memory) {
        return researchers[researcher];
    }
    
    function isRegistered(address researcher) public view returns (bool) {
        return bytes(researchers[researcher]).length > 0;
    }
} 