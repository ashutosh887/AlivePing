export const DATADOG_EVENTS = {
  CHECK_IN_START: "check_in.start",
  CHECK_IN_CONFIRMED: "check_in.confirmed",
  CHECK_IN_EXPIRED: "check_in.expired",
  CHECK_IN_CANCELLED: "check_in.cancelled",

  ALERT_TRIGGERED: "alert.triggered",
  ALERT_CANCELLED: "alert.cancelled",
  ALERT_GRACE_WINDOW_EXPIRED: "alert.grace_window_expired",

  SOLANA_START_CHECK_IN: "solana.start_check_in",
  SOLANA_START_CHECK_IN_SUCCESS: "solana.start_check_in.success",
  SOLANA_START_CHECK_IN_ERROR: "solana.start_check_in.error",

  SOLANA_CONFIRM_SAFE: "solana.confirm_safe",
  SOLANA_CONFIRM_SAFE_SUCCESS: "solana.confirm_safe.success",
  SOLANA_CONFIRM_SAFE_ERROR: "solana.confirm_safe.error",

  SOLANA_EXPIRE_CHECK_IN: "solana.expire_check_in",
  SOLANA_EXPIRE_CHECK_IN_SUCCESS: "solana.expire_check_in.success",
  SOLANA_EXPIRE_CHECK_IN_ERROR: "solana.expire_check_in.error",

  LOCATION_FETCHED: "location.fetched",
  LOCATION_HASHED: "location.hashed",
  LOCATION_PERMISSION_DENIED: "location.permission_denied",
  LOCATION_ERROR: "location.error",

  CONTACT_ADDED: "contact.added",
  CONTACT_REMOVED: "contact.removed",
  CONTACT_IMPORTED: "contact.imported",
  CONTACT_SET_PRIMARY: "contact.set_primary",

  WALLET_CREATED: "wallet.created",
  WALLET_LOADED: "wallet.loaded",
  WALLET_ERROR: "wallet.error",

  APP_STARTED: "app.started",
  APP_ERROR: "app.error",
  APP_EXCEPTION: "app.exception",
}

