import React from 'react';
import { BrowserProvider } from 'ethers';
import { getContract } from '../utils/contract';

interface VotingStatusProps {
  account: string | null;
  provider: BrowserProvider | null;
}

const VotingStatus: React.FC<VotingStatusProps> = ({ account, provider }) => {
  const [hasVoted, setHasVoted] = React.useState(false);
  const [isOwner, setIsOwner] = React.useState(false);
  const [candidatesCount, setCandidatesCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStatus = async () => {
      if (account && provider) {
        try {
          setLoading(true);
          const contract = await getContract(provider);
          
          // Check if user has voted
          const voted = await contract.voters(account);
          setHasVoted(voted);
          
          // Check if user is owner
          const owner = await contract.owner();
          setIsOwner(owner.toLowerCase() === account.toLowerCase());
          
          // Get candidates count
          const count = await contract.candidatesCount();
          setCandidatesCount(Number(count));
        } catch (error) {
          console.error("Error fetching status:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchStatus();
  }, [account, provider]);

  if (!account) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">Please connect your wallet to see voting status.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-gray-600">Loading status...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Voting Status</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Your Voting Status:</span>
          <span className={`px-3 py-1 rounded-full ${hasVoted ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {hasVoted ? 'Already Voted' : 'Can Vote'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Account Role:</span>
          <span className={`px-3 py-1 rounded-full ${isOwner ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
            {isOwner ? 'Owner' : 'Voter'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Total Candidates:</span>
          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full">
            {candidatesCount}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VotingStatus;