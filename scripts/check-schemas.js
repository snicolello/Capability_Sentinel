import { createValidator, SCHEMA_IDS } from '../src/schema/create-validator.js';

createValidator();
console.log(`Compiled ${Object.keys(SCHEMA_IDS).length} Draft 2020-12 schemas in strict mode.`);
