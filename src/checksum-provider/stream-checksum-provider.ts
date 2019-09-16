import { createHash } from 'crypto';
import * as got from 'got';
import { ChecksumProvider } from './checksum-provider';

export class StreamChecksumProvider implements ChecksumProvider {
  public provide(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      hash.setEncoding('hex');

      got
        .stream(url)
        .pipe(hash)
        .on('error', err => reject(err))
        .on('finish', () => {
          resolve(hash.read());
        });
    });
  }
}
