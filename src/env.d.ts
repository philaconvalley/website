/// <reference path="../.astro/types.d.ts" />

// Alpine ships no type declarations of its own, and the DefinitelyTyped package
// trails the runtime by two minor versions — adding it would mean taking on a
// dependency that is known to describe a different version than the one we run.
// Only `start()` is called, and `window.Alpine` exists solely so the Alpine
// devtools extension can find it, so the surface is declared here instead.
declare module 'alpinejs' {
  const Alpine: { start(): void };
  export default Alpine;
}

interface Window {
  Alpine: { start(): void };
}
