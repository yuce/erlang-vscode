# Erlang/OTP Support for Visual Studio Code

This extension provides Erlang/OTP support for [Visual Studio Code](https://code.visualstudio.com/).

## News

* 2016-02-16: Added experimental support for auto-completion of Erlang standard library modules.
(*Currenty only for stdlib application modules*). Enable it with
setting `erlang.enableExperimentalAutoComplete` in your user settings.

## Features

* Syntax highlighting
* Auto-indent
* Snippets
* Auto-complete (*experimental*)


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
