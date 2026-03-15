import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";
import { act, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import type { SupportedLanguageId } from "@/components/home/editor-language-registry";

type HomeHeroModule = typeof import("./home-hero");
type HomeHeroDependencies = HomeHeroModule["homeHeroDependencies"];
type HomeCodeEditorProps = Parameters<
  HomeHeroDependencies["HomeCodeEditor"]
>[0];
type MutationOptions = Parameters<HomeHeroDependencies["useMutation"]>[0];

test("HomeHero disables duplicate submission while a roast is pending", async () => {
  const rendered = await renderHomeHero();

  const submitButton = rendered.getSubmitButton();

  await rendered.clickSubmit();

  assert.equal(rendered.getSubmittedPayloads().length, 1);
  assert.equal(submitButton.disabled, true);

  await rendered.clickButton(submitButton);

  assert.equal(rendered.getSubmittedPayloads().length, 1);

  await rendered.cleanup();
});

test("HomeHero redirects to the roast page after a successful submit", async () => {
  const rendered = await renderHomeHero();

  await rendered.clickSubmit();
  await rendered.resolveSuccess("fresh-slug");

  assert.deepEqual(rendered.getPushCalls(), ["/roasts/fresh-slug"]);

  await rendered.cleanup();
});

test("HomeHero shows inline error text after a failed submit", async () => {
  const rendered = await renderHomeHero();

  await rendered.clickSubmit();
  await rendered.resolveError();

  assert.match(
    rendered.getTextContent(),
    /We could not submit your snippet right now\. Try again in a moment\./,
  );

  await rendered.cleanup();
});

async function renderHomeHero() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/",
  });

  installDomGlobals(dom);

  const module = await import("./home-hero");

  assert.ok("homeHeroDependencies" in module);

  const { HomeHero, homeHeroDependencies } = module as HomeHeroModule;

  const mutationController = createMutationController();
  const pushCalls: string[] = [];
  const originalDependencies = { ...homeHeroDependencies };

  homeHeroDependencies.HomeCodeEditor = createStubHomeCodeEditor();

  homeHeroDependencies.useRouter = () => ({
    back() {},
    forward() {},
    push: (href: string) => {
      pushCalls.push(href);
    },
    prefetch: async () => {},
    refresh() {},
    replace() {},
  });

  homeHeroDependencies.useTRPC = (() => ({
    roasts: {
      submit: {
        mutationOptions: (options: MutationOptions) => options,
      },
    },
  })) as unknown as HomeHeroDependencies["useTRPC"];

  homeHeroDependencies.useMutation =
    mutationController.useMutation as unknown as HomeHeroDependencies["useMutation"];

  const container = document.createElement("div");
  document.body.append(container);

  const root = createRoot(container);

  await act(async () => {
    root.render(<HomeHero />);
  });

  return {
    async cleanup() {
      await act(async () => {
        root.unmount();
      });

      container.remove();
      restoreDomGlobals(dom);
      Object.assign(homeHeroDependencies, originalDependencies);
    },
    async clickSubmit() {
      await this.clickButton(this.getSubmitButton());
    },
    async clickButton(button: HTMLButtonElement) {
      await act(async () => {
        button.dispatchEvent(
          new dom.window.MouseEvent("click", { bubbles: true }),
        );
      });
    },
    getPushCalls() {
      return pushCalls;
    },
    getSubmitButton() {
      const button = Array.from(container.querySelectorAll("button")).find(
        (candidate) => candidate.textContent?.includes("roast_my_code"),
      );

      assert.ok(button instanceof dom.window.HTMLButtonElement);

      return button as HTMLButtonElement;
    },
    getSubmittedPayloads() {
      return mutationController.getSubmittedPayloads();
    },
    getTextContent() {
      return container.textContent ?? "";
    },
    async resolveError() {
      await mutationController.resolveError();
    },
    async resolveSuccess(slug: string) {
      await mutationController.resolveSuccess(slug);
    },
  };
}

function createMutationController() {
  const submittedPayloads: unknown[] = [];
  let pendingHandlers:
    | {
        onError?: (error: Error) => void;
        onSuccess?: (result: { publicSlug: string }) => void;
        setIsPending: (value: boolean) => void;
      }
    | undefined;

  return {
    getSubmittedPayloads() {
      return submittedPayloads;
    },
    async resolveError() {
      assert.ok(pendingHandlers);

      await act(async () => {
        pendingHandlers?.setIsPending(false);
        pendingHandlers?.onError?.(new Error("submit failed"));
      });
    },
    async resolveSuccess(publicSlug: string) {
      assert.ok(pendingHandlers);

      await act(async () => {
        pendingHandlers?.setIsPending(false);
        pendingHandlers?.onSuccess?.({ publicSlug });
      });
    },
    useMutation(options: {
      onError?: (error: Error) => void;
      onSuccess?: (result: { publicSlug: string }) => void;
    }) {
      const [isPending, setIsPending] = useState(false);

      pendingHandlers = {
        onError: options.onError,
        onSuccess: options.onSuccess,
        setIsPending,
      };

      return {
        isPending,
        mutate(payload: unknown) {
          submittedPayloads.push(payload);
          setIsPending(true);
        },
      };
    },
  };
}

function createStubHomeCodeEditor(): HomeHeroDependencies["HomeCodeEditor"] {
  return function StubHomeCodeEditor({
    onCodeChange,
    onLanguageChange,
  }: Pick<HomeCodeEditorProps, "onCodeChange" | "onLanguageChange">) {
    useEffect(() => {
      onCodeChange?.("const answer = 42;");
      onLanguageChange?.("typescript" satisfies SupportedLanguageId);
    }, [onCodeChange, onLanguageChange]);

    return <div data-testid="stub-editor" />;
  };
}

const originalGlobalDescriptors = {
  cancelAnimationFrame: Object.getOwnPropertyDescriptor(
    globalThis,
    "cancelAnimationFrame",
  ),
  document: Object.getOwnPropertyDescriptor(globalThis, "document"),
  HTMLElement: Object.getOwnPropertyDescriptor(globalThis, "HTMLElement"),
  MutationObserver: Object.getOwnPropertyDescriptor(
    globalThis,
    "MutationObserver",
  ),
  navigator: Object.getOwnPropertyDescriptor(globalThis, "navigator"),
  Node: Object.getOwnPropertyDescriptor(globalThis, "Node"),
  requestAnimationFrame: Object.getOwnPropertyDescriptor(
    globalThis,
    "requestAnimationFrame",
  ),
  window: Object.getOwnPropertyDescriptor(globalThis, "window"),
};

function installDomGlobals(dom: JSDOM) {
  Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
    configurable: true,
    value: true,
  });

  Object.defineProperties(globalThis, {
    cancelAnimationFrame: {
      configurable: true,
      value: (handle: number) => {
        dom.window.clearTimeout(handle);
      },
    },
    document: {
      configurable: true,
      value: dom.window.document,
    },
    HTMLElement: {
      configurable: true,
      value: dom.window.HTMLElement,
    },
    MutationObserver: {
      configurable: true,
      value: dom.window.MutationObserver,
    },
    navigator: {
      configurable: true,
      value: dom.window.navigator,
    },
    Node: {
      configurable: true,
      value: dom.window.Node,
    },
    requestAnimationFrame: {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        return dom.window.setTimeout(() => callback(Date.now()), 0);
      },
    },
    window: {
      configurable: true,
      value: dom.window,
    },
  });
}

function restoreDomGlobals(dom: JSDOM) {
  dom.window.close();
  Reflect.deleteProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT");

  for (const [key, descriptor] of Object.entries(originalGlobalDescriptors)) {
    if (descriptor) {
      Object.defineProperty(globalThis, key, descriptor);
      continue;
    }

    Reflect.deleteProperty(globalThis, key);
  }
}
