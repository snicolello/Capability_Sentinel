import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import assessmentSchema from '../../schemas/assessment.schema.json' with { type: 'json' };
import eventSchema from '../../schemas/event.schema.json' with { type: 'json' };
import findingSchema from '../../schemas/finding.schema.json' with { type: 'json' };
import policySchema from '../../schemas/policy.schema.json' with { type: 'json' };
import traceSchema from '../../schemas/trace.schema.json' with { type: 'json' };

export const SCHEMA_IDS = Object.freeze({
  assessment: assessmentSchema.$id,
  event: eventSchema.$id,
  finding: findingSchema.$id,
  policy: policySchema.$id,
  trace: traceSchema.$id,
});

export function createValidator() {
  const ajv = new Ajv2020({
    allErrors: true,
    strict: true,
    validateFormats: true,
  });
  addFormats(ajv, { formats: ['date-time'] });
  for (const schema of [eventSchema, traceSchema, policySchema, findingSchema, assessmentSchema]) {
    ajv.addSchema(schema);
  }
  for (const id of Object.values(SCHEMA_IDS)) {
    if (!ajv.getSchema(id)) throw new Error(`Schema failed to compile: ${id}`);
  }
  return ajv;
}
