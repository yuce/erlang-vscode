import {DocumentSymbolProvider, TextDocument, CancellationToken,
        SymbolInformation, SymbolKind, Range} from 'vscode';
import whatels = require('whatels');

export class ErlangSymbolProvider implements DocumentSymbolProvider {
    private wConn: whatels.Connection = null;

    public provideDocumentSymbols(doc: TextDocument, token: CancellationToken): Thenable<SymbolInformation[]> {
        return new Promise<SymbolInformation[]>((resolve, reject) => {
            console.log('get symbol informations');
            if (this.wConn === null) {
                this.wConn = new whatels.Connection();
                this.wConn.connect((error: any) => {
                    if (error) {
                        this.wConn = null;
                        console.error(error);
                        reject();
                    }
                    else {
                        console.log('Connnected to whatels service.');
                        this.wConn.getSymbols(doc.fileName, (err, symbols) => {
                            if (err) {
                                console.error(err);
                                reject();
                            }
                            else {
                                console.log('symbols: ', symbols);
                                this.resolveGenericItems(resolve, symbols)
                            }
                        });
                    }
                });
            }
            else {
                this.wConn.getSymbols(doc.getText(), (err, symbols) => {
                    console.log('symbols: ', symbols);
                    this.resolveGenericItems(resolve, symbols)
                });
            }
        });
    }

    private resolveGenericItems(resolve, symbols: whatels.Symbols) {
        let vsSymbols: SymbolInformation[] = symbols.functions.map(f => {
            let range = new Range(f.line - 1, 0, f.line - 1, 0);
            return new SymbolInformation(f.name, SymbolKind.Function, range);
        });
        resolve(vsSymbols);
    }
}