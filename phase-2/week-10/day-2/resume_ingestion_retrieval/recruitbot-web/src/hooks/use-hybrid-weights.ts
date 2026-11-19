import { useSearchStore } from "@/lib/stores/search.store";

/**
 * Keeps the BM25 and Vector hybrid weights complementary (always sum to 100).
 */
export function useHybridWeights() {
  const bm25Weight = useSearchStore((s) => s.bm25Weight);
  const vectorWeight = useSearchStore((s) => s.vectorWeight);
  const setWeights = useSearchStore((s) => s.setWeights);

  function handleBm25Change(value: number) {
    setWeights(value, 100 - value);
  }

  function handleVectorChange(value: number) {
    setWeights(100 - value, value);
  }

  function applyPreset(bm25: number, vector: number) {
    setWeights(bm25, vector);
  }

  return {
    bm25Weight,
    vectorWeight,
    handleBm25Change,
    handleVectorChange,
    applyPreset,
  };
}
