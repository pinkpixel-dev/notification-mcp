# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - 2025-05-31

### Added ✨
- **Visual Notifications**: Added cross-platform desktop notification support 📱
  - Linux: `notify-send` (works with notify-osd, dunst, mako, etc.)
  - macOS: `osascript` display notification
  - Windows: PowerShell MessageBox
- **Enhanced Tool Parameters**: Added comprehensive styling options to `play_notification`
  - `urgency`: low, normal, critical notification levels
  - `timeout`: Custom notification duration in milliseconds
  - `icon`: Custom notification icons (dialog-information, dialog-error, etc.)
  - `audio_only`: Visual-only mode for headless environments
- **Qubes OS Support**: Added detection and multiple fallback mechanisms for Qubes OS environments 🔒
  - Automatic Qubes detection via `/proc/xen` and `qrexec-client-vm`
  - Multiple notification fallback methods (qrexec, notify-send, log file, console)
  - Graceful audio handling with multiple audio player attempts
- **Linux Support**: Added mpg123 support for Linux platforms alongside existing Windows and macOS support 🐧
- **Random Sound Option**: Set `MCP_NOTIFICATION_SOUND=random` to randomly play one of the 5 bundled sounds 🎲
- **Bundled Sound Assets**: MP3 files now included in npm package for out-of-the-box functionality
- **NPX Compatibility**: Full support for `npx @pinkpixel/notification-mcp` with bundled sounds
- **Enhanced Configuration**: `MCP_NOTIFICATION_SOUND` environment variable for choosing bundled sounds
- **Priority Configuration System**: Custom path > bundled sound > default gentle chime
- **MIT License**: Added proper open source license file
- **CONTRIBUTING.md**: Comprehensive contribution guidelines and development setup
- **Package Binary**: Added `notification-mcp` binary entry for easier CLI usage
- **Enhanced Package Metadata**: Keywords, author info, repository links, and bug reporting

### Changed 🔄
- **Asset Resolution**: Updated to use `import.meta.url` instead of `process.cwd()` for reliable asset location
- **Sound File Structure**: Moved all MP3 files into dedicated `sounds/` directory
- **Package.json**: Added `sounds` directory to files array for npm distribution
- **README.md**: Complete rewrite with bundled sound examples and modern documentation
- **OVERVIEW.md**: Updated with bundled asset information and enhanced configuration details
- **Code Structure**: Added `fileURLToPath` import and `__dirname` calculation for ES modules

### Fixed 🐛
- **NPX Sound Loading**: Bundled sounds now work correctly when run via npx
- **Asset Path Resolution**: Fixed path resolution issues that prevented sound loading in various environments
- **Environment Variable Priority**: Proper handling of configuration precedence

### Technical Improvements 🛠️
- **ES Module Compatibility**: Full ES module support with proper asset resolution
- **Build Process**: Enhanced to include sound assets in distribution
- **Documentation**: Added comprehensive documentation suite (README, OVERVIEW, CHANGELOG, CONTRIBUTING)
- **Error Handling**: Improved error messages and debugging information
- **Cross-Platform**: Maintained Windows and macOS compatibility with enhanced reliability

## [0.1.0] - 2025-05-30

### Added
- Initial release of Notification MCP Server
- Basic `play_notification` tool implementation  
- Support for custom MP3 file paths via `MCP_NOTIFICATION_SOUND_PATH`
- Cross-platform audio playback (Windows, macOS, and Linux)
- TypeScript implementation with MCP SDK
- Basic documentation and setup instructions 