"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResumeParser = createResumeParser;
const env_1 = require("../../../config/env");
const AlgorithmResumeParser_1 = require("./AlgorithmResumeParser");
const LLMResumeParser_1 = require("./LLMResumeParser");
function createResumeParser() {
    if (env_1.env.USE_LLM_PARSER) {
        const llm = new LLMResumeParser_1.LLMResumeParser();
        return {
            mode: "llm",
            parse: (rawText) => llm.parseResume(rawText),
        };
    }
    const algorithm = new AlgorithmResumeParser_1.AlgorithmResumeParser();
    return {
        mode: "algorithm",
        parse: (rawText) => Promise.resolve(algorithm.parseResume(rawText)),
    };
}
//# sourceMappingURL=ResumeParserFactory.js.map