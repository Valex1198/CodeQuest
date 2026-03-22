/**
 * Goal Manager
 * Handles tracking and updating game objectives.
 */

import { persistCurrentState } from "./saveManager";

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

    // Sync with remote save using helper
    try {
        await persistCurrentState();
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
