/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║  Sticker Decoration System                                         ║
 * ║  Lightweight theme-aware decorative stickers around the game frame ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * Places 10–18 static emoji stickers distributed around the border of
 * the .game-frame element. Each sticker has:
 *   - A zone (top, bottom, left, right, corner)
 *   - A rarity (common 70%, rare 25%, legendary 5%)
 *   - Slight random rotation, scale, and a subtle idle animation
 *
 * No continuous DOM creation. No particles. No FPS impact.
 */

// ─── Rarity definitions ──────────────────────────────────────────────────────

const RARITY = {
    common:    { weight: 70, glow: 'rgba(255,255,255,0.10)', glowSize: '3px',  label: '' },
    rare:      { weight: 25, glow: 'rgba(120,200,255,0.30)', glowSize: '6px',  label: '✦' },
    legendary: { weight:  5, glow: 'rgba(255,215,0,0.50)',   glowSize: '10px', label: '★' },
};

// ─── Per-theme sticker pools ─────────────────────────────────────────────────
// Each pool: { common: [...], rare: [...], legendary: [...] }

const THEME_STICKERS = {
    midnight: {
        common:    ['⭐', '✨', '💫', '🌟', '·', '✦'],
        rare:      ['🌙', '☄️', '🔭'],
        legendary: ['🌌', '🪐'],
    },
    forest: {
        common:    ['🍃', '🌿', '🌱', '🍀', '🌾', '🌲'],
        rare:      ['🍄', '🦎', '🐛'],
        legendary: ['🦌', '🌳'],
    },
    ocean: {
        common:    ['🫧', '🐚', '🌊', '💧', '~', '≋'],
        rare:      ['🐠', '🦀', '🐙'],
        legendary: ['🐋', '🧜'],
    },
    halloween: {
        common:    ['🦇', '🕸️', '💀', '🕷️', '👁️', '🩸'],
        rare:      ['👻', '🎃', '⚰️'],
        legendary: ['🧛', '💀'],
    },
    christmas: {
        common:    ['❄️', '✧', '❅', '❆', '⁕', '✦'],
        rare:      ['🎄', '🎁', '🔔'],
        legendary: ['🎅', '⭐'],
    },
    neon: {
        common:    ['⚡', '✴️', '◆', '◇', '▲', '●'],
        rare:      ['💜', '🔮', '🌀'],
        legendary: ['💎', '🌐'],
    },
    cat: {
        common:    ['🐾', '🧶', '🐱', '😺', '🐟', '🥛'],
        rare:      ['🐈', '😸', '🎀'],
        legendary: ['😻', '👑'],
    },
    banana: {
        common:    ['🍌', '🍋', '🌴', '🥭', '🌻', '💛'],
        rare:      ['🐒', '🙈', '🦧'],
        legendary: ['🍌👑', '🦍'],
    },
    potato: {
        common:    ['🥔', '🌱', '🥄', '🧈', '🍳', '🌾'],
        rare:      ['🧑‍🌾', '🥘', '🍟'],
        legendary: ['👨‍🍳', '🏆'],
    },
    strawberry_spirit: {
        common:    ['🍓', '🌸', '💗', '🎀', '🌺', '💮'],
        rare:      ['🦋', '🎀', '🌷'],
        legendary: ['👸', '💝'],
    },
    quiet_scholar: {
        common:    ['📖', '✒️', '📜', '🕯️', '📝', '🔖'],
        rare:      ['🎓', '📚', '🏛️'],
        legendary: ['🦉', '📿'],
    },
    silent_devotion: {
        common:    ['🔮', '💜', '✨', '🕊️', '🌙', '☆'],
        rare:      ['💎', '🌌', '🪷'],
        legendary: ['👁️‍🗨️', '⚜️'],
    },
    summer: {
        common:    ['☀️', '🌴', '🌊', '🐚', '🌺', '🏖️'],
        rare:      ['🦀', '🍹', '🌅'],
        legendary: ['🐬', '🌈'],
    },
    winter: {
        common:    ['❄️', '⛄', '❅', '❆', '✧', '✦'],
        rare:      ['🧊', '🌨️', '🎿'],
        legendary: ['🏔️', '❄️✨'],
    },
    spring: {
        common:    ['🌸', '🌷', '🌼', '🌱', '🐝', '🦋'],
        rare:      ['🌻', '🪻', '🐞'],
        legendary: ['🦚', '🌈'],
    },
    autumn: {
        common:    ['🍂', '🍁', '🍃', '🌰', '🍄', '🎃'],
        rare:      ['🦊', '🍎', '🎑'],
        legendary: ['🦉', '🏡'],
    },
    classic: {
        common:    ['💾', '⌨️', '🖱️', '📟', '▪️', '▫️'],
        rare:      ['🖥️', '💿', '📠'],
        legendary: ['🏆', '⚙️'],
    },
    sunset: {
        common:    ['🌅', '🌇', '☁️', '🌤️', '🔶', '🔸'],
        rare:      ['🦅', '🌄', '🏜️'],
        legendary: ['🌋', '🎆'],
    },
    aurora: {
        common:    ['✨', '💚', '💜', '💙', '★', '☆'],
        rare:      ['🌌', '🦊', '🌠'],
        legendary: ['🐺', '🔮'],
    },
    cyberpunk: {
        common:    ['⚡', '💛', '💜', '▶', '◀', '●'],
        rare:      ['🤖', '🎮', '🕹️'],
        legendary: ['🦾', '🧬'],
    },
    void: {
        common:    ['⬛', '🌑', '◼️', '▪️', '⬜', '☠️'],
        rare:      ['🕳️', '💀', '🔳'],
        legendary: ['👁️', '⚫'],
    },
    derly: {
        common:    ['⌨️', '⚡', '💻', '⚙️', '{}', '</>'],
        rare:      ['🖥️', '🔧', '🧠'],
        legendary: ['🦠', '🤯'],
    },
    _generic: {
        common:    ['✨', '⭐', '💫', '🌟', '☆', '✦'],
        rare:      ['💎', '🔮', '🌙'],
        legendary: ['👑', '🏆'],
    },
};

// ─── Zone definitions ────────────────────────────────────────────────────────
// Zones define where stickers are placed relative to the game frame.
// offset: how far outside the frame edge (in px). Negative = inside.

const ZONES = {
    top:         { count: 3, side: 'top' },
    bottom:      { count: 3, side: 'bottom' },
    left:        { count: 2, side: 'left' },
    right:       { count: 2, side: 'right' },
    topLeft:     { count: 1, side: 'corner-tl' },
    topRight:    { count: 1, side: 'corner-tr' },
    bottomLeft:  { count: 1, side: 'corner-bl' },
    bottomRight: { count: 1, side: 'corner-br' },
};

// ─── Internal state ──────────────────────────────────────────────────────────

let _container = null;   // the sticker container DOM element
let _theme     = null;   // current theme name
let _stickers  = [];     // array of { element, rarity, emoji }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function _rand(min, max) {
    return Math.random() * (max - min) + min;
}

/** Pick a rarity based on weighted random roll. */
function _rollRarity() {
    const roll = Math.random() * 100;
    if (roll < RARITY.legendary.weight) return 'legendary';
    if (roll < RARITY.legendary.weight + RARITY.rare.weight) return 'rare';
    return 'common';
}

/** Pick a random sticker from the pool for the given theme and rarity. */
function _pickSticker(theme, rarity) {
    const pool = THEME_STICKERS[theme] || THEME_STICKERS._generic;
    const arr  = pool[rarity] || pool.common;
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Calculate sticker positions relative to the game frame.
 * Returns an array of { left, top, zone } objects.
 */
function _computePositions() {
    const frame = document.querySelector('.game-frame');
    if (!frame || !_container) return [];

    const fr = frame.getBoundingClientRect();
    const cr = _container.getBoundingClientRect();

    // Frame rect relative to the sticker container
    const fx = fr.left - cr.left;
    const fy = fr.top  - cr.top;
    const fw = fr.width;
    const fh = fr.height;

    const positions = [];
    const margin = 18; // how far stickers sit from the frame edge

    // Top edge — spread along the top
    for (let i = 0; i < ZONES.top.count; i++) {
        const t = (i + 0.5) / ZONES.top.count;
        positions.push({
            left: fx + fw * t + _rand(-20, 20),
            top:  fy - margin - _rand(8, 24),
            zone: 'top',
        });
    }

    // Bottom edge
    for (let i = 0; i < ZONES.bottom.count; i++) {
        const t = (i + 0.5) / ZONES.bottom.count;
        positions.push({
            left: fx + fw * t + _rand(-20, 20),
            top:  fy + fh + margin + _rand(-4, 12),
            zone: 'bottom',
        });
    }

    // Left edge
    for (let i = 0; i < ZONES.left.count; i++) {
        const t = (i + 0.5) / ZONES.left.count;
        positions.push({
            left: fx - margin - _rand(8, 24),
            top:  fy + fh * t + _rand(-15, 15),
            zone: 'left',
        });
    }

    // Right edge
    for (let i = 0; i < ZONES.right.count; i++) {
        const t = (i + 0.5) / ZONES.right.count;
        positions.push({
            left: fx + fw + margin + _rand(-4, 12),
            top:  fy + fh * t + _rand(-15, 15),
            zone: 'right',
        });
    }

    // Corners
    positions.push({ left: fx - margin + _rand(-8, 4),      top: fy - margin + _rand(-8, 4),      zone: 'corner-tl' });
    positions.push({ left: fx + fw + _rand(-4, 12),          top: fy - margin + _rand(-8, 4),      zone: 'corner-tr' });
    positions.push({ left: fx - margin + _rand(-8, 4),      top: fy + fh + _rand(-4, 12),          zone: 'corner-bl' });
    positions.push({ left: fx + fw + _rand(-4, 12),          top: fy + fh + _rand(-4, 12),          zone: 'corner-br' });

    return positions;
}

/**
 * Create a single sticker DOM element.
 */
function _createStickerEl(emoji, rarity, pos) {
    const el = document.createElement('div');
    el.className = `sticker sticker-${rarity}`;
    el.textContent = emoji;
    el.setAttribute('data-rarity', rarity);

    const rot   = _rand(-22, 22);
    const scale = rarity === 'legendary' ? _rand(1.15, 1.35)
                : rarity === 'rare'      ? _rand(1.0, 1.2)
                :                          _rand(0.8, 1.1);
    const delay = _rand(0, 4);

    el.style.left = `${pos.left}px`;
    el.style.top  = `${pos.top}px`;
    el.style.setProperty('--rot', `${rot}deg`);
    el.style.setProperty('--scale', String(scale));
    el.style.setProperty('--delay', `${delay.toFixed(2)}s`);

    // Rarity-specific glow
    const r = RARITY[rarity];
    el.style.filter = `drop-shadow(0 0 ${r.glowSize} ${r.glow})`;

    return el;
}

// ─── Clear all stickers ──────────────────────────────────────────────────────

function _clearStickers() {
    for (const s of _stickers) {
        s.element.remove();
    }
    _stickers = [];
}

// ─── Place stickers for current theme ────────────────────────────────────────

function _placeStickers() {
    if (!_container || !_theme) return;

    _clearStickers();

    const positions = _computePositions();
    if (positions.length === 0) return;

    for (const pos of positions) {
        const rarity = _rollRarity();
        const emoji  = _pickSticker(_theme, rarity);
        const el     = _createStickerEl(emoji, rarity, pos);

        _container.appendChild(el);
        _stickers.push({ element: el, rarity, emoji });
    }
}

// ─── Reposition on resize ────────────────────────────────────────────────────

let _resizeTimer = null;
function _onResize() {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => {
        _placeStickers(); // recalculate positions based on new frame rect
    }, 250);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export const StickerManager = {
    /**
     * Initialize the sticker system.
     * @param {string} theme — current theme id
     */
    init(theme) {
        _theme = theme;

        // Create or reuse the sticker container
        _container = document.getElementById('sticker-container');
        if (!_container) {
            _container = document.createElement('div');
            _container.id = 'sticker-container';
            _container.className = 'sticker-container';
            // Insert inside .game-view, as a sibling of .game-frame
            const gameView = document.querySelector('.game-view');
            if (gameView) {
                gameView.insertBefore(_container, gameView.firstChild);
            } else {
                document.body.appendChild(_container);
            }
        }

        // Place stickers after a brief delay to ensure layout has settled
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                _placeStickers();
            });
        });

        window.addEventListener('resize', _onResize);
    },

    /**
     * Update stickers when theme changes.
     * @param {string} theme — new theme id
     */
    setTheme(theme) {
        _theme = theme;
        // Re-place stickers with new theme pool
        requestAnimationFrame(() => {
            _placeStickers();
        });
    },

    /**
     * Remove all stickers and unbind listeners.
     */
    destroy() {
        _clearStickers();
        window.removeEventListener('resize', _onResize);
        if (_container) {
            _container.remove();
            _container = null;
        }
    },
};
