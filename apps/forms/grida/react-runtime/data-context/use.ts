import { useContext, useMemo } from "react";
import { DataContext, ScopedVariableContext } from "./context";
import { Tokens } from "@/ast";

export const useValue = <T = any>(key?: Tokens.Access.KeyPath<T>): any => {
  const dataContext = useContext(DataContext);
  const scopedVariableContext = useContext(ScopedVariableContext);

  if (!dataContext) {
    throw new Error("useValue must be used within a DataProvider");
  }

  const { data } = dataContext;
  const variablePaths = scopedVariableContext
    ? scopedVariableContext.variablePaths
    : {};

  if (!key) {
    return data;
  }
  return Tokens.Access.access(data, key as any, {
    scopedIdentifiers: variablePaths,
  });
};

export const useSelectValue = <T>({
  keys,
}: {
  keys: Array<Array<string>>;
}): Record<string, any> => {
  const dataContext = useContext(DataContext);
  const scopedVariableContext = useContext(ScopedVariableContext);

  if (!dataContext) {
    throw new Error("useSelectValue must be used within a DataProvider");
  }

  const { data } = dataContext;
  const variablePaths = scopedVariableContext
    ? scopedVariableContext.variablePaths
    : {};

  return useMemo(() => {
    const selected = Tokens.Access.select(data, keys as any, {
      scopedIdentifiers: variablePaths,
    });
    // console.log(selected, data, keys, variablePaths);
    return selected;
  }, [keys, data, variablePaths]);
};
