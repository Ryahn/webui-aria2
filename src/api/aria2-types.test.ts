import { describe, expect, it } from "vitest";
import { getRpcErrorMessage, unwrapMulticallEntry } from "../api/aria2-types";

describe("unwrapMulticallEntry", () => {
  it("unwraps a one-item success array", () => {
    expect(unwrapMulticallEntry([{ version: "1.37.0" }])).toEqual({
      result: { version: "1.37.0" },
    });
  });

  it("unwraps nested arrays from tellActive", () => {
    expect(unwrapMulticallEntry([[]])).toEqual({ result: [] });
  });

  it("passes through fault structs", () => {
    expect(unwrapMulticallEntry({ code: 1, message: "No such method" })).toEqual({
      code: 1,
      message: "No such method",
    });
  });
});

describe("getRpcErrorMessage", () => {
  it("returns multicall error message", () => {
    expect(getRpcErrorMessage({ code: 1, message: "URI malformed" })).toBe("URI malformed");
  });

  it("returns json-rpc error message", () => {
    expect(getRpcErrorMessage({ id: "1", jsonrpc: "2.0", error: { code: 1, message: "fail" } })).toBe("fail");
  });

  it("returns null on success", () => {
    expect(getRpcErrorMessage({ id: "1", jsonrpc: "2.0", result: "ok" })).toBeNull();
  });
});
