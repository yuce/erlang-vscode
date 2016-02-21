import {DocumentSymbolProvider, TextDocument, CancellationToken,
        SymbolInformation, SymbolKind, Range} from 'vscode';
import {Symbols} from 'whatels';
import {WhatelsClient} from './whatels_client';


export class ErlangSymbolProvider implements DocumentSymbolProvider {
    constructor(private whatelsClient: WhatelsClient) {}

    public provideDocumentSymbols(doc: TextDocument, token: CancellationToken): Thenable<SymbolInformation[]> {
        return new Promise<SymbolInformation[]>((resolve, reject) => {
            console.log('get symbol informations');
            this.whatelsClient.getSymbols(doc.fileName, doc.getText()).then(
                symbols => this.resolveGenericItems(resolve, symbols),
                err => reject(err)
            )
        });
    }

    private resolveGenericItems(resolve, symbols: Symbols) {
        let vsSymbols: SymbolInformation[] = symbols.functions.map(f => {
            let range = new Range(f.line - 1, 0, f.line - 1, 0);
            return new SymbolInformation(`${f.name}/${f.arity}`, SymbolKind.Function, range);
        });
        resolve(vsSymbols);
    }
}