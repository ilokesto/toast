---
"@ilokesto/toast": patch
---

Prevent stale promise settlements from recreating cleared, removed or unmounted toast state or overwriting newer requests with the same ID. Preserve each caller's original fulfillment value or rejection and skip obsolete message resolvers.
