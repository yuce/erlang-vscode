'use strict';

import * as vscode from 'vscode';

export class EralngSettings{
    public erlangPath: string;
    public escriptPath: string;
    public rebar3Path:string;
    public enableExperimentalAutoComplete: boolean;

    private static erlangSettings: EralngSettings = new EralngSettings();
    constructor() {
        if (EralngSettings.erlangSettings) {
            throw new Error('Singleton class, Use getInstance method');
        }
        vscode.workspace.onDidChangeConfiguration(() => {
            this.initializeSettings();
        });
        
        this.initializeSettings();
    }

    initializeSettings(){
        let config = vscode.workspace.getConfiguration('erlang');
        this.enableExperimentalAutoComplete = config.get<boolean>('enableExperimentalAutoComplete');
        this.erlangPath = config.get<string>('erlangPath');
        this.escriptPath = config.get<string>('escriptPath');
        this.rebar3Path = config.get<string>('rebar3Path');
    }

    public static getInstance(): EralngSettings {
        return EralngSettings.erlangSettings;
    }
}