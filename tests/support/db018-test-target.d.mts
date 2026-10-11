/** Types for the executable fail-closed DB018 target guard. */
export type Db018Target = Readonly<{
  host: string;
  database: string;
  mode: "local" | "explicit-remote";
}>;
export declare function assertDb018DisposableTarget(
  env?: NodeJS.ProcessEnv,
  options?: { serviceBound?: boolean },
): Db018Target;
