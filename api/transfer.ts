const TRANSFER_FUNCTION_URL = "https://transfermoney-e37xi73mhq-uc.a.run.app";

export async function transferMoney(
  transferData: {
    accountNumber: string;
    bankCode: string;
    accountName?: string;
    amount: number;
    reference?: string;
  }
) {
  const response = await fetch(TRANSFER_FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transferData),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Transfer failed');
  }

  return result.data;
}