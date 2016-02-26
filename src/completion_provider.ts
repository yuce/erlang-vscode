/// <ref href="../typings/tsd.d.ts">


import {CompletionItemProvider, TextDocument, Position, CancellationToken,
        CompletionItem, CompletionItemKind} from 'vscode';
import {Symbols, FunctionInfo} from 'whatels';
import {WhatelsClient} from './whatels_client';
import fs = require('fs');
import path = require('path');

const RE_MODULE = /(\w+):$/;

export class ErlangCompletionProvider implements CompletionItemProvider {
    private stdModules:any = null;
    private moduleNames: string[] = null;
    private genericCompletionItems: CompletionItem[] = null;

    constructor(private whatelsClient: WhatelsClient,
                private completionPath: string) {}

    public provideCompletionItems(doc: TextDocument,
                                  pos: Position,
                                  token: CancellationToken): Thenable<CompletionItem[]>
    {
        return new Promise<CompletionItem[]>((resolve, reject) => {
	        const line = doc.lineAt(pos.line);
            const m = RE_MODULE.exec(line.text.substring(0, pos.character));
            if (m === null) {
                this.whatelsClient.getAllPathSymbols().then(
                    pathSymbols => {
                        pathSymbols?
                            this.resolveGenericItems(resolve, pathSymbols)
                            : reject();
                    },
                    err => reject(err)
                );
            }
            else {
                const moduleName = m[1];
                this.whatelsClient.getAllPathSymbols().then(
                    pathSymbols => this.resolveModuleItems(resolve, moduleName, pathSymbols),
                    err => reject(err)
                );
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

    private resolveFunNames(module, resolve) {
	   resolve(this.makeModuleFunsCompletion(module));
    }

    private resolveGenericItems(resolve, pathSymbols) {
        resolve(this.makeGenericCompletion(pathSymbols));
    }

    private resolveModuleItems(resolve, moduleName, pathSymbols) {
        resolve(this.makeModuleCompletion(moduleName, pathSymbols));
    }

    private makeFunctionCompletionItem(name: string): CompletionItem {
        const item = new CompletionItem(name);
        // item.documentation = cd.detail;
        item.kind = CompletionItemKind.Function;
        return item;
    }

    private makeModuleNameCompletionItem(name: string): CompletionItem {
        const item = new CompletionItem(name);
        item.kind = CompletionItemKind.Module;
        return item;
    }

    private makeModuleFunsCompletion(module: string): CompletionItem[] {
        const moduleFuns = this.stdModules[module] || [];
        return moduleFuns.map(name => {
            return this.makeFunctionCompletionItem(name);
        });
    }

    private makeGenericCompletion(pathSymbols: {[index: string]: Symbols}) {
        let comps: CompletionItem[] = [];
        for (var p in pathSymbols) {
            var item = new CompletionItem(path.basename(p, '.erl'));
            item.kind = CompletionItemKind.Module;
            comps.push(item);
        }
        return comps;
    }

    private makeModuleCompletion(moduleName: string,
                                 pathSymbols: {[index: string]: Symbols})
    {
        let comps: CompletionItem[] = [];
        for (var p in pathSymbols) {
            if (pathSymbols[p].module == moduleName) {
                var module = pathSymbols[p];
                if (module.functions) {
                    module.functions.forEach(f => {
                        if (f.exported) {
                            var item = new CompletionItem(f.name);
                            item.kind = CompletionItemKind.Function;
                            comps.push(item);
                        }
                    });
                }
            }
        }

        return comps;
    }

    // private makeGenericCompletion(funs: FunctionInfo[]): CompletionItem[] {
    //     let comps: CompletionItem[] = funs.map(f => {
    //         return this.makeFunctionCompletionItem(f.name);
    //     });
    //     const modules = this.modules || {};
    //     const names = [];
    //     for (let k in modules) {
    //         names.push(k);
    //     }
    //     names.sort();
    //     names.forEach(name => {
    //         comps.push(this.makeModuleNameCompletionItem(name));
    //     });

    //     return comps;
    // }

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