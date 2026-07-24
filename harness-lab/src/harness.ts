import Anthropic from "@anthropic-ai/sdk";
import { fileURLToPath } from "url";
import { dirname, join, resolve, relative, isAbsolute } from "path";
import { readFile } from "fs/promises";
import { glob } from "fs/promises";
import { exec } from "child_process";
import { promisify } from "util";
import { createInterface } from "readline/promises";

const execAsync = promisify(exec);

// PROJECT_ROOT is the lol-wiki-frontend repo (two levels up from this file:
// harness-lab/src -> harness-lab -> repo root). Every tool is confined to it.
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..", "..");

const client = new Anthropic(); // reads ANTHROPIC_API_KEY / ant auth profile automatically

// ---------------------------------------------------------------------------
// Tool definitions — this is the contract the model sees. It only ever emits
// a `tool_use` block matching one of these schemas; the harness (this file)
// decides what actually happens when that's requested.
// ---------------------------------------------------------------------------

const tools: Anthropic.Tool[] = [
  {
    name: "list_files",
    description:
      "List files in the project matching a glob pattern, e.g. 'src/**/*.ts'.",
    input_schema: {
      type: "object",
      properties: {
        pattern: { type: "string", description: "Glob pattern relative to the project root." },
      },
      required: ["pattern"],
    },
  },
  {
    name: "read_file",
    description: "Read the full contents of a text file in the project.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string", description: "File path relative to the project root." },
      },
      required: ["path"],
    },
  },
  {
    name: "run_command",
    description:
      "Run a shell command inside the project root. The user is asked to approve each command before it runs.",
    input_schema: {
      type: "object",
      properties: {
        command: { type: "string", description: "The shell command to execute." },
      },
      required: ["command"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool implementations. Each returns a string (or throws) — the harness turns
// that into a tool_result block. Paths are resolved and checked against
// PROJECT_ROOT so the model can't read or run commands outside the project.
// ---------------------------------------------------------------------------

function resolveSafePath(inputPath: string): string {
  const resolved = resolve(PROJECT_ROOT, inputPath);
  const rel = relative(PROJECT_ROOT, resolved);
  if (rel.startsWith("..") || isAbsolute(rel)) {
    throw new Error(`Path "${inputPath}" escapes the project root — refused.`);
  }
  return resolved;
}

const rl = createInterface({ input: process.stdin, output: process.stdout });

async function toolListFiles(pattern: string): Promise<string> {
  const matches: string[] = [];
  for await (const entry of glob(pattern, { cwd: PROJECT_ROOT })) {
    matches.push(entry);
  }
  return matches.length ? matches.join("\n") : "(no matches)";
}

async function toolReadFile(path: string): Promise<string> {
  const safePath = resolveSafePath(path);
  return await readFile(safePath, "utf-8");
}

async function toolRunCommand(command: string): Promise<string> {
  const answer = await rl.question(`\n[harness] Claude wants to run:\n  ${command}\nApprove? (y/N) `);
  if (answer.trim().toLowerCase() !== "y") {
    return "User declined to run this command.";
  }
  try {
    const { stdout, stderr } = await execAsync(command, { cwd: PROJECT_ROOT, timeout: 30_000 });
    return stdout + (stderr ? `\n[stderr]\n${stderr}` : "");
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; message: string };
    return `Command failed: ${e.message}\n${e.stdout ?? ""}${e.stderr ?? ""}`;
  }
}

async function executeTool(name: string, input: unknown): Promise<string> {
  switch (name) {
    case "list_files":
      return toolListFiles((input as { pattern: string }).pattern);
    case "read_file":
      return toolReadFile((input as { path: string }).path);
    case "run_command":
      return toolRunCommand((input as { command: string }).command);
    default:
      return `Unknown tool: ${name}`;
  }
}

// ---------------------------------------------------------------------------
// The harness loop. This is the entire mechanism: ask the model for a turn,
// see if it asked to use a tool, run the tool, feed the result back, repeat
// until the model produces a final answer with no more tool calls.
// ---------------------------------------------------------------------------

async function main() {
  const task = process.argv.slice(2).join(" ");
  if (!task) {
    console.error("Usage: npm start -- \"<task for Claude>\"");
    process.exit(1);
  }

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: task }];

  while (true) {
    // 1. Ask the model for the next turn, given the full conversation so far.
    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 4096,
      system:
        `You are a coding assistant embedded in a small learning harness. ` +
        `You can list files, read files, and run shell commands (with user approval) ` +
        `inside the project at ${PROJECT_ROOT}.`,
      tools,
      messages,
    });

    // 2. Show any text the model produced this turn.
    for (const block of response.content) {
      if (block.type === "text") {
        console.log(`\n[claude] ${block.text}`);
      }
    }

    // 3. If the model didn't ask for a tool, we're done — print why it stopped.
    if (response.stop_reason !== "tool_use") {
      console.log(`\n[harness] stopped: ${response.stop_reason}`);
      break;
    }

    // 4. Otherwise, execute every requested tool call and collect results.
    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      console.log(`\n[tool_use] ${block.name}(${JSON.stringify(block.input)})`);
      const result = await executeTool(block.name, block.input);
      toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
    }

    // 5. Feed the results back as a user turn, and loop — the model sees
    //    them on the next call to messages.create() above.
    messages.push({ role: "user", content: toolResults });
  }

  rl.close();
}

main().catch((err) => {
  console.error(err);
  rl.close();
  process.exit(1);
});
