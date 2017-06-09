// Copyright (c) 2016, Yuce Tekol <yucetekol@gmail.com>.
// All rights reserved.

// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:

// * Redistributions of source code must retain the above copyright
//   notice, this list of conditions and the following disclaimer.

// * Redistributions in binary form must reproduce the above copyright
//   notice, this list of conditions and the following disclaimer in the
//   documentation and/or other materials provided with the distribution.

// * The names of its contributors may not be used to endorse or promote
//   products derived from this software without specific prior written
//   permission.

// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

'use strict';
import {ExtensionContext, Disposable, workspace, window, languages,
        Hover, commands} from 'vscode';
import {ErlangCompletionProvider} from './completion_provider';
// import {range, debounce} from 'lodash';

var spawnCMD = require('spawn-command');
var commandOutput = commandOutput = window.createOutputChannel('Shell');

export function activate(ctx: ExtensionContext) {
    languages.setLanguageConfiguration('erlang', {
        indentationRules: {
            increaseIndentPattern: /^\s*([^%]*->|receive|if|fun|case\s+.*\s+of|try\s+.*\s+of|catch)\s*$/,
            decreaseIndentPattern: /^.*(;|\.)\s*$/,
        },
        comments: {
            lineComment: '%'
        },
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')'],
            ['<<', '>>']
        ],
        __characterPairSupport: {
			autoClosingPairs: [
				{ open: '{', close: '}' },
				{ open: '[', close: ']' },
				{ open: '(', close: ')' },
				{ open: '<<', close: '>>', notIn: ['string', 'comment'] },
				{ open: '"', close: '"', notIn: ['string'] },
				{ open: '\'', close: '\'', notIn: ['string', 'comment'] }
			]
		}
    });

    // enable auto completion
    let config = workspace.getConfiguration('erlang');
    if (config['enableExperimentalAutoComplete']) {
        ctx.subscriptions.push(commandOutput);
        let completionJsonPath = ctx.asAbsolutePath("./priv/erlang-libs.json");
        let workspaceJsonPath = workspace.rootPath + "/.erl_workspace.json";
        let wCompletions = ctx.asAbsolutePath("./priv/wcompletions");
        let completionsCommand = commands.registerCommand('extension.wCompletions', () => {exec(wCompletions + " .", workspace.rootPath);});
        ctx.subscriptions.push(languages.registerCompletionItemProvider({
            language: 'erlang'
        }, new ErlangCompletionProvider([completionJsonPath, workspaceJsonPath]), ':'));
    }
}

export function deactivate() {
}

function exec(cmd:string, cwd:string) {
  if (!cmd) { return; }
  commandOutput.clear();
  commandOutput.appendLine(`> Running command \`${cmd}\`...`)
  run(cmd, cwd).then(() => {
    commandOutput.appendLine(`> Command \`${cmd}\` ran successfully.`);
  }).catch((reason) => {
    commandOutput.appendLine(`> ERROR: ${reason}`);
    window.showErrorMessage(reason, 'Show Output')
      .then((action) => { commandOutput.show(); });
  });
}

function run(cmd:string, cwd:string) {
  return new Promise((accept, reject) => {
    var opts : any = {};
    if (workspace) {
      opts.cwd = cwd;
    }
    process = spawnCMD(cmd, opts);
    function printOutput(data) { commandOutput.append(data.toString()); }
    process.stdout.on('data', printOutput);
    process.stderr.on('data', printOutput);
    process.on('close', (status) => {
      if (status) {
        reject(`Command \`${cmd}\` exited with status code ${status}.`);
      } else {
        accept();
      }
      process = null;
    });
  });
}
