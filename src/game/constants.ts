// const alienRate = 3000 // cooldown for spawning aliens
// const nextAlienTime = 0 // time left until next alien can be spawned
// const aliensKilled = 0
// const playerAmmo = 50

export const WORLD_SIZE = 1000

export const PLAYER = {
    DRAG: 0.99,
    MAX_SPEED: 180,
    STARTING_AMMO: 50,
    MAX_ANGULAR_VELOCITY: 280,
    /**
     * Weapon cooldown time (ms)
     */
    FIRE_RATE: 300,
    /**
     * Prevents aliens from spawning within this radius from the player
     */
    SAFE_RADIUS: 80,
    /**
     * Ensure rotation matches the player sprite
     */
    ROTATION_FIX: Math.PI / 2,
    BULLET_SPEED: 500,
    MAX_BULLETS: 30,
}

export const ALIEN = {
    MAX_SPAWNED: 10,
    MAX_SPEED: 125,
    /**
     * Controls how often aliens spawn.
     */
    STARTING_ALIEN_RATE: 3000,
    /**
     * Don't spawn too often to not make the game too hard.
     */
    MIN_ALIEN_RATE: 800,
}
