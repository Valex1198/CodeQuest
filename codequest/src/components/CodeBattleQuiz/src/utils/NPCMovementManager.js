/**
 * NPC Movement Utility for Phaser
 * Handles patrolling, directional movement, and collision detection for non-static NPCs.
 */
import Phaser from "phaser";

/**
 * Initializes movement state on an NPC sprite.
 * @param {Phaser.Physics.Arcade.Sprite} npc - The NPC sprite.
 * @param {Array} instructions - List of movement instructions: 
 *                                [{ dir: 'left', dist: 100, wait: 1000 }, { dir: 'down', dist: 50 }]
 * @param {string} animPrefix - Optional prefix for animations (e.g. 'mother_')
 */
export const initNPCMovement = (npc, instructions = [], animPrefix = '') => {
    npc.moveInstructions = instructions;
    npc.currentInstructionIdx = 0;
    npc.distanceMoved = 0;
    npc.isWaiting = false;
    npc.lastPos = { x: npc.x, y: npc.y };
    npc.isBlockedCount = 0; 
    npc.animPrefix = animPrefix;
};

/**
 * Updates NPC movement logic. Should be called in the scene's update() loop.
 * @param {Phaser.Physics.Arcade.Sprite} npc - The NPC sprite.
 * @param {number} speed - Movement speed.
 * @param {Phaser.Scene} scene - The current Phaser scene (for timers).
 */
export const updateNPCMovement = (npc, speed, scene) => {
    if (!npc || !npc.body) return;

    const prefix = npc.animPrefix || '';

    if (npc.isWaiting || !npc.moveInstructions || npc.moveInstructions.length === 0) {
        if (!npc.isWaiting) {
            npc.setVelocity(0);
            const dir = npc.lastMoveDir || 'down';
            if (scene.anims.exists(`${prefix}idle_${dir}`)) {
                npc.play(`${prefix}idle_${dir}`, true);
            } else if (scene.anims.exists(`idle_${dir}`)) {
                npc.play(`idle_${dir}`, true);
            }
        }
        return;
    }

    const instr = npc.moveInstructions[npc.currentInstructionIdx];
    const { dir, dist, wait } = instr;

    // 1. Apply Velocity
    switch (dir) {
        case 'left': npc.setVelocity(-speed, 0); break;
        case 'right': npc.setVelocity(speed, 0); break;
        case 'up': npc.setVelocity(0, -speed); break;
        case 'down': npc.setVelocity(0, speed); break;
        case 'idle': npc.setVelocity(0, 0); break;
    }
    npc.lastMoveDir = dir;

    // 2. Play Walk Animation
    if (dir !== 'idle') {
        if (scene.anims.exists(`${prefix}walk_${dir}`)) {
            npc.play(`${prefix}walk_${dir}`, true);
        } else if (scene.anims.exists(`walk_${dir}`)) {
            npc.play(`walk_${dir}`, true);
        }
    } else {
        if (scene.anims.exists(`${prefix}idle_${dir}`)) {
            npc.play(`${prefix}idle_${dir}`, true);
        } else if (scene.anims.exists(`idle_${dir}`)) {
            npc.play(`idle_${dir}`, true);
        }
    }

    // 3. Track Distance
    const currentDist = Phaser.Math.Distance.Between(npc.x, npc.y, npc.lastPos.x, npc.lastPos.y);
    npc.distanceMoved += currentDist;
    npc.lastPos = { x: npc.x, y: npc.y };

    // 4. Check if Blocked (Stuck against a wall)
    if (dir !== 'idle' && currentDist < 0.1) {
        npc.isBlockedCount++;
    } else {
        npc.isBlockedCount = 0;
    }

    // 5. Move to Next Instruction
    const reachedDistance = dist && npc.distanceMoved >= dist;
    const isStuck = npc.isBlockedCount > 30;

    if (reachedDistance || isStuck || dir === 'idle') {
        npc.setVelocity(0, 0);
        npc.distanceMoved = 0;
        npc.isBlockedCount = 0;

        if (wait && wait > 0) {
            npc.isWaiting = true;
            if (scene.anims.exists(`${prefix}idle_${dir}`)) {
                npc.play(`${prefix}idle_${dir}`, true);
            } else if (scene.anims.exists(`idle_${dir}`)) {
                npc.play(`idle_${dir}`, true);
            }
            
            scene.time.delayedCall(wait, () => {
                npc.isWaiting = false;
                npc.currentInstructionIdx = (npc.currentInstructionIdx + 1) % npc.moveInstructions.length;
            });
        } else {
            npc.currentInstructionIdx = (npc.currentInstructionIdx + 1) % npc.moveInstructions.length;
        }
    }
};
