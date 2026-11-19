import {
  chatComplete,
  truncateToTokens,
  estimateTokens,
} from "../../src/shared/services/LlmProvider";

describe("LlmProvider (multi-provider fallback + token budget)", () => {
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  function okResponse(content: string) {
    return { ok: true, json: async () => ({ choices: [{ message: { content } }] }) };
  }

  it("truncateToTokens caps text to the token budget (~4 chars/token)", () => {
    const long = "x".repeat(4000);
    expect(truncateToTokens(long, 100).length).toBe(400);
    expect(truncateToTokens("short", 100)).toBe("short");
  });

  it("estimateTokens approximates ~4 chars/token", () => {
    expect(estimateTokens("x".repeat(400))).toBe(100);
  });

  it("uses the primary step when it succeeds", async () => {
    global.fetch = jest.fn().mockResolvedValue(okResponse("PRIMARY")) as unknown as typeof fetch;
    const r = await chatComplete(
      [
        { provider: "groq", model: "primary" },
        { provider: "groq", model: "fallback" },
      ],
      [{ role: "user", content: "hi" }]
    );
    expect(r.content).toBe("PRIMARY");
    expect(r.model).toBe("primary");
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(1);
  });

  it("falls back to the next step when the primary fails (non-ok)", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce(okResponse("FALLBACK"));
    global.fetch = fetchMock as unknown as typeof fetch;
    const r = await chatComplete(
      [
        { provider: "groq", model: "primary" },
        { provider: "groq", model: "fallback" },
      ],
      [{ role: "user", content: "hi" }]
    );
    expect(r.content).toBe("FALLBACK");
    expect(r.model).toBe("fallback");
    expect(fetchMock.mock.calls.length).toBe(2);
  });

  it("throws when every step fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;
    await expect(
      chatComplete(
        [
          { provider: "groq", model: "a" },
          { provider: "groq", model: "b" },
        ],
        [{ role: "user", content: "hi" }]
      )
    ).rejects.toThrow(/All LLM providers failed/);
  });
});
