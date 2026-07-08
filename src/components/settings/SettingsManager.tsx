const handleDeleteAccount = async () => {
    toast.info("Deleting your sandbox account and clearing all local settings...");
    try {
        // Clear local storage for all keys starting with anvaya
        if (typeof window !== "undefined") {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith("anvaya")) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        }

        toast.success("Sandbox account and data deleted successfully.");
        setIsDeleteDialogOpen(false);

        // Force Sign out
        signOut({ callbackUrl: "/sign-in" });
    } catch (err: any) {
        toast.error("Failed to delete account", { description: err.message });
    }
};
