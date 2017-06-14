'use strict';

import {
  workspace, TextDocument, FormattingOptions, CancellationToken, ExtensionContext, TextEdit, DocumentFormattingEditProvider
} from 'vscode';
import * as child_process from 'child_process';
import {getEdits} from './edit';

export class ErlangFormattingEditProvider implements DocumentFormattingEditProvider {
    public constructor(private context: ExtensionContext) {

    }

    public provideDocumentFormattingEdits(document: TextDocument, options: FormattingOptions, token: CancellationToken): Thenable<TextEdit[]> {
        let tidy = this.context.asAbsolutePath("./priv/erl-indent");
        let cwd = workspace.rootPath;
        document.save();

        return this.execFileInternal(tidy, [document.uri.fsPath], { cwd }, true).then(data => {
            let textEdits: TextEdit[] = [];
            let filePatch = getEdits(document.fileName, document.getText(), data);

            filePatch.edits.forEach((edit) => {
                textEdits.push(edit.apply());
            });
            return textEdits;
        }).catch(error => {
            return [];
        });
    }

    private execFileInternal(file: string, args: string[], options: child_process.ExecFileOptions, includeErrorAsResponse: boolean): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            child_process.execFile(file, args, options, (error, stdout, stderr) => {
                this.handleResponse(file, includeErrorAsResponse, error, stdout, stderr).then(resolve, reject);
            });
        })
    }

    private handleResponse(file: string, includeErrorAsResponse: boolean, error: Error, stdout: string, stderr: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            if (includeErrorAsResponse && (stdout.length > 0 || stderr.length > 0)) {
                return resolve(stdout + '\n' + stderr);
            }

            let hasErrors = (error && error.message.length > 0) || (stderr && stderr.length > 0);
            if (hasErrors && (typeof stdout !== 'string' || stdout.length === 0)) {
                let errorMsg = (error && error.message) ? error.message : (stderr && stderr.length > 0 ? stderr + '' : '');
                return reject(errorMsg);
            }

            resolve(stdout + '');
        })
    }
}
