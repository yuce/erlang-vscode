'use strict';

import * as vscode from 'vscode';
import * as path from 'path';
import {EralngSettings} from '../common/setting';
import {ErlangOutput} from '../common/output';
import {execFileInternal} from '../common/utils';
import {getEdits} from '../common/edit';

export class EralngFormattingEditProvider implements vscode.DocumentFormattingEditProvider {
    public constructor(private context: vscode.ExtensionContext, private output: ErlangOutput, private config: EralngSettings, protected workspaceRootPath: string) {
    }

    public provideDocumentFormattingEdits(document: vscode.TextDocument, options: vscode.FormattingOptions, token: vscode.CancellationToken): Thenable<vscode.TextEdit[]> {
        let tidy = this.context.asAbsolutePath("./priv/erl_tidy.escript");
        let cwd = this.workspaceRootPath;
        this.output.info(document.uri.fsPath);
        return execFileInternal(this.config.escriptPath, [tidy, document.uri.fsPath], { cwd }, true).then(data => {
            this.output.info(data);
            let textEdits: vscode.TextEdit[] = [];
            let filePatch = getEdits(document.fileName, document.getText(), data);

            filePatch.edits.forEach((edit) => {
                textEdits.push(edit.apply());
            });
            return textEdits;
        }).catch(error => {
            this.output.error(error);
            return [];
        });
    }
}