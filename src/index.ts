import { Game, AUTO } from 'phaser'

import { GoaSpaceSurvival } from './game'
import { WORLD_SIZE } from './game/constants'

declare global {
    interface Window {
        game: Game
    }
}

if (import.meta.env.MODE === 'development' && window.game?.destroy) {
    window.game.destroy(true)
}
window.game = new Game({
    type: AUTO,
    parent: 'game',
    width: 800,
    height: 600,
    scene: GoaSpaceSurvival,
    physics: {
        default: 'arcade',
        arcade: {
            // debug: true,
            x: 0,
            y: 0,
            height: WORLD_SIZE,
            width: WORLD_SIZE,
        },
    },
})
