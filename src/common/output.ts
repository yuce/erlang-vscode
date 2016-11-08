'use strict';

import * as vscode from 'vscode';

export class ErlangOutput {
    constructor(private outputChannel: vscode.OutputChannel) {

    }

    public info(msg: string): void {
        this.outputChannel.appendLine(`INFO: ${msg}`);
    }

    public error(msg: string): void {
        this.outputChannel.appendLine(`ERROR: ${msg}`);
    }
}