export interface ChecksumProvider {
  provide(url: string): Promise<string>;
}
