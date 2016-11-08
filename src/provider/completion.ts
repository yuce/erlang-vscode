/// <ref href="../typings/tsd.d.ts">

import * as vscode from 'vscode';
import * as fs from 'fs';

const RE_MODULE = /(\w+):$/;

interface FunctionCompletionData {
    name: string;
    // detail: string;
}

export class ErlangCompletionProvider implements vscode.CompletionItemProvider {
    private modules: any = null;
    private moduleNames: string[] = null;
    private genericCompletionItems: vscode.CompletionItem[] = null;
    private completionPath: string;

    constructor(context: vscode.ExtensionContext) {
        this.completionPath = context.asAbsolutePath("./priv/erlang-libs.json");
    }

    public provideCompletionItems(doc: vscode.TextDocument, pos: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.CompletionItem[]> {
        return new Promise<vscode.CompletionItem[]>((resolve, reject) => {
            const line = doc.lineAt(pos.line);
            const m = RE_MODULE.exec(line.text.substring(0, pos.character));
            if (this.modules === null) {
                this.readCompletionJson(this.completionPath, modules => {
                    this.modules = modules;
                    (m === null) ?
                        this.resolveModuleNames(resolve)
                        : this.resolveFunNames(m[1], resolve);
                });
            }
            else {
                (m === null) ?
                    this.resolveModuleNames(resolve)
                    : this.resolveFunNames(m[1], resolve);
            }
        });
    }

    private resolveFunNames(module, resolve) {
        resolve(this.makeModuleFunsCompletion(module));
    }

    private resolveModuleNames(resolve) {
        if (!this.genericCompletionItems) {
            this.genericCompletionItems = this.makeGenericCompletion();
        }
        resolve(this.genericCompletionItems);
    }

    private makeFunctionCompletionItem(name: string): vscode.CompletionItem {
        const item = new vscode.CompletionItem(name);
        // item.documentation = cd.detail;
        item.kind = vscode.CompletionItemKind.Function;
        return item;
    }

    private makeModuleNameCompletionItem(name: string): vscode.CompletionItem {
        const item = new vscode.CompletionItem(name);
        item.kind = vscode.CompletionItemKind.Module;
        return item;
    }

    private makeModuleFunsCompletion(module: string): vscode.CompletionItem[] {
        const moduleFuns = this.modules[module] || [];
        return moduleFuns.map(name => {
            return this.makeFunctionCompletionItem(name);
        });
    }

    private makeGenericCompletion(): vscode.CompletionItem[] {
        const modules = this.modules || {};
        const names = [];
        for (let k in modules) {
            names.push(k);
        }
        names.sort();
        return names.map(name => {
            return this.makeModuleNameCompletionItem(name);
        });
    }

    private readCompletionJson(filename: string, done: Function): any {
        fs.readFile(filename, (err, data) => {
            if (err) {
                console.log(`Cannot read: ${filename}`);
                done({});
            }
            else {
                let d: any = data.toJSON();
                done(d);
            }
        });
    }
}