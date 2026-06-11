/**
 * Achievements Registry Module (1000+ Achievements)
 * Programmatically generates and validates achievements.
 */

const STORAGE_KEY = 'minesweeper_achievements';

// Hand-crafted unique achievements
const UNIQUE_ACHIEVEMENTS = [
    // --- SKILL CATEGORY ---
    { id: 'no_flags', title: 'No Flags Victory', desc: 'Win a preset game without placing any flags', category: 'flags', icon: '💎', rarity: 'Rare' },
    { id: 'perfect_run', title: 'Perfect Run', desc: 'Win a preset game using flags with 100% accuracy', category: 'skills', icon: '🎯', rarity: 'Rare' },
    { id: 'human_calculator', title: 'Human Calculator', desc: 'Chord 15 times in a single game', category: 'skills', icon: '🧮', rarity: 'Uncommon' },
    { id: 'math_genius', title: 'Math Genius', desc: 'Chord 30 times in a single game', category: 'skills', icon: '📐', rarity: 'Rare' },
    { id: 'probability_master', title: 'Probability Master', desc: 'Win a custom game with >30% mine density', category: 'skills', icon: '📈', rarity: 'Epic' },
    { id: 'cold_blooded', title: 'Cold Blooded', desc: 'Win a game without using flags or chords', category: 'skills', icon: '❄️', rarity: 'Epic' },
    { id: 'cautious', title: 'Double Check', desc: 'Flag all mines on the board before winning', category: 'skills', icon: '🔍', rarity: 'Common' },
    { id: 'speedy_clicker', title: 'Furious Fingers', desc: 'Perform 100 clicks in under 30 seconds', category: 'skills', icon: '🖱️', rarity: 'Uncommon' },
    { id: 'chord_master', title: 'Chording Specialist', desc: 'Win a game using only chords for reveals after first click', category: 'skills', icon: '🎹', rarity: 'Epic' },

    // --- DAILY CATEGORY ---
    // Programmatic milestones will be generated under the 'daily' category

    // --- FUNNY / ACTIONS CATEGORY ---
    { id: 'boom_speedrun', title: 'Boom Speedrun', desc: 'Lose a game in under 2 seconds', category: 'funny', icon: '💥', rarity: 'Common' },
    { id: 'mine_tester', title: 'Professional Mine Tester', desc: 'Lose 5 games in a row', category: 'funny', icon: '🔬', rarity: 'Common' },
    { id: 'mine_enthusiast', title: 'Again?', desc: 'Lose 10 games in a row', category: 'funny', icon: '🧪', rarity: 'Uncommon' },
    { id: 'surely_this_time', title: 'Surely This Time', desc: 'Click the face icon 5 times in a single game', category: 'funny', icon: '🤪', rarity: 'Common' },
    { id: 'face_spammer', title: 'Face Spammer', desc: 'Click the face icon 20 times in a single game', category: 'funny', icon: '🤡', rarity: 'Common' },
    { id: 'touch_grass', title: 'Touching Grass Is Optional', desc: 'Play 50 games in a single day', category: 'funny', icon: '🌱', rarity: 'Uncommon' },
    { id: 'grass_champion', title: 'Grass Champion', desc: 'Play 100 games in a single day', category: 'funny', icon: '🌳', rarity: 'Rare' },
    { id: 'trust_process', title: 'Trust The Process', desc: 'Lose a game by chording onto a mine', category: 'funny', icon: '🍂', rarity: 'Common' },
    { id: 'lucky_survivor', title: 'Lucky Survivor', desc: 'Open a tile adjacent to 8 mines', category: 'funny', icon: '🍀', rarity: 'Rare' },
    { id: 'very_lucky', title: 'Very Lucky Survivor', desc: 'Open a tile adjacent to 8 mines and win', category: 'funny', icon: '🔮', rarity: 'Epic' },
    { id: 'impossible', title: 'Impossible', desc: 'Win a custom 30x30 board with 899 mines', category: 'absurd', icon: '👽', rarity: 'Legendary' },

    // --- SAD CATEGORY ---
    { id: 'one_tile_away', title: 'One Tile Away', desc: 'Lose with exactly 1 safe tile remaining', category: 'funny', icon: '💔', rarity: 'Common' },
    { id: 'heartbreak', title: 'Heartbreak', desc: 'Lose with exactly 2 safe tiles remaining', category: 'funny', icon: '😢', rarity: 'Common' },
    { id: 'last_click', title: 'Last Click', desc: 'Lose on the final unopened mine', category: 'funny', icon: '🥀', rarity: 'Common' },
    { id: 'ninety_nine_pct', title: '99% Completion', desc: 'Lose with over 95% of safe cells opened', category: 'funny', icon: '📉', rarity: 'Common' },
    { id: 'so_close', title: 'So Close', desc: 'Lose with exactly 3 safe tiles remaining', category: 'funny', icon: '🥺', rarity: 'Common' },

    // --- COLLECTION TRACKS ---
    { id: 'collector_1', title: 'Collector I', desc: 'Unlock 10 achievements', category: 'completionist', icon: '📁', rarity: 'Common' },
    { id: 'collector_2', title: 'Collector II', desc: 'Unlock 25 achievements', category: 'completionist', icon: '📂', rarity: 'Uncommon' },
    { id: 'collector_3', title: 'Collector III', desc: 'Unlock 50 achievements', category: 'completionist', icon: '🗄️', rarity: 'Rare' },
    { id: 'collector_4', title: 'Collector IV', desc: 'Unlock 75 achievements', category: 'completionist', icon: '🗂️', rarity: 'Rare' },
    { id: 'achievement_hunter', title: 'Achievement Hunter', desc: 'Unlock 120 achievements', category: 'completionist', icon: '🏹', rarity: 'Epic' },
    { id: 'secret_hunter', title: 'Secret Hunter', desc: 'Unlock all secret achievements', category: 'completionist', icon: '🔑', rarity: 'Epic' },
    { id: 'theme_collector', title: 'Theme Collector', desc: 'Unlock all standard and secret themes', category: 'completionist', icon: '🎨', rarity: 'Epic' },
    { id: 'completionist', title: 'Completionist', desc: 'Unlock almost all normal achievements', category: 'completionist', icon: '🏆', rarity: 'Epic' },
    { id: 'ultimate_completionist', title: 'Ultimate Completionist', desc: 'Unlock all achievements, secret achievements, and themes', category: 'completionist', icon: '👑', rarity: 'Legendary' },

    // --- SECRET CATEGORY (HIDDEN) ---
    { id: 'who_is_derly', title: 'Who Is Derly?', desc: 'Unlock Derly theme', category: 'secret', icon: '💜', secret: true, rarity: 'Epic' },
    { id: 'forbidden_knowledge', title: 'Forbidden Knowledge', desc: 'Try entering an invalid cheat code', category: 'secret', icon: '📜', secret: true, rarity: 'Uncommon' },
    { id: 'curious_sweeper', title: 'Curious Sweeper', desc: 'Open the theme modal 5 times in a single session', category: 'secret', icon: '🎨', secret: true, rarity: 'Common' },
    { id: 'conspiracy_theorist', title: 'Conspiracy Theorist', desc: 'Right-click the face reset button', category: 'secret', icon: '🛸', secret: true, rarity: 'Common' },
    { id: 'night_creature', title: 'Night Creature', desc: 'Win a game at exactly 03:00 local time', category: 'secret', icon: '🌙', secret: true, rarity: 'Uncommon' },
    { id: 'elite', title: 'Elite', desc: 'Win or lose with a score of 1337', category: 'secret', icon: '👾', secret: true, rarity: 'Epic' },
    { id: 'nice', title: 'Nice', desc: 'Win or lose at exactly 69 seconds', category: 'secret', icon: '😏', secret: true, rarity: 'Common' },
    { id: 'friday_13th', title: 'Friday The 13th', desc: 'Win a game on Friday the 13th', category: 'secret', icon: '🔪', secret: true, rarity: 'Uncommon' },
    { id: 'secret_developer', title: 'Developer\'s Pet', desc: 'Unlock the secret developer theme', category: 'secret', icon: '💻', secret: true, rarity: 'Epic' },
    { id: 'the_matrix', title: 'The Matrix Has You', desc: 'Unlock the Matrix Theme.', category: 'secret', icon: '💊', secret: true, rarity: 'Rare' },
    { id: 'void_embrace', title: 'Embrace The Darkness', desc: 'Unlock the Void Theme.', category: 'secret', icon: '🌑', secret: true, rarity: 'Rare' },
    { id: 'cat_sweeper', title: 'Cat Sweeper', desc: 'Unlock the Cat Theme.', category: 'secret', icon: '🐾', secret: true, rarity: 'Rare' },
    { id: 'banana_security', title: 'Banana Security', desc: 'Unlock the Banana Theme.', category: 'secret', icon: '🍌', secret: true, rarity: 'Rare' },
    { id: 'potato_computer', title: 'Potato Computer', desc: 'Unlock the Potato Theme.', category: 'secret', icon: '🥔', secret: true, rarity: 'Rare' },
    
    // --- ABSURD THEMES UNLOCKS ---
    { id: 'absurd_upside', title: 'Why?', desc: 'Unlock the Upside Down Theme.', category: 'absurd', icon: '🙃', secret: true, rarity: 'Rare' },
    { id: 'absurd_comic', title: 'Crimes Against Typography', desc: 'Unlock the Comic Sans Theme.', category: 'absurd', icon: '💀', secret: true, rarity: 'Rare' },
    { id: 'absurd_vhs', title: 'Rewind', desc: 'Unlock the VHS Theme.', category: 'absurd', icon: '📼', secret: true, rarity: 'Rare' },
    { id: 'absurd_nokia', title: '3310 Survivor', desc: 'Unlock the Nokia Theme.', category: 'absurd', icon: '📱', secret: true, rarity: 'Rare' },
    { id: 'absurd_disco', title: 'Disco Sweeper', desc: 'Unlock the Disco Theme.', category: 'absurd', icon: '🪩', secret: true, rarity: 'Rare' },
    { id: 'absurd_chaos', title: 'What Am I Looking At?', desc: 'Unlock the Chaos Theme.', category: 'absurd', icon: '🤯', secret: true, rarity: 'Rare' },

    // --- SEASONAL THEMES UNLOCKS ---
    { id: 'absurd_halloween', title: 'Spooky Sweeper', desc: 'Unlock Halloween Theme by playing in October', category: 'seasonal', icon: '🎃', secret: true, rarity: 'Rare' },
    { id: 'absurd_christmas', title: 'Merry Sweeps', desc: 'Unlock Christmas Theme by playing in December', category: 'seasonal', icon: '🎄', secret: true, rarity: 'Rare' },
    { id: 'absurd_valentine', title: 'Lovely Sweeper', desc: 'Unlock Valentine Theme by playing in February', category: 'seasonal', icon: '💘', secret: true, rarity: 'Rare' },
    { id: 'absurd_newyear', title: 'New Year Boom', desc: 'Unlock New Year Theme by playing in January', category: 'seasonal', icon: '🎆', secret: true, rarity: 'Rare' },
    { id: 'absurd_summer', title: 'Sizzling Sweeps', desc: 'Unlock Summer Theme by playing in June-August', category: 'seasonal', icon: '☀️', secret: true, rarity: 'Rare' },
    { id: 'absurd_winter', title: 'Frozen Tundra', desc: 'Unlock Winter Theme by playing in Dec-Feb', category: 'seasonal', icon: '❄️', secret: true, rarity: 'Rare' },
    { id: 'absurd_spring', title: 'Blossom Sweep', desc: 'Unlock Spring Theme by playing in March-May', category: 'seasonal', icon: '🌸', secret: true, rarity: 'Rare' },
    { id: 'absurd_autumn', title: 'Autumn Harvest', desc: 'Unlock Autumn Theme by playing in Sept-Nov', category: 'seasonal', icon: '🍂', secret: true, rarity: 'Rare' },

    // --- CHEATS SYSTEM UNLOCKS ---
    { id: 'cheat_derly', title: '🕶️ Developer Overlord', desc: 'Activate the ultimate developer cheat mode.', category: 'cheat', icon: '🕶️', secret: true, rarity: 'Legendary' },
    { id: 'cheat_party', title: '🌈 Rainbow Party', desc: 'Activate rainbow color shifting mode.', category: 'cheat', icon: '🌈', secret: true, rarity: 'Common' },
    { id: 'cheat_retro', title: '💾 Retro Styling', desc: 'Force retro styling active.', category: 'cheat', icon: '💾', secret: true, rarity: 'Common' },
    { id: 'cheat_brain', title: '🧠 Probability Analyzer', desc: 'Activate probability calculation assistance.', category: 'cheat', icon: '🧠', secret: true, rarity: 'Uncommon' },
    { id: 'cheat_flags', title: '🚩 Flag Enthusiast', desc: 'Activate unlimited flags cheat.', category: 'cheat', icon: '🚩', secret: true, rarity: 'Common' },
    { id: 'cheat_hidden', title: '🙈 Invisible Numbers', desc: 'Activate hidden numbers challenge mode.', category: 'cheat', icon: '🙈', secret: true, rarity: 'Uncommon' },
    { id: 'cheat_godmode', title: '🛡️ Invulnerable', desc: 'Activate infinite lives mode.', category: 'cheat', icon: '🛡️', secret: true, rarity: 'Rare' },
    { id: 'cheat_showme', title: '👁️ X-Ray View', desc: 'Activate all-mines outline mode.', category: 'cheat', icon: '👁️', secret: true, rarity: 'Rare' },

    // --- EASTER EGG SYSTEM ---
    { id: 'just_sitting_here', title: 'Just Sitting Here', desc: 'Remain on the main menu / idle for 10 minutes', category: 'easter_eggs', icon: '🪑', secret: true, rarity: 'Uncommon' },
    { id: 'config_wizard', title: 'Configuration Wizard', desc: 'Open settings/custom menu 100 times', category: 'easter_eggs', icon: '⚙️', secret: true, rarity: 'Rare' },

    // --- SECRET CHARACTER THEMES ---
    { id: 'endless_knowledge', title: 'Endless Knowledge', desc: 'Some minds shine brightest in silence.', category: 'secret', icon: '📚', secret: true, rarity: 'Epic' },
    { id: 'cookie_master', title: 'Cookie Master', desc: 'Every victory deserves a fresh batch.', category: 'secret', icon: '🍪', secret: true, rarity: 'Epic' },
    { id: 'unspoken_feelings', title: 'Unspoken Feelings', desc: 'Some stories are never spoken aloud.', category: 'secret', icon: '💜', secret: true, rarity: 'Epic' },
    { id: 'character_collector', title: 'Character Collector', desc: 'Every story leaves a mark.', category: 'completionist', icon: '🏆', secret: true, rarity: 'Epic' },
    { id: 'threads_of_fate', title: 'Threads Of Fate', desc: 'Different paths. Different stories. One collection.', category: 'completionist', icon: '🌌', secret: true, rarity: 'Legendary' }
];

// Scalable registry container
export const ACHIEVEMENT_LIST = [];

/**
 * Initializes and dynamically populates the 1,000+ achievement registry.
 */
const WIN_MILESTONES = [1, 5, 10, 25, 50, 100, 250, 500, 1000];
const PLAY_MILESTONES = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500];
const LOSS_MILESTONES = [1, 5, 10, 25, 50, 100, 250, 500, 1000];
const FLAG_MILESTONES = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000];
const TILE_MILESTONES = [100, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000];
const STREAK_MILESTONES = [2, 3, 5, 10, 15, 20, 25, 50, 100];
const DAILY_MILESTONES = [1, 3, 7, 15, 30, 50, 100, 250, 365];
const SMILEY_MILESTONES = [10, 50, 100, 250, 500, 1000];

const SPEED_BEGINNER_MILESTONES = [5, 10, 15, 20, 30, 45, 60];
const SPEED_INTERMEDIATE_MILESTONES = [20, 30, 45, 60, 90, 120, 180];
const SPEED_EXPERT_MILESTONES = [60, 75, 90, 120, 150, 180, 240, 300];

function initAchievementRegistry() {
    ACHIEVEMENT_LIST.length = 0; // Clear array

    // 1. Add all hand-crafted unique ones first
    UNIQUE_ACHIEVEMENTS.forEach(ach => ACHIEVEMENT_LIST.push(ach));

    // 2. Programmatic Wins Milestones
    WIN_MILESTONES.forEach(i => {
        ACHIEVEMENT_LIST.push({
            id: `wins_count_${i}`,
            title: `Victorious X${i}`,
            desc: `Win ${i} games total`,
            category: 'wins',
            icon: '🏆',
            rarity: i >= 500 ? 'Epic' : i >= 100 ? 'Rare' : 'Common'
        });
    });

    // 3. Programmatic Play Milestones
    PLAY_MILESTONES.forEach(i => {
        ACHIEVEMENT_LIST.push({
            id: `games_count_${i}`,
            title: `Persistent Sweeper ${i}`,
            desc: `Play a total of ${i} games`,
            category: 'beginner',
            icon: '🛹',
            rarity: i >= 1000 ? 'Epic' : i >= 250 ? 'Rare' : 'Common'
        });
    });

    // 4. Programmatic Beginner Speedruns
    SPEED_BEGINNER_MILESTONES.forEach(i => {
        ACHIEVEMENT_LIST.push({
            id: `speed_beginner_${i}`,
            title: `Beginner Swiftness ${i}s`,
            desc: `Win Beginner difficulty in under ${i} seconds`,
            category: 'speedruns',
            icon: '⏱️',
            rarity: i <= 10 ? 'Legendary' : i <= 20 ? 'Epic' : 'Common'
        });
    });

    // 5. Programmatic Intermediate Speedruns
    SPEED_INTERMEDIATE_MILESTONES.forEach(i => {
        ACHIEVEMENT_LIST.push({
            id: `speed_intermediate_${i}`,
            title: `Intermediate Swiftness ${i}s`,
            desc: `Win Intermediate difficulty in under ${i} seconds`,
            category: 'speedruns',
            icon: '⏱️',
            rarity: i <= 30 ? 'Legendary' : i <= 60 ? 'Epic' : 'Common'
        });
    });

    // 6. Programmatic Expert Speedruns
    SPEED_EXPERT_MILESTONES.forEach(i => {
        ACHIEVEMENT_LIST.push({
            id: `speed_expert_${i}`,
            title: `Expert Swiftness ${i}s`,
            desc: `Win Expert difficulty in under ${i} seconds`,
            category: 'speedruns',
            icon: '⏱️',
            rarity: i <= 75 ? 'Legendary' : i <= 120 ? 'Epic' : 'Common'
        });
    });

    // 7. Programmatic Win Streaks
    STREAK_MILESTONES.forEach(i => {
        ACHIEVEMENT_LIST.push({
            id: `streak_count_${i}`,
            title: `Win Streak x${i}`,
            desc: `Reach a win streak of ${i} consecutive games`,
            category: 'streaks',
            icon: '🔥',
            rarity: i >= 50 ? 'Legendary' : i >= 15 ? 'Epic' : 'Common'
        });
    });

    // 8. Programmatic Flags Placed
    FLAG_MILESTONES.forEach(i => {
        ACHIEVEMENT_LIST.push({
            id: `flags_placed_${i}`,
            title: `Flag Cadet ${i}`,
            desc: `Place a total of ${i} flags across all games`,
            category: 'flags',
            icon: '🚩',
            rarity: i >= 10000 ? 'Epic' : i >= 1000 ? 'Rare' : 'Common'
        });
    });

    // 9. Programmatic Tiles Opened
    TILE_MILESTONES.forEach(i => {
        ACHIEVEMENT_LIST.push({
            id: `tiles_opened_${i}`,
            title: `Grid Excavator ${i}`,
            desc: `Reveal a total of ${i} tiles across all games`,
            category: 'statistics',
            icon: '⛏️',
            rarity: i >= 100000 ? 'Epic' : i >= 10000 ? 'Rare' : 'Common'
        });
    });

    // 10. Programmatic Smiley Clicks
    SMILEY_MILESTONES.forEach(i => {
        ACHIEVEMENT_LIST.push({
            id: `smiley_clicks_${i}`,
            title: `Face Poke ${i}`,
            desc: `Click the smiley reset face ${i} times total`,
            category: 'easter_eggs',
            icon: '🙂',
            rarity: i >= 500 ? 'Rare' : 'Common'
        });
    });

    // 11. Programmatic Losses
    LOSS_MILESTONES.forEach(i => {
        ACHIEVEMENT_LIST.push({
            id: `losses_count_${i}`,
            title: `Kaboom Veteran ${i}`,
            desc: `Lose ${i} games total`,
            category: 'funny',
            icon: '💥',
            rarity: i >= 500 ? 'Epic' : i >= 100 ? 'Rare' : 'Common'
        });
    });

    // 12. Programmatic Daily challenge completions
    DAILY_MILESTONES.forEach(i => {
        ACHIEVEMENT_LIST.push({
            id: `daily_completions_${i}`,
            title: `Daily Warrior x${i}`,
            desc: `Complete a game on ${i} different days`,
            category: 'daily',
            icon: '📅',
            rarity: i >= 100 ? 'Epic' : i >= 30 ? 'Rare' : 'Common'
        });
    });
}

// Generate the list immediately
initAchievementRegistry();

/**
 * Loads unlocked achievement IDs
 * @returns {Array<string>} List of unlocked achievement IDs
 */
export function loadUnlockedAchievements() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to load achievements from localStorage.", e);
        return [];
    }
}

/**
 * Saves unlocked achievements
 * @param {Array<string>} list 
 */
function saveUnlockedAchievements(list) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
        console.error("Failed to save achievements to localStorage.", e);
    }
}

/**
 * Triggers an achievement unlock
 * @param {string} id 
 * @returns {boolean} True if newly unlocked
 */
export function unlockAchievement(id) {
    const isCheatActive = window.gameCheatsEnabled === true;
    const isCheatUnlock = [
        'who_is_derly', 'party_sweeper', 'secret_developer', 'forbidden_knowledge',
        'the_matrix', 'void_embrace', 'cat_sweeper', 'banana_security', 'potato_computer',
        'absurd_upside', 'absurd_comic', 'absurd_vhs', 'absurd_nokia', 'absurd_disco', 'absurd_chaos',
        'absurd_halloween', 'absurd_christmas', 'absurd_valentine', 'absurd_newyear', 'absurd_summer', 'absurd_winter', 'absurd_spring', 'absurd_autumn',
        'cheat_derly', 'cheat_party', 'cheat_retro', 'cheat_brain', 'cheat_flags', 'cheat_hidden', 'cheat_godmode', 'cheat_showme',
        'endless_knowledge', 'cookie_master', 'unspoken_feelings', 'character_collector', 'threads_of_fate'
    ].includes(id);
    
    // Ignore unlocks if cheat is active (unless they are cheat-triggered secret themes!)
    if (isCheatActive && !isCheatUnlock) return false;

    const unlocked = loadUnlockedAchievements();
    if (unlocked.includes(id)) return false;

    unlocked.push(id);
    saveUnlockedAchievements(unlocked);

    // Find details
    const ach = ACHIEVEMENT_LIST.find(a => a.id === id);
    if (ach) {
        window.dispatchEvent(new CustomEvent('achievement-unlocked', { detail: ach }));
        
        // Update stats summary counter
        import('./stats.js').then(statsMod => {
            const stats = statsMod.loadStats();
            stats.todayAchievements++;
            statsMod.saveStats(stats);
        });

        // Trigger completionist tracks check
        checkCompletionistTracks(unlocked);
    }

    return true;
}

/**
 * Validates Collector and Completionist unlock targets
 */
function checkCompletionistTracks(unlocked) {
    const totalAchs = ACHIEVEMENT_LIST.length;
    const normalAchs = ACHIEVEMENT_LIST.filter(a => !a.secret);
    const secretAchs = ACHIEVEMENT_LIST.filter(a => a.secret);
    
    const unlockedNormalCount = unlocked.filter(id => {
        const ach = ACHIEVEMENT_LIST.find(a => a.id === id);
        return ach && !ach.secret;
    }).length;

    const unlockedSecretCount = unlocked.filter(id => {
        const ach = ACHIEVEMENT_LIST.find(a => a.id === id);
        return ach && ach.secret;
    }).length;

    const totalUnlockedCount = unlocked.length;

    if (totalUnlockedCount >= 10) unlockAchievement('collector_1');
    if (totalUnlockedCount >= 25) unlockAchievement('collector_2');
    if (totalUnlockedCount >= 50) unlockAchievement('collector_3');
    if (totalUnlockedCount >= 75) unlockAchievement('collector_4');
    if (totalUnlockedCount >= 120) unlockAchievement('achievement_hunter');

    if (unlockedSecretCount >= secretAchs.length - 1) { // subtract secret_hunter
        unlockAchievement('secret_hunter');
    }

    // Check themes collection
    try {
        const themesJSON = localStorage.getItem('minesweeper_unlocked_themes');
        if (themesJSON) {
            const unlockedThemes = JSON.parse(themesJSON);
            if (unlockedThemes.length >= 33) { // all 33 themes
                unlockAchievement('theme_collector');
            }
        }
    } catch (e) {}

    // Check Character themes collection (Endless Knowledge, Cookie Master, Unspoken Feelings)
    if (unlocked.includes('endless_knowledge') && unlocked.includes('cookie_master') && unlocked.includes('unspoken_feelings')) {
        unlockAchievement('character_collector');
        unlockAchievement('threads_of_fate');
    }

    // Unlock normal completionist
    if (unlockedNormalCount >= normalAchs.length - 5) { // subtract collector badges
        unlockAchievement('completionist');
    }

    // Ultimate Completionist requires ALL achievements except itself
    if (totalUnlockedCount >= totalAchs - 1) {
        unlockAchievement('ultimate_completionist');
    }
}

/**
 * Query search and filters achievements dynamically
 * @param {string} query Search text
 * @param {string} category Category select (wins, speedruns, Streaks, etc.)
 * @param {string} status Status check (all, locked, unlocked)
 * @returns {Array<object>} Filtered achievements
 */
export function queryAchievements(query = '', category = 'all', status = 'all') {
    const unlocked = loadUnlockedAchievements();
    const search = query.trim().toLowerCase();

    return ACHIEVEMENT_LIST.filter(ach => {
        const isUnlocked = unlocked.includes(ach.id);

        // Hide secret locked achievements
        if (ach.secret && !isUnlocked) return false;

        // Apply status filter
        if (status === 'locked' && isUnlocked) return false;
        if (status === 'unlocked' && !isUnlocked) return false;

        // Apply category filter
        if (category !== 'all' && ach.category !== category) return false;

        // Apply search query
        if (search) {
            const titleMatch = ach.title.toLowerCase().includes(search);
            const descMatch = ach.desc.toLowerCase().includes(search);
            if (!titleMatch && !descMatch) return false;
        }

        return true;
    });
}

/**
 * Validates game statistics and triggers unlocks
 * @param {object} game 
 * @param {object} stats 
 */
export function checkAchievements(game, stats) {
    const newlyUnlocked = [];
    const unlocked = loadUnlockedAchievements();

    const checkAndUnlock = (id) => {
        if (!unlocked.includes(id)) {
            const success = unlockAchievement(id);
            if (success) {
                const ach = ACHIEVEMENT_LIST.find(a => a.id === id);
                if (ach) newlyUnlocked.push(ach);
            }
        }
    };

    // --- 1. Unique Static Achievements Checks ---
    if (stats.totalWins >= 1) checkAndUnlock('first_victory');

    if (game.status === 'won') {
        const isPreset = ['beginner', 'intermediate', 'expert'].includes(game.difficulty);
        
        let activeFlags = 0;
        let falseFlags = 0;
        for (let r = 0; r < game.rows; r++) {
            for (let c = 0; c < game.cols; c++) {
                const cell = game.board.grid[r][c];
                if (cell.isFlagged) {
                    activeFlags++;
                    if (!cell.isMine) falseFlags++;
                }
            }
        }

        if (isPreset) {
            if (activeFlags === 0) checkAndUnlock('no_flags');
            if (activeFlags > 0 && falseFlags === 0) checkAndUnlock('perfect_run');
            if (game.chordsCount >= 15) checkAndUnlock('human_calculator');
            if (game.chordsCount >= 30) checkAndUnlock('math_genius');
        }

        // Probability overlays density
        if (game.difficulty === 'custom') {
            const density = game.minesCount / (game.rows * game.cols);
            if (density >= 0.3) checkAndUnlock('probability_master');
        }

        // Secret visual check (Night Creature win at 3 AM local time)
        const now = new Date();
        if (now.getHours() === 3) {
            checkAndUnlock('night_creature');
        }

        // Easter Egg: win with score 1337
        if (game.score === 1337) {
            checkAndUnlock('elite');
        }

        // Friday the 13th victory
        if (now.getDate() === 13 && now.getDay() === 5) {
            checkAndUnlock('friday_13th');
        }
    }

    if (game.status === 'lost') {
        const totalNonMines = (game.rows * game.cols) - game.minesCount;
        const unopenedSafe = totalNonMines - game.revealedCount;
        const percentCleared = game.revealedCount / totalNonMines;

        if (unopenedSafe === 1) checkAndUnlock('one_tile_away');
        if (unopenedSafe === 2) checkAndUnlock('heartbreak');
        if (unopenedSafe === 3) checkAndUnlock('so_close');
        if (percentCleared >= 0.95) checkAndUnlock('ninety_nine_pct');
        if (game.lostByChord) checkAndUnlock('trust_process');
        if (game.timer < 2) checkAndUnlock('boom_speedrun');
    }

    // Win or lose at exactly 69 seconds
    if (game.timer === 69) {
        checkAndUnlock('nice');
    }

    // Config wizard check
    if (stats.customMenuOpens >= 100) {
        checkAndUnlock('config_wizard');
    }

    // --- 2. Programmatic Evaluator Checks ---
    // Evaluates every generated achievement check condition
    ACHIEVEMENT_LIST.forEach(ach => {
        if (ach.id.startsWith('wins_count_')) {
            const count = parseInt(ach.id.replace('wins_count_', ''), 10);
            if (stats.totalWins >= count) checkAndUnlock(ach.id);
        } else if (ach.id.startsWith('games_count_')) {
            const count = parseInt(ach.id.replace('games_count_', ''), 10);
            if (stats.totalGames >= count) checkAndUnlock(ach.id);
        } else if (ach.id.startsWith('speed_beginner_')) {
            const max = parseInt(ach.id.replace('speed_beginner_', ''), 10);
            if (game.status === 'won' && game.difficulty === 'beginner' && game.timer < max) checkAndUnlock(ach.id);
        } else if (ach.id.startsWith('speed_intermediate_')) {
            const max = parseInt(ach.id.replace('speed_intermediate_', ''), 10);
            if (game.status === 'won' && game.difficulty === 'intermediate' && game.timer < max) checkAndUnlock(ach.id);
        } else if (ach.id.startsWith('speed_expert_')) {
            const max = parseInt(ach.id.replace('speed_expert_', ''), 10);
            if (game.status === 'won' && game.difficulty === 'expert' && game.timer < max) checkAndUnlock(ach.id);
        } else if (ach.id.startsWith('streak_count_')) {
            const streak = parseInt(ach.id.replace('streak_count_', ''), 10);
            if (stats.bestWinStreak >= streak) checkAndUnlock(ach.id);
        } else if (ach.id.startsWith('flags_placed_')) {
            const count = parseInt(ach.id.replace('flags_placed_', ''), 10);
            if (stats.totalFlagsPlaced >= count) checkAndUnlock(ach.id);
        } else if (ach.id.startsWith('tiles_opened_')) {
            const count = parseInt(ach.id.replace('tiles_opened_', ''), 10);
            if (stats.totalTilesOpened >= count) checkAndUnlock(ach.id);
        } else if (ach.id.startsWith('smiley_clicks_')) {
            const count = parseInt(ach.id.replace('smiley_clicks_', ''), 10);
            if (stats.smileyClicks >= count) checkAndUnlock(ach.id);
        } else if (ach.id.startsWith('losses_count_')) {
            const count = parseInt(ach.id.replace('losses_count_', ''), 10);
            if (stats.totalLosses >= count) checkAndUnlock(ach.id);
        } else if (ach.id.startsWith('daily_completions_')) {
            const count = parseInt(ach.id.replace('daily_completions_', ''), 10);
            if ((stats.dailyCompletions || 0) >= count) checkAndUnlock(ach.id);
        }
    });

    return newlyUnlocked;
}
