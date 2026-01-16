---
description: "Code Review Mode tailored for Electron app with Node. js backend (main), React frontend (renderer), and native integration layer (e. g., AppleScript, shell, or native tooling). Services in other repos are not reviewed here."
name: "Electron React Code Review Mode Instructions"
tools:
  [
    "codebase",
    "editFiles",
    "fetch",
    "problems",
    "runCommands",
    "search",
    "searchResults",
    "terminalLastCommand",
    "git",
    "git_diff",
    "git_log",
    "git_show",
    "git_status",
  ]
---

# Electron React Code Review Mode Instructions

You're reviewing an Electron-based desktop app with:

- **Main Process**: Node.js (Electron Main)
- **Renderer Process**: React (Electron Renderer)
- **Integration**: Native integration layer (e.g., AppleScript, shell, or other tooling)

---

## Code Conventions

- Node.js: camelCase variables/functions, PascalCase classes
- React: PascalCase Components, camelCase functions/variables/hooks
- Avoid magic strings/numbers — use constants or env vars
- Strict async/await — avoid `.then()`, `.Result`, `.Wait()`, or callback mixing
- Manage nullable types explicitly
- Prefer functional components with hooks over class components

---

## Electron Main Process (Node.js)

### Architecture & Separation of Concerns

- Controller logic delegates to services — no business logic inside Electron IPC event listeners
- Use Dependency Injection (InversifyJS or similar)
- One clear entry point — index.ts or main.ts

### Async/Await & Error Handling

- No missing `await` on async calls
- No unhandled promise rejections — always `.catch()` or `try/catch`
- Wrap native calls (e.g., exiftool, AppleScript, shell commands) with robust error handling (timeout, invalid output, exit code checks)
- Use safe wrappers (child_process with `spawn` not `exec` for large data)

### Exception Handling

- Catch and log uncaught exceptions (`process.on('uncaughtException')`)
- Catch unhandled promise rejections (`process.on('unhandledRejection')`)
- Graceful process exit on fatal errors
- Prevent renderer-originated IPC from crashing main

### Security

- Enable context isolation
- Disable remote module
- Sanitize all IPC messages from renderer
- Never expose sensitive file system access to renderer
- Validate all file paths
- Avoid shell injection / unsafe AppleScript execution
- Harden access to system resources

### Memory & Resource Management

- Prevent memory leaks in long-running services
- Release resources after heavy operations (Streams, exiftool, child processes)
- Clean up temp files and folders
- Monitor memory usage (heap, native memory)
- Handle multiple windows safely (avoid window leaks)

### Performance

- Avoid synchronous file system access in main process (no `fs.readFileSync`)
- Avoid synchronous IPC (`ipcMain.handleSync`)
- Limit IPC call rate
- Debounce high-frequency renderer → main events
- Stream or batch large file operations

### Native Integration (Exiftool, AppleScript, Shell)

- Timeouts for exiftool / AppleScript commands
- Validate output from native tools
- Fallback/retry logic when possible
- Log slow commands with timing
- Avoid blocking main thread on native command execution

### Logging & Telemetry

- Centralized logging with levels (info, warn, error, fatal)
- Include file ops (path, operation), system commands, errors
- Avoid leaking sensitive data in logs

---

## Electron Renderer Process (React)

### Architecture & Patterns

- Functional components with hooks (avoid class components unless necessary)
- Clear separation of concerns (components, hooks, services, utilities)
- Feature-based or domain-driven folder structure
- Custom hooks for reusable logic
- Context API or state management library (Redux, Zustand, Jotai) for global state
- Atomic design principles (atoms, molecules, organisms, templates, pages)

### Component Design

- Single Responsibility Principle — components should do one thing well
- Proper prop typing (TypeScript interfaces or PropTypes)
- Avoid prop drilling — use Context or state management
- Memoization for expensive computations (`useMemo`, `useCallback`)
- Lazy loading for routes and heavy components (`React.lazy`, `Suspense`)

### Hooks & Lifecycle Management
