import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { useHybridWeights } from "@/hooks/use-hybrid-weights";

/**
 * HybridWeightPanel — BM25/Vector weight sliders (complementary, sum to 100)
 * plus 50/50 · 70/30 · 30/70 preset pills. Slides in/out when Hybrid is active.
 */
const PRESETS: Array<[number, number]> = [
  [50, 50],
  [70, 30],
  [30, 70],
];

export function HybridWeightPanel() {
  const {
    bm25Weight,
    vectorWeight,
    handleBm25Change,
    handleVectorChange,
    applyPreset,
  } = useHybridWeights();

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="rounded-lg border border-white/[0.07] p-3 flex flex-col gap-3">
        <div className="text-xs font-medium uppercase tracking-widest text-text-muted">
          Search Weights
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-score-bm25">BM25</span>
            <span className="text-text-primary tabular-nums">{bm25Weight}%</span>
          </div>
          <Slider
            value={[bm25Weight]}
            min={0}
            max={100}
            step={5}
            onValueChange={(v) => handleBm25Change(v[0])}
            aria-label="BM25 weight"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-score-vector">Vector</span>
            <span className="text-text-primary tabular-nums">
              {vectorWeight}%
            </span>
          </div>
          <Slider
            value={[vectorWeight]}
            min={0}
            max={100}
            step={5}
            onValueChange={(v) => handleVectorChange(v[0])}
            aria-label="Vector weight"
          />
        </div>

        <div className="flex gap-2">
          {PRESETS.map(([b, v]) => {
            const selected = bm25Weight === b && vectorWeight === v;
            return (
              <button
                key={`${b}-${v}`}
                type="button"
                onClick={() => applyPreset(b, v)}
                className={
                  "flex-1 rounded-md border py-1 text-xs transition-colors " +
                  (selected
                    ? "border-indigo-400/40 bg-indigo-500/[0.12] text-text-primary"
                    : "border-white/10 text-text-muted hover:bg-white/5")
                }
              >
                {b}/{v}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export default HybridWeightPanel;
