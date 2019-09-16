import * as Parser from 'rss-parser';

describe('rss-parser testing malformed xml', () => {
  let parser: Parser;

  beforeEach(() => {
    parser = new Parser();
  });

  it('Unexpected close tag', async () => {
    await expect(
      parser.parseString(`<rss version="2.0">
          <channel>
            <title>test title
            <link>https://www.test.com</link>
            <description>some test data</description>
            <item>
              <title>item A</title>
              <link>https://www.test.com/a</link>
              <description>This is item A</description>
            </item>
          </channel>
          </rss>`)
    ).rejects.toThrowError();
  });

  it('Non-whitespace before first tag', async () => {
    await expect(parser.parseString(`yadayada`)).rejects.toThrowError();
  });

  it('Unclosed root tag', async () => {
    await expect(parser.parseString(`<rrr>`)).rejects.toThrowError();
  });

  it('Unable to parse XML', async () => {
    await expect(parser.parseString(``)).rejects.toThrowError();
  });
});
