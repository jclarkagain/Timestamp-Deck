---
name: Expo mobile workflow
description: Environment-specific dependency and workflow notes for nested Expo artifacts.
---

When adding a dependency to a nested Expo artifact in this monorepo, the generic package helper may target the workspace root and reject the install. Run the package manager from the artifact directory instead so the dependency is recorded on the mobile package.

**Why:** The workspace contains multiple package manifests, while the helper invocation does not always infer the intended nested package.

**How to apply:** Confirm the dependency is Expo SDK-compatible, then install from the target artifact directory. The managed Expo workflow can still serve Metro when the optional React Native DevTools binary logs a missing GLib library; that warning affects DevTools only, not the app preview.