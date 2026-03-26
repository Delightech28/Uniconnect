export interface VirtualAccountRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface VirtualAccountResponse {
  success: boolean;
  data: {
    accountNumber: string;
    bankName: string;
    bankCode: string;
    accountName: string;
    paystackCustomerId: number;
    paystackDedicatedAccountId: number;
  };
}


const CREATE_VIRTUAL_ACCOUNT_URL = "https://createvirtualaccount-e37xi73mhq-uc.a.run.app";

export async function createVirtualAccount(
  userData: VirtualAccountRequest
): Promise<VirtualAccountResponse['data']> {
  try {
    const response = await fetch(CREATE_VIRTUAL_ACCOUNT_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const result: VirtualAccountResponse = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.data?.toString() || 'Failed to create virtual account');
    }

    return result.data;

  } catch (error: any) {
    console.error("Create Virtual Account Error:", error);
    throw new Error(error.message || "Failed to create virtual account");
  }
}