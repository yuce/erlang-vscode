/// <ref href="../typings/tsd.d.ts">


import {CompletionItemProvider, TextDocument, Position, CancellationToken,
        CompletionItem, CompletionItemKind, SnippetString} from 'vscode';

let fs = require('fs');

const RE_MODULE = /(\w+):$/;

interface FunctionCompletionData {
    name: string;
    // detail: string;
}

export class ErlangCompletionProvider implements CompletionItemProvider {
    private modules:any = null;
    private moduleNames: string[] = null;
    private genericCompletionItems: CompletionItem[] = null;

    constructor(private completionPath: string[]) {}

    public provideCompletionItems(doc: TextDocument,
                                  pos: Position,
                                  token: CancellationToken): Thenable<CompletionItem[]>
    {
        return new Promise<CompletionItem[]>((resolve, reject) => {
	        const line = doc.lineAt(pos.line);
            const m = RE_MODULE.exec(line.text.substring(0, pos.character));
            if (this.modules === null) {
                this.readCompletionJson(this.completionPath[0], modules => {
                    this.readCompletionJson(this.completionPath[1], workspaceModules => {
                        this.modules = (workspaceModules === null) ? modules : Object.assign(modules, workspaceModules);

                        (m === null)?
                            this.resolveModuleNames(resolve)
                            : this.resolveFunNames(m[1], resolve);
                    });
                });
            }
            else {
                (m === null)?
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

    private makeFunctionCompletionItem(name: string): CompletionItem {
        const item = new CompletionItem(name);
        // item.documentation = cd.detail;
        let [fun, arity] = name.split("/");
        arity = parseInt(arity);
        let snippet = new SnippetString();
        snippet.appendText(fun);
        snippet.appendText("(");

        if (arity > 0) {
            snippet.appendPlaceholder("Param1");
        }

        for (var index = 1; index < arity; index++) {
            snippet.appendText(",");
            snippet.appendPlaceholder("Param" + (index + 1));
        }

        snippet.appendText(")");

        item.insertText = snippet;
        item.kind = CompletionItemKind.Function;
        return item;
    }

    private makeModuleNameCompletionItem(name: string): CompletionItem {
        const item = new CompletionItem(name);
        item.kind = CompletionItemKind.Module;
        return item;
    }

    private makeModuleFunsCompletion(module: string): CompletionItem[] {
        const moduleFuns = this.modules[module] || [];
        return moduleFuns.map(name => {
            return this.makeFunctionCompletionItem(name);
        });
    }

    private makeGenericCompletion(): CompletionItem[] {
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
                let d: any = JSON.parse(data);
                done(d);
            }
        });
    }
}
