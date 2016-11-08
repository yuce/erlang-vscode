#!/usr/bin/env escript
%% -*- erlang -*-
%%! -smp enable -sname erl_tidy debug verbose

-mode(compile).
-export([main/1]).

%% erl_tidy.escript: does not support HRL ESCRIPT APP.SRC.

main([]) ->
    io:format(standard_error
             ,"Usage: ~s  <ERL files or folders>\n"
             ,[escript:script_name()]
             ),
    halt(1);
main(Files) ->
    tidy_files(Files).

%% Internals

tidy_files(Paths) ->
    lists:foreach(fun tidy/1, Paths).
    
printer(AST, Options) ->
    erl_prettypr:format(AST, [{paper, 115}
                             ,{ribbon, 100}
                              | Options
                             ]).
                             
tidy(Path) ->
    case {filelib:is_regular(Path), filelib:is_dir(Path)} of
        {true, _} ->
            case filename:extension(Path) of
                ".erl" ->
                    erl_tidy:file(Path, [{keep_unused, true} ,{stdout, true}, {printer, fun printer/2}]);
                _ ->
                    skip(Path)
            end;
        {_, true} ->
            RegExp = "\\.erl$",
            Paths = filelib:fold_files(Path, RegExp, true, fun cons/2, []),
            tidy_files(Paths);
        _ ->
            skip(Path)
    end.

cons(H, T) -> [H | T].

skip(Path) ->
    io:format(standard_error, "Skipping ~s\n", [Path]).

%% End of Module