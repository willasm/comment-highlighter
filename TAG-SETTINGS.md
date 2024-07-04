# Comment Highlighter `tag-settings.json` Settings File

## `tag-settings.json`
All tag settings are stored in this file which can be opened for editing with the command `Comment Highlighter: Edit Tags Settings File`. This file has its own JSON Schema which makes editing and adding new items much easier to accomplish. The root contains the following entries...

### JSON Root
![Settings Root Screenshot](/images/SettingsRoot.png)

### "tagsArrayGroupOne":
This array is for tags that you want to only highlight the tag keyword itself. All these tags must be followed by a colon. You can add your own tags to this array and they are defined as follows...

![tagsArrayGroupOne Screenshot](/images/tagItemGroupOne.png)

- `"description":` A human readable string describing this tag
- `"keyword":` The string of the tag keyword. Note that tags are case insensitive.
- `"isEnabled":` _**Boolean value**_ Set to `false` to disable this tag. Set to `true` to enable this tag.
- `"decoratorOptions":` This is where the tags decorations are defined
  - See [DecorationRenderOptions](https://code.visualstudio.com/api/references/vscode-api#DecorationRenderOptions) for more detailed information.
  - This must include the `"light":` and `"dark":` arrays which must include at least the `"color":` key

### "tagsArrayGroupTwo":
This array is for tags that you want to highlight the tag keyword and all the following text to the end of the line. All these tags should _**not**_ be followed by a colon. You can add your own tags to this array and they are defined as follows...

![tagsArrayGroupTwo Screenshot](/images/tagItemGroupTwo.png)

- `"description":` A human readable string describing this tag
- `"keyword":` The string of the tag keyword. Note that tags are case insensitive.
- `"isEnabled":` _**Boolean value**_ Set to `false` to disable this tag. Set to `true` to enable this tag.
- `"decoratorOptions":` This is where the tags decorations are defined
  - See [DecorationRenderOptions](https://code.visualstudio.com/api/references/vscode-api#DecorationRenderOptions) for more detailed information.
  - This must include the `"light":` and `"dark":` arrays which must include at least the `"color":` key

#### tagBlocksArray
This array is for defining tag blocks, all text between a starting string and an ending string. You can add your own tags to this array and they are defined as follows...

![tagBlocksArray Screenshot](/images/tagItemBlocks.png)

- `"description":` A human readable string describing this tag
- `"startText":` The string the tag block begins with
- `"endText":` The string the tag block ends with
- `"isEnabled":` _**Boolean value**_ Set to `false` to disable this tag. Set to `true` to enable this tag.
- `"decoratorOptions":` This is where the tags decorations are defined
  - See [DecorationRenderOptions](https://code.visualstudio.com/api/references/vscode-api#DecorationRenderOptions) for more detailed information.
  - This must include the `"light":` and `"dark":` arrays which must include at least the `"color":` key

#### specialTagsArray
This array defines the special tags, such as quotes, Parentheses, etc. You _**Can Not**_ add your own entries to this array as the extension will not look for other items. You can however edit the existing ones attributes such as color and decorator options. They are defined as follows...

![specialTagsArray Screenshot](/images/tagItemSpecial.png)

- `"description":` A human readable string describing this tag
- `"isEnabled":` _**Boolean value**_ Set to `false` to disable this tag. Set to `true` to enable this tag.
- `"decoratorOptions":` This is where the tags decorations are defined
  - See [DecorationRenderOptions](https://code.visualstudio.com/api/references/vscode-api#DecorationRenderOptions) for more detailed information.
  - This must include the `"light":` and `"dark":` arrays which must include at least the `"color":` key

#### extensions
This is the array which contains all the supported file extensions of this extension. These objects provide the Regular Expression to search the code for comments. If you want to add a file extension, first check the "description" key of the existing entries to see if your languages comments definition matches one of the existing ones. If it does then you simply have to add the extension text to the "ext" key. Otherwise you will need to add a new extension object. I like to use [https://regex101.com/](https://regex101.com/) for creating and testing my Regular Expressions. Note that when adding an expression value to the "commentsRegEx" key you need to escape any backslashes (\s needs to be \\\\s) or vscode will not read it in properly. If you need assistance adding a new languages extension please submit a request to my [Github Issues page](https://github.com/willasm/pnotes/issues) and I will add it to the settings file. You can add your own extensions to this array and they are defined as follows...

![extensions Screenshot](/images/tagItemExtensions.png)

- `"description":` A human readable string describing this extension
- `"ext":` An array of all file entensions that use the same syntax for their comments
- `"commentsRegEx":` The regular Expression used to find the files comments
  - If you require help creating of these, create an issue on the [Github](https://github.com/willasm/comment-highlighter/issues) repo and I will assist you
  - These are quite complex as they cover both single line and multi-line comments


## Please refer to these sites for more information on rendering options...

[VSCode API Decoration Render Options Reference](https://code.visualstudio.com/api/references/vscode-api#DecorationRenderOptions)

[vshaxe.github.io Decoration Render Options Reference](https://vshaxe.github.io/vscode-extern/vscode/DecorationRenderOptions.html)

## That is it for the Settings
I hope you enjoy using this extension! Feel free to leave any comments, questions or suggestions on either the extensions [Github Issues](https://github.com/willasm/pnotes/issues) web page or the extensions [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=willasm.pnotes) web page.

Thank you, William McKeever.
