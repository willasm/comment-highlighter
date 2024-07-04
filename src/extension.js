const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { readFile } = require('fs/promises');
const DataProvider = require("./dataProvider.js");

let myContext;
let settings = vscode.workspace.getConfiguration("comment-highlighter");
let filesToExclude = settings.get("filesToExclude");
let foldersToExclude = settings.get("foldersToExclude");
let defaultTagSettingsFile = './defaultTagSettings.json';
let defaultTagSettings = require(defaultTagSettingsFile);
let timeout;
let tagSettingsPath;
let tagSettingsFile;
let currentFileExt;
let commentsRegEx;

//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                            ● Function Activate ●                             │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function activate(context) {

  // Activate - Initialize Extension 
  //--------------------------------------------------------------------------------
  myContext = context;                    // Save context
 
  // Activate - Initialize Tag Settings 
  tagSettingsPath = context.globalStorageUri.fsPath;                  // Get Global Storage Path
  tagSettingsFile = tagSettingsPath + path.sep + 'tag-settings.json'; // Tag settings json file
  await initTagSettingsFilePath();                                    // Initialize global storage path and tag settings file
  
  // Activate - Load Tag Settings 
  let tagFileData = await readFile(tagSettingsFile, 'utf-8');         // Read file into memory
  const tagFileJsonData = JSON.parse(tagFileData);                    // Parse the tag settings json file

  // Activate - Save Array of All Extensions 
  let allExtensions = [];
  for (let i = 0; i < tagFileJsonData.extensions.length; i++) {
    for (let j = 0; j < tagFileJsonData.extensions[i].ext.length; j++) {
      allExtensions.push(tagFileJsonData.extensions[i].ext[j]);
    }
  };

  // Activate - Get the extension for current file 
  getExtension();

  // Activate - Create Treeview Data Provider 
  let extInclude = allExtensions        // allExtensions from above
  let myData = new DataProvider(context, extInclude, filesToExclude, foldersToExclude, tagFileJsonData);
  
  // Activate - Create Treeview 
  let view = vscode.window.createTreeView("commentHighlighterTreeview", {
    treeDataProvider: myData,
  });

  // Activate - Register Extension Commands 
  vscode.commands.registerCommand('comment-highlighter.edit-settings-file', editTagSettingsFile);
  vscode.commands.registerCommand('comment-highlighter.tree-edit-settings-file', editTagSettingsFile);
  vscode.commands.registerCommand('comment-highlighter.restore-settings-file', restoreTagSettingsFile);
  vscode.commands.registerCommand('comment-highlighter.gotoLine', gotoLine);

  // Activate - Push Subscriptions 
  context.subscriptions.push(editTagSettingsFile);
  context.subscriptions.push(restoreTagSettingsFile);
  context.subscriptions.push(gotoLine);

  // Activate - Get active editor 
  let activeEditor = vscode.window.activeTextEditor;

  // Activate - Set Decoration Types 
  let decorationTypes = [];

  // Activate - Tag Types Objects Whole Word 
  tagFileJsonData.tagsArrayGroupOne.forEach(element => {
    let decorationType = vscode.window.createTextEditorDecorationType(element.decoratorOptions);
    decorationTypes.push(decorationType);
  });

  // Activate - Tag Types Objects Whole Line 
  tagFileJsonData.tagsArrayGroupTwo.forEach(element => {
    let decorationType = vscode.window.createTextEditorDecorationType(element.decoratorOptions);
    decorationTypes.push(decorationType);
  });

  // Activate - Tag Block Types Objects 
  tagFileJsonData.tagBlocksArray.forEach(element => {
    let decorationType = vscode.window.createTextEditorDecorationType(element.decoratorOptions);
    decorationTypes.push(decorationType);
  });  
  
  // Activate - Special Tag Types Objects 
  tagFileJsonData.specialTagsArray.forEach(element => {
      let decorationType = vscode.window.createTextEditorDecorationType(element.decoratorOptions);
      decorationTypes.push(decorationType);
  });

//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                        ● Function updateDecorations ●                        │
//  │                                                                              │
//  │                          • Update Our Decorations •                          │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
function updateDecorations() {
  // updateDecorations - If no active editor then return 
  if (!activeEditor) {
    return;
  };
  
  // updateDecorations - If no file extension found then return 
  if (currentFileExt === "") {
    return;
  };

  // updateDecorations - Clear previous comment Regex definition 
  commentsRegEx = "";

  // updateDecorations - Get comment symbols and set comments RegEx 
  let i = 0;
  tagFileJsonData.extensions.forEach(e => {
    let arr = tagFileJsonData.extensions[i].ext;
    const extMatch = arr.some((e) => {
        return e === currentFileExt;
    });
    // updateDecorations - If extension supported then set comment's RegEx 
    if (extMatch) {
      commentString = tagFileJsonData.extensions[i].commentsRegEx;
      commentsRegEx = new RegExp(commentString,'gmi')
    };
    i ++;
  });
  if (commentsRegEx === "") {
    return;
  };

  // updateDecorations - Search for tag matches 
  let commentMatch;
  let keywordMatch;

  // updateDecorations - Ignore comments in strings 
  let commentInString = /^[^'"\r\n]+(['"])[^'"]+[\r\n]/gmi

  // updateDecorations - Load active document into text buffer 
  let text = activeEditor.document.getText();
  // Make sure last line ends with new line for later tests
  if (!text.endsWith('\n')) {
    // Need the space as well for correct indexing later
    text = text.concat(' \n');
  };

  // updateDecorations - Tags Decorations Whole Word 
  let decorationOptionsArray = [];
  tagFileJsonData.tagsArrayGroupOne.forEach(element => {
      let decorationOptions = vscode.DecorationOptions = [];
      decorationOptionsArray.push(decorationOptions);
  });

  // updateDecorations - Tags Decorations Whole Line 
  tagFileJsonData.tagsArrayGroupTwo.forEach(element => {
      let decorationOptions = vscode.DecorationOptions = [];
      decorationOptionsArray.push(decorationOptions);
  });

  // updateDecorations - Tag Block Decorations 
  tagFileJsonData.tagBlocksArray.forEach(element => {
      let decorationOptions = vscode.DecorationOptions = [];
      decorationOptionsArray.push(decorationOptions);
  });

  // updateDecorations - Special Tags Decorations 
  tagFileJsonData.specialTagsArray.forEach(element => {
      let decorationOptions = vscode.DecorationOptions = [];
      decorationOptionsArray.push(decorationOptions);
  });

  // updateDecorations - Pre-defined Tags Words Only 
  let index = 0;
  tagFileJsonData.tagsArrayGroupOne.forEach(element => {
    let keyword = element.keyword
    let keywordRegex = new RegExp('\\b'+keyword+'\\b:', 'gi');
    while (commentMatch = commentsRegEx.exec(text)) {
      // Skip comments in strings 
      let inString = commentInString.exec(commentMatch);
      if (inString !== null) {
        commentsRegEx.lastIndex = commentMatch.index + 3
        continue;
      };
      while (keywordMatch = keywordRegex.exec(commentMatch[0])) {
        let startPosition = commentMatch.index + keywordMatch.index;
        let endPosition = startPosition + keywordMatch[0].length;
        let endPositionHover = text.indexOf('\n',endPosition);
        endPositionHover--;
        let hoverTextStr = text.substring(startPosition,endPositionHover);
        if (hoverTextStr.endsWith('*/')) {
          hoverTextStr = hoverTextStr.slice(0,hoverTextStr.length-2);
        };
        if (hoverTextStr.endsWith('-->')) {
          hoverTextStr = hoverTextStr.slice(0,hoverTextStr.length-3);
        };
        for (let hoverTextIndex = 1; hoverTextIndex < 5; hoverTextIndex++) {
          // Default to entire comment in case no match found 
          hoverText = commentMatch[0];
          if (commentMatch[hoverTextIndex] != undefined) {
            hoverText = hoverTextStr;
            break;
          };
        };
        let rangeStart = activeEditor.document.positionAt(startPosition);
        let rangeEnd = activeEditor.document.positionAt(endPosition);
        const decoration = { range: new vscode.Range(rangeStart, rangeEnd), hoverMessage: hoverText };
        decorationOptionsArray[index].push(decoration);
      }
    };
    if (element.isEnabled) {
      activeEditor.setDecorations(decorationTypes[index], decorationOptionsArray[index]);
    };
    index ++;
  });

  // updateDecorations - Pre-defined Tags Whole Line 
  tagFileJsonData.tagsArrayGroupTwo.forEach(element => {
    let keyword = element.keyword
    let keywordRegex = new RegExp('\\b'+keyword+'\\b[^:](.*)[^/]', 'gi');
      while (commentMatch = commentsRegEx.exec(text)) {
        // Skip comments in strings 
        let inString = commentInString.exec(commentMatch);
        if (inString !== null) {
          commentsRegEx.lastIndex = commentMatch.index + 3
          continue;
        };
        while (keywordMatch = keywordRegex.exec(commentMatch[0])) {
          let startPosition = commentMatch.index + keywordMatch.index;
          let endPosition = startPosition + keywordMatch[0].length;
          let endPositionHover = text.indexOf('\n',endPosition);
          endPositionHover--;
          let hoverTextStr = text.substring(startPosition,endPositionHover);
          if (hoverTextStr.endsWith('*/')) {
            hoverTextStr = hoverTextStr.slice(0,hoverTextStr.length-2);
          };
          if (hoverTextStr.endsWith('-->')) {
            hoverTextStr = hoverTextStr.slice(0,hoverTextStr.length-3);
          };
          for (let hoverTextIndex = 1; hoverTextIndex < 5; hoverTextIndex++) {
            // Default to entire comment in case no match found 
            hoverText = commentMatch[0];
            if (commentMatch[hoverTextIndex] != undefined) {
              hoverText = hoverTextStr;//keywordMatch[0];//commentMatch[hoverTextIndex];
              break;
            };
          };
          let rangeStart = activeEditor.document.positionAt(startPosition);
          let rangeEnd = activeEditor.document.positionAt(endPosition);
          const decoration = { range: new vscode.Range(rangeStart, rangeEnd), hoverMessage: hoverText };
          decorationOptionsArray[index].push(decoration);
        }
      };
    if (element.isEnabled) {
      activeEditor.setDecorations(decorationTypes[index], decorationOptionsArray[index]);
    };
    index ++;
  })

  // updateDecorations - Tag Blocks - Main Title 
  tagFileJsonData.tagBlocksArray.forEach(element => {
    let regExStart = element.startText;
    let regExStartFixed = regExStart.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
    let regExEnd = element.endText;
    let regExEndFixed = regExEnd.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
    let tagBlockRegEx = new RegExp(regExStartFixed+'([^\r\n]+?)'+regExEndFixed,'gi');
    while (commentMatch = commentsRegEx.exec(text)) {
      // Skip comments in strings 
      let inString = commentInString.exec(commentMatch);
      if (inString !== null) {
        commentsRegEx.lastIndex = commentMatch.index + 3
        continue;
      };
      while (specialMatch = tagBlockRegEx.exec(commentMatch[0])) {
        let startPosition = commentMatch.index + specialMatch.index;
        let endPosition = startPosition + specialMatch[0].length;
        let hoverText = '--== '+specialMatch[0]+' ==--';
        let rangeSpecialStart = activeEditor.document.positionAt(startPosition);
        let rangeSpecialEnd = activeEditor.document.positionAt(endPosition);
        const decoration = { range: new vscode.Range(rangeSpecialStart, rangeSpecialEnd), hoverMessage: hoverText };
        decorationOptionsArray[index].push(decoration);
      };
    };
    if (element.isEnabled) {
      activeEditor.setDecorations(decorationTypes[index], decorationOptionsArray[index]);
    };
    index ++;
  });

  // updateDecorations - Special Tags - File Link 
  let specialTagIndex = 0;
  let filelinkRegEx = /project file:\s*([\w\s\d!@()\-+]+.md)/gi;
  while (commentMatch = commentsRegEx.exec(text)) {
    // Skip comments in strings 
    let inString = commentInString.exec(commentMatch);
    if (inString !== null) {
      commentsRegEx.lastIndex = commentMatch.index + 3
      continue;
    }
    while (specialMatch = filelinkRegEx.exec(commentMatch[0])) {
      let fileNameRegEx = new RegExp(specialMatch[1],'gi');
      let fileNameIndex = fileNameRegEx.exec(commentMatch[0]).index;
      let startPosition = commentMatch.index + fileNameIndex;
      let endPosition = startPosition + specialMatch[1].length;
      let hoverText = '--== '+specialMatch[1]+' ==--';
      let rangeSpecialStart = activeEditor.document.positionAt(startPosition);
      let rangeSpecialEnd = activeEditor.document.positionAt(endPosition);
      const decoration = { range: new vscode.Range(rangeSpecialStart, rangeSpecialEnd), hoverMessage: hoverText };
      decorationOptionsArray[index].push(decoration);
    };
  };
  if (tagFileJsonData.specialTagsArray[specialTagIndex].isEnabled) {
    activeEditor.setDecorations(decorationTypes[index], decorationOptionsArray[index]);
  };
  index ++;
  specialTagIndex ++;

  // updateDecorations - Special Tags - Global File Link 
  let globalFilelinkRegEx = /global file:\s*([\w\s\d!@()\-+]+.md)/gi;
  while (commentMatch = commentsRegEx.exec(text)) {
    // Skip comments in strings 
    let inString = commentInString.exec(commentMatch);
    if (inString !== null) {
      commentsRegEx.lastIndex = commentMatch.index + 3
      continue;
    }
    while (specialMatch = globalFilelinkRegEx.exec(commentMatch[0])) {
      let GlobalfileNameRegEx = new RegExp(specialMatch[1],'gi');
      let GlobalfileNameIndex = GlobalfileNameRegEx.exec(commentMatch[0]).index;
      let startPosition = commentMatch.index + GlobalfileNameIndex;
      let endPosition = startPosition + specialMatch[1].length;
      let hoverText = '--== '+specialMatch[1]+' ==--';
      let rangeSpecialStart = activeEditor.document.positionAt(startPosition);
      let rangeSpecialEnd = activeEditor.document.positionAt(endPosition);
      const decoration = { range: new vscode.Range(rangeSpecialStart, rangeSpecialEnd), hoverMessage: hoverText };
      decorationOptionsArray[index].push(decoration);
    };
  };
  if (tagFileJsonData.specialTagsArray[specialTagIndex].isEnabled) {
    activeEditor.setDecorations(decorationTypes[index], decorationOptionsArray[index]);
  };
  index ++;
  specialTagIndex ++;

  // updateDecorations - Special Tags - Parentheses 
  let parenthesesRegEx = /(\(.+\))/gi;
  while (commentMatch = commentsRegEx.exec(text)) {
    // Skip comments in strings 
    let inString = commentInString.exec(commentMatch);
    if (inString !== null) {
      commentsRegEx.lastIndex = commentMatch.index + 3
      continue;
    }
    while (specialMatch = parenthesesRegEx.exec(commentMatch[0])) {
      let startPosition = commentMatch.index + specialMatch.index;
      let endPosition = startPosition + specialMatch[0].length;
      let hoverText = '--== '+specialMatch[0]+' ==--';
      let rangeSpecialStart = activeEditor.document.positionAt(startPosition);
      let rangeSpecialEnd = activeEditor.document.positionAt(endPosition);
      const decoration = { range: new vscode.Range(rangeSpecialStart, rangeSpecialEnd), hoverMessage: hoverText };
      decorationOptionsArray[index].push(decoration);
    };
  };
  if (tagFileJsonData.specialTagsArray[specialTagIndex].isEnabled) {
    activeEditor.setDecorations(decorationTypes[index], decorationOptionsArray[index]);
  };
  index ++;
  specialTagIndex ++;

  // updateDecorations - Special Tags - Curly Braces 
  let curlyRegEx = /(\{.+\})/gi;
  while (commentMatch = commentsRegEx.exec(text)) {
    // Skip comments in strings 
    let inString = commentInString.exec(commentMatch);
    if (inString !== null) {
      commentsRegEx.lastIndex = commentMatch.index + 3
      continue;
    };
    while (specialMatch = curlyRegEx.exec(commentMatch[0])) {
      let startPosition = commentMatch.index + specialMatch.index;
      let endPosition = startPosition + specialMatch[0].length;
      let hoverText = '--== '+specialMatch[0]+' ==--';
      let rangeSpecialStart = activeEditor.document.positionAt(startPosition);
      let rangeSpecialEnd = activeEditor.document.positionAt(endPosition);
      const decoration = { range: new vscode.Range(rangeSpecialStart, rangeSpecialEnd), hoverMessage: hoverText };
      decorationOptionsArray[index].push(decoration);
    };
  };
  if (tagFileJsonData.specialTagsArray[specialTagIndex].isEnabled) {
    activeEditor.setDecorations(decorationTypes[index], decorationOptionsArray[index]);
  };
  index ++;
  specialTagIndex ++;

  // updateDecorations - Special Tags - Brackets 
  let bracketRegEx = /(\[(.+)\])/gi;
  while (commentMatch = commentsRegEx.exec(text)) {
    // Skip comments in strings 
    let inString = commentInString.exec(commentMatch);
    if (inString !== null) {
      commentsRegEx.lastIndex = commentMatch.index + 3
      continue;
    }
    while (specialMatch = bracketRegEx.exec(commentMatch[0])) {
      let startPosition = commentMatch.index + specialMatch.index;
      let endPosition = startPosition + specialMatch[0].length;
      let hoverText = '--== '+specialMatch[0]+' ==--';
      let rangeSpecialStart = activeEditor.document.positionAt(startPosition);
      let rangeSpecialEnd = activeEditor.document.positionAt(endPosition);
      const decoration = { range: new vscode.Range(rangeSpecialStart, rangeSpecialEnd), hoverMessage: hoverText };
      decorationOptionsArray[index].push(decoration);
    };
  };
  if (tagFileJsonData.specialTagsArray[specialTagIndex].isEnabled) {
    activeEditor.setDecorations(decorationTypes[index], decorationOptionsArray[index]);
  };
  index ++;
  specialTagIndex ++;

  // updateDecorations - Special Tags - Backticks 
  let backtickRegEx = /(`.*?`)/gi;
  while (commentMatch = commentsRegEx.exec(text)) {
    // Skip comments in strings 
    let inString = commentInString.exec(commentMatch);
    if (inString !== null) {
      commentsRegEx.lastIndex = commentMatch.index + 3
      continue;
    };
    while (specialMatch = backtickRegEx.exec(commentMatch[0])) {
      let startPosition = commentMatch.index + specialMatch.index;
      let endPosition = startPosition + specialMatch[0].length;
      let hoverText = '--== '+specialMatch[0]+' ==--';
      let rangeSpecialStart = activeEditor.document.positionAt(startPosition);
      let rangeSpecialEnd = activeEditor.document.positionAt(endPosition);
      const decoration = { range: new vscode.Range(rangeSpecialStart, rangeSpecialEnd), hoverMessage: hoverText };
      decorationOptionsArray[index].push(decoration);
    };
  };
  if (tagFileJsonData.specialTagsArray[specialTagIndex].isEnabled) {
    activeEditor.setDecorations(decorationTypes[index], decorationOptionsArray[index]);
  };
  index ++;
  specialTagIndex ++;

  // updateDecorations - Special Tags - Double Quotes 
  let doubleQuotesRegEx = /(\".*?\")/gi;
  while (commentMatch = commentsRegEx.exec(text)) {
    // Skip comments in strings 
    let inString = commentInString.exec(commentMatch);
    if (inString !== null) {
      commentsRegEx.lastIndex = commentMatch.index + 3
      continue;
    };
    while (specialMatch = doubleQuotesRegEx.exec(commentMatch[0])) {
      let startPosition = commentMatch.index + specialMatch.index;
      let endPosition = startPosition + specialMatch[0].length;
      let hoverText = '--== '+specialMatch[0]+' ==--';
      let rangeSpecialStart = activeEditor.document.positionAt(startPosition);
      let rangeSpecialEnd = activeEditor.document.positionAt(endPosition);
      const decoration = { range: new vscode.Range(rangeSpecialStart, rangeSpecialEnd), hoverMessage: hoverText };
      decorationOptionsArray[index].push(decoration);
    };
  };
  if (tagFileJsonData.specialTagsArray[specialTagIndex].isEnabled) {
    activeEditor.setDecorations(decorationTypes[index], decorationOptionsArray[index]);
  };
  index ++;
  specialTagIndex ++;

  // updateDecorations - Special Tags - Single Quotes 
  let singleQuotesRegEx = /('.*')/gi;
  while (commentMatch = commentsRegEx.exec(text)) {
    // Skip comments in strings 
    let inString = commentInString.exec(commentMatch);
    if (inString !== null) {
      commentsRegEx.lastIndex = commentMatch.index + 3
      continue;
    };
    while (specialMatch = singleQuotesRegEx.exec(commentMatch[0])) {
      let startPosition = commentMatch.index + specialMatch.index;
      let endPosition = startPosition + specialMatch[0].length;
      let hoverText = '--== '+specialMatch[0]+' ==--';
      let rangeSpecialStart = activeEditor.document.positionAt(startPosition);
      let rangeSpecialEnd = activeEditor.document.positionAt(endPosition);
      const decoration = { range: new vscode.Range(rangeSpecialStart, rangeSpecialEnd), hoverMessage: hoverText };
      decorationOptionsArray[index].push(decoration);
    };
  };
  if (tagFileJsonData.specialTagsArray[specialTagIndex].isEnabled) {
    activeEditor.setDecorations(decorationTypes[index], decorationOptionsArray[index]);
  };
  index ++;
  specialTagIndex ++;

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                    ● Function triggerUpdateDecorations ●                     │
//  │                                                                              │
//  │                    • Timer for Updating Our Decoraions •                     │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
function triggerUpdateDecorations(throttle = false) {

  if (timeout) {
    clearTimeout(timeout);
    timeout = undefined;
  };

  if (throttle) {
    timeout = setTimeout(updateDecorations, 100);
  } else {
    updateDecorations();
  };

};

  if (activeEditor) {
    triggerUpdateDecorations();
  };

  vscode.window.onDidChangeActiveTextEditor(editor => {
  activeEditor = editor;
  if (editor) {
    getExtension();
    triggerUpdateDecorations();
  };
  }, null, context.subscriptions);

  vscode.workspace.onDidChangeTextDocument(event => {
  if (activeEditor && event.document === activeEditor.document) {
    triggerUpdateDecorations(true);
  };
  }, null, context.subscriptions);

  vscode.workspace.onDidSaveTextDocument((TextDocument) => {
  if (activeEditor && TextDocument.fileName === tagSettingsFile) {
    promptUserForRestart();
  };
  }, null, context.subscriptions);

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                            ● Function gotoLine ●                             │
//  │                                                                              │
//  │                • Called When Treeview Keyword Item Clicked •                 │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function gotoLine(item,line,col) {

  //console.log("item:",item);
  let pos = new vscode.Position(line,col);
  await vscode.window.showTextDocument(
    vscode.Uri.file(item), 
    {selection: new vscode.Range(pos, pos)}
  );

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                     ● Function initTagSettingsFilePath ●                     │
//  │                                                                              │
//  │                  • Initialize Tag Settings File and Path •                   │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function initTagSettingsFilePath() {

  // initTagSettingsFilePath - If folder does exist then verifiy extensions files exist 
  if (fs.existsSync(tagSettingsPath)) {
    if (!fs.existsSync(tagSettingsFile)) {
      // Write new settings file if it does not exist
      fs.writeFileSync(tagSettingsFile, JSON.stringify(defaultTagSettings, null, 2));
    };
  } else {
    // initTagSettingsFilePath - Otherwise create folder and Tag Settings File 
    fs.mkdirSync(tagSettingsPath, {recursive: true});
    fs.writeFileSync(tagSettingsFile, JSON.stringify(defaultTagSettings, null, 2));
  };
};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                       ● Function editTagSettingsFile ●                       │
//  │                                                                              │
//  │                          • Edit Tag Settings File •                          │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function editTagSettingsFile() {

  // editTagSettingsFile - Create tags file if needed 
  initTagSettingsFilePath();

  // editTagSettingsFile - Open it for editing 
  var document = await vscode.workspace.openTextDocument(tagSettingsFile);
  await vscode.window.showTextDocument(document);

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                     ● Function restoreTagSettingsFile ●                      │
//  │                                                                              │
//  │              • Restore Tag Settings File to Default Settings •               │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function restoreTagSettingsFile() {

  // restoreTagSettingsFile - Prompt user for confirmation 
  const selectedItem = await vscode.window.showWarningMessage('All tag settings will be restored to default settings. Any changes you have made will be lost.','Continue','Cancel');
  if ('Continue' !== selectedItem) {
    return;
  };

  // restoreTagSettingsFile - Remove existing tags settings file 
  await fs.rmSync(tagSettingsFile);

  // editTagSettingsFile - Create default tags settings file 
  initTagSettingsFilePath();

  // restoreTagSettingsFile - Open it for editing 
  var document = await vscode.workspace.openTextDocument(tagSettingsFile);
  await vscode.window.showTextDocument(document);

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                          ● Function getExtension ●                           │
//  │                                                                              │
//  │                     • Get the Current Files Extension •                      │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
function getExtension() {

  let activeEditor = vscode.window.activeTextEditor;
	if (!activeEditor) {
    currentFileExt = "";
		return;
	};
  let a = vscode.window.activeTextEditor.document.fileName.split(".");
  if( a.length === 1 || ( a[0] === "" && a.length === 2 ) ) {
    currentFileExt = "";
  } else {
    currentFileExt = a.pop().toLowerCase();
  };

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                           ● Function deactivate ●                            │
//  │                                                                              │
//  │                       • Deactivate Extension Cleanup •                       │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
function deactivate() {}

//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                              ● Export modules ●                              │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
module.exports = {
    activate,
    deactivate,
};
