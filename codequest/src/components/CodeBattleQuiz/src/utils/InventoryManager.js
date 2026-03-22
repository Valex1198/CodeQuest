/**
 * Simple Inventory Manager
 * Handles the logic for a 9-slot inventory system.
 */

import { persistCurrentState } from "./saveManager";
import { completeGoal } from "./GoalManager";

const MAX_SLOTS = 9;

export const getInventory = () => {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    return user.inventory || [];
};

export const saveInventory = (inventory) => {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    user.inventory = inventory.slice(0, MAX_SLOTS);
    localStorage.setItem("user", JSON.stringify(user));
};

export const addItem = async (item) => {
    const inventory = getInventory();
    if (inventory.length < MAX_SLOTS) {
        inventory.push(item);
        saveInventory(inventory);
        
        // Sync to persistent save
        try {
            await persistCurrentState();
        } catch (err) {
            console.error("Failed to sync inventory (add):", err);
        }

        // --- GOAL TRACKING ---
        const itemName = typeof item === 'string' ? item : (item.name || "");
        if (itemName === "School ID") {
            completeGoal("get_id");
        }
        
        return true;
    }
    console.warn("Inventory full!");
    return false;
};

export const removeItem = async (index) => {
    const inventory = getInventory();
    if (index >= 0 && index < inventory.length) {
        inventory.splice(index, 1);
        saveInventory(inventory);
        
        // Sync to persistent save
        try {
            await persistCurrentState();
        } catch (err) {
            console.error("Failed to sync inventory (remove):", err);
        }
        return true;
    }
    return false;
};

export const hasItem = (itemName) => {
    const inventory = getInventory();
    return inventory.some(item => item.name === itemName || item === itemName);
};
