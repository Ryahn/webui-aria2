import { describe, expect, it } from "vitest";
import { normalizeUri, parseUriLines, getProgress, downloadName } from "./helpers";

describe("parseUriLines", () => {
  it("parses one URL per line with quoted spaces", () => {
    const result = parseUriLines('"https://example.com/a b.txt"\nhttps://example.com/c.zip');
    expect(result).toHaveLength(2);
    expect(result[0].uris[0]).toContain("a b.txt");
  });

  it("parses URL with spaces without quotes when scheme line", () => {
    const result = parseUriLines("https://example.com/my file/name.pdf");
    expect(result[0].uris[0]).toBe("https://example.com/my file/name.pdf");
  });

  it("parses --out per line", () => {
    const result = parseUriLines("https://ex.com/f1 --out=f1.txt\nhttps://ex.com/f2 --out=f2.txt");
    expect(result[0].options.out).toBe("f1.txt");
    expect(result[1].options.out).toBe("f2.txt");
  });

  it("encodes apostrophe in URL", () => {
    const result = parseUriLines("https://example.com/example'name.pdf");
    expect(result[0].uris[0]).toBe("https://example.com/example%27name.pdf");
  });
});

describe("normalizeUri", () => {
  it("encodes apostrophe", () => {
    expect(normalizeUri("https://a.com/x'y")).toBe("https://a.com/x%27y");
  });
});

describe("getProgress", () => {
  it("returns percentage", () => {
    expect(getProgress({ completedLength: "50", totalLength: "100" })).toBe(50);
  });
});

describe("downloadName", () => {
  it("uses bittorrent name", () => {
    expect(downloadName({ bittorrent: { name: "test.torrent" }, files: [] })).toBe("test.torrent");
  });
});
