#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { EXIT_CODES, INPUT_LIMITS } from './constants.js';
import { ArrmError, UsageError } from './errors.js';
import { loadJsonFile } from './io/load-json.js';
import { validatePolicySemantics } from './policy/validate-semantics.js';
import { validateTraceSemantics, validateInputPair } from './trace/validate-semantics.js';
import {
  validateAssessmentStructure,
  validatePolicyStructure,
  validateTraceStructure,
} from './schema/validate-input.js';
import { evaluateRun } from './evaluate/evaluate-run.js';
import { stableJson } from './audit/stable-json.js';

function parseArguments(args) {
  if (args.length !== 4 || args[0] !== 'assess' || args[3] !== '--json') {
    throw new UsageError('usage: arrm assess POLICY.json TRACE.json --json');
  }
  return { policyPath: args[1], tracePath: args[2] };
}

function exitCodeForDecision(decision) {
  switch (decision) {
    case 'ALLOW':
    case 'LOG': return EXIT_CODES.success;
    case 'REQUIRE_APPROVAL': return EXIT_CODES.requireApproval;
    case 'BLOCK': return EXIT_CODES.block;
    case 'TERMINATE': return EXIT_CODES.terminate;
    default: throw new Error('Unknown assessment decision');
  }
}

export async function main(args, io = process) {
  try {
    const { policyPath, tracePath } = parseArguments(args);
    const policy = await loadJsonFile(
      policyPath,
      { label: 'policy', maxBytes: INPUT_LIMITS.policy },
    );
    const trace = await loadJsonFile(
      tracePath,
      { label: 'trace', maxBytes: INPUT_LIMITS.trace },
    );
    validatePolicySemantics(validatePolicyStructure(policy));
    validateTraceSemantics(validateTraceStructure(trace));
    validateInputPair(policy, trace);
    const assessment = evaluateRun(policy, trace);
    validateAssessmentStructure(assessment);
    io.stdout.write(stableJson(assessment));
    return exitCodeForDecision(assessment.overall_decision);
  } catch (error) {
    if (error instanceof ArrmError) {
      io.stderr.write(`ARRM_ERROR ${error.code}: ${error.message}\n`);
      return error.exitCode;
    }
    io.stderr.write('ARRM_ERROR INTERNAL_ERROR: assessment failed\n');
    return EXIT_CODES.internal;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await main(process.argv.slice(2));
}
