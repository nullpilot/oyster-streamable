export const API = Object.freeze({
  // HOST: "http://localhost:8000",
  // BROKER_NODE_A: "http://localhost:8000",
  // BROKER_NODE_B: "http://localhost:8000",
  HOST: "",
  BROKER_NODE_A: "",
  BROKER_NODE_B: "",
  V1_UPLOAD_SESSIONS_PATH: ":3000/api/v1/upload-sessions",
  V2_UPLOAD_SESSIONS_PATH: ":3000/api/v2/upload-sessions",
  CHUNKS_PER_REQUEST: 10
});

export const IOTA_API = Object.freeze({
  PROVIDER_A: "",
  PROVIDER_B: "",
  ADDRESS_LENGTH: 81,
  MESSAGE_LENGTH: 2187,
  BUNDLE_SIZE: 30
});

export const UPLOAD_STATUSES = Object.freeze({
  PENDING: "PENDING",
  SENT: "SENT",
  FAILED: "FAILED"
});

export const DOWNLOAD_STATUSES = Object.freeze({
  STANDBY: "STANDBY",
  PENDING: "PENDING",
  RECEIVED: "RECEIVED",
  FAILED: "FAILED"
});

export const FILE = Object.freeze({
  MAX_FILE_SIZE: 2000 * 1000,
  CHUNK_TYPES: {
    METADATA: "METADATA",
    FILE_CONTENTS: "FILE_CONTENTS"
  }
});

export const INCLUDE_TREASURE_OFFSETS = false;
