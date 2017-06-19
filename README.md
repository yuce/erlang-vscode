# Erlang/OTP Support for Visual Studio Code

This extension provides Erlang/OTP support for [Visual Studio Code](https://code.visualstudio.com/)and is available at the [Marketplace](https://marketplace.visualstudio.com/items?itemName=yuce.erlang-otp).

## News

* 2017-06-12: Common used rebar3 commands (contributed by @frepond)
* 2017-06-09: Experimental workspace modules and functions auto-completion (contributed by @frepond)
* 2016-02-17: Experimental module name auto-completion (*currently Erlang standard library modules only*)
* 2016-02-16: Added experimental support for auto-completion of Erlang standard library module functions. Enable it with
setting `erlang.enableExperimentalAutoComplete` to `true` in your user settings and restart VSCode.

## Features

* Syntax highlighting
* Auto-indent
* Snippets
* Auto-complete (*experimental*)
* Rebar3 common commands
* Format document (*needs emacs installed*)
* Generate Erlang ctags (*needs ctags installed, for use with [ctags plugin](https://marketplace.visualstudio.com/items?itemName=jtanx.ctagsx) *)

Workspace auto-completion is based on file `.erl_workspace.json` in the workspace top folder. This file could be generated
using the `Cmd+Shit+P` and `Erlang: generate workspace completions`. This file is generated with available *.beam under the current
workspace (it needs the project to be already built). The command `rebar` compile` within the editor triggers this automatically upon successful compile.


## Planned Features

* Build support
* Erlang shell

## Work In Progress

This extension is still WIP, feel free to submit ideas/bug fixes
on [Github](https://github.com/yuce/erlang-vscode/issues).

## Snippets

* `rec`: receive block
* `reca`: receive block with after
* `case`: case block
* `if`: if block
* `try`: try .. catch block

You can submit more snippets on [Github](https://github.com/yuce/erlang-vscode/issues).

## Thanks

* Erlang syntax file is based on: https://github.com/pgourlain/vscode_erlang.
