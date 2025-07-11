#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const execAsync = promisify(exec);

// Get the directory where this script is located (works with npx!)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Available sound files
const SOUND_FILES = {
  cosmic: 'sounds/cosmic_chime.mp3',
  fairy: 'sounds/fairy_chime.mp3',
  gentle: 'sounds/gentle_chime.mp3',
  pleasant: 'sounds/pleasant_chime.mp3',
  retro: 'sounds/retro_chime.mp3'
};

// Get configured sound from environment variables
const DEFAULT_SOUND_NAME = process.env.MCP_NOTIFICATION_SOUND || 'gentle';
const USER_CONFIGURED_SOUND_PATH = process.env.MCP_NOTIFICATION_SOUND_PATH;

// Function to get a random sound
function getRandomSound(): string {
  const soundKeys = Object.keys(SOUND_FILES) as (keyof typeof SOUND_FILES)[];
  const randomKey = soundKeys[Math.floor(Math.random() * soundKeys.length)];
  return SOUND_FILES[randomKey];
}

// Determine which sound file to use
function getSoundFile(): string {
  if (USER_CONFIGURED_SOUND_PATH) {
    return USER_CONFIGURED_SOUND_PATH;
  }
  
  if (DEFAULT_SOUND_NAME === 'random') {
    return path.join(__dirname, '..', getRandomSound());
  }
  
  const DEFAULT_SOUND_FILE = SOUND_FILES[DEFAULT_SOUND_NAME as keyof typeof SOUND_FILES] || SOUND_FILES.gentle;
  return path.join(__dirname, '..', DEFAULT_SOUND_FILE);
}

// Function to detect if running in Qubes OS
function isQubesOS(): boolean {
  try {
    // Check for Qubes-specific indicators
    const fs = require('fs');
    return fs.existsSync('/proc/xen') && 
           fs.existsSync('/usr/bin/qrexec-client-vm') &&
           fs.existsSync('/etc/qubes-rpc/');
  } catch {
    return false;
  }
}

// Function to show visual notification
async function showVisualNotification(title: string, message: string): Promise<void> {
  let command: string;
  
  switch (process.platform) {
    case 'linux':
      if (isQubesOS()) {
        // Qubes OS: Try multiple notification methods
        // Method 1: Try qrexec notification (may be restricted)
        try {
          command = `echo "${title}|${message}" | qrexec-client-vm dom0 qubes.NotifyAll`;
          await execAsync(command);
          return;
        } catch {
          // Method 2: Fallback to local notify-send within the VM
          try {
            command = `notify-send "${title}" "${message}"`;
            await execAsync(command);
            return;
          } catch {
            // Method 3: Write to a log file that could be monitored
            command = `echo "$(date): [${title}] ${message}" >> /tmp/mcp-notifications.log`;
            await execAsync(command);
            return;
          }
        }
      } else {
        // Regular Linux: Use notify-send
        command = `notify-send "${title}" "${message}"`;
      }
      break;
    case 'darwin':
      // Use osascript for macOS
      command = `osascript -e 'display notification "${message}" with title "${title}"'`;
      break;
    case 'win32':
      // Use PowerShell for Windows toast notifications
      command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('${message}', '${title}')"`;
      break;
    default:
      throw new Error(`Visual notifications not supported on platform: ${process.platform}`);
  }
  
  await execAsync(command);
}

/**
 * Create an MCP server with tool capability for playing notifications
 */
const server = new Server(
  {
    name: "notification-mcp",
    version: "0.1.2",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler that lists available tools.
 * Exposes a "play_notification" tool that plays a sound when tasks complete.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "play_notification",
        description: "Play a notification sound to indicate task completion",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "Optional message to display with notification"
            },
            show_visual: {
              type: "boolean",
              description: "Whether to show a visual desktop notification (default: false)"
            },
            title: {
              type: "string",
              description: "Title for the visual notification (default: 'Task Complete')"
            },
            audio_only: {
              type: "boolean",
              description: "Skip audio and only show visual notification (default: false)"
            }
          }
        }
      }
    ]
  };
});

/**
 * Handler for the play_notification tool.
 * Plays the configured sound file and returns success message.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "play_notification") {
    throw new Error("Unknown tool");
  }

  try {
    const args = request.params.arguments as any || {};
    const message: string = args.message || "";
    const showVisual: boolean = args.show_visual || false;
    const title: string = args.title || "Task Complete";
    const audioOnly: boolean = args.audio_only || false;
    
    // Execute audio notification (unless audio_only is true)
    if (!audioOnly) {
      const SOUND_FILE_TO_PLAY = getSoundFile();
      let audioCommand: string;
      switch (process.platform) {
        case 'win32':
          audioCommand = `start "" "${SOUND_FILE_TO_PLAY}"`;
          break;
        case 'darwin':
          audioCommand = `afplay "${SOUND_FILE_TO_PLAY}"`;
          break;
        case 'linux':
          if (isQubesOS()) {
            // Qubes OS: Try multiple audio methods
            try {
              // Method 1: Try paplay (PulseAudio) which often works better in Qubes
              audioCommand = `paplay "${SOUND_FILE_TO_PLAY}"`;
              await execAsync(audioCommand);
            } catch {
              try {
                // Method 2: Fallback to mpg123
                audioCommand = `mpg123 -q "${SOUND_FILE_TO_PLAY}"`;
                await execAsync(audioCommand);
              } catch {
                // Method 3: Try aplay with conversion (last resort)
                audioCommand = `ffplay -nodisp -autoexit "${SOUND_FILE_TO_PLAY}" 2>/dev/null`;
                await execAsync(audioCommand);
              }
            }
          } else {
            // Regular Linux
            audioCommand = `mpg123 -q "${SOUND_FILE_TO_PLAY}"`;
            await execAsync(audioCommand);
          }
          break;
        default:
          throw new Error(`Unsupported platform: ${process.platform}`);
      }
    }
    
    // Execute visual notification if requested
    if (showVisual) {
      const notificationMessage = message || "Task completed successfully!";
      await showVisualNotification(title, notificationMessage);
    }

    // Prepare response message
    let responseText = audioOnly ? "Visual notification shown successfully" : "Notification played successfully";
    if (message) {
      responseText = audioOnly ? `Visual notification: ${message}` : `Notification played: ${message}`;
    }
    if (showVisual && !audioOnly) {
      responseText += " (with visual notification)";
    }

    return {
      content: [{
        type: "text",
        text: responseText
      }]
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Failed to play notification: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
});

/**
 * Start the server using stdio transport
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`Notification MCP server running`);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
