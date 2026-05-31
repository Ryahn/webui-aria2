import { describe, expect, it } from "vitest";
import { parseCligetCommand } from "./cliget-parser";

const SAMPLE_URL = "https://cdn.example.com/files/video.mp4?token=abc";

describe("parseCligetCommand", () => {
  it("merges multiple --header flags into newline-separated header option", () => {
    const cmd = `aria2c --header="Referer: https://example.com/" --header="User-Agent: Mozilla/5.0" --header="Cookie: a=b; c=d" "${SAMPLE_URL}"`;
    const result = parseCligetCommand(cmd);

    expect(result.uris).toEqual([SAMPLE_URL]);
    expect(result.options.header).toBe(
      "Referer: https://example.com/\nUser-Agent: Mozilla/5.0\nCookie: a=b; c=d"
    );
  });

  it("parses --header with space-separated value", () => {
    const cmd = `aria2c --header "Authorization: Bearer my-token" '${SAMPLE_URL}'`;
    const result = parseCligetCommand(cmd);

    expect(result.options.header).toBe("Authorization: Bearer my-token");
    expect(result.uris[0]).toBe(SAMPLE_URL);
  });

  it("parses unquoted --header= with special cookie characters", () => {
    const cmd = `aria2c --header=Cookie:session=abc123;Path=/;Secure ${SAMPLE_URL}`;
    const result = parseCligetCommand(cmd);

    expect(result.options.header).toBe("Cookie:session=abc123;Path=/;Secure");
    expect(result.uris).toEqual([SAMPLE_URL]);
  });

  it("maps cliget short flags -x -s -k -o -d", () => {
    const cmd = `aria2c -x16 -s16 -k1M -o saved.bin -d /downloads --header="Referer: https://x.com/" "${SAMPLE_URL}"`;
    const result = parseCligetCommand(cmd);

    expect(result.options["max-connection-per-server"]).toBe("16");
    expect(result.options.split).toBe("16");
    expect(result.options["min-split-size"]).toBe("1M");
    expect(result.options.out).toBe("saved.bin");
    expect(result.options.dir).toBe("/downloads");
    expect(result.options.header).toContain("Referer:");
  });

  it("parses attached short flag values like -x16", () => {
    const result = parseCligetCommand(`aria2c -x16 -s8 "${SAMPLE_URL}"`);
    expect(result.options["max-connection-per-server"]).toBe("16");
    expect(result.options.split).toBe("8");
  });

  it("handles --referer and --user-agent as separate options", () => {
    const cmd = `aria2c --referer=https://example.com/ --user-agent="CustomAgent/1.0" "${SAMPLE_URL}"`;
    const result = parseCligetCommand(cmd);

    expect(result.options.referer).toBe("https://example.com/");
    expect(result.options["user-agent"]).toBe("CustomAgent/1.0");
  });

  it("handles line continuations and escaped quotes in headers", () => {
    const cmd = 'aria2c --header="X-Note: say \\"hello\\"" \\\n' + `"${SAMPLE_URL}"`;
    const result = parseCligetCommand(cmd);

    expect(result.options.header).toBe('X-Note: say "hello"');
    expect(result.uris).toEqual([SAMPLE_URL]);
  });

  it("does not treat header values as URIs", () => {
    const cmd = `aria2c --header="Referer: https://example.com/page" "${SAMPLE_URL}"`;
    const result = parseCligetCommand(cmd);

    expect(result.uris).toEqual([SAMPLE_URL]);
    expect(result.options.header).toBe("Referer: https://example.com/page");
  });

  it("encodes apostrophe in pasted URL when double-quoted", () => {
    const url = "https://example.com/file'name.mp4";
    const result = parseCligetCommand(`aria2c "${url}"`);
    expect(result.uris[0]).toBe("https://example.com/file%27name.mp4");
  });

  it("returns empty result for blank input", () => {
    expect(parseCligetCommand("   ")).toEqual({ uris: [], options: {} });
  });
});
