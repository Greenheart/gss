export const WORLD_SIZE = 1000

export const PLAYER = {
    DRAG: 0.59,
    MAX_SPEED: 170,
    STARTING_AMMO: 50,
    MAX_ANGULAR_VELOCITY: 200,
    /**
     * Weapon cooldown time (ms)
     */
    COOLDOWN: 300,
    /**
     * Prevents aliens from spawning within this radius from the player
     */
    SAFE_RADIUS: 120,
    /**
     * Ensure rotation matches the player sprite
     */
    ROTATION_FIX: Math.PI / 2,
    BULLET_SPEED: 600,
    MAX_SPAWNED_BULLETS: 40,
    WEAPON_ACTIVATION_TIME: 500,
}

export const ALIEN = {
    MAX_SPAWNED: 30,
    MAX_SPEED: 125,
    /**
     * Controls how often aliens spawn.
     */
    STARTING_ALIEN_RATE: 3000,
    /**
     * Don't spawn too often to not make the game too hard.
     */
    MIN_ALIEN_RATE: 800,
    AMMO_DROP_CHANCE: 0.3,
    AMMO_TIMEOUT: 10_000,
    AMMO_PER_CLIP: 5,
}

export const HIGHSCORES_DB = 'gss_highscores'
