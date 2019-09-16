import * as Boom from '@hapi/boom';
import { Server as RawServer } from '@hapi/hapi';
import * as Parser from 'rss-parser';
import { ChecksumProvider } from '../checksum-provider/checksum-provider';
import { EpisodeInfo } from './episode-info';
import { Server } from './server';

export class HapiServer implements Server {
  constructor(
    private server: RawServer,
    // maybe the parser should have been wrapped with a better interface to reduce our dependency
    private parser: Parser,
    private checksumProvider: ChecksumProvider
  ) {}

  public initialize(): RawServer {
    this.server.route([
      {
        method: 'GET',
        path: '/',
        handler: (request, h) => {
          return 'Get your episode data from /feeds/{feed_url}/episodes';
        },
      },
      {
        method: 'GET',
        path: '/feeds/{rss_url}/episodes',
        handler: async (request, h) => {
          const rssUrl = request.params.rss_url;

          //break out this chunk for better typing and reusability
          let feed: Parser.Output;
          try {
            feed = await this.parser.parseURL(rssUrl);
          } catch (err) {
            const stack = err.stack as string;

            // make it a nice 404
            if (stack.includes('Status code 404')) {
              return Boom.notFound(
                `The provided url ${rssUrl} does not seem to match any rss feed`
              );
            }

            // the external rss parser had some good parse error indications so lets use them
            return Boom.failedDependency(
              `There was a problem while trying to parse the rss feed: ${err}`
            );
          }

          const feedItems = feed.items;
          let episodes: EpisodeInfo[] = [];

          //break out this chunk for better typing and reusability
          if (feedItems) {
            episodes = await Promise.all(
              feedItems.map(async item => {
                const streamUrl = item.enclosure.url;

                // only option to get a checksum is to fetch the audio data and then generate a checksum
                // seems a bit overkill to do that in a GET request. better to have a separate service or db where it is already stored
                const checksum = await this.checksumProvider.provide(streamUrl);

                // is it ok with missing title and url or should it raise error? depends on what it should be used for.
                return {
                  title: item.title ? item.title : '',
                  checksum,
                  url: item.link ? item.link : '',
                };
              })
            );
          }

          return episodes;
        },
      },
    ]);

    return this.server;
  }

  public async start(): Promise<void> {
    if (!this.server) {
      throw new Error(
        'Server needs to be initialized before calling Server.start()'
      );
    }
    await this.server.start();
  }
  public async stop(): Promise<void> {
    if (!this.server) {
      throw new Error(
        'Server needs to be initialized before calling Server.stop()'
      );
    }
    await this.server.stop();
  }
}
