import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy,
  DocumentData 
} from "firebase/firestore";
import { db } from "../src/firebase";

export function listenToWallet(
  userId: string, 
  callback: (balance: number) => void
) {
  const userRef = doc(db, "users", userId);
  
  return onSnapshot(userRef, (snapshot) => {
    const data = snapshot.data();
    if (data) {
      callback(data.walletBalance || 0);
    }
  });
}

export interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  reference: string;
  timestamp: any;
  status: string;
}

export function listenToTransactions(
  userId: string, 
  callback: (transactions: Transaction[]) => void
) {
  const transactionsRef = collection(db, "users", userId, "transactions");
  const q = query(transactionsRef, orderBy("timestamp", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];
    callback(transactions);
  });
}