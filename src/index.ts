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
    // Get the sound file to play (potentially random)
    const SOUND_FILE_TO_PLAY = getSoundFile();
    
    // Play sound using platform-specific command
    let command: string;
    switch (process.platform) {
      case 'win32':
        command = `start "" "${SOUND_FILE_TO_PLAY}"`;
        break;
      case 'darwin':
        command = `afplay "${SOUND_FILE_TO_PLAY}"`;
        break;
      case 'linux':
        command = `aplay "${SOUND_FILE_TO_PLAY}"`;
        break;
      default:
        throw new Error(`Unsupported platform: ${process.platform}`);
    }

    await execAsync(command);

    return {
      content: [{
        type: "text",
        text: request.params.arguments?.message
          ? `Notification played: ${request.params.arguments.message}`
          : "Notification played successfully"
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
