
import {Disposable} from 'vscode';
import whatels = require('whatels');

interface SymbolTimeInfo {
    symbols: whatels.Symbols;
    updated: number;
}

export class WhatelsClient implements Disposable {
    private pathSymbols = {};
    private wConn: whatels.Connection;
    private refreshTime: number;

    constructor(refreshTime?:number) {
        this.refreshTime = refreshTime || 1000;
    }

    public getSymbols(path: string, text: string): Thenable<whatels.Symbols> {
        return new Promise<whatels.Symbols>((resolve, reject) => {
            const now = (new Date()).getTime();
            const sti: SymbolTimeInfo = this.pathSymbols[path];
            if (sti && (now - sti.updated) < this.refreshTime) {
                resolve(sti.symbols);
            }
            else {
                this._getSymbols(path, text).then(symbols => resolve(symbols),
                                                  err => reject(err));
            }
        });
    }

    public dispose() {
        this.wConn.close();
        this.wConn = null;
        this.pathSymbols = null;
    }

    private _connect(): Thenable<whatels.Connection> {
        return new Promise<whatels.Connection>((resolve, reject) => {
            if (this.wConn) {
                resolve(this.wConn);
            }
            else {
                this.wConn = new whatels.Connection();
                this.wConn.connect(err => {
                    err? reject(err) : resolve(this.wConn);
                });
            }
        })
    }

    private _getSymbols(path: string, text: string): Thenable<whatels.Symbols> {
        return new Promise<whatels.Symbols>((resolve, reject) => {
            this._connect().then(conn => {
                conn.getSymbols(text, (err, symbols) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        const now = (new Date()).getTime();
                        this.pathSymbols[path] = {updated: now, symbols: symbols};
                        resolve(symbols);
                    }
                });
            },
            err => reject(err));
        });
    }
}