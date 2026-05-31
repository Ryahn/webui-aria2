import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../api/rpc-client", () => ({
  rpcClient: {
    once: vi.fn(),
    forceUpdate: vi.fn(),
  },
}));

import { addUris } from "../api/aria2-actions";
import { rpcClient } from "../api/rpc-client";

describe("addUris", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queues addUri for each line with merged options", () => {
    addUris(
      [
        { uris: ["http://a/1"], options: { out: "a.txt" } },
        { uris: ["http://a/2"], options: { out: "b.txt" } },
      ],
      { pause: "false" }
    );

    expect(rpcClient.once).toHaveBeenCalledTimes(2);
    expect(rpcClient.once).toHaveBeenNthCalledWith(
      1,
      "addUri",
      [["http://a/1"], { pause: "false", out: "a.txt" }],
      expect.any(Function),
      true
    );
    expect(rpcClient.once).toHaveBeenNthCalledWith(
      2,
      "addUri",
      [["http://a/2"], { pause: "false", out: "b.txt" }],
      expect.any(Function),
      true
    );
    expect(rpcClient.forceUpdate).toHaveBeenCalled();
  });
});
