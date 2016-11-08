-module(binary_string).
-author("fireflyc").

%% API
-export([to_decimal/1]).

to_decimal(String) ->
  try
    {_, Result} = lists:foldr(fun to_decimal/2, {0, 0}, String),
    Result

  catch
    _:_ -> 0

  end.



to_decimal($0, {N, Acc}) -> {N + 1, Acc};
to_decimal($1, {N, Acc}) -> {N + 1, Acc + trunc(math:pow(2, N))}.