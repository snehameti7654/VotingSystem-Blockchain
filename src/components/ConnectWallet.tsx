import React from 'react';
import { BrowserProvider } from 'ethers';

interface ConnectWalletProps {
  account: string | null;
  setAccount: (account: string | null) => void;
  setProvider: (provider: BrowserProvider | null) => void;
}

const ConnectWallet: React.FC<ConnectWalletProps> = ({ account, setAccount, setProvider }) => {
  const connectWallet = async () => {
    if ((window as any).ethereum) {
      try {
        const provider = new BrowserProvider((window as any).ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
        setProvider(provider);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
  };

  return (
    <div className="flex items-center space-x-4">
      {account ? (
        <>
          <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg">
            Connected: {account.slice(0, 6)}...{account.slice(-4)}
          </span>
          <button
            onClick={disconnectWallet}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Disconnect
          </button>
        </>
      ) : (
        <button
          onClick={connectWallet}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
};

export default ConnectWallet;