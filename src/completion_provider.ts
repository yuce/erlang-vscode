/// <ref href="../typings/tsd.d.ts">


import {CompletionItemProvider, TextDocument, Position, CancellationToken,
        CompletionItem, CompletionItemKind} from 'vscode';
import {Symbols, FunctionInfo, CallbackAction} from 'whatels';
import {WhatelsClient} from './whatels_client';
import fs = require('fs');
import path = require('path');

const RE_MODULE = /(\w+):$/;

export class ErlangCompletionProvider implements CompletionItemProvider {
    private stdModules: any = null;
    private moduleNames: string[] = null;
    private docPath: string;
    private genericCompletionItems: CompletionItem[] = null;
    private moduleCompletionItems: CompletionItem[] = null;
    private stdLibCompletionItems: CompletionItem[] = null;

    constructor(private whatelsClient: WhatelsClient,
                private completionPath: string)
    {
        whatelsClient.subscribe((action, msg) => {
            if (action == CallbackAction.getSymbols) {
                this.genericCompletionItems = null;
                if (msg.path == this.docPath) {
                    // invalidate completion items of the current doc
                    this.docPath = '';
                    this.moduleCompletionItems = null;
                }
            }
        });
    }

    public provideCompletionItems(doc: TextDocument,
                                  pos: Position,
                                  token: CancellationToken): Thenable<CompletionItem[]>
    {
        return new Promise<CompletionItem[]>((resolve, reject) => {
	        const line = doc.lineAt(pos.line);
            const m = RE_MODULE.exec(line.text.substring(0, pos.character));
            if (m === null) {
                this.resolveGenericItems(resolve, reject, doc.fileName);
            }
            else {
                resolve([]);
                // const moduleName = m[1];
                // this.whatelsClient.getAllPathSymbols().then(
                //     pathSymbols => this.resolveModuleItems(resolve, moduleName, pathSymbols),
                //     err => reject(err)
                // );
                // if (this.stdModules === null) {
                //     this.readCompletionJson(this.completionPath, modules => {
                //         this.stdModules = modules;
                //         this.resolveFunNames(m[1], resolve);
                //     });
                // }
                // else {
                //     this.resolveFunNames(m[1], resolve);
                // }
            }
        });
    }

    private resolveGenericItems(resolve, reject, path: string) {
        this.getGenericCompletionItems(path).then(
            items => resolve(items),
            err => reject(err)
        )
    }

    private getGenericCompletionItems(path: string): Thenable<CompletionItem[]> {
        return new Promise<CompletionItem[]>((resolve, reject) => {
            if (this.genericCompletionItems) {
                resolve(this.genericCompletionItems);
            }
            else {
                let cis: CompletionItem[] = [];
                Promise.all([this.getModuleCompletionItems(path),
                             this.getStdLibCompletionItems()]).then(
                    allCompletionItems => {
                        allCompletionItems.forEach(items => {
                            items.forEach(ci => cis.push(ci));
                        });
                    },
                    err => reject(err)
                );
                this.genericCompletionItems = cis;
            }
        });
    }

    private getModuleCompletionItems(path: string): Thenable<CompletionItem[]> {
        return new Promise<CompletionItem[]>((resolve, reject) => {
            if (!this.moduleCompletionItems || path != this.docPath) {
                this.whatelsClient.getPathSymbols(path).then(
                    symbols => {
                        this.docPath = path;
                        this.createModuleCompletionItems(path, symbols);
                        resolve(this.moduleCompletionItems);
                    },
                    err => reject(err)
                );
            }
            else {
                resolve(this.moduleCompletionItems);
            }
        });
    }

    private getStdLibCompletionItems(): Thenable<CompletionItem[]> {
        return new Promise<CompletionItem[]>((resolve, reject) => {
            if (this.stdLibCompletionItems) {
                resolve(this.stdLibCompletionItems);
            }
            else {
                this.readCompletionJson(this.completionPath, modules => {
                    this.stdModules = modules;
                    this.createStdLibCompletionItems(modules);
                });
            }
        });
    }

    private createModuleCompletionItems(path: string, symbols: Symbols) {
        let cis: CompletionItem[] = [];
        if (symbols && symbols.functions) {
            let funNames = new Set(symbols.functions.map(f => {
                return f.name;
            }));
            funNames.forEach(name => {
                var item = new CompletionItem(name);
                item.kind = CompletionItemKind.Function;
                cis.push(item);
            });
        }
        this.moduleCompletionItems = cis;
    }

    private createStdLibCompletionItems(modules) {
        let cis: CompletionItem[] = [];
        for (var k in modules) {
            var item = new CompletionItem(k);
            item.kind = CompletionItemKind.Module;
            cis.push(item);
        }
        this.stdLibCompletionItems = cis;
    }

    private readCompletionJson(filename: string, done: Function): any {
        fs.readFile(filename, 'utf8', (err, data) => {
            if (err) {
                console.log(`Cannot read: ${filename}`);
                done({});
            }
            else {
                let d: any = JSON.parse(data);
                done(d);
            }
        });
    }
}