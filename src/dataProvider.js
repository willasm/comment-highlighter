const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { readFile } = require('fs/promises');

class DataProvider {

  constructor(context, extInclude, filesToExclude, foldersToExclude, tagFileJsonData) {
    this.context = context;
    this.tagFileJsonData = tagFileJsonData;
    this.extInclude = extInclude;
    this.filesToExclude = filesToExclude;
    this.foldersToExclude = foldersToExclude;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    vscode.workspace.onDidCreateFiles(() => this.onCreateFiles());
    vscode.workspace.onDidDeleteFiles(() => this.onDeleteFiles());
    vscode.workspace.onDidRenameFiles(() => this.onRenameFiles());
    vscode.workspace.onDidSaveTextDocument(() => this.onSaveFiles());
    vscode.commands.registerCommand('comment-highlighter.refresh', () => this.refresh());
    new CountDecorationProvider();

  };

  getTreeItem(element) {
    // NOTE: Just need to return the tree item here.
    return element;
  };

  getChildren(element) {
    if (element) {
      // NOTE: Return the tree items children here 'element.children'
      //console.log('### GETCHILDREN element.children:', element.children);
      return element.children;
    } else {
      // NOTE: Return an array of the entire Treeviews items
      // See the example array below
      //return [{"label": "blah", "collapsibleState": "Expanded","children": [{"label": "Child 1"},{"label": "Child 2"},{"label": "Child 3"}]},{"label": "boss", "collapsibleState": "Expanded","children": []},{"label": "bitchin", "collapsibleState": "Expanded","children": []}];

      // NOTE: Call this function to create and return the Treeviews array of items.

      return this.convertDataToTreeItems();
    };
  };

  refresh() {
    //console.log("Refreshed.....");
    this._onDidChangeTreeData.fire(undefined);
    
  };

  onCreateFiles() {
    //console.log('Created File...');
    this.refresh();
  };

  onDeleteFiles() {
    //console.log('Deleted File...');
    this.refresh();
  };

  onRenameFiles() {
    //console.log('Renamed File...');
    this.refresh();
  };

  onSaveFiles() {
    //console.log('Saved File...');
    this.refresh();
  };

  async convertDataToTreeItems() {

    // NOTE: Array for all found files items
    let dataList = [];

    // NOTE: Array for all current parents child items
    let dataItemsChild = [];

    // NOTE: All currently included extensions as of June 14 2024
    // ["asm", "ini", "c", "cc", "cp", "cs", "cpp", "c++", "cxx", "cppm", "ixx", "go", "java", "js", "jsx", "kt", "kts", "ktm", "less", "php", "scss", "swift", "ts", "tsx", "jsonc", "css", "coffee", "tbs", "bat", "cmd", "html", "vue", "md", "sql", "py", "rb", "rs", "rlib", "twig", "pl", "m", "mat", "bas", "cls", "r", "dpr", "pas"];

    // NOTE: The extensions to include/exclude are sent to this data provider from the activate function
    const files = fs.readdirSync(vscode.workspace.workspaceFolders[0].uri.fsPath,{recursive: true,withFileTypes: true,}).filter(async (file) => {
      // Only interested in files
      if (file.isFile()) {
        // Do not want specific files
        if (!this.filesToExclude.includes(file.name)) {
          // Only want files with supported extensions
          if (this.extInclude.includes(path.extname(file.name).slice(1))) {
            // Do not want files in excluded folders
            let flagNotFound = true;
            for (let idx = 0; idx < this.foldersToExclude.length; idx++) {
              if (file.path.includes(this.foldersToExclude[idx])) {
                flagNotFound = false;
              };
            };
            if (flagNotFound) {
              // NOTE: Here you open the file and search for keyword tags and saving the array to `children:` below
              let fsPath = path.join(file.path, file.name);
              let uri = vscode.Uri.file(path.join(file.path, file.name)).path;
              dataItemsChild = this.getChildArray(fsPath, uri, this.tagFileJsonData).then(function(results){
                if (results[0] != undefined) {
                  dataList.push({
                    fileName: file.name,
                    fsPath: fsPath,
                    uri: uri,
                    children: results//dataItemsChild
                  });
                };
                //console.log('$$$ dataList:', dataList);
              });
            };
          };
        };
      };
    });

    // NOTE: Sort the array alphabetically
    // Need the delay as await was giving me a headache
    let safetyValve = 0;
    while (dataList.length == 0) {
      await new Promise(r => setTimeout(r, 10));
      safetyValve++
      if (safetyValve == 500) {
        break;
      }
    };
    dataList.sort(compare);

    // NOTE: Array of all tree items to be returned
    let treeItemsArray = [];
    dataList.forEach((element) => {
      treeItemsArray.push(
        new TreeItem(element, vscode.TreeItemCollapsibleState.Collapsed),
      );
    });

    return treeItemsArray;

  };


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                          ● Function getChildArray ●                          │
//  │                                                                              │
//  │                       • Get This Files Tag Keywords •                        │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
  async getChildArray(fsPath, uri, tagFileJsonData) {
    
    let currentFileExt;
    let commentsRegEx;
    let commentString;
    
    // getChildArray - Childrens array 
    let treeItemsChildrenArray = [];

    // getChildArray - Clear any previous comment Regex definition 
    commentsRegEx = "";

    // getChildArray - Get comment symbols and set comments RegEx 
    currentFileExt = path.extname(fsPath).slice(1)
    let i = 0;
    tagFileJsonData.extensions.forEach(e => {
      let arr = tagFileJsonData.extensions[i].ext;
      const extMatch = arr.some((e) => {
      return e === currentFileExt;
      });

      // getChildArray - If extension supported then set comment's RegEx 
      if (extMatch) {
        commentString = tagFileJsonData.extensions[i].commentsRegEx;
        commentsRegEx = new RegExp(commentString,'gmi')
      };
      i ++;
    });
    if (commentsRegEx === "") {
      return [];
    };

    // getChildArray - Search for tag matches 
    let commentMatch;
    let keywordMatch;

    // getChildArray - Ignore comments in strings 
    let commentInString = /^[^'"\r\n]+(['"])[^'"]+[\r\n]/gmi

    // getChildArray - Get files data 
    let text = await readFile(fsPath, 'utf-8');   // Read file into memory
    text = text.replace(/\r\n|\r/g, '\n');        // Preprocess the text to handle different possible line endings

    // getChildArray - Search files data for Group One tags 
    let index = 0;
    tagFileJsonData.tagsArrayGroupOne.forEach(element => {
      let keyword = element.keyword
      let keywordRegex = new RegExp('\\b'+keyword+'\\b:\\s+.*[^\\*/|\\n|###|\\-\\-\\>]', 'gi');
      while (commentMatch = commentsRegEx.exec(text)) {
        // Skip strings noi in comments 
        let inString = commentInString.exec(commentMatch);
        if (inString !== null) {
          commentsRegEx.lastIndex = commentMatch.index + 3
          continue;
          }
          while (keywordMatch = keywordRegex.exec(commentMatch[0])) {
          let startPosition = commentMatch.index + keywordMatch.index;
          for (let keywordIndex = 1; keywordIndex < 5; keywordIndex++) {
            // Default to entire comment in case no match found 
            let keywordString = commentMatch[0];
            if (commentMatch[keywordIndex] != undefined) {
              keywordString = keywordMatch[0];//commentMatch[keywordIndex];
              //console.log('keywordONE:', keyword);
              let lineCol = this.getLineColNumbers(text, startPosition);
              let lineNumber = lineCol[0]
              let columnNumber = lineCol[1];
              let childData = new ChildItem(keyword,keywordString,lineNumber,columnNumber,uri,fsPath);
              treeItemsChildrenArray.push(childData);
              break;
            }
          };
        };
      }
      index ++;
    });

    // getChildArray - Search files data for Group Two tags 
    let idx = 0;
    tagFileJsonData.tagsArrayGroupTwo.forEach(element => {
      let keyword = element.keyword
      let keywordRegex = new RegExp('\\b'+keyword+'\\b[^:].+', 'gi');
      while (commentMatch = commentsRegEx.exec(text)) {
        // Skip strings noi in comments 
        let inString = commentInString.exec(commentMatch);
        if (inString !== null) {
          commentsRegEx.lastIndex = commentMatch.index + 3
          continue;
          }
          while (keywordMatch = keywordRegex.exec(commentMatch[0])) {
          let startPosition = commentMatch.index + keywordMatch.index;
          for (let keywordIndex = 1; keywordIndex < 15; keywordIndex++) {
            // Default to entire comment in case no match found 
            let keywordString = commentMatch[0];
            if (commentMatch[keywordIndex] != undefined) {
              keywordString = keywordMatch[0];
              let lineCol = this.getLineColNumbers(text, startPosition);
              let lineNumber = lineCol[0]
              let columnNumber = lineCol[1];
              let childData = new ChildItem(keyword,keywordString,lineNumber,columnNumber,uri,fsPath);
              treeItemsChildrenArray.push(childData);
              break;
            }
          };
        };
      }
      idx ++;
    });
    return treeItemsChildrenArray;
  };


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                        ● Function getLineColNumbers ●                        │
//  │                                                                              │
//  │      • Returns an Array with Current Line and Column From Files Index •      │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
  getLineColNumbers(text, index) {
    let line = 0;
    let col = 0;
    for (let i = 0; i < index; i++) {
      col++
      if (text[i] === '\n') {
        col = 0
        line++;
      }
    }
    return [line,col];
  }

};

//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                      ● Class CountDecorationProvider ●                       │
//  │                                                                              │
//  │               • Provides Decoration for my Treeview (Color) •                │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
class CountDecorationProvider {
  constructor() {
    this.disposables = [];
    this.disposables.push(vscode.window.registerFileDecorationProvider(this));
  }; 

  provideFileDecoration(uri) {
    const treeFileTextColor = new vscode.ThemeColor('chTreeItem.filenameTextColor');
    const bugTextColor = new vscode.ThemeColor('chTreeItem.bugTextColor');
    const changedTextColor = new vscode.ThemeColor('chTreeItem.changedTextColor');
    const debugTextColor = new vscode.ThemeColor('chTreeItem.debugTextColor');
    const fixmeTextColor = new vscode.ThemeColor('chTreeItem.fixmeTextColor');
    const hackTextColor = new vscode.ThemeColor('chTreeItem.hackTextColor');
    const ideaTextColor = new vscode.ThemeColor('chTreeItem.ideaTextColor');
    const noteTextColor = new vscode.ThemeColor('chTreeItem.noteTextColor');
    const optimizeTextColor = new vscode.ThemeColor('chTreeItem.optimizeTextColor');
    const researchTextColor = new vscode.ThemeColor('chTreeItem.researchTextColor');
    const reviewTextColor = new vscode.ThemeColor('chTreeItem.reviewTextColor');
    const tempTextColor = new vscode.ThemeColor('chTreeItem.tempTextColor');
    const todoTextColor = new vscode.ThemeColor('chTreeItem.todoTextColor');
    const userTagTextColor = new vscode.ThemeColor('chTreeItem.userTagTextColor');
    if (uri.scheme == "foo") {
      if (uri.authority >= 0) {
        return {
          color: treeFileTextColor, // Treeview filename foreground text color
          badge: uri.authority,     // This is the number of keyword tags found in the file
          //tooltip: "Blah",        // This has no effect if defined in tree item constructor
          //propagate: true,        // This did not work for me? Not needed anyways.
        };
      
      } else if (uri.authority === 'bug') {
        return {
          color: bugTextColor,
        };
      } else if (uri.authority === 'changed') {
        return {
          color: changedTextColor,
        };
      } else if (uri.authority === 'debug') {
        return {
          color: debugTextColor,
        };
      } else if (uri.authority === 'fixme') {
        return {
          color: fixmeTextColor,
        };
      } else if (uri.authority === 'hack') {
        return {
          color: hackTextColor,
        };
      } else if (uri.authority === 'idea') {
        return {
          color: ideaTextColor,
        };
      } else if (uri.authority === 'note') {
        return {
          color: noteTextColor,
        };
      } else if (uri.authority === 'optimize') {
        return {
          color: optimizeTextColor,
        };
      } else if (uri.authority === 'research') {
        return {
          color: researchTextColor,
        };
      } else if (uri.authority === 'review') {
        return {
          color: reviewTextColor,
        };
      } else if (uri.authority === 'temp') {
        return {
          color: tempTextColor,
        };
      } else if (uri.authority === 'todo') {
        return {
          color: todoTextColor,
        };
      } else if (uri.authority) {
        return {
          color: userTagTextColor,
        };
      };
    };
    return undefined;
  };

  dispose() {
    this.disposables.forEach((d) => d.dispose());
  };
};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                              ● Class TreeItem ●                              │
//  │                                                                              │
//  │                 • Creates a New Tree Item For Current File •                 │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
class TreeItem extends vscode.TreeItem {

  constructor(files, collapsibleState) {

    super(files, collapsibleState);
    this.label = files.fileName;
    this.collapsibleState = collapsibleState;
    this.fsPath = files.fsPath;
    this.uri = files.uri;
    this.tooltip = `File Location...\n${files.fsPath}`;
    this.iconPath = treeItemIcon(this.fsPath);
    this.children = files.children;
    let childCount = files.children.length;
    this.resourceUri = vscode.Uri.parse(`foo://${childCount}`);//this.uri);
    
  };
};

//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                          ● Function treeItemIcon ●                           │
//  │                                                                              │
//  │       • Sets the Icon for this Filename Item Based on its Extension •        │
//  ╰──────────────────────────────────────────────────────────────────────────────╯

function treeItemIcon(fsPath) {

  let ext = path.extname(fsPath).slice(1);
  ext = ext.toLowerCase();
  if (ext == 'asm') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'ASM.svg');
  } else if (ext == 'bat' || ext == 'cmd') { 
    return path.join(__filename, '..', '..', 'images', 'icons', 'Batch.svg');
  } else if (ext == 'c' || ext == 'cc') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'C.svg');
  } else if (ext == 'cs') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'Csharp.svg');
  } else if (ext == 'coffee') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'coffee.svg');
  } else if (ext == 'cpp' || ext == 'c++' || ext == 'cxx' || ext == 'cppm' || ext == 'ixx' || ext == 'cp') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'Cpp.svg');
  } else if (ext == 'css' || ext == 'scss' || ext == 'less') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'CSS.svg');
  } else if (ext == 'go') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'GO.svg');
  } else if (ext == 'dpr' || ext == 'pas') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'Delphi.svg');
  } else if (ext == 'html') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'HTML.svg');
  } else if (ext == 'ini') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'INI.svg');
  } else if (ext == 'java') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'JAVA.svg');
  } else if (ext == 'js' || ext == 'jsx') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'Javascript.svg');
  } else if (ext == 'jsonc') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'JSON.svg');
  } else if (ext == 'kt' || ext == 'kts') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'Kotlin.svg');
  } else if (ext == 'ktm') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'KotlinMain.svg');
  } else if (ext == 'md') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'Markdown.svg');
  } else if (ext == 'm' || ext == 'mat') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'Matlab.svg');
  } else if (ext == 'pl') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'Perl.svg');
  } else if (ext == 'php' || ext == 'twig') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'PHP.svg');
  } else if (ext == 'py') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'Python.svg');
  } else if (ext == 'r') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'R.svg');
  } else if (ext == 'rb') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'Ruby.svg');
  } else if (ext == 'rs' || ext == 'rlib') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'Rust.svg');
  } else if (ext == 'swift') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'Swift.svg');
  } else if (ext == 'sql') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'SQL.svg');
  } else if (ext == 'tbs') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'TerraByteScript.svg');
  } else if (ext == 'ts' || ext == 'tsx') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'TypeScript.svg');
  } else if (ext == 'vba' || ext == 'vbs' || ext == 'bas' || ext == 'cls') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'VBA.svg');
  } else if (ext == 'vue') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'Vue.svg');
  } else {
    return new vscode.ThemeIcon("file-code");
  }

// Complete Extension List as of June 14 2024
// extList = ["asm", "ini", "c", "cc", "cp", "cs", "cpp", "c++", "cxx", "cppm", "ixx", "go", "java", "js", "jsx", "kt", "kts", "ktm", "less", "php", "scss", "swift", "ts", "tsx", "jsonc", "css", "coffee", "tbs", "bat", "cmd", "html", "vue", "md", "sql", "py", "rb", "rs", "rlib", "twig", "pl", "m", "mat", "bas", "cls", "r", "dpr", "pas"];

}

//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                             ● Class ChildItem ●                              │
//  │                                                                              │
//  │                          • Child Item Constructor •                          │
//  ╰──────────────────────────────────────────────────────────────────────────────╯

class ChildItem {

  constructor (keyword,keywordStr,row, col, uri, fsPath) {
    this.label = keywordStr;
    //console.log('keyword:', keyword);
    //console.log('keywordStr:', keywordStr);
    this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    this.command = {
      "command": "comment-highlighter.gotoLine",
      "title": "Goto",
      "arguments":[uri,row,col]
    };
    this.iconPath = childItemIcon(keyword);
    this.tooltip = `${keywordStr}\nLine: ${row+1} Column: ${col+1}\nFile Location...\n${fsPath}`;
    this.resourceUri = vscode.Uri.parse(`foo://${keyword}`);//this.uri);
  };
};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                          ● Function childItemIcon ●                          │
//  │                                                                              │
//  │        • Sets the Icon for this Child Item Based on the Tag Keyword •        │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
function childItemIcon(keyword) {

  if (keyword.toLowerCase() === 'bug') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'bug.svg');
  } else if (keyword.toLowerCase() === 'changed'){
    return path.join(__filename, '..', '..', 'images', 'icons', 'icons8-support.svg');
  } else if (keyword.toLowerCase() === 'debug'){
    return path.join(__filename, '..', '..', 'images', 'icons', 'debug-script-svgrepo-com.svg');
  } else if (keyword.toLowerCase() === 'fixme'){
    return path.join(__filename, '..', '..', 'images', 'icons', 'icons8-clock.svg');
  } else if (keyword.toLowerCase() === 'hack'){
    return path.join(__filename, '..', '..', 'images', 'icons', 'icons8-padlock.svg');
  } else if (keyword.toLowerCase() === 'idea'){
    return path.join(__filename, '..', '..', 'images', 'icons', 'icons8-idea.svg');
  } else if (keyword.toLowerCase() === 'note'){
    return path.join(__filename, '..', '..', 'images', 'icons', 'icons8-scroll.svg');
  } else if (keyword.toLowerCase() === 'optimize'){
    return path.join(__filename, '..', '..', 'images', 'icons', 'icons8-services.svg');
  } else if (keyword.toLowerCase() === 'research'){
    return path.join(__filename, '..', '..', 'images', 'icons', 'icons8-search.svg');
  } else if (keyword.toLowerCase() === 'review'){
    return path.join(__filename, '..', '..', 'images', 'icons', 'icons8-info.svg');
  } else if (keyword.toLowerCase() === 'temp'){
    return path.join(__filename, '..', '..', 'images', 'icons', 'icons8-restart.svg');
  } else if (keyword.toLowerCase() === 'todo'){
    return path.join(__filename, '..', '..', 'images', 'icons', 'icons8-plus.svg');
  } else {
    return new vscode.ThemeIcon("account");
  }
}

//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                             ● Function compare ●                             │
//  │                                                                              │
//  │                     • Used to Sort an Arrar of Strings •                     │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
function compare(a, b) {
  // Use toUpperCase() to ignore character casing
  const fileA = a.fileName.toUpperCase();
  const fileB = b.fileName.toUpperCase();
  let comparison = 0;
  if (fileA > fileB) {
    comparison = 1;
  } else if (fileA < fileB) {
    comparison = -1;
  };
  return comparison;
};

//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                              ● Export modules ●                              │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
module.exports = DataProvider;
