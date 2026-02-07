import  { useState, useEffect } from 'react';
import AddCandidateForm from './components/AddCandidateForm';
import CandidateList from './components/CandidateList';
import ResetCandidates from './components/ResetCandidates';
import { getContract } from './utils/contract';
import { useEthereum } from './hooks/useEthereum';

function App() {
  const { account, provider, connectWallet, disconnectWallet } = useEthereum();
  const [hasVoted, setHasVoted] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [candidatesCount, setCandidatesCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [votingSession, setVotingSession] = useState(1); // Track voting session

  // Get/set voting session from localStorage
  useEffect(() => {
    const savedSession = localStorage.getItem('votingSession');
    if (savedSession) {
      setVotingSession(parseInt(savedSession));
    }
  }, []);

  // Save voting session to localStorage
  useEffect(() => {
    localStorage.setItem('votingSession', votingSession.toString());
  }, [votingSession]);

  // Check if user has voted in current session
  const checkSessionVote = () => {
    if (!account) return false;
    const sessionKey = `hasVoted_${account}_${votingSession}`;
    return localStorage.getItem(sessionKey) === 'true';
  };

  // Mark user as voted in current session
  const markAsVoted = () => {
    if (!account) return;
    const sessionKey = `hasVoted_${account}_${votingSession}`;
    localStorage.setItem(sessionKey, 'true');
    setHasVoted(true);
  };

  // Refresh all data
  const refreshAll = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Check voting status and ownership
  useEffect(() => {
    const checkVotingStatus = async () => {
      if (account && provider) {
        try {
          const contract = await getContract(provider);
          
          // Get candidates count
          const count = await contract.candidatesCount();
          setCandidatesCount(Number(count));
          
          // Check contract owner
          const owner = await contract.owner();
          setIsOwner(owner.toLowerCase() === account.toLowerCase());
          
          // Check voting status - combine contract check with session check
          if (Number(count) > 0) {
            // Check if voted in current session (localStorage)
            const votedInSession = checkSessionVote();
            
            // Also check contract (for backward compatibility)
            const contractVoted = await contract.voters(account);
            
            // User has voted if: voted in current session OR voted in contract
            setHasVoted(votedInSession || contractVoted);
          } else {
            // No candidates = can't vote
            setHasVoted(false);
          }
          
        } catch (error: any) {
          console.error("Error checking voting status:", error);
        }
      } else {
        // If not connected, reset states
        setHasVoted(false);
        setIsOwner(false);
        setCandidatesCount(0);
      }
    };

    checkVotingStatus();
  }, [account, provider, refreshTrigger, votingSession]);

  const handleVote = () => {
    markAsVoted(); // Mark as voted in current session
    refreshAll();
  };

  const handleCandidateAdded = () => {
    refreshAll();
  };

  const handleCandidatesReset = () => {
    // Start new voting session
    setVotingSession(prev => prev + 1);
    
    // Clear all session votes from localStorage
    if (account) {
      // Only clear for current account (optional - could clear all)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`hasVoted_${account}_`)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
    
    refreshAll();
  };

  // Get list of all voters in current session (for debugging/display)
  const getSessionVoters = () => {
    const voters: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('hasVoted_') && key.endsWith(`_${votingSession}`)) {
        // Extract address from key: hasVoted_0xAddress_session
        const address = key.split('_')[1];
        voters.push(address);
      }
    }
    return voters;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">Voting System</h1>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                Session #{votingSession}
              </span>
            </div>
            <p className="text-gray-600 mt-1">Decentralized voting on blockchain</p>
          </div>
          <div className="flex items-center space-x-3">
            {account ? (
              <>
                <div className="text-right">
                  <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm block">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    {isOwner && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                        Owner
                      </span>
                    )}
                    {hasVoted && candidatesCount > 0 && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                        Voted
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={connectWallet}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Candidates */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Candidates</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Session #{votingSession} • One vote per address per session
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                    {candidatesCount} candidate{candidatesCount !== 1 ? 's' : ''}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded">
                    Voters: {getSessionVoters().length}
                  </span>
                </div>
              </div>
              <CandidateList 
                account={account} 
                provider={provider} 
                hasVoted={hasVoted} 
                onVote={handleVote}
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Voting Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-lg flex items-center justify-center mr-3">
                  {votingSession}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">Voting Status</h3>
                  <p className="text-sm text-gray-600">Current Session</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Your Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    candidatesCount === 0 
                      ? 'bg-gray-100 text-gray-800' 
                      : hasVoted 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {candidatesCount === 0 ? 'Waiting for Candidates' : 
                     hasVoted ? 'Already Voted' : 'Ready to Vote'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Account Role:</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    isOwner ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {isOwner ? 'Owner' : 'Voter'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Candidates:</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    {candidatesCount}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Session Voters:</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    {getSessionVoters().length}
                  </span>
                </div>
              </div>
            </div>

            {/* Owner Controls */}
            {isOwner && account && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center mr-3">
                    👑
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Owner Controls</h3>
                    <p className="text-sm text-gray-600">Manage voting system</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <AddCandidateForm 
                    account={account} 
                    provider={provider} 
                    onCandidateAdded={handleCandidateAdded}
                  />
                  
                  <div className="pt-4 border-t">
                    <ResetCandidates 
                      account={account} 
                      provider={provider} 
                      candidatesCount={candidatesCount}
                      isOwner={isOwner}
                      onReset={handleCandidatesReset}
                    />
                  </div>
                  
                  {/* Session Info */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-blue-800">Current Session</p>
                        <p className="text-2xl font-bold text-blue-600">#{votingSession}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-blue-700">Voters this session:</p>
                        <p className="text-lg font-bold text-blue-800">{getSessionVoters().length}</p>
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      Resetting candidates will start Session #{votingSession + 1}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Contract Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-800 mb-4">Contract Info</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Contract Address:</p>
                  <code className="text-xs bg-gray-100 p-2 rounded block break-all">
                    0xeBd09BCf1274Dbf17E7bD3C77BF7314372D888c9
                  </code>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Candidates</p>
                    <p className="text-lg font-bold">{candidatesCount}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Session</p>
                    <p className="text-lg font-bold">#{votingSession}</p>
                  </div>
                </div>
                {candidatesCount === 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800 text-center">
                      ⏳ Waiting for candidates to be added
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t text-center text-gray-500 text-sm">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-left">
              <p className="font-medium">Voting System • Session #{votingSession}</p>
              <p className="text-xs text-gray-400 mt-1">
                Each wallet can vote once per session. Session resets when owner resets candidates.
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-600">
                {candidatesCount} candidate{candidatesCount !== 1 ? 's' : ''} • 
                {isOwner ? ' 👑 Owner Mode' : ' 👥 Voter Mode'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Total voters this session: {getSessionVoters().length}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;