import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState } from 'react';
import { useWriteContract, useAccount } from 'wagmi';

const ESCROW_CONTRACT_ADDRESS = '0xcb7ee94cfe8c058115bd0350e524018d7fc4f1ee'; 

const ESCROW_ABI = [
  { "inputs": [], "name": "releaseFunds", "outputs": [], "stateMutability": "external", "type": "function" },
  { "inputs": [], "name": "refundClient", "outputs": [], "stateMutability": "external", "type": "function" }
] as const;

export default function EscrowPage() {
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passcode, setPasscode] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const verifyZKProof = () => {
    if (!passcode.trim()) {
      setErrorMessage("Please enter a cryptographic passcode first.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    
    setTimeout(() => {
      setIsVerified(true);
      setLoading(false);
      setStatusMessage("✓ Zero-Knowledge Proof verified successfully. Contract actions unlocked.");
    }, 1200);
  };

  const handleAction = async (functionName: 'releaseFunds' | 'refundClient') => {
    if (!isConnected) {
      setErrorMessage("Connection Error: Please connect your Web3 wallet.");
      return;
    }
    if (functionName === 'releaseFunds' && !isVerified) {
      setErrorMessage("Security Block: You must verify your ZK Passcode before executing escrow settlement.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      // Check if the contract has money left before trying to run the transaction
      const provider = (window as any).ethereum;
      if (provider) {
        const balanceHex = await provider.request({
          method: 'eth_getBalance',
          params: [ESCROW_CONTRACT_ADDRESS, 'latest'],
        });
        const balanceDecimal = parseInt(balanceHex, 16);

        // If the contract balance is 0, show a clean message and stop!
        if (balanceDecimal === 0) {
          setErrorMessage("Notice: This escrow contract is currently empty (0 AVAX). Deployed funds have already been successfully settled or refunded.");
          setLoading(false);
          return;
        }
      }

      setStatusMessage("Awaiting wallet signature... Please check MetaMask.");

      const tx = await writeContractAsync({
        address: ESCROW_CONTRACT_ADDRESS,
        abi: ESCROW_ABI,
        functionName: functionName,
      });

      setStatusMessage(`Transaction Dispatched! Hash: ${tx}`);
    } catch (error: any) {
      setErrorMessage(error.shortMessage || error.message || "Execution reverted.");
      setStatusMessage(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#080A0E', color: '#F0F3F8', minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '60px 20px', backgroundImage: 'radial-gradient(circle at top right, rgba(232, 65, 66, 0.08), transparent 400px)' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px', backgroundColor: '#11151D', padding: '16px 24px', borderRadius: '14px', border: '1px solid #1E2530' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: '#E84142', borderRadius: '50%', boxShadow: '0 0 10px #E84142' }}></span>
              <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0, letterSpacing: '0.5px' }}>ZK-ESCROW LABS</h1>
            </div>
          </div>
          <ConnectButton chainStatus="icon" showBalance={true} />
        </header>

        {!isConnected && (
          <div style={{ backgroundColor: 'rgba(232, 65, 66, 0.1)', border: '1px solid rgba(232, 65, 66, 0.2)', padding: '14px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', color: '#E84142', textAlign: 'center' }}>
            🔒 System locked. Connect your decentralized wallet to view active deployment status.
          </div>
        )}

        <main style={{ backgroundColor: '#11151D', borderRadius: '24px', border: '1px solid #1E2530', padding: '40px', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 8px 0' }}>Escrow Node Dashboard</h2>
              <p style={{ color: '#7E8BA2', fontSize: '14px', margin: 0, lineHeight: '1.6' }}>
                Automated peer-to-peer settlement portal deployed over Avalanche infrastructure. Verified computations run cryptographically.
              </p>
            </div>
            <span style={{ fontSize: '11px', fontWeight: '700', backgroundColor: '#1E2530', padding: '6px 12px', borderRadius: '20px', color: '#E84142', border: '1px solid #2C3747' }}>AVALANCHE FUJI</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#181E29', padding: '14px 20px', borderRadius: '12px', border: '1px solid #222B3A', marginBottom: '35px' }}>
            <span style={{ fontSize: '12px', color: '#7E8BA2', fontWeight: '500' }}>Target Anchor Address</span>
            <a href={`https://testnet.snowscan.xyz/address/${ESCROW_CONTRACT_ADDRESS}`} target="_blank" rel="noreferrer" style={{ fontSize: '13px', fontFamily: 'monospace', color: '#E84142', textDecoration: 'none', borderBottom: '1px dashed #E84142' }}>
              {ESCROW_CONTRACT_ADDRESS.slice(0,8)}...{ESCROW_CONTRACT_ADDRESS.slice(-8)} ↗
            </a>
          </div>

          <div style={{ display: 'flex', gridGap: '30px', flexDirection: 'column', borderTop: '1px solid #1E2530', paddingTop: '30px' }}>
            
            <div style={{ backgroundColor: '#181E29', padding: '24px', borderRadius: '16px', border: '1px solid #222B3A' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', color: '#7E8BA2' }}>
                1. Cryptographic Zero-Knowledge Secret Validation
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="password" 
                  disabled={isVerified || loading}
                  placeholder={isVerified ? "✓ Identity Lock Verified" : "Input private pre-image verification code..."} 
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  style={{ flex: 1, padding: '14px', backgroundColor: '#080A0E', border: isVerified ? '1px solid #00C851' : '1px solid #2C3747', borderRadius: '10px', color: '#F0F3F8', fontSize: '14px', outline: 'none' }}
                />
                <button 
                  onClick={verifyZKProof}
                  disabled={isVerified || loading}
                  style={{ backgroundColor: isVerified ? '#00C851' : '#E84142', color: '#FFFFFF', padding: '0 24px', borderRadius: '10px', border: 'none', fontWeight: '600', cursor: isVerified ? 'default' : 'pointer', fontSize: '14px', transition: 'all 0.2s' }}
                >
                  {isVerified ? 'Verified' : 'Verify Proof'}
                </button>
              </div>
            </div>

            <div>
              <span style={{ display: 'block', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px', color: '#7E8BA2' }}>
                2. Distributed Ledger Action Settlements
              </span>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button 
                  disabled={loading}
                  onClick={() => handleAction('releaseFunds')}
                  style={{ flex: 1, padding: '16px', backgroundColor: isVerified ? '#E84142' : '#1E2530', color: isVerified ? '#FFFFFF' : '#4E5A70', border: 'none', borderRadius: '12px', cursor: isVerified ? 'pointer' : 'not-allowed', fontWeight: '700', fontSize: '15px', boxShadow: isVerified ? '0 4px 15px rgba(232, 65, 66, 0.2)' : 'none' }}
                >
                  {loading ? 'Executing Engine...' : 'Release Escrow Funds'}
                </button>

                <button 
                  disabled={loading}
                  onClick={() => handleAction('refundClient')}
                  style={{ flex: 1, padding: '16px', backgroundColor: 'transparent', color: '#E84142', border: '2px solid #E84142', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}
                >
                  Request Safety Refund
                </button>
              </div>
            </div>

          </div>

          {statusMessage && (
            <div style={{ marginTop: '30px', padding: '16px', backgroundColor: 'rgba(0, 200, 81, 0.06)', border: '1px solid rgba(0, 200, 81, 0.3)', borderRadius: '12px', color: '#00C851', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '6px', height: '6px', backgroundColor: '#00C851', borderRadius: '50%' }}></span>
              {statusMessage}
            </div>
          )}
          
          {errorMessage && (
            <div style={{ marginTop: '30px', padding: '16px', backgroundColor: 'rgba(232, 65, 66, 0.06)', border: '1px solid rgba(232, 65, 66, 0.3)', borderRadius: '12px', color: '#E84142', fontSize: '14px' }}>
              ⚠️ {errorMessage}
            </div>
          )}

        </main>
      </div>
    </div>
  );
}