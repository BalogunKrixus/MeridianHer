/**
 * Writes src/database.types.ts in the same shape as `supabase gen types typescript`,
 * by applying every migration to an in process Postgres and reading the catalog.
 * Works offline and on Windows without Docker. CI fails if the file is stale.
 *
 *   pnpm --filter @meridianher/db db:types
 */
import { writeFileSync } from "node:fs"

import { createTestDb } from "../test/test-db.ts"

const out = new URL("../src/database.types.ts", import.meta.url)
const { pg } = await createTestDb()

type Column = {
  table_name: string
  column_name: string
  udt_name: string
  data_type: string
  is_nullable: "YES" | "NO"
  has_default: boolean
  is_generated: boolean
}

const enums = (
  await pg.query<{ name: string; labels: string[] }>(`
    select t.typname as name, array_agg(e.enumlabel order by e.enumsortorder) as labels
    from pg_type t join pg_enum e on e.enumtypid = t.oid join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' group by t.typname order by t.typname`)
).rows
const enumNames = new Set(enums.map((e) => e.name))

const relations = (
  await pg.query<{ name: string; kind: "r" | "v" }>(`
    select c.relname as name, c.relkind as kind from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'v') order by c.relname`)
).rows

const columns = (
  await pg.query<Column>(`
    select c.table_name, c.column_name, c.udt_name, c.data_type, c.is_nullable,
           c.column_default is not null as has_default, c.is_generated = 'ALWAYS' as is_generated
    from information_schema.columns c where c.table_schema = 'public' order by c.table_name, c.ordinal_position`)
).rows

const foreignKeys = (
  await pg.query<{ name: string; table: string; columns: string[]; referenced: string; referenced_columns: string[]; one_to_one: boolean }>(`
    select con.conname as name, src.relname as table,
           array(select a.attname from unnest(con.conkey) k join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k) as columns,
           dst.relname as referenced,
           array(select a.attname from unnest(con.confkey) k join pg_attribute a on a.attrelid = con.confrelid and a.attnum = k) as referenced_columns,
           exists (
             select 1 from pg_index i where i.indrelid = con.conrelid and i.indisunique
               and (select array_agg(x order by x) from unnest(i.indkey::int2[]) x) = (select array_agg(x order by x) from unnest(con.conkey) x)
           ) as one_to_one
    from pg_constraint con
    join pg_class src on src.oid = con.conrelid join pg_namespace n on n.oid = src.relnamespace
    join pg_class dst on dst.oid = con.confrelid join pg_namespace dn on dn.oid = dst.relnamespace
    where con.contype = 'f' and n.nspname = 'public' and dn.nspname = 'public'
    order by src.relname, con.conname`)
).rows

const functions = (
  await pg.query<{ name: string; args: { name: string; type: string; has_default: boolean }[]; returns: string; returns_set: boolean }>(`
    select p.proname as name,
           coalesce((
             select json_agg(json_build_object('name', a.name, 'type', format_type(a.type, null), 'has_default', a.ord > p.pronargs - p.pronargdefaults) order by a.ord)
             from unnest(p.proargnames[1:p.pronargs], p.proargtypes::oid[]) with ordinality a(name, type, ord)
           ), '[]') as args,
           format_type(p.prorettype, null) as returns, p.proretset as returns_set
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f'
    order by p.proname`)
).rows

function tsType(udt: string): string {
  if (udt.startsWith("_")) return `${tsType(udt.slice(1))}[]`
  if (enumNames.has(udt)) return `Database["public"]["Enums"]["${udt}"]`
  switch (udt) {
    case "bool":
    case "boolean":
      return "boolean"
    case "int2":
    case "int4":
    case "int8":
    case "smallint":
    case "integer":
    case "bigint":
    case "numeric":
    case "float4":
    case "float8":
      return "number"
    case "json":
    case "jsonb":
      return "Json"
    case "tsvector":
    case "void":
      return udt === "void" ? "undefined" : "unknown"
    default:
      return "string"
  }
}

function sqlTypeToUdt(type: string) {
  const map: Record<string, string> = {
    text: "text", boolean: "bool", integer: "int4", smallint: "int2", jsonb: "jsonb", uuid: "uuid", void: "void",
    "text[]": "_text", "public.app_role": "app_role",
  }
  return map[type] ?? type.replace(/^public\./, "")
}

const indent = (s: string, n: number) => s.split("\n").map((l) => (l ? " ".repeat(n) + l : l)).join("\n")

function relationships(table: string) {
  const fks = foreignKeys.filter((f) => f.table === table)
  if (!fks.length) return "Relationships: []"
  return `Relationships: [\n${fks
    .map(
      (f) =>
        `  {\n    foreignKeyName: "${f.name}"\n    columns: [${f.columns.map((c) => `"${c}"`).join(", ")}]\n    isOneToOne: ${f.one_to_one}\n    referencedRelation: "${f.referenced}"\n    referencedColumns: [${f.referenced_columns.map((c) => `"${c}"`).join(", ")}]\n  },`
    )
    .join("\n")}\n]`
}

function tableBlock(name: string) {
  const cols = columns.filter((c) => c.table_name === name)
  const row = cols.map((c) => `${c.column_name}: ${tsType(c.udt_name)}${c.is_nullable === "YES" ? " | null" : ""}`)
  const insert = cols.map((c) =>
    c.is_generated
      ? `${c.column_name}?: never`
      : `${c.column_name}${c.is_nullable === "YES" || c.has_default ? "?" : ""}: ${tsType(c.udt_name)}${c.is_nullable === "YES" ? " | null" : ""}`
  )
  const update = cols.map((c) =>
    c.is_generated ? `${c.column_name}?: never` : `${c.column_name}?: ${tsType(c.udt_name)}${c.is_nullable === "YES" ? " | null" : ""}`
  )
  return `${name}: {\n  Row: {\n${indent(row.join("\n"), 4)}\n  }\n  Insert: {\n${indent(insert.join("\n"), 4)}\n  }\n  Update: {\n${indent(update.join("\n"), 4)}\n  }\n${indent(relationships(name), 2)}\n}`
}

function viewBlock(name: string) {
  const cols = columns.filter((c) => c.table_name === name)
  const row = cols.map((c) => `${c.column_name}: ${tsType(c.udt_name)} | null`)
  return `${name}: {\n  Row: {\n${indent(row.join("\n"), 4)}\n  }\n  Relationships: []\n}`
}

function functionBlock(f: (typeof functions)[number]) {
  const args = f.args.length
    ? `{\n${indent(f.args.map((a) => `${a.name}${a.has_default ? "?" : ""}: ${tsType(sqlTypeToUdt(a.type))}`).join("\n"), 4)}\n  }`
    : "never"
  const returns = tsType(sqlTypeToUdt(f.returns)) + (f.returns_set ? "[]" : "")
  return `${f.name}: {\n  Args: ${args}\n  Returns: ${returns}\n}`
}

const tables = relations.filter((r) => r.kind === "r").map((r) => tableBlock(r.name))
const views = relations.filter((r) => r.kind === "v").map((r) => viewBlock(r.name))

const source = `// Generated by packages/db/scripts/gen-types.ts from supabase/migrations. Do not edit.
// Regenerate with: pnpm --filter @meridianher/db db:types

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
${indent(tables.join("\n"), 6)}
    }
    Views: {
${indent(views.join("\n"), 6)}
    }
    Functions: {
${indent(functions.map(functionBlock).join("\n"), 6)}
    }
    Enums: {
${indent(enums.map((e) => `${e.name}: ${e.labels.map((l) => `"${l}"`).join(" | ")}`).join("\n"), 6)}
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"]
export type Views<T extends keyof PublicSchema["Views"]> = PublicSchema["Views"][T]["Row"]
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T]
`

writeFileSync(out, source)
console.log(`Wrote ${tables.length} tables, ${views.length} views, ${functions.length} functions, ${enums.length} enums`)
