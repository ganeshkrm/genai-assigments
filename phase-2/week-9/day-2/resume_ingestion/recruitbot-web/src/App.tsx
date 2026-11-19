import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ChatPage } from "@/pages/ChatPage";
import { IngestionPage } from "@/features/ingestion";

/**
 * App root (Phase 10).
 *
 * Routes (guard's safe integrated target):
 *   /          → Retrieval ChatPage
 *   /ingestion → Resume ingestion page (preserved from Phases 1–9)
 */
function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1E1430",
            color: "#F3F0F7",
            border: "1px solid rgba(180,111,214,0.25)",
          },
        }}
      />
      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route path="/ingestion" element={<IngestionPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
