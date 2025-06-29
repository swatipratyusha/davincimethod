// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract WalletAuth {
    // Track which addresses have authenticated
    mapping(address => bool) public authenticatedUsers;
    
    // Track user profiles
    mapping(address => UserProfile) public userProfiles;
    
    struct UserProfile {
        string name;
        string email;
        uint256 registrationDate;
        bool isActive;
    }
    
    event UserAuthenticated(address indexed user, string name);
    event ProfileUpdated(address indexed user, string name);
    
    /**
     * @dev Register a new user with their wallet
     * @param name User's display name
     * @param email User's email (optional, can be empty)
     */
    function registerUser(string memory name, string memory email) public {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(!authenticatedUsers[msg.sender], "User already registered");
        
        authenticatedUsers[msg.sender] = true;
        userProfiles[msg.sender] = UserProfile({
            name: name,
            email: email,
            registrationDate: block.timestamp,
            isActive: true
        });
        
        emit UserAuthenticated(msg.sender, name);
    }
    
    /**
     * @dev Update user profile
     * @param name New display name
     * @param email New email
     */
    function updateProfile(string memory name, string memory email) public {
        require(authenticatedUsers[msg.sender], "User not registered");
        require(bytes(name).length > 0, "Name cannot be empty");
        
        userProfiles[msg.sender].name = name;
        userProfiles[msg.sender].email = email;
        
        emit ProfileUpdated(msg.sender, name);
    }
    
    /**
     * @dev Get user profile
     * @param user Address of the user
     * @return name The user's display name
     * @return email The user's email address
     * @return registrationDate The timestamp when the user registered
     * @return isActive Whether the user account is active
     */
    function getUserProfile(address user) public view returns (
        string memory name,
        string memory email,
        uint256 registrationDate,
        bool isActive
    ) {
        UserProfile memory profile = userProfiles[user];
        return (
            profile.name,
            profile.email,
            profile.registrationDate,
            profile.isActive
        );
    }
    
    /**
     * @dev Check if an address is authenticated
     * @param user Address to check
     * @return True if user is registered
     */
    function isAuthenticated(address user) public view returns (bool) {
        return authenticatedUsers[user];
    }
    
    /**
     * @dev Deactivate user account
     */
    function deactivateAccount() public {
        require(authenticatedUsers[msg.sender], "User not registered");
        userProfiles[msg.sender].isActive = false;
    }
    
    /**
     * @dev Reactivate user account
     */
    function reactivateAccount() public {
        require(authenticatedUsers[msg.sender], "User not registered");
        userProfiles[msg.sender].isActive = true;
    }
}