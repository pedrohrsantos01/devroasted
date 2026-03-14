"use client";

import { Select } from "@base-ui/react/select";

import {
  AUTO_LANGUAGE_VALUE,
  editorLanguageOptions,
  getEditorLanguageLabel,
  type SupportedLanguageId,
} from "@/components/home/editor-language-registry";

const languageSelectItems = [
  { label: "Auto", value: AUTO_LANGUAGE_VALUE },
  ...editorLanguageOptions.map((language) => ({
    label: language.label,
    value: language.id,
  })),
];

export interface HomeCodeLanguageSelectProps {
  detectedLanguage: SupportedLanguageId;
  disabled?: boolean;
  manualLanguage: SupportedLanguageId | null;
  onManualLanguageChange: (language: SupportedLanguageId | null) => void;
}

export function HomeCodeLanguageSelect({
  detectedLanguage,
  disabled = false,
  manualLanguage,
  onManualLanguageChange,
}: HomeCodeLanguageSelectProps) {
  const value = manualLanguage ?? AUTO_LANGUAGE_VALUE;
  const triggerLabel =
    manualLanguage === null
      ? detectedLanguage === "plaintext"
        ? "Auto"
        : `Auto (${getEditorLanguageLabel(detectedLanguage)})`
      : getEditorLanguageLabel(manualLanguage);

  return (
    <Select.Root
      disabled={disabled}
      items={languageSelectItems}
      onValueChange={(nextValue) => {
        if (nextValue === AUTO_LANGUAGE_VALUE) {
          onManualLanguageChange(null);

          return;
        }

        onManualLanguageChange(nextValue as SupportedLanguageId);
      }}
      value={value}
    >
      <Select.Trigger className="inline-flex h-8 min-w-[156px] items-center justify-between border border-border-primary bg-surface px-3 font-mono text-[12px] text-foreground-inverse transition duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page disabled:cursor-not-allowed disabled:opacity-50">
        <span className="truncate">{triggerLabel}</span>
        <Select.Icon className="ml-3 text-subtle">v</Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Positioner sideOffset={8}>
          <Select.Popup className="z-50 max-h-[280px] w-[220px] overflow-hidden border border-border-primary bg-surface shadow-[0_20px_40px_rgba(0,0,0,0.35)] outline-none">
            <Select.List className="max-h-[280px] overflow-auto py-1">
              {languageSelectItems.map((item) => (
                <Select.Item
                  key={item.value}
                  className="flex cursor-pointer items-center gap-3 px-3 py-2 font-mono text-[12px] text-muted outline-none transition duration-150 ease-out data-[highlighted]:bg-page data-[highlighted]:text-foreground-inverse"
                  value={item.value}
                >
                  <Select.ItemText>{item.label}</Select.ItemText>
                  <Select.ItemIndicator className="ml-auto text-accent-green">
                    *
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
