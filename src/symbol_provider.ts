import {DocumentSymbolProvider, WorkspaceSymbolProvider, TextDocument,
        CancellationToken, SymbolInformation, SymbolKind,
        Range, Uri} from 'vscode';
import {Symbols, CallbackAction} from 'whatels';
import {WhatelsClient} from './whatels_client';


export class ErlangDocumentSymbolProvider implements DocumentSymbolProvider {
    private symbols: SymbolInformation[] = null;
    private symbolsPath: string;

    constructor(private whatelsClient: WhatelsClient) {
        let cb = (action: CallbackAction, msg: any) => {
            if (action == CallbackAction.getSymbols && msg.path == this.symbolsPath) {
                console.log(`ErlangDocumentSymbolProvider: Invalidating symbols - ${this.symbolsPath}`);
                this.symbols = null;
                this.symbolsPath = '';
            }
        }
        whatelsClient.subscribe(cb);
    }

    public provideDocumentSymbols(doc: TextDocument, token: CancellationToken)
        :Thenable<SymbolInformation[]>
    {
        return new Promise<SymbolInformation[]>((resolve, reject) => {
            console.log('ErlangDocumentSymbolProvider: get doc symbol informations');
            if (!this.symbols || this.symbolsPath != doc.fileName) {
                this.whatelsClient.getPathSymbols(doc.fileName).then(
                    symbols => {
                        this.symbolsPath = doc.fileName;
                        this.createSymbolInformations(symbols);
                        this.resolveItems(resolve);
                    },
                    err => reject(err)
                )
            }
            else {
                this.resolveItems(resolve);
            }
        });
    }

    private resolveItems(resolve) {
        resolve(this.symbols || []);
    }

    private createSymbolInformations(symbols: Symbols) {
        if (!symbols) {
            this.symbols = null;
            return;
        }
        // TODO: sort symbols by name
        this.symbols = symbols.functions.map(f => {
            let range = new Range(f.line - 1, 0, f.line - 1, 0);
            let name = `${f.name}/${f.arity}`;
            return new SymbolInformation(name, SymbolKind.Function, range);
        });
    }
}

export class ErlangWorkspaceDocumentSymbolProvider implements WorkspaceSymbolProvider {
    private symbols: {[index: string]: SymbolInformation[]} = null;

    constructor(private whatelsClient: WhatelsClient) {
        let cb = (action: CallbackAction, msg: any) => {
            if (action == CallbackAction.getSymbols) {
                if (this.symbols) {
                    console.log(`ErlangWorkspaceDocumentSymbolProvider: Invalidating symbols - ${msg.path}`);
                    this.symbols[msg.path] = null;
                }

            }
        }
        whatelsClient.subscribe(cb);
    }

    public provideWorkspaceSymbols(query: string, token: CancellationToken)
        :SymbolInformation[] | Thenable<SymbolInformation[]>
    {
        return new Promise<SymbolInformation[]>((resolve, reject) => {
            console.log('ErlangWorkspaceDocumentSymbolProvider: get doc symbol informations');
            if (!this.symbols) {
                this.whatelsClient.getAllPathSymbols().then(
                    symbols => {
                        this.createSymbolInformations(symbols);
                        this.resolveItems(resolve, query);
                    },
                    err => reject(err)
                );
            }
            else {
                this.resolveItems(resolve, query);
            }
        });
    }

    private resolveItems(resolve, query) {
        let sis: SymbolInformation[] = [];
        if (!this.symbols) {
            resolve([]);
        }
        for (var k in this.symbols) {
            var symbols = this.symbols[k] || [];
            symbols.forEach(sym => {
                if (sym.name.indexOf(query) >= 0) {
                    sis.push(sym);
                }
            });
        }
        resolve(sis);
    }

    private createSymbolInformations(pathSymbols: {[index: string]: Symbols}) {
        if (!this.symbols) {
            this.symbols = {};
        }
        for (var path in pathSymbols) {
            this.symbols[path] = [];
            var symbols = pathSymbols[path];
            pathSymbols[path].functions.forEach(f  => {
                const range = new Range(f.line - 1, 0, f.line - 1, 0);
                const uri = Uri.file(path);
                const name = `${symbols.module}:${f.name}/${f.arity}`;
                var si = new SymbolInformation(name,
                                               SymbolKind.Function,
                                               range,
                                               uri);
                this.symbols[path].push(si);
            });
        }
    }

}