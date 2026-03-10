/**
 * School ID Card Utility
 * Creates a container with the School ID background and dynamic player data.
 */
import SchoolIDImg from "../assets/SchoolID.png";

export const createSchoolID = (scene, x, y, playerData) => {
    // 1. Load the image if not already loaded
    if (!scene.textures.exists("SchoolID")) {
        scene.load.image("SchoolID", SchoolIDImg);
        scene.load.once("complete", () => {
            const container = createID(scene, x, y, playerData);
            scene.events.emit("idCreated", container);
        });
        scene.load.start();
        return null; // Return null initially, will be created after load
    } else {
        const container = createID(scene, x, y, playerData);
        // Delay emit to ensure caller can set up listener if they expect it even in sync case
        scene.time.delayedCall(1, () => scene.events.emit("idCreated", container));
        return container;
    }
};

const createID = (scene, x, y, playerData) => {
    const container = scene.add.container(x, y);

    // 1. Background ID Card (128x120)
    const idCard = scene.add.image(0, 0, "SchoolID").setOrigin(0.5);
    container.add(idCard);
    
    // --- AVATAR PLACEMENT ---
    // The white box center is roughly at (x: 35.5, y: 11.5) relative to the center.
    // Box size is roughly 35x35.
    
    const avatarX = 35.5; 
    const avatarY = 11.5;
    const avatarSize = 35; 

    // Load Avatar
    let avatarKey = "userAvatarID";
    let avatarPath = playerData.avatar || "avatars/avatar1.png"; // Default
    if (avatarPath.startsWith("/")) avatarPath = avatarPath.slice(1);

    // If avatar texture doesn't exist, load it
    if (!scene.textures.exists(avatarKey)) {
        scene.load.image(avatarKey, avatarPath);
        scene.load.once("complete", () => {
            const avatar = scene.add.image(avatarX, avatarY, avatarKey).setOrigin(0.5);
            avatar.setDisplaySize(avatarSize, avatarSize);
            container.add(avatar);
        });
        scene.load.start();
    } else {
        const avatar = scene.add.image(avatarX, avatarY, avatarKey).setOrigin(0.5);
        avatar.setDisplaySize(avatarSize, avatarSize);
        container.add(avatar);
    }

    return container;
};
