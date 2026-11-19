import { Link } from "react-router-dom";
import { ResumeUploadCard } from "../components/ResumeUploadCard";
import "../components/ingestion.css";

/**
 * IngestionPage — Resume Upload (Phases 2–9).
 *
 * Composes the heading + ResumeUploadCard (dropzone + upload button + status).
 * From Phase 10 it lives at the /ingestion route; a link back to the retrieval
 * search page keeps both features reachable.
 */
export function IngestionPage() {
  return (
    <main className="ingestion-page">
      <header className="ingestion-header">
        <h1 className="ingestion-brand">RecruitBot</h1>
        <p className="ingestion-subtitle">Talent Acquisition · Resume Ingestion</p>
        <Link to="/" className="ingestion-navlink">
          Search candidates &rarr;
        </Link>
      </header>

      <ResumeUploadCard />
    </main>
  );
}

export default IngestionPage;
