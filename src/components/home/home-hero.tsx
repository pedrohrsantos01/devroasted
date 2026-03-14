import { HomeCodeEditor } from "@/components/home/home-code-editor";
import {
  Button,
  ToggleField,
  ToggleLabel,
  ToggleRoot,
  ToggleThumb,
} from "@/components/ui";

export function HomeHero() {
  return (
    <section className="flex flex-col items-center gap-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <h1 className="flex flex-wrap items-center justify-center gap-3 font-mono text-3xl font-bold tracking-[-0.04em] text-foreground-inverse sm:text-4xl md:text-5xl">
          <span className="text-accent-green">$</span>
          <span>paste your code. get roasted.</span>
        </h1>

        <p className="max-w-[720px] font-sans text-sm leading-6 text-muted md:text-[14px]">
          {
            "// drop your code below and we'll rate it - brutally honest or full roast mode"
          }
        </p>
      </div>

      <HomeCodeEditor className="w-full max-w-[780px]" />

      <div className="flex w-full max-w-[780px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <ToggleField className="justify-center sm:justify-start">
            <ToggleRoot defaultChecked>
              <ToggleThumb />
            </ToggleRoot>
            <ToggleLabel>roast mode</ToggleLabel>
          </ToggleField>
          <span className="font-sans text-[12px] text-subtle">
            {"// maximum sarcasm enabled"}
          </span>
        </div>

        <Button className="focus-visible:ring-offset-page">
          $ roast_my_code
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 font-sans text-[12px] text-subtle">
        <span>2,847 codes roasted</span>
        <span className="font-mono">.</span>
        <span>avg score: 4.2/10</span>
      </div>
    </section>
  );
}
