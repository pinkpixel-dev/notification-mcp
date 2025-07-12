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
import { NOTIFICATION_TEMPLATES, type NotificationTemplate } from './templates/index.js';

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
function getSoundFile(templateSound?: string): string {
  if (USER_CONFIGURED_SOUND_PATH) {
    return USER_CONFIGURED_SOUND_PATH;
  }
  
  // Use template-specific sound if provided
  if (templateSound && SOUND_FILES[templateSound as keyof typeof SOUND_FILES]) {
    return path.join(__dirname, '..', SOUND_FILES[templateSound as keyof typeof SOUND_FILES]);
  }
  
  if (DEFAULT_SOUND_NAME === 'random') {
    return path.join(__dirname, '..', getRandomSound());
  }
  
  const DEFAULT_SOUND_FILE = SOUND_FILES[DEFAULT_SOUND_NAME as keyof typeof SOUND_FILES] || SOUND_FILES.gentle;
  return path.join(__dirname, '..', DEFAULT_SOUND_FILE);
}

// Templates are now imported from ./templates/index.js

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
async function showVisualNotification(title: string, message: string, urgency: string = "normal", timeout: number = 5000, icon: string = "dialog-information"): Promise<void> {
  let command: string;
  
  switch (process.platform) {
    case 'linux':
      if (isQubesOS()) {
        // Qubes OS: Try multiple notification methods with styling
        const methods = [
          // Method 1: Try qrexec notification (may be restricted)
          () => execAsync(`echo "${title}|${message}" | qrexec-client-vm dom0 qubes.NotifyAll`),
          // Method 2: Fallback to local notify-send with full styling
          () => execAsync(`notify-send -u ${urgency} -t ${timeout} -i ${icon} "${title}" "${message}"`),
          // Method 3: Try notify-send with basic styling (fallback if icon fails)
          () => execAsync(`notify-send -u ${urgency} -t ${timeout} "${title}" "${message}"`),
          // Method 4: Basic notify-send as fallback
          () => execAsync(`notify-send "${title}" "${message}"`),
          // Method 5: Write to a styled log file that could be monitored
          () => execAsync(`echo "$(date) [${urgency.toUpperCase()}] ${title}: ${message}" >> /tmp/mcp-notifications.log`),
          // Method 6: Console output as last resort
          () => Promise.resolve(console.log(`NOTIFICATION [${urgency.toUpperCase()}]: [${title}] ${message}`))
        ];
        
        for (const method of methods) {
          try {
            await method();
            return; // Success, exit early
          } catch (error) {
            // Continue to next method
            continue;
          }
        }
        // If all methods fail, throw the last error
        throw new Error(`All Qubes notification methods failed for: [${title}] ${message}`);
      } else {
        // Regular Linux: Use notify-send with full styling
        command = `notify-send -u ${urgency} -t ${timeout} -i ${icon} "${title}" "${message}"`;
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
            },
            urgency: {
              type: "string",
              description: "Notification urgency level: low, normal, critical (default: normal)",
              enum: ["low", "normal", "critical"]
            },
            timeout: {
              type: "number",
              description: "Notification timeout in milliseconds (default: 5000)"
            },
            icon: {
              type: "string",
              description: "Icon name or path for the notification (default: dialog-information)"
            },
            template: {
              type: "string",
              description: "Use a predefined notification template: success, error, warning, info, build, deploy, test, backup",
              enum: ["success", "error", "warning", "info", "build", "deploy", "test", "backup"]
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
    const template = args.template;
    
    // Apply template if specified
    let templateDefaults: NotificationTemplate | {} = {};
    if (template && NOTIFICATION_TEMPLATES[template as keyof typeof NOTIFICATION_TEMPLATES]) {
      templateDefaults = NOTIFICATION_TEMPLATES[template as keyof typeof NOTIFICATION_TEMPLATES];
    }
    
    // Extract parameters with template defaults
    const message: string = args.message || (templateDefaults as any).message || "";
    const showVisual: boolean = args.show_visual || false;
    const title: string = args.title || (templateDefaults as any).title || "Task Complete";
    const audioOnly: boolean = args.audio_only || false;
    const urgency: string = args.urgency || (templateDefaults as any).urgency || "normal";
    const timeout: number = args.timeout || (templateDefaults as any).timeout || 5000;
    const icon: string = args.icon || (templateDefaults as any).icon || "dialog-information";
    const templateSound: string | undefined = (templateDefaults as any).sound;
    
    // Execute audio notification (unless audio_only is true)
    if (!audioOnly) {
      try {
        const SOUND_FILE_TO_PLAY = getSoundFile(templateSound);
        
        switch (process.platform) {
          case 'win32':
            await execAsync(`start "" "${SOUND_FILE_TO_PLAY}"`);
            break;
          case 'darwin':
            await execAsync(`afplay "${SOUND_FILE_TO_PLAY}"`);
            break;
          case 'linux':
            if (isQubesOS()) {
              // Qubes OS: Try multiple audio methods with proper error handling
              const audioMethods = [
                // Method 1: Try paplay (PulseAudio) which often works better in Qubes
                () => execAsync(`paplay "${SOUND_FILE_TO_PLAY}"`),
                // Method 2: Try mpg123
                () => execAsync(`mpg123 -q "${SOUND_FILE_TO_PLAY}"`),
                // Method 3: Try ffplay
                () => execAsync(`ffplay -nodisp -autoexit "${SOUND_FILE_TO_PLAY}" 2>/dev/null`),
                // Method 4: Try aplay (may not work with MP3 but worth trying)
                () => execAsync(`aplay "${SOUND_FILE_TO_PLAY}" 2>/dev/null`)
              ];
              
              let audioSuccess = false;
              for (const method of audioMethods) {
                try {
                  await method();
                  audioSuccess = true;
                  break; // Success, exit early
                } catch (error) {
                  // Continue to next method
                  continue;
                }
              }
              
              if (!audioSuccess) {
                console.log(`Audio playback failed in Qubes VM, but continuing...`);
                // Don't throw error for audio failure in Qubes - it's often expected
              }
            } else {
              // Regular Linux
              await execAsync(`mpg123 -q "${SOUND_FILE_TO_PLAY}"`);
            }
            break;
          default:
            throw new Error(`Unsupported platform: ${process.platform}`);
        }
      } catch (error) {
        // Log audio failure but don't fail the entire operation in Qubes
        if (isQubesOS()) {
          console.log(`Audio notification failed in Qubes: ${error instanceof Error ? error.message : String(error)}`);
        } else {
          throw error; // Re-throw for non-Qubes systems
        }
      }
    }
    
    // Execute visual notification if requested
    if (showVisual) {
      const notificationMessage = message || "Task completed successfully!";
      try {
        await showVisualNotification(title, notificationMessage, urgency, timeout, icon);
      } catch (error) {
        // Log visual notification failure but don't fail the entire operation
        console.log(`Visual notification failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Prepare response message
    let responseText = audioOnly ? "Visual notification shown successfully" : "Notification played successfully";
    if (message) {
      responseText = audioOnly ? `Visual notification: ${message}` : `Notification played: ${message}`;
    }
    if (showVisual && !audioOnly) {
      responseText += ` (with ${urgency} visual notification)`;
    }
    
    // Add Qubes-specific messaging
    if (isQubesOS()) {
      responseText += " (Qubes OS detected - using fallback methods)";
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
