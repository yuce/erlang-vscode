import * as vscode from 'vscode';
import * as jsDiff from 'diff';

export interface FilePatch {
    fileName: string;
    edits: Edit[];
}

export enum EditTypes { EDIT_DELETE, EDIT_INSERT, EDIT_REPLACE };

export class Edit {
    action: number;
    start: vscode.Position;
    end: vscode.Position;
    text: string;

    constructor(action: number, start: vscode.Position) {
        this.action = action;
        this.start = start;
        this.text = '';
    }

    // Creates TextEdit for current Edit
    apply(): vscode.TextEdit {
        switch (this.action) {
            case EditTypes.EDIT_INSERT:
                return vscode.TextEdit.insert(this.start, this.text);

            case EditTypes.EDIT_DELETE:
                return vscode.TextEdit.delete(new vscode.Range(this.start, this.end));

            case EditTypes.EDIT_REPLACE:
                return vscode.TextEdit.replace(new vscode.Range(this.start, this.end), this.text);
        }
    }

    // Applies Edit using given TextEditorEdit
    applyUsingTextEditorEdit(editBuilder: vscode.TextEditorEdit): void {
        switch (this.action) {
            case EditTypes.EDIT_INSERT:
                editBuilder.insert(this.start, this.text);
                break;

            case EditTypes.EDIT_DELETE:
                editBuilder.delete(new vscode.Range(this.start, this.end));
                break;

            case EditTypes.EDIT_REPLACE:
                editBuilder.replace(new vscode.Range(this.start, this.end), this.text);
                break;
        }
    }

    // Applies Edits to given WorkspaceEdit
    applyUsingWorkspaceEdit(workspaceEdit: vscode.WorkspaceEdit, fileUri: vscode.Uri): void {
        switch (this.action) {
            case EditTypes.EDIT_INSERT:
                workspaceEdit.insert(fileUri, this.start, this.text);
                break;

            case EditTypes.EDIT_DELETE:
                workspaceEdit.delete(fileUri, new vscode.Range(this.start, this.end));
                break;

            case EditTypes.EDIT_REPLACE:
                workspaceEdit.replace(fileUri, new vscode.Range(this.start, this.end), this.text);
                break;
        }
    }
}


export function getEdits(fileName: string, oldStr: string, newStr: string): FilePatch {
    if (process.platform === 'win32') {
        oldStr = oldStr.split('\r\n').join('\n');
        newStr = newStr.split('\r\n').join('\n');
    }
    let unifiedDiffs: jsDiff.IUniDiff = jsDiff.structuredPatch(fileName, fileName, oldStr, newStr.trim(), '', '');
    let filePatches: FilePatch[] = parseUniDiffs([unifiedDiffs]);
    return filePatches[0];
}

function parseUniDiffs(diffOutput: jsDiff.IUniDiff[]): FilePatch[] {
    let filePatches: FilePatch[] = [];
    diffOutput.forEach((uniDiff: jsDiff.IUniDiff) => {
        let edit: Edit = null;
        let edits: Edit[] = [];
        uniDiff.hunks.forEach((hunk: jsDiff.IHunk) => {
            let startLine = hunk.oldStart;
            hunk.lines.forEach((line) => {
                switch (line.substr(0, 1)) {
                    case '-':
                        if (edit == null) {
                            edit = new Edit(EditTypes.EDIT_DELETE, new vscode.Position(startLine - 1, 0));
                        }
                        edit.end = new vscode.Position(startLine, 0);
                        startLine++;
                        break;
                    case '+':
                        if (edit == null) {
                            edit = new Edit(EditTypes.EDIT_INSERT, new vscode.Position(startLine - 1, 0));
                        } else if (edit.action === EditTypes.EDIT_DELETE) {
                            edit.action = EditTypes.EDIT_REPLACE;
                        }
                        edit.text += line.substr(1) + '\n';
                        break;
                    case ' ':
                        startLine++;
                        if (edit != null) {
                            edits.push(edit);
                        }
                        edit = null;
                        break;
                }
            });
            if (edit != null) {
                edits.push(edit);
            }
        });
        filePatches.push({ fileName: uniDiff.oldFileName, edits: edits });
    });

    return filePatches;

}
