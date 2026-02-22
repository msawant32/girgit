# Project: [Insert Project Name, e.g., Banker Web Portal]

## 1. Token Efficiency & Style (STRICT)
- **Conciseness:** Be extremely concise. Do not explain code unless requested.
- **Diffs Only:** When making changes, output *only* the modified lines or the specific function/block, not the entire file, unless it's a new file.
- **No Yapping:** skip phrases like "Here is the updated code" or "I have analyzed the file." Just output the code or answer.
- **Dry Run:** If a task seems complex, outline the plan in 3 bullet points before writing code.

 ## 2. The "Compounding Engineering" Rule (STRICT)
- **Self-Correction:** This file is our shared source of truth. Anytime Claude makes a mistake or uses an incorrect pattern, the correction MUST be documented in this file immediately.
- **Pull Requests:** During code review, if a reviewer tags `@.claude` with a correction, automatically add that learning to this `CLAUDE.md` file.

## 3. Workflow & Planning Directives
- **Plan Mode First:** For any new feature or Pull Request, always start in **Plan Mode** (`Shift+Tab` twice). Go back and forth to refine the architecture before switching to auto-accept edits.
- **Verification Loop (Crucial):** Never write code blindly. You must always use a tool to verify the output:
  - *Server Code:* Start the Node.js server (`npm run dev` in `/server`) and test the API endpoints.
  - *Web Code:* Start the React client (`npm start` in `/client`) and verify the UI renders correctly in the browser.
  - Act like a staff engineer or experienced professioal while checking all the mentioned items.
 
