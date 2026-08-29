import { InputError } from '../errors.js';
import { createValidator, SCHEMA_IDS } from './create-validator.js';

let validator;

function getValidator() {
  validator ??= createValidator();
  return validator;
}

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

function stableParams(params) {
  return Object.fromEntries(
    Object.entries(params).sort(([left], [right]) => compareText(left, right)),
  );
}

function validateSchema(kind, value) {
  const validate = getValidator().getSchema(SCHEMA_IDS[kind]);
  const valid = validate(value);
  if (valid) return value;

  const details = (validate.errors ?? [])
    .map((error) => ({
      instancePath: error.instancePath,
      keyword: error.keyword,
      params: stableParams(error.params),
      schemaPath: error.schemaPath,
    }))
    .sort((left, right) => compareText(JSON.stringify(left), JSON.stringify(right)));

  throw new InputError(
    'SCHEMA_VALIDATION_FAILED',
    `${kind} failed schema validation`,
    { details },
  );
}

export const validatePolicyStructure = (value) => validateSchema('policy', value);
export const validateTraceStructure = (value) => validateSchema('trace', value);
export const validateAssessmentStructure = (value) => validateSchema('assessment', value);
