<div align="center">
  <img src="./icon.png" alt="Notification MCP Logo" width="300"/>

  # ✨ Notifications MCP Server ✨

  **Dream it, Pixel it. Made with ❤️ by Pink Pixel.**

  [![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE) [![Model Context Protocol](https://img.shields.io/badge/Model%20Context%20Protocol-Server-green)](https://github.com/model-context-protocol/model-context-protocol) [![npm version](https://badge.fury.io/js/@pinkpixel%2Fnotification-mcp.svg)](https://www.npmjs.com/package/@pinkpixel/notification-mcp) [![LightNow capabilities](https://lightnow.ai/badge/io.github.pinkpixel-dev/notification-mcp)](https://lightnow.ai/servers/io.github.pinkpixel-dev/notification-mcp)

  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/) [![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/@pinkpixel/notification-mcp)

  [![NPM Downloads](https://img.shields.io/npm/dm/@pinkpixel/notification-mcp?style=flat-square&color=ff69b4)](https://www.npmjs.com/package/@pinkpixel/notification-mcp) [![GitHub Stars](https://img.shields.io/github/stars/pinkpixel-dev/notification-mcp?style=flat-square&color=ff69b4)](https://github.com/pinkpixel-dev/notification-mcp/stargazers) [![GitHub Issues](https://img.shields.io/github/issues/pinkpixel-dev/notification-mcp?style=flat-square&color=ff69b4)](https://github.com/pinkpixel-dev/notification-mcp/issues) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-ff69b4.svg?style=flat-square)](http://makeapullrequest.com)

  [![Platform Support](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square)](https://github.com/pinkpixel-dev/notification-mcp) [![Built with Love](https://img.shields.io/badge/Built%20with-❤️-ff1744.svg?style=flat-square)](https://pinkpixel.dev) [![Pink Pixel](https://img.shields.io/badge/Pink-Pixel-ff69b4?style=flat-square&logo=sparkles)](https://pinkpixel.dev)

</div>

## Overview

A Model Context Protocol server that allows AI agents to play notification sounds when tasks are completed. This TypeScript-based MCP server provides a simple, configurable notification system with **bundled sounds that work out of the box** with npx!

## ✨ Features

### 🔧 Tools

- `notify` - Show a desktop toast notification and/or play a sound when tasks complete (Recommended for summaries)
  - `message` (required): The notification message/summary of the completed task
  - `title` (optional): The title for the toast notification (defaults to "Task Completed")
  - `mode` (optional): `"toast" | "sound" | "both"` (defaults to `"both"`)
  - `sound` (optional): Name of the sound to play, which overrides default settings
  - Fully supports Windows, macOS, and Linux out of the box!
- `play_notification` - Play a notification sound to indicate task completion
  - Takes an optional `message` parameter to log/display with the notification
  - Supports cross-platform sound playback (Windows, macOS, and Linux)
  - **Works with bundled sounds** - no manual downloads required!

### 🎵 Built-in Sound Library
**5 high-quality notification sounds bundled with the package:**
- `cosmic` - Space-themed notification 🌌
- `fairy` - Magical, whimsical tone 🧚‍♀️
- `gentle` - Soft, pleasant default sound (default) 🔔
- `pleasant` - Balanced, professional tone 📞
- `retro` - Nostalgic, vintage-style notification 🕹️
- `random` - Randomly plays one of the 5 sounds 🎲

## 🚀 Quick Start

### Option 1: Use Bundled Sounds (Recommended) ⭐
Just run it with npx - sounds included!

```json
{
  "mcpServers": {
    "notifications": {
      "command": "npx",
      "args": ["-y", "@pinkpixel/notification-mcp"]
    }
  }
}
```

### Option 2: Choose a Different Bundled Sound
```json
{
  "mcpServers": {
    "notifications": {
      "command": "npx",
      "args": ["-y", "@pinkpixel/notification-mcp"],
      "env": {
        "MCP_NOTIFICATION_SOUND": "cosmic"
      }
    }
  }
}
```

### Option 3: Random Sound Each Time 🎲
```json
{
  "mcpServers": {
    "notifications": {
      "command": "npx",
      "args": ["-y", "@pinkpixel/notification-mcp"],
      "env": {
        "MCP_NOTIFICATION_SOUND": "random"
      }
    }
  }
}
```

### Option 4: Use Your Own Custom Sound
```json
{
  "mcpServers": {
    "notifications": {
      "command": "npx",
      "args": ["-y", "@pinkpixel/notification-mcp"],
      "env": {
        "MCP_NOTIFICATION_SOUND_PATH": "C:\\path\\to\\your\\sound.mp3"
      }
    }
  }
}
```

## ⚙️ Configuration

The notification sound can be configured using environment variables:

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_NOTIFICATION_SOUND` | Choose from bundled sounds: `cosmic`, `fairy`, `gentle`, `pleasant`, `retro`, `random` | `gentle` |
| `MCP_NOTIFICATION_SOUND_PATH` | Absolute path to your own MP3 file (overrides bundled sounds) | `null` |

### Priority Order
1. **Custom Path** (`MCP_NOTIFICATION_SOUND_PATH`) - highest priority
2. **Bundled Sound** (`MCP_NOTIFICATION_SOUND`) - choose from 5 included sounds
3. **Default** - gentle chime if nothing is specified

## 💻 Usage

Once configured, your MCP client can call either the unified `notify` tool or the audio-only `play_notification` tool:

### 1. Unified Toast + Sound Notification (Recommended)
```typescript
await client.request({
  method: "tools/call",
  params: {
    name: "notify",
    arguments: {
      title: "Build Succeeded",
      message: "Antigravity successfully tested the package version 0.2.0! 🚀",
      mode: "both", // "toast", "sound", or "both"
      sound: "cosmic" // optional override
    }
  }
});
```

### 2. Audio-Only Notification
```typescript
await client.request({
  method: "tools/call",
  params: {
    name: "play_notification",
    arguments: {
      message: "Task completed successfully! 🎉"
    }
  }
});
```

## 🛠️ Development

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/pinkpixel-dev/notification-mcp.git
cd notification-mcp

# Install dependencies
npm install

# Build the server
npm run build

# For development with auto-rebuild
npm run watch
```

### Local Development Configuration
```json
{
  "mcpServers": {
    "notifications": {
      "command": "node",
      "args": ["./build/index.js"],
      "env": {
        "MCP_NOTIFICATION_SOUND": "retro"
      }
    }
  }
}
```

### Debugging

Use the [MCP Inspector](https://github.com/modelcontextprotocol/inspector) for interactive debugging:

```bash
npm run inspector
```

The Inspector provides a web interface to test your MCP server in your browser.

## 📦 Installation Methods

### NPX (Recommended)
No installation required - sounds are bundled automatically:
```bash
npx @pinkpixel/notification-mcp
```

### Global Install
```bash
npm install -g @pinkpixel/notification-mcp
notification-mcp
```

### Local Install
```bash
npm install @pinkpixel/notification-mcp
npx notification-mcp
```

## 🎵 Sound Files

All sound files are located in the `sounds/` directory and are automatically included when you install the package:

- Cosmic: `sounds/cosmic_chime.mp3` - 🌌 Space-themed
- Fairy: `sounds/fairy_chime.mp3` - 🧚‍♀️ Magical
- Gentle: `sounds/gentle_chime.mp3` - 🔔 Default (soft)
- Pleasant:`sounds/pleasant_chime.mp3` - 📞 Professional
- Retro: `sounds/retro_chime.mp3` - 🕹️ Vintage
- Random: Set `MCP_NOTIFICATION_SOUND=random` - 🎲 Surprise me!

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is dual-licensed under the MIT and Apache 2.0 Licenses - see the [LICENSE](LICENSE) file for details.

## 🌟 About Pink Pixel

- **Website:** [pinkpixel.dev](https://pinkpixel.dev)
- **GitHub:** [github.com/pinkpixel-dev](https://github.com/pinkpixel-dev)
- **Discord:** @sizzlebop

---

*Made with ❤️ by Pink Pixel* ✨
