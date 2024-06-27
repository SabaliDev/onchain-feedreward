import { ethers } from 'ethers';
import contractABI from './utils/contractAbi.json';

const contractAddress = '0x6801474CB41342Ade2215cAF0c08D96F51F5c0d7';

// connect the wallet export function
export async function connectWallet() {
  if (window.ethereum) {
  try {
    await window.ethereum.request({ method: 'eth_requestAccounts' }); 
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    return { address, signer };
  } catch (error) {
    console.error('Error connecting wallet:', error);
    return { address: null, signer: null };
  }
} else {
  alert('Ethereum object not found, please install MetaMask.');
  return { address: null, signer: null };
}
}

// Initialize the contract with a signer when needed
export function getFeedbackRewardsContract(signer) {
  return new ethers.Contract(contractAddress, contractABI, signer);
}

export async function rewardUser(signer, userAddress, hashedToken) {
    await checkAndSwitchToMorphTestnet(); // Ensure the user is on the Morph Testnet
    const feedbackRewards = getFeedbackRewardsContract(signer);
    // Prefix the hashedToken with '0x' as if not already prefixed
    const prefixedHashedToken = hashedToken.startsWith('0x') ? hashedToken : `0x${hashedToken}`;
    try {
      const tx = await feedbackRewards.rewardUser(userAddress, prefixedHashedToken);
      await tx.wait();
      console.log('Reward transaction successful:', tx);
    } catch (error) {
      console.error('Error rewarding user:', error);
      throw error;
    }
}

// function to interact with addValidHashedToken
export async function addValidHashedToken(signer, hashedToken) {
    await checkAndSwitchToMorphTestnet(); // Ensure the user is on the Morph Testnet
    const feedbackRewards = getFeedbackRewardsContract(signer);
    const tx = await feedbackRewards.addValidHashedToken(hashedToken);
    await tx.wait();
    console.log('Hashed token added successfully');
    return true; // Return true if the operation is successful
}

// Function to check if the user is on the Morph Testnet
export async function checkAndSwitchToMorphTestnet() {
  if (!window.ethereum) throw new Error('Ethereum object not found, please install MetaMask.');

  const sepoliaChainId = '0xaa36f7'; // Chain ID for Sepolia
  try {
    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (currentChainId !== sepoliaChainId) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: sepoliaChainId }],
        });
      } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: sepoliaChainId,
                  rpcUrl: "https://sepolia.infura.io/v3/", 
                  blockExplorerUrl: "https://sepolia.etherscan.io",
                  chainName: "Sepolia test network",
                  nativeCurrency: {
                    name: "Ether",
                    symbol: "ETH", 
                    decimals: 18
                  }
                },
              ],
            });
          } catch (addError) {
            throw new Error('Failed to add the  Sepolia');
          }
        } else {
          throw new Error('Failed to switch to the Sepolia Testnet.');
        }
      }
    }
  } catch (error) {
    console.error('Error checking or switching network:', error);
    throw error;
  }
}