import React, { useState } from 'react';
import { BrowserProvider } from 'ethers';
import { getContract } from '../utils/contract';

interface AddCandidateFormProps {
  account: string | null;
  provider: BrowserProvider | null;
  onCandidateAdded: () => void;
}

const AddCandidateForm: React.FC<AddCandidateFormProps> = ({ account, provider, onCandidateAdded }) => {
  const [candidateName, setCandidateName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !provider) {
      setError('Please connect your wallet');
      return;
    }

    if (!candidateName.trim()) {
      setError('Please enter a candidate name');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const contract = await getContract(provider);
      const tx = await contract.addCandidate(candidateName.trim());
      await tx.wait();
      setSuccess(`Candidate "${candidateName}" added successfully!`);
      setCandidateName('');
      onCandidateAdded();
    } catch (error: any) {
      console.error('Error adding candidate:', error);
      setError(error.message || 'Failed to add candidate. Make sure you are the owner.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Candidate</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="candidateName" className="block text-sm font-medium text-gray-700 mb-2">
            Candidate Name
          </label>
          <input
            type="text"
            id="candidateName"
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            placeholder="Enter candidate name"
            disabled={isLoading}
          />
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Adding Candidate...' : 'Add Candidate'}
        </button>
      </form>
    </div>
  );
};

export default AddCandidateForm;