export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  points: number;
  rupees: number;
  streak: number;
  lastSubmissionDate?: string;
  co2SavedKg: number;
  createdAt: string;
};

export type Session = {
  token: string;
  userId: string;
};

export type SubmissionStatus = "pending" | "approved" | "rejected";

export type Submission = {
  id: string;
  userId: string;
  image: string;
  category: string;
  notes?: string;
  status: SubmissionStatus;
  timestamp: string;
  reward: number;
  confidence?: number;
};

export type WalletTransactionType = "credit" | "debit" | "withdrawal";

export type WalletTransaction = {
  id: string;
  userId: string;
  amount: number;
  type: WalletTransactionType;
  description: string;
  status: "success" | "processing";
  createdAt: string;
};
