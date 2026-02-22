# Session Optimization Guide

Running AI development sessions on machines with 4GB RAM requires careful management to prevent crashes and connection aborts. Use these practical techniques to maintain a stable environment.

## Context Optimization

Keep the session focused to prevent memory bloat and performance lag.

- **Summarize old history.** When a conversation grows long, summarize the key points and findings. Start a new session with this summary to clear out the heavy history while keeping essential context.
- **Include only what's necessary.** Only add the current task, relevant files, and the active plan to your context.
- **Remove completed items.** Once a task is finished and verified, stop including its specific code details in every prompt.
- **Split large tasks.** Break down complex features into small, manageable chunks. Tackle one small piece per session.

## RAM Optimization

Limited memory means every byte counts.

- **Use smaller models.** Stick to efficient models that require less memory when the task allows.
- **Close background apps.** Shut down unused browser tabs, IDE plugins, or other applications that consume RAM.
- **Run one session.** Focus on a single AI task at a time to avoid splitting resources.
- **Use quantized models.** If running locally, choose versions designed to fit into smaller memory footprints.

## Session Management

Manage the lifecycle of your sessions to avoid hitting memory limits.

- **Summarize early.** Don't wait for the connection to drop. Summarize your progress before the context window fills up.
- **Use the handoff command.** When a session becomes too large, use a handoff to transition to a fresh one. This preserves your state without carrying over the entire message history.
- **Document decisions.** Record architectural choices and problems in your notepad files. This keeps important info accessible outside the active session memory.
- **End sessions cleanly.** Finish with a clear summary of what was done and what needs to happen next.

## Practical Tips

- **Keep documents updated.** Treat your README and docs as the source of truth. It's easier for the AI to read a short doc than to re-learn everything from scratch.
- **Use the notepad.** Append learnings and issues to `.sisyphus/notepads/` files immediately. This offloads information from the active context.
- **Keep it simple.** Don't attempt massive refactors in a single session. Small, iterative changes are safer and more reliable.
- **Monitor your system.** Keep an eye on memory usage and restart the environment if things start to feel sluggish.
