import { createContext, useContext } from "react";

interface SelectedItem {
    selectedItem: null | string,
    setSelectedItem: (item: null | string) => void
}

const SelectedItemContext = createContext<SelectedItem>({
    selectedItem: null,
    setSelectedItem: () => {}
})

export const SelectedItemProvider = SelectedItemContext.Provider

export const useSelectedItem = () => useContext(SelectedItemContext)