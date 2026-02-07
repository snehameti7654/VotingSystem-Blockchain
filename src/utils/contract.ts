import { BrowserProvider, Contract, type Signer } from 'ethers';
import { VotingABI } from '../contracts/VotingABI';

export const CONTRACT_ADDRESS = "0xCb4CDB6Ba28fd39a8568eaAB9ce099Ee58761fB9";

export const getContract = async (provider: BrowserProvider): Promise<Contract> => {
  const signer: Signer = await provider.getSigner();
  return new Contract(CONTRACT_ADDRESS, VotingABI, signer);
};