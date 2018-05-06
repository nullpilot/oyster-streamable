import Forge from 'node-forge'

// `length` should be a multiple of 8
export function getSalt (length) {
  const bytes = Forge.random.getBytesSync(Math.ceil(length / 8 * 6))
  return Forge.util.encode64(bytes)
}

export function getPrimordialHash () {
  const bytes = Forge.random.getBytesSync(16)
  return Forge.md.sha256.create().update(bytes).digest().toHex()
}

// Expects node-forge ByteBuffer
// Returns [obfuscatedHash, nextHash]
export function hashChain (hash) {
  const obfuscatedHash = Forge.md.sha384.create().update(hash).digest()
  const nextHash = Forge.md.sha256.create().update(hash).digest()

  return [obfuscatedHash, nextHash]
}

// Genesis hash is not yet obfuscated.
export function genesisHash (handle) {
  const bytes = new Forge.util.ByteBuffer(handle, 'utf8')
  const [_obfuscatedHash, genHash] = hashChain(bytes);

  return genHash.toHex();
}

// Moved to Encryption utility
export function createHandle (filename) {
  const fileNameTrimmed = (filename + getSalt(8)).substr(0, 8)
  const salt = getSalt(8)
  const primordialHash = getPrimordialHash()
  const handle = fileNameTrimmed + primordialHash + salt

  return handle
}
