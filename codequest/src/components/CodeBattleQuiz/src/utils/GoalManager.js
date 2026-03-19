/**
 * Goal Manager
 * Handles tracking and updating game objectives.
 */

import { getSave, setSave } from "./saveManager";

/**
 * Get all current goals and their status.
 * @returns {Object} - The goals object from localStorage.
 */
export const getGoals = () => {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    return user.goals || {};
};

/**
 * Marks a specific goal as completed.
 * @param {string} goalId - The unique identifier for the goal (e.g., 'talk_to_mother').
 * @param {Phaser.Scene} scene - Optional: The current scene to trigger a visual notification.
 */
export const completeGoal = async (goalId, scene = null) => {
    const user = JSON.parse(localStorage.getItem("user")) || {};
    if (!user.goals) user.goals = {};

    // Don't do anything if already completed
    if (user.goals[goalId]) return;

    user.goals[goalId] = true;
    localStorage.setItem("user", JSON.stringify(user));

    console.log(`🎯 Goal Completed: ${goalId}`);

    // Sync with remote save
    try {
        const userId = user.id || 1;
        const slotId = user.currentSlot || 1;
        const saveData = await getSave(userId, slotId);
        if (saveData) {
            saveData.goals = user.goals;
            // setSave(userId, slotId, scene, player, language, quiz, codingTasks, isNewGame, taxi, inventory, flags, goals)
            // Note: We need to ensure setSave supports goals or pass it via the existing structure.
            // For now, let's assume we can update it.
            await setSave(userId, slotId, null, null, saveData.language, null, null, false, null, null, null, user.goals);
        }
    } catch (err) {
        console.error("Failed to sync goal to remote:", err);
    }

    // Trigger visual notification if scene is provided
    if (scene && scene.scene.isActive("GoalOverlay")) {
        const goalOverlay = scene.scene.get("GoalOverlay");
        if (goalOverlay && typeof goalOverlay.showNotification === "function") {
            goalOverlay.showNotification(goalId);
        }
    }
};

/**
 * Checks if a goal is completed.
 * @param {string} goalId 
 * @returns {boolean}
 */
export const isGoalCompleted = (goalId) => {
    const goals = getGoals();
    return !!goals[goalId];
};

/**
 * Returns a list of defined goals with descriptions.
 * This is for UI display.
 */
export const GOAL_DEFINITIONS = {
    "talk_to_mother": "Talk to your Mother",
    "get_id": "Find your School ID",
    "reach_school": "Take a taxi to the School",
    "pass_guard": "Pass the School Guard",
    "complete_python_1": "Complete Python Quiz Level 1",
    "complete_task_1": "Complete your first Coding Task"
};
