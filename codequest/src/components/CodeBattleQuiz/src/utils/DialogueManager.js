/**
 * Evaluates a single condition against the current game state.
 * @param {Object} condition - The condition object (e.g., { type: 'FLAG_EQUALS', key: 'met_npc', value: true })
 * @param {Object} gameState - The global state of the game (flags, inventory, quests, etc.)
 * @returns {boolean} - Whether the condition is met.
 */
export const checkCondition = (condition, gameState) => {
  if (!condition || !gameState) return true;

  const { type, key, value, id, status, item } = condition;

  switch (type) {
    case 'FLAG_EQUALS':
      return gameState.flags?.[key] === value;
    case 'QUEST_STATUS':
      return gameState.quests?.[id] === status;
    case 'HAS_ITEM':
      return gameState.inventory?.some(i => i === item || i.name === item);
    case 'MIN_LEVEL':
      return (gameState.user?.level || 0) >= value;
    default:
      console.warn(`Unknown condition type: ${type}`);
      return true;
  }
};

/**
 * Finds the most appropriate dialogue node based on current game state.
 * @param {Object} npcData - The JSON data for the NPC.
 * @param {Object} gameState - The current game progress/state.
 * @returns {Object|null} - The dialogue node to display.
 */
export const getNPCDialogue = (npcData, gameState) => {
  if (!npcData || !npcData.dialogueNodes) return null;

  // Filter for all nodes where conditions are met
  const validNodes = npcData.dialogueNodes.filter(node => {
    if (!node.conditions || node.conditions.length === 0) return true;
    return node.conditions.every(cond => checkCondition(cond, gameState));
  });

  // Sort by priority (higher first) if priority exists, otherwise maintain order
  validNodes.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const node = validNodes[0] || null;

  // Handle RANDOM type if it exists
  if (node && node.type === 'RANDOM' && Array.isArray(node.pool)) {
    const randomIndex = Math.floor(Math.random() * node.pool.length);
    return {
      ...node,
      text: node.pool[randomIndex]
    };
  }

  return node;
};

/**
 * Processes actions associated with a dialogue node.
 * @param {Array} actions - List of actions (e.g., { type: 'SET_FLAG', key: 'met_npc', value: true })
 * @param {Function} updateState - A callback function to update the global game state.
 */
export const handleDialogueActions = (actions, updateState) => {
  if (!actions || !updateState) return;

  actions.forEach(action => {
    updateState(action);
  });
};
