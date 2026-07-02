"use client";

import React, { createContext, useContext, useState } from "react";

interface UserContextType {
    activeElement: string;
    setActiveElement: (element: string) => void;
    activeRequest: string,
    setActiveRequest: (element: string) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [activeElement, setActiveElement] = useState("apiClient");
    const [activeRequest, setActiveRequest] = useState("")

    const value = {
        activeElement,
        setActiveElement,
        activeRequest,
        setActiveRequest
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export const useApp = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useApp must be used within a UserProvider");
    }
    return context;
};