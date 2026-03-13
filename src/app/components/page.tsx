import { ShowcaseSection } from "@/components/showcase/showcase-section";
import {
  Badge,
  Button,
  type ButtonProps,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DiffLine,
  ToggleField,
  ToggleLabel,
  ToggleRoot,
  ToggleThumb,
} from "@/components/ui";
import { CodeBlock } from "@/components/ui/server";

const buttonVariantOptions: Array<NonNullable<ButtonProps["variant"]>> = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "destructive",
];

const buttonSizeOptions: Array<NonNullable<ButtonProps["size"]>> = [
  "sm",
  "md",
  "lg",
  "icon",
];

const badgeVariantOptions = ["critical", "warning", "good", "neutral"] as const;

const showcaseCode = [
  "function calculateTotal(items) {",
  "  var total = 0;",
  "  for (var i = 0; i < items.length; i++) {",
  "    total = total + items[i].price;",
  "  }",
  "}",
].join("\n");

export default function ComponentsPage() {
  return (
    <main className="min-h-full bg-white px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="overflow-hidden rounded-[24px] border border-border-primary bg-page text-foreground-inverse shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
          <div className="flex flex-col gap-6 px-6 py-8 sm:px-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-[12px] font-medium uppercase tracking-[0.24em] text-accent-green">
                UI components
              </span>
              <span className="rounded-full border border-border-primary px-3 py-1 font-mono text-[11px] text-white/64">
                /components
              </span>
            </div>

            <div className="flex max-w-3xl flex-col gap-3">
              <h1 className="font-sans text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">
                Visual playground for reusable UI primitives.
              </h1>
              <p className="max-w-2xl font-sans text-sm leading-6 text-white/72 sm:text-base">
                This page centralizes every generic UI building block and shows
                the current visual permutations we extracted from the Pencil
                component library.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
          <ShowcaseSection.Root>
            <ShowcaseSection.Header>
              <ShowcaseSection.Eyebrow>Button</ShowcaseSection.Eyebrow>
              <ShowcaseSection.Title>Variant gallery</ShowcaseSection.Title>
              <ShowcaseSection.Description>
                The base button comes from the Pencil selection and is extended
                with variants, sizes, and width behavior.
              </ShowcaseSection.Description>
            </ShowcaseSection.Header>

            <ShowcaseSection.Body className="grid gap-4">
              {buttonVariantOptions.map((variant) => (
                <div
                  key={variant}
                  className="rounded-[20px] border border-black/8 bg-secondary/40 p-4"
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-black/52">
                      {variant}
                    </span>
                    <span className="font-mono text-[11px] text-black/40">
                      default state
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant={variant}>roast_my_code</Button>
                    <Button size="sm" variant={variant}>
                      run
                    </Button>
                    <Button size="lg" variant={variant}>
                      deploy_build
                    </Button>
                    <Button
                      aria-label={`${variant} icon button`}
                      size="icon"
                      variant={variant}
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </ShowcaseSection.Body>
          </ShowcaseSection.Root>

          <div className="flex flex-col gap-6">
            <ShowcaseSection.Root>
              <ShowcaseSection.Header>
                <ShowcaseSection.Eyebrow>Button</ShowcaseSection.Eyebrow>
                <ShowcaseSection.Title>Size scale</ShowcaseSection.Title>
              </ShowcaseSection.Header>

              <ShowcaseSection.Body className="flex flex-col gap-4">
                {buttonSizeOptions.map((size) => (
                  <div
                    key={size}
                    className="flex items-center justify-between gap-4 rounded-[20px] border border-black/8 bg-secondary/40 p-4"
                  >
                    <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-black/52">
                      {size}
                    </span>
                    <Button
                      aria-label={
                        size === "icon" ? "icon size button" : undefined
                      }
                      size={size}
                    >
                      {size === "icon" ? "+" : `size_${size}`}
                    </Button>
                  </div>
                ))}
              </ShowcaseSection.Body>
            </ShowcaseSection.Root>

            <ShowcaseSection.Root>
              <ShowcaseSection.Header>
                <ShowcaseSection.Eyebrow>Button</ShowcaseSection.Eyebrow>
                <ShowcaseSection.Title>
                  States and overrides
                </ShowcaseSection.Title>
              </ShowcaseSection.Header>

              <ShowcaseSection.Body className="flex flex-col gap-4">
                <div className="rounded-[20px] border border-black/8 bg-secondary/40 p-4">
                  <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-black/40">
                    Disabled
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button disabled>roast_my_code</Button>
                    <Button disabled variant="outline">
                      outline_disabled
                    </Button>
                  </div>
                </div>

                <div className="rounded-[20px] border border-black/8 bg-secondary/40 p-4">
                  <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-black/40">
                    Full width
                  </p>
                  <Button fullWidth>start_full_scan</Button>
                </div>

                <div className="rounded-[20px] border border-black/8 bg-secondary/40 p-4">
                  <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-black/40">
                    Class override via tailwind-variants
                  </p>
                  <Button className="border border-border-primary bg-white text-foreground">
                    custom_override
                  </Button>
                </div>
              </ShowcaseSection.Body>
            </ShowcaseSection.Root>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <ShowcaseSection.Root>
            <ShowcaseSection.Header>
              <ShowcaseSection.Eyebrow>Toggle</ShowcaseSection.Eyebrow>
              <ShowcaseSection.Title>Switch primitive</ShowcaseSection.Title>
              <ShowcaseSection.Description>
                Built on Base UI&apos;s Switch primitive so the behavior stays
                accessible and reusable.
              </ShowcaseSection.Description>
            </ShowcaseSection.Header>

            <ShowcaseSection.Body className="rounded-[20px] bg-page p-5 text-foreground-inverse">
              <div className="flex flex-col gap-4">
                <ToggleField>
                  <ToggleRoot defaultChecked>
                    <ToggleThumb />
                  </ToggleRoot>
                  <ToggleLabel>roast mode</ToggleLabel>
                </ToggleField>
                <ToggleField>
                  <ToggleRoot>
                    <ToggleThumb />
                  </ToggleRoot>
                  <ToggleLabel>roast mode</ToggleLabel>
                </ToggleField>
                <ToggleField>
                  <ToggleRoot defaultChecked disabled>
                    <ToggleThumb />
                  </ToggleRoot>
                  <ToggleLabel>disabled mode</ToggleLabel>
                </ToggleField>
              </div>
            </ShowcaseSection.Body>
          </ShowcaseSection.Root>

          <ShowcaseSection.Root>
            <ShowcaseSection.Header>
              <ShowcaseSection.Eyebrow>Badge</ShowcaseSection.Eyebrow>
              <ShowcaseSection.Title>Status labels</ShowcaseSection.Title>
              <ShowcaseSection.Description>
                Compact status markers for verdicts, severities, and labels that
                repeat throughout the app.
              </ShowcaseSection.Description>
            </ShowcaseSection.Header>

            <ShowcaseSection.Body className="flex flex-col gap-4 rounded-[20px] bg-page p-5 text-foreground-inverse">
              <div className="flex flex-wrap items-center gap-6">
                {badgeVariantOptions.map((variant) => (
                  <Badge key={variant} variant={variant}>
                    {variant === "good" ? "good" : variant}
                  </Badge>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <Badge variant="critical">needs_serious_help</Badge>
                <Badge variant="neutral">javascript</Badge>
                <Badge dot={false} variant="warning">
                  no_dot_label
                </Badge>
              </div>
            </ShowcaseSection.Body>
          </ShowcaseSection.Root>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <ShowcaseSection.Root>
            <ShowcaseSection.Header>
              <ShowcaseSection.Eyebrow>Card</ShowcaseSection.Eyebrow>
              <ShowcaseSection.Title>Compound layout</ShowcaseSection.Title>
              <ShowcaseSection.Description>
                `Card`, `CardHeader`, `CardTitle`, `CardDescription`, and
                `CardContent` compose the analysis surface from the Pencil
                reference.
              </ShowcaseSection.Description>
            </ShowcaseSection.Header>

            <ShowcaseSection.Body className="rounded-[20px] bg-page p-5">
              <Card className="max-w-[480px]">
                <CardHeader>
                  <Badge variant="critical">critical</Badge>
                  <CardTitle>using var instead of const/let</CardTitle>
                  <CardDescription>
                    The `var` keyword is function-scoped rather than
                    block-scoped, which can lead to unexpected behavior and
                    bugs. Modern JavaScript favors `const` and `let` instead.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="warning">hoisted_scope</Badge>
                    <Button size="sm">view_fix</Button>
                  </div>
                </CardContent>
              </Card>
            </ShowcaseSection.Body>
          </ShowcaseSection.Root>

          <ShowcaseSection.Root>
            <ShowcaseSection.Header>
              <ShowcaseSection.Eyebrow>Diff</ShowcaseSection.Eyebrow>
              <ShowcaseSection.Title>
                Line-by-line changes
              </ShowcaseSection.Title>
              <ShowcaseSection.Description>
                Minimal diff rows for code review summaries, inline fixes, or
                result summaries.
              </ShowcaseSection.Description>
            </ShowcaseSection.Header>

            <ShowcaseSection.Body className="overflow-hidden rounded-[20px] bg-page p-5">
              <div className="flex flex-col gap-1 overflow-hidden border border-border-primary bg-surface-panel">
                <DiffLine.Root variant="removed">
                  <DiffLine.Prefix />
                  <DiffLine.Content>var total = 0;</DiffLine.Content>
                </DiffLine.Root>
                <DiffLine.Root variant="added">
                  <DiffLine.Prefix />
                  <DiffLine.Content>const total = 0;</DiffLine.Content>
                </DiffLine.Root>
                <DiffLine.Root variant="context">
                  <DiffLine.Prefix />
                  <DiffLine.Content>
                    {"for (let i = 0; i < items.length; i++) {"}
                  </DiffLine.Content>
                </DiffLine.Root>
              </div>
            </ShowcaseSection.Body>
          </ShowcaseSection.Root>
        </section>

        <section>
          <ShowcaseSection.Root>
            <ShowcaseSection.Header>
              <ShowcaseSection.Eyebrow>Code Block</ShowcaseSection.Eyebrow>
              <ShowcaseSection.Title>
                Server-rendered syntax highlighting
              </ShowcaseSection.Title>
              <ShowcaseSection.Description>
                The code block is rendered only on the server with Shiki using
                the `vesper` theme, plus a reusable file header and optional
                line numbers.
              </ShowcaseSection.Description>
            </ShowcaseSection.Header>

            <ShowcaseSection.Body>
              <CodeBlock.Root>
                <CodeBlock.Header>
                  <CodeBlock.TrafficLights />
                  <CodeBlock.Filename>calculate.js</CodeBlock.Filename>
                </CodeBlock.Header>
                <CodeBlock.Content lang="javascript">
                  {showcaseCode}
                </CodeBlock.Content>
              </CodeBlock.Root>
            </ShowcaseSection.Body>
          </ShowcaseSection.Root>
        </section>
      </div>
    </main>
  );
}
