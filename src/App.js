import React, { useState, useEffect } from 'react';
import './App.css';
import { connectWallet, rewardUser, getFeedbackRewardsContract, addValidHashedToken } from './eth';
import analyseFeedback from './AiAnalysis.js';
import RewardModal from './components/popup.js';
import emailjs from 'emailjs-com';
import sha256 from 'crypto-js/sha256';
import qualifyImage from './images/QualifyButton.png';
import feedbackImage from './images/feedbackArrow.png';

function App() {
  const [userAddress, setUserAddress] = useState('');
  const [signer, setSigner] = useState(null);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false); // State to control modal visibility
  const [isLoading, setIsLoading] = useState(false); // State to control loading spinner
  const [feedbackItems, setFeedbackItems] = useState([]); // State to hold feedback items
  const [isClaiming, setIsClaiming] = useState(false); // State to manage claiming process
  const [isQualified, setIsQualified] = useState(""); // State to track if the user is qualified to submit feedback
  const [isQualifying, setIsQualifying] = useState(false); // State to manage qualifying process
  const [isMorphTestnet, setIsMorphTestnet] = useState(false); // State to track if the user is on Morph Testnet

  useEffect(() => {
    const isQualified = localStorage.getItem('isQualified') === 'true';
    const hashedToken = localStorage.getItem('hashedToken');
    const usageCount = parseInt(localStorage.getItem('hashedTokenUsageCount'), 10);

    if (isQualified && hashedToken && usageCount < 2) {
      setIsQualified(true);
    }
  }, []);

  const handleConnectWallet = async () => {
    try {
      const { address, signer } = await connectWallet();
      if (address && signer) {
        setUserAddress(address);
        setSigner(signer);
        setIsWalletConnected(true);
        // Check for Morph Testnet
        const chainId = await window.ethereum.request({ method: "eth_chainId" });
        const isMorphTestnet = chainId === "0xa96";
        setIsMorphTestnet(isMorphTestnet);
        return { wasConnected: true, signer };
      } else {
        return { wasConnected: false };
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return { wasConnected: false };
    }
  };

  const handleQualifyForFeedback = async () => {
    setIsQualifying(true); // Start of qualifying process
    let localSigner = signer;
    if (!isWalletConnected) {
      const connectionResult = await handleConnectWallet();
      if (!connectionResult.wasConnected) {
        console.log('Wallet connection failed or was cancelled by the user.');
        setIsQualifying(false); //stop the spinner if wallet connection fails
        return;
      }
      localSigner = connectionResult.signer;
    }
    const token = new Date().toISOString();
    const hashedToken = "0x" + sha256(token).toString();
    localStorage.setItem('hashedToken', hashedToken);
    localStorage.setItem('isQualified', 'true');
    localStorage.setItem('hashedTokenUsageCount', '0'); // Initialize usage count
    setIsQualified(true);
    console.log("Stored Hashed Token:", hashedToken);

    try {
      await addValidHashedToken(localSigner, hashedToken);
      alert("You're now qualified to submit feedback.");
    } catch (error) {
      console.error('Error adding valid hashed token:', error);
    } finally {
      setIsQualifying(false); // End of qualifying process
    }
  };

  const handleSubmitFeedback = async (feedbackText) => {
    if (!isQualified) {
      console.log("User is not qualified to submit feedback.");
      alert("You are not qualified to submit feedback");
      return;
    }

    if (!feedbackText.trim()) {
      console.log("Feedback text is empty or only contains whitespace.");
      alert("Please enter some feedback before submitting.");
      return;
    }

    const hashedToken = localStorage.getItem('hashedToken');
    if (!hashedToken) {
      console.log("No hashed token found in local storage.");
      alert("You do not have proof of qualification needed to submit or have already submitted.");
      return;
    }

    console.log("Submitting feedback:", feedbackText);
    try {
      const feedbackResult = await analyseFeedback(feedbackText);
      if (feedbackResult.isConstructive === 'no' && feedbackResult.suggestions.length > 0) {
        // Display suggestions to the user
        alert('Your feedback could be more constructive. Here are some suggestions:\n' + feedbackResult.suggestions.join('\n'));
      } else if (feedbackResult.isConstructive === 'yes') {
        setFeedbackSubmitted(true); // Only set to true if feedback is constructive
        setModalIsOpen(true); // Open the reward modal
      } else {
        alert('Feedback is not constructive enough. Please try again.');
      }
    } catch (error) {
      console.error("Error during feedback analysis or submission:", error);
      alert("An error occurred while processing your feedback. Please try again.");
    }
  }

  const handleRewardUser = async () => {
    setIsClaiming(true); // Start of claiming process
    const hashedToken = localStorage.getItem('hashedToken');
    console.log("Retrieved Hashed Token:", hashedToken); // Added log
    if (!hashedToken) {
        alert('You are not qualified for feedback submission.');
        setIsClaiming(false); // Reset the claiming state
        return;
    }

    try {
      const feedbackRewards = getFeedbackRewardsContract(signer);
      const prefixedHashedToken = hashedToken.startsWith('0x') ? hashedToken : `0x${hashedToken}`;
      console.log("Prefixed Hashed Token:", prefixedHashedToken); // Added log
      const isTokenValid = await feedbackRewards.isHashedTokenValid(prefixedHashedToken);
      if (!isTokenValid) {
        alert('The provided token is not valid. Please try again.');
        setIsClaiming(false); // Reset the claiming state
        setModalIsOpen(false); // Close the RewardModal
        return;
      }
      await rewardUser(signer, userAddress, hashedToken);
      // After rewarding the user successfully, invalidate the hashedToken
      localStorage.setItem('hashedToken', ''); // Clear the hashedToken
      localStorage.setItem('isQualified', 'false'); //  mark as not qualified
      alert('Reward successful!');
      setModalIsOpen(false); // Close modal on success
    } catch (error) {
      console.error('Error rewarding user:', error);
      if (error.data && error.data.includes("Submission limit reached.")) {
        alert('Reward cannot be claimed because the submission limit has been reached.');
      } else {
        alert('Failed to claim reward. You may have already claimed. Please try again or stop.');
      }
      setModalIsOpen(false); // Close modal on failure
    } finally {
      setIsClaiming(false); // Reset the claiming state
    }
    setModalIsOpen(false); // Close modal on success
  };
     
  return (
    <div>
       {isWalletConnected && (
        <div style={{ position: 'absolute', top: 0, left: 0, padding: '10px', zIndex: 1000, fontStyle: 'italic', fontSize: '12px' }}>
          Connected: {`${userAddress.substring(0, 4)}...${userAddress.substring(userAddress.length - 5)}`}
          <br />
          {isMorphTestnet ? "Connected to Morph Testnet" : "Please connect to Morph Testnet!"}
        </div>
      )}
      <>
        <div className="feedback-container">
        <h1>Give Feedback. <br></br> Get <span style={{color: '#00bf63'}}>Paid</span>. </h1>

        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <p>Get instantly rewarded for your constructive criticism.</p>
          <img 
      src={feedbackImage} 
      alt="Feedback Arrow" 
      style={{ marginLeft: '100px', height: '170px', width: 'auto' }} 
    />
  </div>
            <textarea 
            placeholder=
            " What feature would you like to see? How can we improve? Please share your constructive criticism, feature requests, or suggestions for improvement. Detailed feedback is especially appreciated and rewarded! How about you give it a try and send some feedback about this dapp?" 
            value={feedbackText} 
            onChange={(e) => setFeedbackText(e.target.value)}
            style={{minHeight: '200px', minWidth: '300px'}}
          ></textarea>
          {!isWalletConnected && (
            <button onClick={handleConnectWallet}>
              Connect Wallet
            </button>
          )}
          {/* Image equivalent to the Qualify for Feedback button */}
      <div className="qualify-button-container" style={{ position: 'fixed', top: '20px', right: '20px' }}>
            <img 
              src={qualifyImage} 
              alt="Qualify for Feedback" 
              onClick={!isQualifying ? handleQualifyForFeedback : undefined} 
              style={{
                cursor: isQualifying ? 'default' : 'pointer',
                width: '500px',
                height: 'auto',
                position: 'fixed', 
                top: '20px', 
                right: '20px', 
                cursor: 'pointer'
              }}
            />
            {isQualifying && (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div className="button-spinner-overlay"></div>
    <span style={{ marginRight: '20px', padding: '20px', zIndex: 10000,  color: 'green' }}>Please wait</span>
  </div>
)}
          </div>

          {isWalletConnected && (
            <button 
              onClick={() => handleSubmitFeedback(feedbackText)}
            >
              Submit Feedback
            </button>
          )}
        </div>    
        <div className="mobile-message">
        <h1>Give Feedback. <br></br> Get <span style={{color: '#00bf63'}}>Paid</span>. </h1>
        <p>For the best experience view on web, the application is currently not optimised for mobile devices.</p>
        </div>
        <RewardModal isOpen={modalIsOpen} onClose={() => setModalIsOpen(false)} handleRewardUser={handleRewardUser} isLoading={isClaiming}>
    <p>Thank you for the constructive feedback!</p>
    <button onClick={handleRewardUser} disabled={isClaiming}>
      {isClaiming ? (
        <div className="button-spinner"></div>
      ) : (
        'Claim Reward'
      )}
    </button>
</RewardModal>
      </>
    </div>
  );
}

export default App;