"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  createElement,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";

interface SearchContextValue {
  query: string;
  setQuery: (query: string) => void;
  clearQuery: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

interface SearchProviderProps {
  children: ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [query, setQueryState] = useState("");
  const pathname = usePathname();

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
  }, []);

  const clearQuery = useCallback(() => {
    setQueryState("");
  }, []);

  // Clear search query when navigating to a different view
  useEffect(() => {
    clearQuery();
  }, [pathname, clearQuery]);

  return createElement(
    SearchContext.Provider,
    { value: { query, setQuery, clearQuery } },
    children
  );
}

export function useSearch(): SearchContextValue {
  const context = useContext(SearchContext);

  if (!context) {
    throw new Error("useSearch must be used within a SearchProvider");
  }

  return context;
}
