![](https://img.shields.io/visual-studio-marketplace/v/willasm.comment-highlighter)
![](https://img.shields.io/visual-studio-marketplace/d/willasm.comment-highlighter)
![](https://img.shields.io/visual-studio-marketplace/r/willasm.comment-highlighter)
![](https://img.shields.io/visual-studio-marketplace/release-date/willasm.comment-highlighter)
![](https://img.shields.io/visual-studio-marketplace/last-updated/willasm.comment-highlighter)

<!-- omit in toc -->
# Comment Highlighter
IMPORTANT: If you have the old version of this extension installed `Project Notes + TODO Highlighter` it should be removed before installing this newer version. They are not compatible with each other and will cause issues if they are run simutaneously.

Note: This is a complete rewrite of my earlier version `Project Notes + TODO Highlighter` found here on [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=willasm.project-notes) and on [Github](https://github.com/willasm/project-notes). The syntax highlighting was only intended to be a minor addition to the extension but it has grown to the point where it really needed be its own seperate extension. The new `Project Notes` extension without comment highlighting can now be found on [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=willasm.pnotes) and on [Github](https://github.com/willasm/pnotes). Seperating the old extension into two extensions allows me to focus exclusivly on each of the new extensions as needed. The old extension will remain available for those that wish to use it but it will only receive limited support for bug fixes if they are discovered.

<!-- omit in toc -->
## Table of Contents  
- [Features](#features)
- [Screenshots](#screenshots)
  - [Highlight Tags Only](#highlight-tags-only)
  - [Highlight Tags To End of Line](#highlight-tags-to-end-of-line)
  - [Highlight Tag Blocks](#highlight-tag-blocks)
  - [Highlight Special Tags](#highlight-special-tags)
  - [Tag Browser Dark+ (Default)](#tag-browser-dark-default)
  - [Tag Browser Light+ (Default)](#tag-browser-light-default)
  - [Tag Browser Emerald Sky (My Theme)](#tag-browser-emerald-sky-my-theme)
- [Settings](#settings)
- [Commands](#commands)
- [The Tag Browser](#the-tag-browser)
- [Changing the Default Tag Browser Colors](#changing-the-default-tag-browser-colors)
- [Recommended](#recommended)
- [Release Notes and Changelog](#release-notes-and-changelog)

## Features
- Adds syntax highlighting in comments to the default tags `BUG, CHANGED, DEBUG, FIXME, HACK, IDEA, NOTE, OPTIMIZE, RESEARCH, REVIEW, TEMP and TODO`
- `Tags` can be in single or multi-line commenmts
- `Tags` are case insensitive
- `Tags` without trailing colon highlight just the tag
- `Tags` with trailing colon highlight the entire line
- `Tags browser` to view all project files `Tags` in the `Comment Highlighter` panel and jump to tag on selection
- `Tags browser` displays the project files tag total tags count on the far right of the filename
- `Tags browser` User definable colors for all default tags
  - In your `settings.json` under the key "workbench.colorCustomizations" type "chTreeItem." to get a popup of all available colors
- New `Tags` can be added to the settings file
- All `Tags` can be enabled or disabled individually in the `tag-settings.json` file
- `tag-settings.json` settings file has accompanying JSON Schema to aid in creating and editing tags
- Highlighting of user definable `Tag Blocks` - Any text surrounded by user definable text characters
- Comment highlighting is based on the files extension allowing for highlighting in file languages unkown to VS Code
- Supported file extensions "asm", "ini", "c", "cc", "cp", "cs", "cpp", "c++", "cxx", "cppm", "ixx", "go", "java", "js", "jsx", "kt", "kts", "ktm", "less", "php", "scss", "swift", "ts", "tsx", "jsonc", "css", "coffee", "tbs", "bat", "cmd", "html", "vue", "md", "sql", "py", "rb", "rs", "rlib", "twig", "pl", "m", "mat", "bas", "cls", "r", "dpr", "pas"
- Supports Light and Dark Themes
- [Snippets](#snippets-for-tags) for the pre-defined tags and tag blocks
- `Parentheses`, `brackets` and `Curly braces` in comments are also highlighed. (Can be individually disabled in the settings file)
- `Backticks`, `"Double Quotes"` and `'Single Quotes'` in comments are also highlighted. (Can be individually disabled in the settings file)

## Screenshots
### Highlight Tags Only

|  Dark+ (Default)         |  Light+ (Default)        |  Emerald Sky (My Theme)  |
| ------------------------ | ------------------------ | -------------------------|
|![](/images/TagOnlyDark+.png)|![](/images/TagOnlyLight+.png)|![](/images/TagOnlyEmerald.png)|

### Highlight Tags To End of Line

|  Dark+ (Default)         |  Light+ (Default)        |  Emerald Sky (My Theme)  |
| ------------------------ | ------------------------ | -------------------------|
|![](/images/TagToEndOfLineDark+.png)|![](/images/TagToEndOfLineLight+.png)|![](/images/TagToEndOfLineEmerald.png)|

### Highlight Tag Blocks

|  Dark+ (Default)         |  Light+ (Default)        |  Emerald Sky (My Theme)  |
| ------------------------ | ------------------------ | -------------------------|
|![](/images/TagBlocksDark+.png)|![](/images/TagBlocksLight+.png)|![](/images/TagBlocksEmerald.png)|

### Highlight Special Tags

|  Dark+ (Default)         |  Light+ (Default)        |  Emerald Sky (My Theme)  |
| ------------------------ | ------------------------ | -------------------------|
|![](/images/SpecialTagsDark+.png)|![](/images/SpecialTagsLight+.png)|![](/images/SpecialTagsEmerald.png)|

### Tag Browser Dark+ (Default)
![](/images/TagBrowserDark+.png)

### Tag Browser Light+ (Default)
![](/images/TagBrowserLight+.png)

### Tag Browser Emerald Sky (My Theme)
![](/images/TagBrowserEmerald.png)

## Settings
Note: This extension will search for tags in all files with a supported extension. The following two settings can be used to override this behavior.

- `Files To Exclude` An array of filenames to exclude from Comment Highlighter
- `Folders To Exclude` An array of folder names to exclude from Comment Highlighter

> All this extensions tag settings are stored in the file `tag-settings.json` located in this extensions global storage folder. It uses its own file as it would be annoyingly too large for your `settings.json` file. It also has its own JSON Schema making adding and editing items much easier. To edit this file run the command `Comment Highlighter: Edit Tags Settings File`. To reset this file to its default settings run the command `Comment Highlighter: Restore Tag Settings File`. Be aware that this will remove any changes you have made!

Read [TAG-SETTINGS.md](TAG-SETTINGS.md) for a more detailed description of the `tag-settings.json` file and its usage

## Commands
These commands are availiable from the command pallette: (Windows: CTRL+Shift+P or F1) (Mac: CMD+Shift+P)

- `Comment Highlighter: Edit Tags Settings File` Opens `tag-settings.json` File for editing.

- `Comment Highlighter: Restore Tag Settings File` Restores `tag-settings.json` file to its default settings.
  - (Caution! This will remove all changes you have previously made!)

## The Tag Browser
The tag browser panel displays a list of all project files with a supported extension that include any tag keywords. Selecting the file will display all the tag keywords within that file. Then selecting the displayed tags will open that file in the editor and jump to the location of the tag.

Example Screenshot...

![](/images/TagBrowserEmerald.png)

## Changing the Default Tag Browser Colors
You can override the default file colors in the `settings.json` file under the `workbench.colorCustomizations` key...

`chTreeItem.filenameTextColor` sets all filenames text color

`chTreeItem.bugTextColor` sets the BUG tags text color

`chTreeItem.changedTextColor` sets the CHANGED tags text color

`chTreeItem.debugTextColor` sets the DEBUG tags text color

`chTreeItem.fixmeTextColor` sets the FIXME tags text color

`chTreeItem.ideaTextColor` sets the IDEA tags text color

`chTreeItem.noteTextColor` sets the NOTE tags text color

`chTreeItem.optimizeTextColor` sets the OPTIMIZE tags text color

`chTreeItem.researchTextColor` sets the RESEARCH tags text color

`chTreeItem.reviewTextColor` sets the REVIEW tags text color

`chTreeItem.tempTextColor` sets the TEMP tags text color

`chTreeItem.todoTextColor` sets the TODO tags text color

`chTreeItem.userTagTextColor` sets all User Defined tags text color

Example Screenshot...

![Example Screenshot](/images/ColorOverride.png)

## Recommended
The [Project Notes](https://marketplace.visualstudio.com/items?itemName=willasm.pnotes) extension which has project and global file links in comments which are supported by this extension.

The [Emerald Sky](https://marketplace.visualstudio.com/items?itemName=willasm.emerald-sky) dark theme which I created with this extension in mind.

## Release Notes and Changelog
See the [Release Notes](RELEASE.md) for details on this released version or [Changelog](CHANGELOG.md) for a history of all changes.

