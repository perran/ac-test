import { Server, ServerInjectResponse } from '@hapi/hapi';
import * as Parser from 'rss-parser';
import { anyString, instance, mock, when } from 'ts-mockito';
import { ChecksumProvider } from '../../checksum-provider/checksum-provider';
import { EpisodeInfo } from '../episode-info';
import { HapiServer } from '../hapi-server';

const testData = {
  title: 'test title',
  description: 'some test data',
  link: 'https://www.test.com',
  items: [
    {
      title: 'item A',
      link: 'https://www.test.com/a',
      content: 'This is item A',
      contentSnippet: 'This is item A',
      enclosure: {
        url: 'https://www.test.com/files/a.mp3',
      },
    },
  ],
};

describe('hapi-server', () => {
  describe('testing routes', () => {
    let server: HapiServer;
    let rawServer: Server;
    const host = 'localhost';
    const port = 3000;
    const baseUrl = `http://${host}:${port}`;
    // const realFeedUrl = 'https://rss.acast.com/varvet';

    const getEpisodes = async (
      feedUrl: string
    ): Promise<ServerInjectResponse> => {
      const encodedRealFeedUrl = encodeURIComponent(feedUrl);
      return rawServer.inject({
        method: 'get',
        url: `${baseUrl}/feeds/${encodedRealFeedUrl}/episodes`,
      });
    };

    describe('mocked parser', () => {
      let mockedParser: Parser;
      const fakeUrl = 'http://rss.fakeurl.com/faux';
      let mockedChecksumProvider: ChecksumProvider;

      beforeEach(async () => {
        rawServer = new Server({ host, port });
        mockedParser = mock(Parser);
        const parser = instance(mockedParser);
        mockedChecksumProvider = mock<ChecksumProvider>();
        const checksumProvider = instance(mockedChecksumProvider);
        server = new HapiServer(rawServer, parser, checksumProvider);
        server.initialize();
        await server.start();
      });

      afterEach(async () => {
        await server.stop();
      });

      it('should return a 200 with empty list when there are no feed items', async () => {
        when(mockedParser.parseURL(fakeUrl)).thenResolve({
          description: 'some description',
          items: [],
        });
        const res = await getEpisodes(fakeUrl);
        expect(res.statusCode).toBe(200);
        const episodeInfos = res.result as EpisodeInfo[];

        expect(episodeInfos.length).toBe(0);
      });

      describe('getting a complete test data', () => {
        let res: ServerInjectResponse;
        beforeEach(async () => {
          when(mockedParser.parseURL(fakeUrl)).thenResolve(testData);
          when(mockedChecksumProvider.provide(anyString())).thenResolve(
            'fake_checksum'
          );
          res = await getEpisodes(fakeUrl);
        });

        it('should return a 200 with episodes when feed has items', () => {
          expect(res.statusCode).toBe(200);
        });

        it('should return as many episode data as there are feed items', () => {
          const episodeInfos = res.result as EpisodeInfo[];
          expect(episodeInfos.length).toBe(1);
        });

        it('should have provided checksum for the items', () => {
          const episodeInfos = res.result as EpisodeInfo[];
          expect(episodeInfos[0].checksum).toBe('fake_checksum');
        });

        it('should populate the episode data with correct data', () => {
          const episodeInfos = res.result as EpisodeInfo[];
          expect(episodeInfos[0].title).toBe(testData.items[0].title);
          expect(episodeInfos[0].url).toBe(testData.items[0].link);
        });
      });

      it('should return a 404 when the url is not existing', async () => {
        when(mockedParser.parseURL(fakeUrl)).thenThrow(
          new Error('yada yada Status code 404 bla bla')
        );
        const res = await getEpisodes(fakeUrl);
        expect(res.statusCode).toBe(404);
      });

      it('should return a 424 and contain external error message when parsing failed', async () => {
        when(mockedParser.parseURL(fakeUrl)).thenThrow(
          new Error('something was malformed')
        );
        const res = await getEpisodes(fakeUrl);
        expect(res.statusCode).toBe(424);
        expect(res.payload).toContain('something was malformed');
      });
    });
  });
});
