<script lang="ts">
    import { onMount } from 'svelte'
    import { Game, AUTO } from 'phaser'

    import { GoaSpaceSurvival } from './game'
    import { WORLD_SIZE } from './game/constants'

    onMount(() => {
        if (import.meta.env.MODE === 'development' && window.game?.destroy) {
            window.game.destroy(false)
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
                    x: 0,
                    y: 0,
                    height: WORLD_SIZE,
                    width: WORLD_SIZE,
                },
            },
        })
    })
</script>

<main class="flex flex-col items-center pt-8 text-stone-50">
    <h2 class="text-3xl font-bold">Goa Space Survival</h2>
    <p class="font-mono pt-4">
        Controls: UP or W to move forward, LEFT/RIGHT or A/D to rotate &amp;
        Spacebar to shoot
    </p>

    <div id="game" class="flex justify-center pt-8 pb-16" />
</main>
