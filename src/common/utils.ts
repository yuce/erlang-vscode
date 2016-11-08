'use strict';

import * as vscode from 'vscode';
import * as child_process from 'child_process';

function handleResponse(file: string, includeErrorAsResponse: boolean, error: Error, stdout: string, stderr: string): Promise<string> {
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
    });
}

export function execFileInternal(file: string, args: string[], options: child_process.ExecFileOptions, includeErrorAsResponse: boolean): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        child_process.execFile(file, args, options, (error, stdout, stderr) => {
            handleResponse(file, includeErrorAsResponse, error, stdout, stderr).then(resolve, reject);
        });
    });
}