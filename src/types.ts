export interface TOCCloudData {
  parties: string;
  wantD: string;
  wantDPrime: string;
  needB: string;
  needC: string;
  objectiveA: string;
  assumptionsBD: string[];
  assumptionsCDPrime: string[];
  solutionsDPrimeB: string[];
  solutionsDC: string[];
}

export type Step = 
  | 'intro'
  | 'step0' // Parties
  | 'step1' // Wants (D, D')
  | 'step2' // Needs (B, C)
  | 'step3' // Objective (A)
  | 'review' // Logic check
  | 'step4' // Assumptions
  | 'step5' // Solutions
  | 'final'; // Infographic
