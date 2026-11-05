---
"@ilokesto/toast": patch
---

Start queued toast lifetimes when displayed. Preserve remaining duration across limit changes and pauses, keep closing rows in their slot until removal, and reset updated IDs without consuming their lifetime in the queue.
