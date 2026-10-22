import type { Pool } from "pg";

type ForeignKeyEdge = {
  child: string;
  parent: string;
  childColumns: string[];
  parentColumns: string[];
};

const quoteIdent = (name: string): string => `"${name.replaceAll('"', '""')}"`;

/**
 * Test-only cleanup for suites that wipe every placement drive between tests.
 *
 * Production foreign keys deliberately RESTRICT deletes of drives, rounds,
 * applications and their history rows, so a suite that clears `root` must
 * first clear every row that (transitively) references it. The FK graph is
 * read from the live catalogue so newly added child tables are covered
 * without loosening any production constraint. Child rows are removed only
 * when they reference a row of an in-scope parent table; the roots
 * themselves are cleared completely, matching the suites' existing
 * `delete from placement_jobs` semantics. Append-only tables keep their
 * immutability triggers: if such a table holds a referencing row, the
 * delete fails loudly instead of being bypassed.
 */
export async function deletePlacementRowTrees(
  pool: Pool,
  roots: readonly string[] = ["placement_jobs"],
): Promise<void> {
  const { rows: edges } = await pool.query<ForeignKeyEdge>(`
    select cl.relname::text as child,
           pl.relname::text as parent,
           array(select a.attname::text
                   from unnest(c.conkey) with ordinality as k(attnum, ord)
                   join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
                  order by k.ord) as "childColumns",
           array(select a.attname::text
                   from unnest(c.confkey) with ordinality as k(attnum, ord)
                   join pg_attribute a on a.attrelid = c.confrelid and a.attnum = k.attnum
                  order by k.ord) as "parentColumns"
      from pg_constraint c
      join pg_class cl on cl.oid = c.conrelid
      join pg_class pl on pl.oid = c.confrelid
      join pg_namespace n on n.oid = cl.relnamespace
     where c.contype = 'f'
       and n.nspname = current_schema()
       and pl.relnamespace = cl.relnamespace`);

  const inScope = new Set<string>(roots);
  const queue = [...roots];
  while (queue.length > 0) {
    const parent = queue.shift();
    for (const edge of edges) {
      if (edge.parent !== parent || inScope.has(edge.child)) continue;
      inScope.add(edge.child);
      queue.push(edge.child);
    }
  }

  // Order tables so every referencing table is cleared before its parents.
  const scopedEdges = edges.filter((edge) =>
    edge.child !== edge.parent &&
    inScope.has(edge.child) &&
    inScope.has(edge.parent));
  const ordered: string[] = [];
  const remaining = new Set(inScope);
  while (remaining.size > 0) {
    const ready = [...remaining].filter((table) =>
      !scopedEdges.some((edge) =>
        edge.parent === table && remaining.has(edge.child)));
    if (ready.length === 0) {
      throw new Error(
        `Placement cleanup found a foreign-key cycle among: ${[...remaining].join(", ")}`,
      );
    }
    for (const table of ready.sort()) {
      ordered.push(table);
      remaining.delete(table);
    }
  }

  const rootSet = new Set(roots);
  for (const table of ordered) {
    if (rootSet.has(table)) {
      await pool.query(`delete from ${quoteIdent(table)}`);
      continue;
    }
    const matches = scopedEdges
      .filter((edge) => edge.child === table)
      .map((edge) => {
        const join = edge.childColumns
          .map((column, index) =>
            `p.${quoteIdent(edge.parentColumns[index] ?? column)} = c.${quoteIdent(column)}`)
          .join(" and ");
        return `exists (select 1 from ${quoteIdent(edge.parent)} p where ${join})`;
      });
    if (matches.length === 0) continue;
    await pool.query(
      `delete from ${quoteIdent(table)} c where ${matches.join(" or ")}`,
    );
  }
}
