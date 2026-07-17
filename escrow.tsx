import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// PASTE YOUR NEW CONTRACT ADDRESS COPIED FROM REMIX INSIDE THESE QUOTES:
const ESCROW_CONTRACT_ADDRESS = "PASTE_YOUR_COPIED_REMIX_ADDRESS_HERE";

const ESCROW_ABI = [
  "function depositFunds() external payable",
  "function submitProofOfWork(bytes32 _proofHash) external",
  "function approveAndRelease(string memory _passcode) external",
  "function refundClient() external",
  "function currentState() external view returns (uint8)",
  "function paymentAmount() external view returns (uint256)"
];

export default function App() {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState("");
  const [passcode, setPasscode] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function initBlockchain() {
      if (window.ethereum) {
        try {
          const web3Provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          const web3Signer = await web3Provider.getSigner();
          const escrowContract = new ethers.Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, web3Signer);

          setContract(escrowContract);
          setAccount(accounts[0]);
          setStatusMessage("Connected to MetaMask successfully.");
        } catch (err) {
          console.error(err);
          setStatusMessage("Failed to connect MetaMask. Ensure you are on Fuji Testnet.");
        }
      } else {
        setStatusMessage("Please install MetaMask to use this app.");
      }
    }
    initBlockchain();
  }, []);

  async function handleDeposit() {
    if (!contract) return;
    setLoading(true);
    setStatusMessage("Sending deposit transaction...");
    try {
      const tx = await contract.depositFunds({
        value: ethers.parseEther("0.1") 
      });
      setStatusMessage("Deposit processing on blockchain... please wait.");
      await tx.wait(); 
      setStatusMessage("Deposit successful! 0.1 AVAX added to contract.");
    } catch (error) {
      console.error(error);
      setStatusMessage(`Deposit Failed: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleReleaseFunds() {
    if (!contract) return;
    if (!passcode) {
      setStatusMessage("Please enter a valid passcode first.");
      return;
    }
    setLoading(true);
    setStatusMessage("Verifying proof and sending transaction...");
    try {
      const tx = await contract.approveAndRelease(passcode);
      setStatusMessage("Transaction executing on-chain... please wait.");
      const receipt = await tx.wait(); 
      
      if (receipt.status === 1) {
        setStatusMessage("Success! Passcode verified and funds released smoothly.");
      } else {
        setStatusMessage("Transaction failed on-chain execution.");
      }
    } catch (error) {
      console.error(error);
      setStatusMessage(`Transaction Reverted: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefund() {
    if (!contract) return;
    setLoading(true);
    setStatusMessage("Requesting refund...");
    try {
      const tx = await contract.refundClient();
      setStatusMessage("Processing refund... please wait.");
      await tx.wait();
      setStatusMessage("Refund processed successfully!");
    } catch (error) {
      console.error(error);
      setStatusMessage(`Refund Failed: ${error.reason || error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "600px", margin: "0 auto" }}>
      <h1>ZK-Escrow Live Project Test Dashboard</h1>
      <p><strong>Connected Account:</strong> {account || "Not Connected"}</p>
      
      <div style={{ background: "#f5f5f5", padding: "20px", borderRadius: "8px", margin: "20px 0" }}>
        <h3>Step 1: Fund the Contract</h3>
        <button onClick={handleDeposit} disabled={loading} style={{ padding: "10px 20px", cursor: "pointer" }}>
          Deposit 0.1 AVAX
        </button>
      </div>

      <div style={{ background: "#f5f5f5", padding: "20px", borderRadius: "8px", margin: "20px 0" }}>
        <h3>Step 2: Submit & Verify Passcode</h3>
        <input 
          type="text" 
          placeholder="Enter Passcode" 
          value={passcode} 
          onChange={(e) => setPasscode(e.target.value)}
          style={{ padding: "10px", width: "80%", marginBottom: "10px" }}
        />
        <br />
        <button onClick={handleReleaseFunds} disabled={loading} style={{ padding: "10px 20px", cursor: "pointer", marginRight: "10px", background: "#4CAF50", color: "white", border: "none" }}>
          Release Escrow Funds
        </button>
        <button onClick={handleRefund} disabled={loading} style={{ padding: "10px 20px", cursor: "pointer", background: "#f44336", color: "white", border: "none" }}>
          Refund Client
        </button>
      </div>

      <div style={{ marginTop: "20px", padding: "15px", background: "#eef7ff", borderRadius: "5px", borderLeft: "5px solid #2196F3" }}>
        <strong>System Logs / Error Output:</strong>
        <p style={{ margin: "5px 0 0 0", color: statusMessage.includes("Failed") || statusMessage.includes("Reverted") ? "red" : "black" }}>
          {statusMessage}
        </p>
      </div>
    </div>
  );
}
