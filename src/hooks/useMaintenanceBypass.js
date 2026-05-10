import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

// Define your secret bypass key here
const SECRET_BYPASS_KEY = "admin_uniconnect_2026";

const useMaintenanceBypass = () => {
  const [searchParams] = useSearchParams();
  const [canBypass, setCanBypass] = useState(false);

  useEffect(() => {
    // Check if bypass is already saved in localStorage
    const savedBypass = localStorage.getItem("bypass_maintenance");
    if (savedBypass === "true") {
      setCanBypass(true);
      return;
    }

    // Check if the key query param matches the secret
    const key = searchParams.get("key");
    if (key && key === SECRET_BYPASS_KEY) {
      localStorage.setItem("bypass_maintenance", "true");
      setCanBypass(true);
    }
  }, [searchParams]);

  return canBypass;
};

export default useMaintenanceBypass;
