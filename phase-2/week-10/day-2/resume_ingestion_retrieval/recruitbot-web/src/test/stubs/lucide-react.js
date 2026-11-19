/* Test stub for lucide-react — every named icon import renders a <span>. */
const React = require("react");

const SKIP = new Set(["size", "strokeWidth"]);

function stripSize(props = {}) {
  const out = {};
  for (const k in props) {
    if (!SKIP.has(k)) out[k] = props[k];
  }
  return out;
}

const Icon = React.forwardRef((props, ref) =>
  React.createElement("span", { ref, "data-icon": true, ...stripSize(props) })
);

module.exports = new Proxy(
  { __esModule: true },
  {
    get: (_t, key) => (key === "__esModule" ? true : Icon),
  }
);
