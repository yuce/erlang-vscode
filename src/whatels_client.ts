
import {Disposable} from 'vscode';
import whatels = require('whatels');

export class WhatelsClient implements Disposable {
    private wConn: whatels.Connection;
    private port: number;

    constructor(refreshTime?: number, port?: number) {
        this.port = port || 10998;
    }

    public getPathSymbols(path: string): Thenable<whatels.Symbols> {
        return new Promise<whatels.Symbols>((resolve, reject) => {
            this._connect().then(
                conn => resolve(conn.getPathSymbols(path)),
                err => reject(err)
            )
        });
    }

    public getAllPathSymbols(): Thenable<{[index: string]: whatels.Symbols}> {
        return new Promise<{[index: string]: whatels.Symbols}>((resolve, reject) => {
            this._connect().then(
                conn => resolve(conn.getAllPathSymbols()),
                err => reject(err)
            )
        });
    }

    public watch(wildcard: string) {
        console.log('watch: ', wildcard);
        this._connect().then(
            conn => {
                conn.watch(wildcard);
            },
            err => console.error(err)
        );
    }

    public dispose() {
        this.wConn.close();
        this.wConn = null;
    }

    private _connect(): Thenable<whatels.Connection> {
        return new Promise<whatels.Connection>((resolve, reject) => {
            if (this.wConn) {
                resolve(this.wConn);
            }
            else {
                this.wConn = new whatels.Connection(this.port);
                this.wConn.connect().then(
                    () => resolve(this.wConn),
                    err => reject(err)
                );
            }
        });
    }
}