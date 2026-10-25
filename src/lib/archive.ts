/** Server-only public archive ingestion. Never import this module from client scripts. */
import { readFileSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import { z } from "zod";

export const GAME_VERSION = "3.19.26.22" as const;
export const categories = {
  connection: "连接与会话",
  frontend: "界面与交互",
  gameplay: "对局与玩法",
  assets: "资源与呈现",
  services: "服务与数据",
} as const;
export const availabilityLabels = {
  verified: "已验证可用",
  partial: "部分可用",
  unverified: "待验证",
  unavailable: "暂不可用",
} as const;
export const workStatusLabels = {
  notDisclosed: "未披露",
  investigating: "调查中",
  inProgress: "处理中",
  blocked: "受阻",
  completed: "已完成",
} as const;
export const accessStatusLabels = {
  notDisclosed: "未披露",
  notPublic: "未开放",
  limited: "有限开放",
  public: "已公开",
} as const;

const nonempty = z.string().trim().min(1);
const stableId = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "ID must be lowercase kebab-case");
const calendarDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use an explicit YYYY-MM-DD date")
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(parsed.valueOf()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, "Date must exist in the calendar");

/** Syntax restrictions reduce accidental private links; a human must review their actual contents. */
const publicHttpsUrl = z.url().refine((value) => {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443")
  )
    return false;
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (
    !host.includes(".") ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  )
    return false;
  // Evidence links must use a public DNS name, never a literal address or local service.
  if (/^\[.*\]$/.test(host) || /^\d+(?:\.\d+){3}$/.test(host)) return false;
  return !["localhost", "metadata.google.internal"].includes(host);
}, "Evidence must use a reviewed public HTTPS URL without credentials or local addresses");

export const evidenceSchema = z
  .object({
    id: stableId,
    type: z.enum(["image", "video", "document"]),
    title: nonempty,
    url: publicHttpsUrl,
    description: nonempty,
    alt: nonempty.optional(),
  })
  .strict()
  .superRefine((item, ctx) => {
    if (item.type === "image" && !item.alt) {
      ctx.addIssue({
        code: "custom",
        path: ["alt"],
        message: "Image evidence needs meaningful alt text",
      });
    }
  });

export const recordSchema = z
  .object({
    id: stableId,
    title: nonempty,
    category: z.enum([
      "connection",
      "frontend",
      "gameplay",
      "assets",
      "services",
    ]),
    gameVersion: z.literal(GAME_VERSION),
    availability: z.enum(["verified", "partial", "unverified", "unavailable"]),
    workStatus: z.enum([
      "notDisclosed",
      "investigating",
      "inProgress",
      "blocked",
      "completed",
    ]),
    accessStatus: z.enum(["notDisclosed", "notPublic", "limited", "public"]),
    summary: nonempty,
    limitations: z.array(nonempty),
    verifiedAt: calendarDate.nullable(),
    updatedAt: calendarDate.nullable(),
    evidence: z.array(evidenceSchema),
    relatedLogIds: z.array(stableId),
    approvedPublic: z.literal(true),
  })
  .strict()
  .superRefine((record, ctx) => {
    if (
      record.availability === "verified" &&
      (!record.verifiedAt || record.evidence.length === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["availability"],
        message:
          "Verified availability requires a real verification date and evidence",
      });
    }
    if (
      ["partial", "unavailable"].includes(record.availability) &&
      record.limitations.length === 0
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["limitations"],
        message: "Partial or unavailable records must state their limitations",
      });
    }
    if (record.workStatus === "blocked" && record.limitations.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["limitations"],
        message: "Blocked work must explain the known limitation",
      });
    }
    if (
      record.verifiedAt &&
      record.updatedAt &&
      record.updatedAt < record.verifiedAt
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["updatedAt"],
        message: "Update date cannot precede verification date",
      });
    }
    if (
      new Set(record.evidence.map((item) => item.id)).size !==
      record.evidence.length
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["evidence"],
        message: "Evidence IDs must be unique within each record",
      });
    }
    if (new Set(record.relatedLogIds).size !== record.relatedLogIds.length) {
      ctx.addIssue({
        code: "custom",
        path: ["relatedLogIds"],
        message: "Log references must not be repeated",
      });
    }
  });

export const logSchema = z
  .object({
    id: stableId,
    title: nonempty,
    date: calendarDate,
    gameVersion: z.literal(GAME_VERSION),
    summary: nonempty,
    relatedRecordIds: z.array(stableId),
    approvedPublic: z.literal(true),
    body: nonempty,
  })
  .strict()
  .superRefine((log, ctx) => {
    marked.walkTokens(marked.lexer(log.body), (token) => {
      if (token.type === "html") {
        ctx.addIssue({
          code: "custom",
          path: ["body"],
          message: "Raw HTML is not accepted in public Markdown logs",
        });
      }
      if (
        (token.type === "link" || token.type === "image") &&
        !publicHttpsUrl.safeParse(token.href).success
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["body"],
          message:
            "Markdown links and images require reviewed public HTTPS URLs",
        });
      }
      if (token.type === "image" && !token.text.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["body"],
          message: "Markdown images need meaningful alt text",
        });
      }
    });
    if (new Set(log.relatedRecordIds).size !== log.relatedRecordIds.length) {
      ctx.addIssue({
        code: "custom",
        path: ["relatedRecordIds"],
        message: "Record references must not be repeated",
      });
    }
  });

export type ArchiveRecord = z.infer<typeof recordSchema>;
export type ArchiveLog = z.infer<typeof logSchema>;
export type Archive = { records: ArchiveRecord[]; logs: ArchiveLog[] };

/** Fail closed instead of hiding private content after it has entered a public repository. */
export function validateArchive(
  rawRecords: unknown,
  rawLogs: unknown,
): Archive {
  const records = z.array(recordSchema).parse(rawRecords);
  const logs = z.array(logSchema).parse(rawLogs);
  const recordIds = new Set(records.map((record) => record.id));
  const logIds = new Set(logs.map((log) => log.id));
  if (recordIds.size !== records.length) throw new Error("Duplicate record ID");
  if (logIds.size !== logs.length) throw new Error("Duplicate log ID");
  for (const record of records) {
    for (const id of record.relatedLogIds) {
      if (!logIds.has(id))
        throw new Error(
          `Record ${record.id} references missing public log ${id}`,
        );
    }
  }
  for (const log of logs) {
    for (const id of log.relatedRecordIds) {
      if (!recordIds.has(id))
        throw new Error(`Log ${log.id} references missing public record ${id}`);
    }
  }
  return {
    records,
    logs: logs.sort(
      (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id),
    ),
  };
}

// npm scripts run at the project root. Avoid import.meta.url: Astro bundles this
// module into a generated directory before prerendering the static pages.
export function loadArchive(root: string = process.cwd()): Archive {
  const rawRecords: unknown = JSON.parse(
    readFileSync(join(root, "src/data/records.json"), "utf8"),
  );
  const logDirectory = join(root, "src/content/logs");
  const entries = readdirSync(logDirectory, { withFileTypes: true });
  if (
    entries.some(
      (entry) =>
        !entry.isFile() ||
        (entry.name !== ".gitkeep" && !entry.name.endsWith(".md")),
    )
  ) {
    throw new Error(
      "Public log directory may contain only Markdown files and .gitkeep",
    );
  }
  const rawLogs = entries
    .filter((entry) => entry.name.endsWith(".md"))
    .map(({ name: file }) => {
      const source = readFileSync(join(logDirectory, file), "utf8").replace(
        /^\uFEFF/,
        "",
      );
      // gray-matter supports executable frontmatter languages; accept plain YAML
      // delimiters only, before invoking its parser or inspecting approval fields.
      if (!/^---\r?\n/.test(source))
        throw new Error(`Log must begin with plain YAML frontmatter: ${file}`);
      const { data, content } = matter(source);
      if (data.id !== basename(file, ".md"))
        throw new Error(`Log filename must match stable ID: ${file}`);
      return { ...data, body: content.trim() };
    });
  return validateArchive(rawRecords, rawLogs);
}

export const { records, logs } = loadArchive();
