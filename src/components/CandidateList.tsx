import React, { useEffect, useState } from 'react';
import { BrowserProvider } from 'ethers';
import { getContract } from '../utils/contract';
import type { Candidate } from '../types';

interface CandidateListProps {
  account: string | null;
  provider: BrowserProvider | null;
  hasVoted: boolean;
  onVote: () => void;
}

const CandidateList: React.FC<CandidateListProps> = ({ account, provider, hasVoted, onVote }) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<number | null>(null);

  const fetchCandidates = async () => {
    if (!provider) return;
    
    try {
      const contract = await getContract(provider);
      const count = await contract.candidatesCount();
      const candidatesArray: Candidate[] = [];
      
      for (let i = 1; i <= Number(count); i++) {
        const candidate = await contract.candidates(i);
        candidatesArray.push({
          id: Number(candidate[0]),
          name: candidate[1],
          voteCount: Number(candidate[2])
        });
      }
      
      setCandidates(candidatesArray);
    } catch (error) {
      console.error('Error fetching candidates:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [provider]);

 
const handleVote = async (candidateId: number) => {
  if (!account || !provider || hasVoted) {
    alert(hasVoted ? 'You have already voted in this session!' : 'Please connect your wallet');
    return;
  }

  setVoting(candidateId);
  try {
    const contract = await getContract(provider);
    const tx = await contract.vote(candidateId);
    await tx.wait();
    
    // Show success message with session info
    alert('✅ Vote submitted successfully for this session!');
    
    // Refresh data
    fetchCandidates();
    onVote(); // This will mark as voted in current session
    
  } catch (error: any) {
    console.error('Error voting:', error);
    
    // Check if error is "Already voted" from contract
    if (error.message.includes('Already voted') || error.message.includes('already voted')) {
      alert('⚠️ Contract says you have already voted. Starting fresh session.');
    } else {
      alert(error.message || 'Failed to submit vote');
    }
  } finally {
    setVoting(null);
  }
};

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading candidates...</p>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">No candidates available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-800">Candidates</h3>
        <span className="text-sm text-gray-600">{candidates.length} candidates total</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-medium text-gray-800">{candidate.name}</h4>
                <p className="text-sm text-gray-600 mt-1">ID: #{candidate.id}</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {candidate.voteCount} votes
              </span>
            </div>
            
            <button
              onClick={() => handleVote(candidate.id)}
              disabled={hasVoted || voting === candidate.id}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                hasVoted
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : voting === candidate.id
                  ? 'bg-yellow-500 text-white'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {voting === candidate.id ? 'Voting...' : hasVoted ? 'Already Voted' : 'Vote'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CandidateList;