import "dotenv/config";

import { faker } from "@faker-js/faker";
import { count } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import {
  type codeLanguageEnum,
  roastFindings,
  type roastModeEnum,
  roasts,
  type roastVisibilityEnum,
} from "./schema";

type CodeLanguage = (typeof codeLanguageEnum.enumValues)[number];
type RoastInsert = typeof roasts.$inferInsert;
type RoastFindingInsert = typeof roastFindings.$inferInsert;
type RoastMode = (typeof roastModeEnum.enumValues)[number];
type RoastVisibility = (typeof roastVisibilityEnum.enumValues)[number];

type CodeTemplate = {
  improvedCode: string;
  language: CodeLanguage;
  originalCode: string;
  templateKey: string;
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, {
  casing: "snake_case",
  schema: {
    roastFindings,
    roasts,
  },
});

const issueLibrary = [
  {
    description:
      "The snippet leans on side effects, which makes each refactor more expensive than it needs to be.",
    title: "Side effects are driving",
  },
  {
    description:
      "Naming and flow control are doing very little work here, so the reader has to simulate the code mentally.",
    title: "Cognitive load is too high",
  },
  {
    description:
      "Error handling is either too broad or too optimistic, which is exactly how production bugs sneak in.",
    title: "Error handling is wishful thinking",
  },
  {
    description:
      "The implementation solves the happy path first and leaves the edge cases to pure luck.",
    title: "Edge cases are freelancing",
  },
  {
    description:
      "Repeated logic shows up fast, which is a sign the abstraction line is in the wrong place.",
    title: "Duplication is already spreading",
  },
  {
    description:
      "The code mixes formatting, orchestration, and business rules in one place, which makes it harder to test.",
    title: "Responsibilities are tangled",
  },
];

const strengthLibrary = [
  {
    description:
      "Even in rough shape, the main intent is still visible enough to refactor without archaeology.",
    title: "Intent still survives",
  },
  {
    description:
      "The snippet is short enough that a cleanup pass could pay off quickly.",
    title: "Refactor cost is manageable",
  },
  {
    description:
      "There is a reasonable core idea here, it just needs tighter structure and naming.",
    title: "Core idea is salvageable",
  },
  {
    description:
      "The happy path is at least easy to spot, which makes the next iteration much simpler.",
    title: "Main flow is readable",
  },
];

const templateFactories: Array<() => CodeTemplate> = [
  createJavaScriptTemplate,
  createTypeScriptTemplate,
  createTsxTemplate,
  createPythonTemplate,
  createSqlTemplate,
  createBashTemplate,
  createHtmlTemplate,
  createCssTemplate,
  createJsonTemplate,
];

async function main() {
  faker.seed(20260314);

  const roastRows: Array<RoastInsert> = [];
  const findingRows: Array<RoastFindingInsert> = [];

  for (let index = 0; index < 100; index++) {
    const roastRecord = createRoastRecord(index);

    roastRows.push(roastRecord.roast);
    findingRows.push(...roastRecord.findings);
  }

  await db.transaction(async (tx) => {
    await tx.delete(roastFindings);
    await tx.delete(roasts);
    await tx.insert(roasts).values(roastRows);
    await tx.insert(roastFindings).values(findingRows);
  });

  const [roastCount, findingCount] = await Promise.all([
    db.select({ value: count() }).from(roasts),
    db.select({ value: count() }).from(roastFindings),
  ]);

  console.log(
    `Seed complete: ${roastCount[0]?.value ?? 0} roasts, ${findingCount[0]?.value ?? 0} findings.`,
  );

  await pool.end();
}

function createRoastRecord(index: number) {
  const id = faker.string.uuid();
  const template = faker.helpers.arrayElement(templateFactories)();
  const scoreNumber = createScore();
  const verdict = getVerdict(scoreNumber);
  const mode = pickMode();
  const visibility = pickVisibility();
  const lineCount = countLines(template.originalCode);
  const createdAt = faker.date.between({
    from: daysAgo(120),
    to: new Date(),
  });
  const completedAt = new Date(
    createdAt.getTime() + faker.number.int({ min: 90_000, max: 7_200_000 }),
  );
  const updatedAt = new Date(
    completedAt.getTime() + faker.number.int({ min: 15_000, max: 2_400_000 }),
  );
  const publishedAt =
    visibility === "public"
      ? new Date(
          completedAt.getTime() +
            faker.number.int({ min: 10_000, max: 900_000 }),
        )
      : undefined;

  const roast: RoastInsert = {
    completedAt,
    createdAt,
    id,
    improvedCode: template.improvedCode,
    language: template.language,
    lineCount,
    meta: {
      generator: "manual-faker-seed",
      modeProfile: mode,
      seededAt: new Date().toISOString(),
      templateKey: template.templateKey,
      visibilityProfile: visibility,
    },
    mode,
    originalCode: template.originalCode,
    publicSlug: createPublicSlug(index, template.language),
    publishedAt,
    score: scoreNumber.toFixed(1),
    status: "completed",
    summary: buildSummary(scoreNumber, template.language),
    updatedAt,
    verdictLabel: verdict,
    visibility,
  };

  return {
    findings: createFindings({
      createdAt,
      language: template.language,
      lineCount,
      roastId: id,
      score: scoreNumber,
    }),
    roast,
  };
}

function createFindings(input: {
  createdAt: Date;
  language: CodeLanguage;
  lineCount: number;
  roastId: string;
  score: number;
}) {
  const issueCount = input.score < 3 ? 4 : input.score < 6 ? 3 : 2;
  const strengthCount = input.score >= 7 ? 2 : 1;

  const issueFindings = faker.helpers
    .shuffle(issueLibrary)
    .slice(0, issueCount)
    .map((item, index) => {
      const range = pickLineRange(input.lineCount);

      return {
        createdAt: new Date(
          input.createdAt.getTime() +
            faker.number.int({ min: 15_000, max: 300_000 }),
        ),
        description: `${item.description} The seeded ${input.language} sample makes this pain very visible.`,
        id: faker.string.uuid(),
        kind: "issue" as const,
        lineEnd: range.lineEnd,
        lineStart: range.lineStart,
        roastId: input.roastId,
        severity: input.score < 3.5 && index < 2 ? "critical" : "warning",
        sortOrder: index,
        title: item.title,
      } satisfies RoastFindingInsert;
    });

  const strengthFindings = faker.helpers
    .shuffle(strengthLibrary)
    .slice(0, strengthCount)
    .map((item, index) => ({
      createdAt: new Date(
        input.createdAt.getTime() +
          faker.number.int({ min: 90_000, max: 600_000 }),
      ),
      description: `${item.description} There is enough signal in this ${input.language} snippet to justify another pass instead of a rewrite.`,
      id: faker.string.uuid(),
      kind: "strength" as const,
      roastId: input.roastId,
      severity: "good" as const,
      sortOrder: issueFindings.length + index,
      title: item.title,
    })) satisfies Array<RoastFindingInsert>;

  return [...issueFindings, ...strengthFindings];
}

function createScore() {
  const roll = faker.number.int({ min: 1, max: 100 });

  if (roll <= 20) {
    return faker.number.float({ fractionDigits: 1, max: 2.9, min: 0.8 });
  }

  if (roll <= 65) {
    return faker.number.float({ fractionDigits: 1, max: 6.4, min: 3.0 });
  }

  return faker.number.float({ fractionDigits: 1, max: 9.8, min: 6.5 });
}

function pickMode(): RoastMode {
  return faker.number.int({ max: 100, min: 1 }) <= 70 ? "roast" : "honest";
}

function pickVisibility(): RoastVisibility {
  const roll = faker.number.int({ max: 100, min: 1 });

  if (roll <= 82) {
    return "public";
  }

  if (roll <= 94) {
    return "private";
  }

  return "hidden";
}

function createPublicSlug(index: number, language: CodeLanguage) {
  const adjective = slugify(faker.word.adjective());
  const noun = slugify(faker.word.noun());

  return `${index + 1}-${language}-${adjective}-${noun}-${faker.string.alphanumeric({ casing: "lower", length: 6 })}`;
}

function getVerdict(score: number) {
  if (score < 2.5) {
    return "certified-spaghetti";
  }

  if (score < 5) {
    return "fixable-chaos";
  }

  if (score < 7.5) {
    return "surprisingly-salvageable";
  }

  return "annoyingly-competent";
}

function buildSummary(score: number, language: CodeLanguage) {
  if (score < 2.5) {
    return `This ${language} roast has enormous 'it works on my machine' energy.`;
  }

  if (score < 5) {
    return `The ${language} snippet ships plenty of confidence and not nearly enough discipline.`;
  }

  if (score < 7.5) {
    return `This ${language} sample is messy, but at least it still remembers what it wants to be.`;
  }

  return `The ${language} code escaped total public shame, but it is still one rushed refactor away from trouble.`;
}

function pickLineRange(lineCount: number) {
  const lineStart = faker.number.int({ max: lineCount, min: 1 });
  const maxSpread = Math.min(2, lineCount - lineStart);

  return {
    lineEnd: lineStart + faker.number.int({ max: maxSpread, min: 0 }),
    lineStart,
  };
}

function countLines(source: string) {
  return source.split("\n").length;
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function createJavaScriptTemplate(): CodeTemplate {
  const entity = toPascalCase(faker.hacker.noun());
  const entityList = toCamelCase(`${entity} list`);
  const functionName = `load${entity}`;

  return {
    improvedCode: `const ${entityList} = [1, 2, 3];

function ${functionName}(id) {
  return ${entityList}.find((itemId) => itemId === id) ?? null;
}

console.log(${functionName}(2));`,
    language: "javascript",
    originalCode: `const ${entityList} = [1,2,3]

function ${functionName}(id){
  var result = ${entityList}.filter(itemId => itemId == id)
  if(result.length == 0){
    return null
  }
  return result[0]
}

console.log(${functionName}(2))`,
    templateKey: "javascript-filter-lookup",
  };
}

function createTypeScriptTemplate(): CodeTemplate {
  const payload = toCamelCase(faker.hacker.noun());

  return {
    improvedCode: `type ApiResponse = {
  data?: Array<string>;
  error?: string;
};

export function parse${toPascalCase(payload)}(response: ApiResponse) {
  return response.data ?? [];
}`,
    language: "typescript",
    originalCode: `type ApiResponse = any

export function parse${toPascalCase(payload)}(response: ApiResponse){
  if(response && response.data){
    return response.data
  }
  return []
}`,
    templateKey: "typescript-any-response",
  };
}

function createTsxTemplate(): CodeTemplate {
  const componentName = `${toPascalCase(faker.commerce.productAdjective())}Panel`;

  return {
    improvedCode: `type ${componentName}Props = {
  isLoading: boolean;
  items: Array<string>;
};

export function ${componentName}({ isLoading, items }: ${componentName}Props) {
  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (items.length === 0) {
    return <p>Empty state</p>;
  }

  return <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}`,
    language: "tsx",
    originalCode: `export function ${componentName}(props:any){
  return <div>{props.loading ? 'Loading...' : props.items && props.items.length ? props.items.map((item:any, index:number) => <div key={index}>{item}</div>) : 'Empty state'}</div>
}`,
    templateKey: "tsx-nested-ternary",
  };
}

function createPythonTemplate(): CodeTemplate {
  const subject = toIdentifier(faker.hacker.noun()).toLowerCase();

  return {
    improvedCode: `import json


def load_${subject}(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as source:
        content = source.read()

    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return {}`,
    language: "python",
    originalCode: `import json


def load_${subject}(path):
    file = open(path, "r")
    content = file.read()
    file.close()
    try:
        return json.loads(content)
    except:
        return {}`,
    templateKey: "python-broad-except",
  };
}

function createSqlTemplate(): CodeTemplate {
  const tableName = `${toIdentifier(faker.hacker.noun()).toLowerCase()}_events`;

  return {
    improvedCode: `select
  id,
  status,
  created_at
from ${tableName}
where status = 'failed'
order by created_at desc
limit 25;`,
    language: "sql",
    originalCode: `select *
from ${tableName}
where status != 'ok'
order by created_at desc;`,
    templateKey: "sql-select-star",
  };
}

function createBashTemplate(): CodeTemplate {
  const target = toIdentifier(
    faker.system.directoryPath().split("/").pop() || "workspace",
  ).toLowerCase();

  return {
    improvedCode: `TARGET_DIR="./${target}"

for file in "$TARGET_DIR"/*; do
  printf 'processing %s\n' "$file"
done

rm -rf "$TARGET_DIR/tmp"`,
    language: "bash",
    originalCode: `TARGET_DIR=./${target}

for file in $(ls $TARGET_DIR); do
  echo processing $file
done

rm -rf $TARGET_DIR/tmp`,
    templateKey: "bash-unquoted-vars",
  };
}

function createHtmlTemplate(): CodeTemplate {
  const title = faker.company.catchPhrase();

  return {
    improvedCode: `<article class="card">
  <header>
    <h2>${title}</h2>
    <p>${faker.company.buzzPhrase()}</p>
  </header>
  <footer>
    <button type="button">Open details</button>
  </footer>
</article>`,
    language: "html",
    originalCode: `<div class="card">
  <div class="title">${title}</div>
  <div class="subtitle">${faker.company.buzzPhrase()}</div>
  <div class="button">Open details</div>
</div>`,
    templateKey: "html-non-semantic-card",
  };
}

function createCssTemplate(): CodeTemplate {
  const selector = toIdentifier(faker.hacker.noun()).toLowerCase();

  return {
    improvedCode: `:root {
  --panel-bg: #101414;
  --panel-accent: #5ef2a1;
}

.${selector}-panel {
  background: var(--panel-bg);
  border: 1px solid rgba(94, 242, 161, 0.24);
  color: var(--panel-accent);
  padding: 16px;
}`,
    language: "css",
    originalCode: `#${selector}Panel {
  background: black !important;
  color: #00ff00 !important;
  border: 1px solid #00ff00 !important;
  padding: 16px !important;
}`,
    templateKey: "css-important-overload",
  };
}

function createJsonTemplate(): CodeTemplate {
  const serviceName = toIdentifier(faker.company.name()).toLowerCase();

  return {
    improvedCode: `{
  "serviceName": "${serviceName}",
  "retries": 3,
  "timeoutMs": 5000,
  "features": {
    "cache": true,
    "metrics": true
  }
}`,
    language: "json",
    originalCode: `{
  "service_name": "${serviceName}",
  "timeout": "5s",
  "retry": true,
  "features": {
    "cache": "yes",
    "metrics": 1
  }
}`,
    templateKey: "json-inconsistent-config",
  };
}

function toIdentifier(value: string) {
  return value
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((chunk) => chunk.toLowerCase())
    .join(" ");
}

function toCamelCase(value: string) {
  const normalized = toIdentifier(value).split(" ").filter(Boolean);

  return normalized
    .map((chunk, index) => {
      if (index === 0) {
        return chunk;
      }

      return `${chunk[0]?.toUpperCase() ?? ""}${chunk.slice(1)}`;
    })
    .join("");
}

function toPascalCase(value: string) {
  return toIdentifier(value)
    .split(" ")
    .filter(Boolean)
    .map((chunk) => `${chunk[0]?.toUpperCase() ?? ""}${chunk.slice(1)}`)
    .join("");
}

function slugify(value: string) {
  return toIdentifier(value).replace(/\s+/g, "-");
}

void main().catch(async (error) => {
  console.error("Seed failed.");
  console.error(error);
  await pool.end();
  process.exit(1);
});
