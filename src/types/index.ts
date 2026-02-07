export interface Candidate {
  id: number;
  name: string;
  voteCount: number;
}

export interface VotingContract {
  candidates: (id: number) => Promise<Candidate>;
  candidatesCount: () => Promise<number>;
  owner: () => Promise<string>;
  voters: (address: string) => Promise<boolean>;
  vote: (candidateId: number) => Promise<void>;
  addCandidate: (name: string) => Promise<void>;
  resetCandidates: () => Promise<void>;
}