declare module "word-extractor" {
  interface WordDocument {
    getBody(): string;
    getFootnotes(): string;
    getHeaders(options?: { includeFooters?: boolean }): string;
  }
  class WordExtractor {
    extract(input: string | Buffer): Promise<WordDocument>;
  }
  export default WordExtractor;
}
