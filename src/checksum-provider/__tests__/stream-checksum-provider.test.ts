import { StreamChecksumProvider } from '../stream-checksum-provider';

describe('getting checksum from streams', () => {
  jest.setTimeout(1000 * 100);

  // shaky test depending on external resource
  // took approximately 33 sec to create checksum for audio
  it.only('should get checksum of a file', async () => {
    const provider = new StreamChecksumProvider();
    const checksum = await provider.provide(
      `https://upload.wikimedia.org/wikipedia/commons/d/de/Bananavarieties.jpg`
      // `https://media.acast.com/varvet/kortversion--380-livmjones/media.mp3`
    );

    expect(checksum).toBe(
      `eb79da05d653570e96fbcc3e97f6f84ca9fe7bc9778d0dbe242ef71cab11ef92`
    );
  });
});
