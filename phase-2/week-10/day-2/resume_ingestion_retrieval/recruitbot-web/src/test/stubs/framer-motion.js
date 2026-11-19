/* Test stub for framer-motion — renders plain DOM elements, strips motion
   props, and passes AnimatePresence children straight through. */
const React = require("react");

const MOTION_PROPS = new Set([
  "initial",
  "animate",
  "exit",
  "transition",
  "whileHover",
  "whileTap",
  "whileInView",
  "layout",
  "variants",
]);

function strip(props = {}) {
  const out = {};
  for (const k in props) {
    if (!MOTION_PROPS.has(k)) out[k] = props[k];
  }
  return out;
}

const motion = new Proxy(
  {},
  {
    get: (_t, tag) =>
      React.forwardRef((props, ref) =>
        React.createElement(String(tag), { ref, ...strip(props) })
      ),
  }
);

const AnimatePresence = ({ children }) => children;

module.exports = { __esModule: true, motion, AnimatePresence };
