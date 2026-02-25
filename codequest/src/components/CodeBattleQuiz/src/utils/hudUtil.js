// utils/hudUtil.js
// import Phaser from "phaser";

/**
 * Launch or update the HudOverlay for a scene
 * @param {Phaser.Scene} scene - Current scene
 * @param {object} player - Player object
 * @param {number} saveSlot - Current save slot
 * @param {string} language - Current language (Python, Java, etc.)
 */
export async function launchHUD(scene, player, saveSlot = 1, language = "Python") {
    if (!player) {
        console.error("Cannot launch HUD: player is undefined");
        return;
    }

    const storedUser = JSON.parse(localStorage.getItem("user")) || { username: "Player" };

    if (!scene.scene.isActive("HudOverlay")) {
        scene.scene.launch("HudOverlay", {
            player,
            playerName: storedUser.username,
            saveSlot,
            language
        });

        const hudScene = scene.scene.get("HudOverlay");

        hudScene.events.once("create", async () => {
            hudScene.saveSlot = saveSlot;
            hudScene.language = language;
            await hudScene.updateTotalScore();
        });

    } else {
        const hudScene = scene.scene.get("HudOverlay");
        hudScene.saveSlot = saveSlot;
        hudScene.language = language;
        await hudScene.updateTotalScore();
    }

    scene.scene.setVisible(true, "HudOverlay");
    scene.scene.bringToTop("HudOverlay");
}
export function getHUD(scene) {
    return scene.scene.get("HudOverlay");
}
