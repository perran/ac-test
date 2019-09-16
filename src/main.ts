import { Server } from '@hapi/hapi';
import * as Parser from 'rss-parser';
import { StreamChecksumProvider } from './checksum-provider/stream-checksum-provider';
import { HapiServer } from './server/hapi-server';

process.on('unhandledRejection', err => {
  console.log(err);
  process.exit(1);
});

const rawServer = new Server({ host: 'localhost', port: 3000 });
const parser = new Parser();
const testChecksumProvider = new StreamChecksumProvider();

const server = new HapiServer(rawServer, parser, testChecksumProvider);
server.initialize();
server.start().then(() => {
  console.log('Server started!');
});
