import {
  Badge,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";

import type { RoastIssue } from "./roast-result-data";

export interface RoastIssueCardProps {
  issue: RoastIssue;
}

export function RoastIssueCard({ issue }: RoastIssueCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="gap-3 p-5">
        <Badge
          className="text-[12px] font-medium"
          dotClassName="size-2"
          size="sm"
          variant={issue.tone}
        >
          {issue.label}
        </Badge>

        <div className="flex flex-col gap-3">
          <CardTitle className="font-medium">{issue.title}</CardTitle>
          <CardDescription className="font-sans leading-5 text-muted">
            {issue.description}
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}
