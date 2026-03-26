const VERIFY_ACCOUNT_URL = "https://verifyaccount-e37xi73mhq-uc.a.run.app";

export async function verifyAccount(accountNumber: string, bankCode: string) {
  const response = await fetch(VERIFY_ACCOUNT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accountNumber, bankCode }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Verification failed');
  }

  return result.data;
}