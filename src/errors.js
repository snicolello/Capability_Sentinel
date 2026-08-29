export class ArrmError extends Error {
  constructor(code, message, options = {}) {
    super(message, options);
    this.name = 'ArrmError';
    this.code = code;
    this.exitCode = options.exitCode;
    this.details = options.details ?? [];
  }
}

export class InputError extends ArrmError {
  constructor(code, message, options = {}) {
    super(code, message, { ...options, exitCode: 65 });
    this.name = 'InputError';
  }
}

export class UsageError extends ArrmError {
  constructor(message) {
    super('INVALID_USAGE', message, { exitCode: 64 });
    this.name = 'UsageError';
  }
}
