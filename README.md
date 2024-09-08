

# FeedReward

`FeedReward` is a smart contract designed to reward users with tokens for providing feedback. The contract uses interaction tokens to ensure the validity of submissions and prevent abuse.

## Features

- **Reward Distribution**: Users are rewarded with a specified amount of tokens for providing valid feedback.
- **Submission Tracking**: Limits the number of rewards each user can receive.
- **Token Validation**: Uses hashed tokens to validate genuine feedback interactions.
- **Ownership Management**: Allows the contract owner to manage the contract and perform administrative tasks.

## Prerequisites

- Node.js (>= 12.x)
- NPM or Yarn
- Hardhat
- MetaMask (or any Ethereum wallet)
- Testnet (Sepolia, Polygon Amoy, etc.)

## Installation

1. **Clone the Repository**

   ```sh
   git clone https://github.com/SabaliDev/onchain-feedreward.git
   cd feedreward
   ```

2. **Install Dependencies**

   ```sh
   npm install
   ```

   or

   ```sh
   yarn install
   ```

3. **Configure Environment Variables**

   Create a `.env` file in the root directory and add the following environment variables:

   ```sh
   PRIVATE_KEY=your_private_key
   INFURA_PROJECT_ID=your_infura_project_id
   ```

## Deployment

1. **Compile the Contract**

   ```sh
   npx hardhat compile
   ```

2. **Deploy to a Test Network**

   Deploy the contract to Sepolia Testnet:

   ```sh
   npx hardhat run scripts/deploy.js --network sepolia
   ```

   Alternatively, deploy to Polygon Amoy Testnet:

   ```sh
   npx hardhat run scripts/deploy.js --network polygon_amoy
   ```

   Ensure that your `hardhat.config.js` is configured for the respective network.

## Hardhat Configuration

Update your `hardhat.config.js` to include the desired networks:

```javascript
require("@nomiclabs/hardhat-waffle");

module.exports = {
  solidity: "0.8.0",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
    polygon_amoy: {
      url: "https://rpc-amoy.polygon.technology/",
      chainId: 80002,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
  },
};
```

## Usage

### Adding Valid Hashed Tokens

To add valid hashed tokens that users can submit for rewards:

```solidity
function addValidHashedToken(bytes32 _hashedToken) public onlyOwner {
    validHashedTokens[_hashedToken] = true;
}
```

### Rewarding Users

To reward users for their feedback:

```solidity
function rewardUser(address _user, bytes32 _hashedToken) public {
    require(validHashedTokens[_hashedToken], "Invalid or no interaction token provided.");
    require(submissionCount[_user] < MAX_SUBMISSIONS, "Submission limit reached.");
    require(usdt.transfer(_user, REWARD_AMOUNT), "Failed to transfer USDT.");
    submissionCount[_user] += 1;
    invalidateHashedToken(_hashedToken);
}
```

### Checking Contract Balance

To check the contract's token balance (restricted to the owner):

```solidity
function checkUSDTBalance() public view onlyOwner returns (uint256) {
    return usdt.balanceOf(address(this));
}
```

### Transferring Ownership

To transfer ownership of the contract:

```solidity
function transferOwnership(address newOwner) public onlyOwner {
    require(newOwner != address(0), "New owner is the zero address.");
    owner = newOwner;
}
```

## Testing

1. **Run Tests**

   ```sh
   npx hardhat test
   ```

   This will execute the test scripts in the `test` directory to ensure the contract functions as expected.

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.




