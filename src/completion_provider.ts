/// <ref href="../typings/tsd.d.ts">


import {CompletionItemProvider, TextDocument, Position, CancellationToken,
        CompletionItem, CompletionItemKind} from 'vscode';

let fs = require('fs');

const RE_MODULE = /(\w+):$/;

interface FunctionCompletionData {
    name: string;
    // detail: string;
}

export class ErlangCompletionProvider implements CompletionItemProvider {
    private modules:any = null;

    constructor(private completionPath: string) {}

    public provideCompletionItems(doc: TextDocument,
                                  pos: Position,
                                  token: CancellationToken): Thenable<CompletionItem[]>
    {
        return new Promise<CompletionItem[]>((resolve, reject) => {
	        const line = doc.lineAt(pos.line);
            const m = RE_MODULE.exec(line.text.substring(0, pos.character));
            if (m === null) {
                resolve([]);
            }
            else {
                const module = m[1];
                console.log('module', module);
                if (this.modules === null) {
                    this.readCompletionJson(this.completionPath, modules => {
                        this.modules = modules;
                        this.resolveItems(module, resolve);
                    });
                }
                else {
                    this.resolveItems(module, resolve);
                }
            }
        });
    }

    private resolveItems(module, resolve) {
	   resolve(this.makeModuleCompletion(module));
    }

    private makeFunctionCompletionItem(module: string, name: string): CompletionItem {
        const item = new CompletionItem(name);
        // item.documentation = cd.detail;
        item.kind = CompletionItemKind.Function;

        return item;
    }

    private makeModuleCompletion(module: string): CompletionItem[] {
        const moduleFuns = this.modules[module] || [];
        return moduleFuns.map(name => {
            return this.makeFunctionCompletionItem(module, name);
        });
    }

    private readCompletionJson(filename: string, done: Function): any {
        fs.readFile(filename, (err, data) => {
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