import type { RoastDiffLine } from "./roast-result-types";

export function buildDiffLines(input: {
  improvedCode: string;
  originalCode: string;
}): ReadonlyArray<RoastDiffLine> {
  const originalLines = input.originalCode.split("\n");
  const improvedLines = input.improvedCode.split("\n");
  const lengths = Array.from({ length: originalLines.length + 1 }, () =>
    Array.from<number>({ length: improvedLines.length + 1 }).fill(0),
  );

  for (
    let originalIndex = 1;
    originalIndex <= originalLines.length;
    originalIndex++
  ) {
    const row = lengths[originalIndex];

    if (!row) {
      continue;
    }

    for (
      let improvedIndex = 1;
      improvedIndex <= improvedLines.length;
      improvedIndex++
    ) {
      if (
        originalLines[originalIndex - 1] === improvedLines[improvedIndex - 1]
      ) {
        row[improvedIndex] =
          (lengths[originalIndex - 1]?.[improvedIndex - 1] ?? 0) + 1;
        continue;
      }

      row[improvedIndex] = Math.max(
        lengths[originalIndex - 1]?.[improvedIndex] ?? 0,
        row[improvedIndex - 1] ?? 0,
      );
    }
  }

  const lines: RoastDiffLine[] = [];
  let originalIndex = originalLines.length;
  let improvedIndex = improvedLines.length;

  while (originalIndex > 0 || improvedIndex > 0) {
    if (
      originalIndex > 0 &&
      improvedIndex > 0 &&
      originalLines[originalIndex - 1] === improvedLines[improvedIndex - 1]
    ) {
      lines.push({
        content: originalLines[originalIndex - 1] ?? "",
        variant: "context",
      });
      originalIndex -= 1;
      improvedIndex -= 1;
      continue;
    }

    if (
      improvedIndex > 0 &&
      (originalIndex === 0 ||
        (lengths[originalIndex]?.[improvedIndex - 1] ?? 0) >=
          (lengths[originalIndex - 1]?.[improvedIndex] ?? 0))
    ) {
      lines.push({
        content: improvedLines[improvedIndex - 1] ?? "",
        variant: "added",
      });
      improvedIndex -= 1;
      continue;
    }

    lines.push({
      content: originalLines[originalIndex - 1] ?? "",
      variant: "removed",
    });
    originalIndex -= 1;
  }

  return lines.reverse();
}
