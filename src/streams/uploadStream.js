import { Writable } from 'readable-stream'
import { sendToBrokerA, sendToBrokerB } from '../utils/backend'

const CHUNK_ORDER_ASC = 1
const CHUNK_ORDER_DESC = 2

const DEFAULT_OPTIONS = Object.freeze({
    batchSize: 2000,
    maxParallelUploads: 2,
    maxRetries: 10,
    objectMode: true
  })

export default class UploadStream extends Writable {
  constructor (metadataTrytes, genesisHash, sessIdA, sessIdB, options) {
    const opts = Object.assign({}, DEFAULT_OPTIONS, options)
    const metachunk = {idx: 0, data: metadataTrytes, hash: genesisHash}

    super(opts)
    this.options = opts
    this.genesisHash = genesisHash
    this.sessIdA = sessIdA
    this.sessIdB = sessIdB
    this.chunkBufferLow = [metachunk]
    this.chunkBufferHigh = []
    this.batchBuffer = []
    this.ongoingUploads = 0
    this.retries = 0
    this.finishCallback = null
  }
  _write (data, encoding, callback) {
    const chunk = {
      idx: data.idx,
      data: data.data,
      hash: this.genesisHash
    }

    if(data.order === CHUNK_ORDER_ASC) {
      this.chunkBufferLow.push(chunk)
      if(this.chunkBufferLow.length === this.options.batchSize) {
        this.batchBuffer.push({
          chunks: this.chunkBufferLow,
          order: CHUNK_ORDER_ASC
        })
        this.chunkBufferLow = []
        this._attemptUpload()
      }
    } else {
      this.chunkBufferHigh.push(chunk)
      if(this.chunkBufferHigh.length === this.options.batchSize) {
        this.batchBuffer.push({
          chunks: this.chunkBufferHigh,
          order: CHUNK_ORDER_DESC
        })
        this.chunkBufferHigh = []
        this._attemptUpload()
      }
    }

    callback()
  }
  _final (callback) {
    this.finishCallback = callback

    if (this.chunkBufferLow.length > 0) {
      this.batchBuffer.push({
        chunks: this.chunkBufferLow,
        order: CHUNK_ORDER_ASC
      })
    }

    if (this.chunkBufferHigh.length > 0) {
      this.batchBuffer.push({
        chunks: this.chunkBufferHigh,
        order: CHUNK_ORDER_DESC
      })
    }

    if(this.batchBuffer.length > 0) {
      this._attemptUpload()
    } else if (this.ongoingUploads === 0) {
      callback()
    }
  }
  _attemptUpload () {
    if(this.ongoingUploads >= this.options.maxParallelUploads) {
      return
    }

    const batch = this.batchBuffer.shift()
    this._upload(batch)
  }
  _upload (batch) {
    this.ongoingUploads++

    // Cork stream when busy
    if(this.ongoingUploads === this.options.maxParallelUploads) {
      this.cork()
    }

    let upload
    if (batch.order === CHUNK_ORDER_ASC) {
      upload = sendToBrokerA(this.sessIdA, batch.chunks)
    } else {
      upload = sendToBrokerB(this.sessIdB, batch.chunks)
    }

    upload.then((result) => {
      this._afterUpload()
    }).catch(error => {
      this._uploadError(error, batch)
    })
  }
  _afterUpload () {
    this.ongoingUploads--

    // Upload until done
    if(this.batchBuffer.length > 0) {
      return this._attemptUpload()
    }

    if(this.finishCallback) {
      // Finish
      if(this.ongoingUploads === 0) {
        this.finishCallback()
      }
    } else {
      // Continue
      process.nextTick(() => this.uncork())
    }
  }
  _uploadError (error, batch) {
    this.ongoingUploads--

    console.warn('error', error)

    if(this.retries++ < this.options.maxRetries) {
      console.log('retrying', this.retries, 'of', this.options.maxRetries)
      this.batchBuffer.push(batch)
      this._attemptUpload()
      return
    }

    if(this.finishCallback) {
      this.finishCallback(error)
    } else {
      this.emit('error', error)
      this.close()
    }
  }
}
