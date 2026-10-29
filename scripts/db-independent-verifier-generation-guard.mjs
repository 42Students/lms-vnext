/**
 * Drizzle-kit has returned exit code 0 after printing fatal exceptions.
 * The canonical generation gate must not infer success from exitCode alone.
 * Deliberately treat all stderr as an unsuccessful generation. Unlike a
 * generic build gate, schema generation must be quiet on stderr, so an
 * unexpected warning also requires review before schema certification.
 */
const FATAL_STDOUT = /(?:^|\n)\s*(?:(?:[A-Za-z_$][\w.$]*?(?:Error|Exception))|Error|Exception|UnhandledPromiseRejection|Uncaught|npm\s+error)\b\s*(?::|\[|\s)|Do not know how to serialize a BigInt/mi;

export function inspectCanonicalGenerationOutput({ stdout = "", stderr = "" } = {}) {
  const stderrWasEmpty = String(stderr).trim().length === 0;
  const fatalOutputDetected = FATAL_STDOUT.test(String(stdout)) ||
    FATAL_STDOUT.test(String(stderr));
  return {
    stderrWasEmpty,
    fatalOutputDetected,
    passed: stderrWasEmpty && !fatalOutputDetected,
  };
}
