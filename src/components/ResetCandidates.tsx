import React, { useState } from 'react';
import { BrowserProvider } from 'ethers';
import { getContract } from '../utils/contract';

interface ResetCandidatesProps {
  account: string | null;
  provider: BrowserProvider | null;
  candidatesCount: number;
  isOwner: boolean;
  onReset: () => void;
}

const ResetCandidates: React.FC<ResetCandidatesProps> = ({ 
  account, 
  provider, 
  candidatesCount, 
  isOwner,
  onReset 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  const handleReset = async () => {
    if (!account || !provider) {
      setMessage('Please connect your wallet');
      return;
    }

    if (!isOwner) {
      setMessage('Only contract owner can reset candidates');
      return;
    }

    if (candidatesCount === 0) {
      setMessage('No candidates to reset');
      return;
    }

    const confirmed = window.confirm(
      `Reset all ${candidatesCount} candidate(s)?\n\nThis will delete all candidates and start a new voting session.`
    );

    if (!confirmed) return;

    setIsLoading(true);
    setMessage('');

    try {
      const contract = await getContract(provider);
      const tx = await contract.resetCandidates();
      await tx.wait();
      
      setMessage('✅ Candidates reset successfully! New voting session started.');
      onReset();
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
      
    } catch (error: any) {
      console.error('Error resetting candidates:', error);
      setMessage(`Error: ${error.message || 'Failed to reset candidates'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't show if not owner
  if (!isOwner) {
    return null;
  }

  return (
    <div className="border border-red-200 rounded-lg p-5 bg-white">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center mr-3">
          🔄
        </div>
        <div>
          <h3 className="font-bold text-gray-800">Reset Candidates</h3>
          <p className="text-sm text-gray-600">Start fresh voting session</p>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-700 mb-2">
          Current candidates: <span className="font-bold">{candidatesCount}</span>
        </p>
        <p className="text-xs text-gray-500">
          Resetting will delete all candidates and allow everyone to vote again in a new session.
        </p>
      </div>
      
      {message && (
        <div className={`mb-4 p-3 rounded text-sm ${
          message.includes('✅') 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}
      
      <button
        onClick={handleReset}
        disabled={isLoading || candidatesCount === 0}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          isLoading
            ? 'bg-yellow-500 text-white'
            : candidatesCount === 0
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-red-500 text-white hover:bg-red-600'
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <span className="animate-spin mr-2">⟳</span>
            Resetting...
          </span>
        ) : (
          `Reset ${candidatesCount} Candidate${candidatesCount !== 1 ? 's' : ''}`
        )}
      </button>
      
      {candidatesCount === 0 && (
        <p className="text-xs text-gray-500 text-center mt-3">
          Add candidates first to enable reset
        </p>
      )}
    </div>
  );
};

export default ResetCandidates;