import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeRLSPolicies } from "./integrations/supabase/rls-init";

// Initialize RLS policies on app startup
initializeRLSPolicies().catch((err) => {
  console.warn('RLS initialization failed:', err);
  // Continue anyway - policies might already be fixed
});

createRoot(document.getElementById("root")!).render(<App />);
