import { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';

export const useEthereum = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);

  const connectWallet = async () => {
    if (( window as any).ethereum) {
      try {
        const provider = new BrowserProvider(( window as any).ethereum);
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

  useEffect(() => {
    const checkConnection = async () => {
      if (( window as any).ethereum) {
        try {
          const provider = new BrowserProvider(( window as any).ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0].address);
            setProvider(provider);
          }
        } catch (error) {
          console.error("Error checking connection:", error);
        }
      }
    };

    checkConnection();
  }, []);

  return {
    account,
    provider,
    connectWallet,
    disconnectWallet
  };
};