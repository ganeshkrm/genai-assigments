import { create } from "zustand";
import type { SearchMode, RetrievalResult } from "@/types/search.types";

/**
 * Search store (Phase 10 skeleton) — retrieval/search state only.
 * Isolated from the ingestion store (guard rule 9). Filled in Phases 11–13.
 */
interface SearchState {
  searchType: SearchMode;
  bm25Weight: number; // 0..100 (hybrid)
  vectorWeight: number; // 0..100 (hybrid)
  topK: number;
  results: RetrievalResult[];
  isSearching: boolean;
  lastQuery: string;
  setSearchType: (mode: SearchMode) => void;
  setWeights: (bm25: number, vector: number) => void;
  setTopK: (k: number) => void;
  setResults: (results: RetrievalResult[], query: string) => void;
  setSearching: (v: boolean) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  // Default to the full RAG pipeline (BM25 + vector → dedup → re-rank →
  // summarize). Vector/BM25 are raw-retrieval comparison modes.
  searchType: "hybrid",
  bm25Weight: 50,
  vectorWeight: 50,
  topK: 5,
  results: [],
  isSearching: false,
  lastQuery: "",
  setSearchType: (mode) => set({ searchType: mode }),
  setWeights: (bm25, vector) => set({ bm25Weight: bm25, vectorWeight: vector }),
  setTopK: (k) => set({ topK: k }),
  setResults: (results, query) => set({ results, lastQuery: query }),
  setSearching: (v) => set({ isSearching: v }),
}));
