/**
 * Simple Inventory Manager
 * Handles the logic for a 9-slot inventory system.
 */

import { getSave, setSave } from "./saveManager";
import { completeGoal } from "./GoalManager";

const MAX_SLOTS = 9;

/**
 * Get the current save slot from the active scene or data
 */
const getCurrentSlot = () => {
    // This is a bit of a hack since InventoryManager doesn't have scene context
    // We try to find it in the current scene if possible, or fallback to 1
    const storedUser = JSON.parse(localStorage.getItem("user")) || {};
    return storedUser.currentSlot || 1; 
};

export const getInventory = () => {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    return user.inventory || [];
};

export const saveInventory = (inventory) => {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    user.inventory = inventory.slice(0, MAX_SLOTS);
    localStorage.setItem("user", JSON.stringify(user));
};

export const addItemToSave = async (userId, slotId, item) => {
    const saveData = await getSave(userId, slotId);
    if (!saveData) return;
    
    if (!saveData.inventory) saveData.inventory = [];
    if (saveData.inventory.length < MAX_SLOTS) {
        saveData.inventory.push(item);
        // Pass the updated inventory as the last parameter (or correct positional param)
        // setSave(userId, slotId, scene, player, language, quiz, codingTasks, isNewGame, taxi, inventory)
        await setSave(userId, slotId, null, null, saveData.language, null, null, false, null, saveData.inventory);
    }
};

export const addItem = async (item) => {
    const inventory = getInventory();
    if (inventory.length < MAX_SLOTS) {
        inventory.push(item);
        saveInventory(inventory);
        
        // Also sync to persistent save if we can identify user/slot
        const user = JSON.parse(localStorage.getItem("user")) || {};
        const slotId = user.currentSlot || 1;
        if (user.id) {
            await addItemToSave(user.id, slotId, item);
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

export const removeItem = (index) => {
    const inventory = getInventory();
    if (index >= 0 && index < inventory.length) {
        inventory.splice(index, 1);
        saveInventory(inventory);
        return true;
    }
    return false;
};

export const hasItem = (itemName) => {
    const inventory = getInventory();
    return inventory.some(item => item.name === itemName || item === itemName);
};
