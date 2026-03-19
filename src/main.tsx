import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { LanguageProvider } from "./context/LanguageContext";
import { initializeRLSPolicies } from "./integrations/supabase/rls-init";
import { SUPABASE_ENV_OK } from "./integrations/supabase/client";

const rootEl = document.getElementById("root")!;

// Initialize RLS policies on app startup
if (SUPABASE_ENV_OK) {
  initializeRLSPolicies().catch((err) => {
    console.warn("RLS initialization failed:", err);
    // Continue anyway - policies might already be fixed
  });
} else {
  console.warn(
    "Supabase env is missing. Skipping RLS initialization until env is set."
  );
}

if (!SUPABASE_ENV_OK) {
  createRoot(rootEl).render(
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
      }}
    >
      <div style={{ maxWidth: 720, width: "100%" }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Missing Supabase environment variables
        </h1>
        <p style={{ opacity: 0.8, marginBottom: 12 }}>
          The app can&apos;t start until you configure Supabase. Create a{" "}
          <code>.env</code> file in the project root and add:
        </p>
        <pre
          style={{
            background: "rgba(0,0,0,0.06)",
            padding: 12,
            borderRadius: 8,
            overflowX: "auto",
          }}
        >{`VITE_SUPABASE_URL=\"https://YOUR_PROJECT.supabase.co\"
VITE_SUPABASE_PUBLISHABLE_KEY=\"YOUR_SUPABASE_KEY\"`}</pre>
        <p style={{ opacity: 0.8, marginTop: 12 }}>
          Then restart: <code>npm run dev</code>.
        </p>
      </div>
    </div>
  );
} else {
  createRoot(rootEl).render(
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
}
