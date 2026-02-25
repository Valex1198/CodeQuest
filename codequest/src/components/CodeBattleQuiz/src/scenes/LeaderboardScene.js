import Phaser from "phaser";

const DIRECTUS_URL = "http://localhost:8055";
const COLLECTION = "game_saves";

// Fetch leaderboard including quiz + coding scores
async function getLeaderboard() {
    const res = await fetch(`${DIRECTUS_URL}/items/${COLLECTION}?fields=save_json,user.username,user.avatar`);
    const json = await res.json();
    const entries = [];

    for (const row of json.data || []) {
        if (!row.save_json) continue;
        let saveData;
        try { saveData = JSON.parse(row.save_json); } catch { continue; }

        const quiz = saveData.quiz || {};
        const coding = saveData.codingTasks || {};
        const name = row.user?.username || "Unknown";
        const avatar = row.user?.avatar || null;

        const languages = new Set([...Object.keys(quiz), ...Object.keys(coding)]);
        for (const language of languages) {
            let totalScore = 0;
            if (quiz[language]) Object.values(quiz[language]).forEach(lvl => totalScore += lvl.score || 0);
            if (coding[language]) Object.values(coding[language]).forEach(lvl => totalScore += lvl.score || 0);
            if (totalScore > 0) entries.push({ name, language, score: totalScore, avatar });
        }
    }

    entries.sort((a, b) => b.score - a.score);
    return entries.map((e, i) => ({ rank: i + 1, ...e }));
}

export class LeaderboardScene extends Phaser.Scene {
    constructor() {
        super({ key: "LeaderboardScene" });
        this.rowsPerPage = 5;
        this.currentPage = 0;
        this.avatarDisplaySize = 32;
        this.rankColumnWidth = 200; // combined Rank + Avatar + Name
    }

    async create() {
        const { width, height } = this.scale;

        // Panel setup
        const panelWidth = 600;
        const panelHeight = 420;
        const panelX = width / 2;
        const panelY = height / 2;

        // Background & panel
        this.add.rectangle(0, 0, width, height, 0x000000, 0.75).setOrigin(0);
        this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x1e1e2f).setStrokeStyle(3, 0xffffff);
        this.add.text(panelX, panelY - 180, "🏆 Leaderboard", { fontSize: "32px", fontFamily: "Arial", color: "#ffffff" }).setOrigin(0.5);

        // Fetch leaderboard
        this.leaderboard = [];
        try { this.leaderboard = await getLeaderboard(); } catch (err) { console.error(err); }

        // Preload all avatars first
        for (const entry of this.leaderboard) {
            if (entry.avatar) {
                let path = entry.avatar.startsWith("/") ? entry.avatar.slice(1) : entry.avatar;
                const key = `avatar_${entry.rank}`;
                if (!this.textures.exists(key)) this.load.image(key, path);
            }
        }

        this.load.once("complete", () => {
            this.renderPage();
        });
        this.load.start();

        // Columns for Lang + Score
        const startX = panelX - panelWidth / 2 + this.rankColumnWidth + 10;
        const remainingWidth = panelWidth - this.rankColumnWidth - 20;
        const colWidth = remainingWidth / 2;

        this.columnX = {
            rankColumn: panelX - panelWidth / 2 + 10, // combined Rank+Avatar+Name
            language: startX,
            score: startX + colWidth
        };

        // Headers
        const headerY = panelY - 120;
        this.add.text(this.columnX.rankColumn, headerY, "Rank / Player", { fontSize: "18px", color: "#ffcc00" }).setOrigin(0, 0.5);
        this.add.text(this.columnX.language, headerY, "Lang", { fontSize: "18px", color: "#ffcc00" }).setOrigin(0, 0.5);
        this.add.text(this.columnX.score, headerY, "Score", { fontSize: "18px", color: "#ffcc00" }).setOrigin(0, 0.5);

        // Pagination arrows
        const arrowY = panelY + 150;
        this.leftArrow = this.add.text(panelX - panelWidth / 2 + 20, arrowY, "⬅", { fontSize: "32px", color: "#ffffff" })
            .setInteractive().on("pointerdown", () => this.changePage(-1));
        this.rightArrow = this.add.text(panelX + panelWidth / 2 - 40, arrowY, "➡", { fontSize: "32px", color: "#ffffff" })
            .setInteractive().on("pointerdown", () => this.changePage(1));

        // Close hint
        this.add.text(panelX, panelY + 180, "Press Enter to close", { fontSize: "14px", color: "#aaaaaa" }).setOrigin(0.5);
        this.input.keyboard.on("keydown-ENTER", () => this.scene.stop());
    }

    renderPage() {
        const { height } = this.scale;
        if (this.pageGroup) this.pageGroup.forEach(obj => obj.destroy());
        this.pageGroup = [];

        const start = this.currentPage * this.rowsPerPage;
        const end = start + this.rowsPerPage;
        const pageEntries = this.leaderboard.slice(start, end);

        pageEntries.forEach((entry, i) => {
            const rowY = height / 2 - 70 + i * 40;
            let textX = this.columnX.rankColumn;

            // Rank number
            const rankText = this.add.text(textX, rowY, `${entry.rank}. `, { fontSize: "16px", color: "#ffffff" }).setOrigin(0, 0.5);
            this.pageGroup.push(rankText);
            textX += rankText.width + 5;

            // Avatar
            if (entry.avatar) {
                const key = `avatar_${entry.rank}`;
                if (this.textures.exists(key)) {
                    const avatar = this.add.image(textX, rowY, key)
                        .setDisplaySize(this.avatarDisplaySize, this.avatarDisplaySize)
                        .setOrigin(0, 0.5);
                    this.pageGroup.push(avatar);
                    textX += this.avatarDisplaySize + 5;
                }
            }

            // Name
            const nameText = this.add.text(textX, rowY, entry.name, { fontSize: "16px", color: "#ffffff" }).setOrigin(0, 0.5);
            this.pageGroup.push(nameText);

            // Language
            this.pageGroup.push(this.add.text(this.columnX.language, rowY, entry.language, { fontSize: "16px", color: "#ffffff" }).setOrigin(0, 0.5));

            // Score
            this.pageGroup.push(this.add.text(this.columnX.score, rowY, entry.score, { fontSize: "16px", color: "#ffffff" }).setOrigin(0, 0.5));
        });
    }

    changePage(delta) {
        const totalPages = Math.ceil(this.leaderboard.length / this.rowsPerPage);
        this.currentPage = Phaser.Math.Clamp(this.currentPage + delta, 0, totalPages - 1);
        this.renderPage();
    }
}
