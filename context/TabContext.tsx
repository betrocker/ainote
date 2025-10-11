import React from "react";

type TabContextValue = {
    activeIndex: number;
    setActive: (index: number, tab: string) => void;
    menuOpen: boolean;
    setMenuOpen: (open: boolean) => void;
};

const TabContext = React.createContext<TabContextValue | undefined>(undefined);

export const TabProvider: React.FC<React.PropsWithChildren> = ({children}) => {
    const [activeIndex, setActiveIndex] = React.useState(0);
    const [menuOpen, setMenuOpen] = React.useState(false);

    const setActive = (index: number, _tab: string) => {
        setActiveIndex(index);
    };

    return (
        <TabContext.Provider
            value={{
                activeIndex,
                setActive,
                menuOpen,
                setMenuOpen,
            }}
        >
            {children}
        </TabContext.Provider>
    );
};

export const useTab = () => {
    const ctx = React.useContext(TabContext);
    if (!ctx) throw new Error("useTab must be used within TabProvider");
    return ctx;
};