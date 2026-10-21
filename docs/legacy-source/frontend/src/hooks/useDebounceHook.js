import { useEffect, useState } from "react";

export const useDebounceHook = (value, delay) => {
  const [debounceValue, setDebounceQuery] = useState();
  useEffect(() => {
    const timeOut = setTimeout(() => {
      setDebounceQuery(value);
    }, delay);
    return () => {
      clearTimeout(timeOut);
    };
  }, [delay, value]);
  return debounceValue;
};
