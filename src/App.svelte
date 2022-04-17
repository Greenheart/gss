<script lang="ts">
    import { onMount } from 'svelte'
    import { Game, AUTO } from 'phaser'

    import { GoaSpaceSurvival } from './game'

    const config = {
        type: AUTO,
        parent: 'game',
        width: 800,
        height: 600,
        scene: GoaSpaceSurvival,
    }

    onMount(() => {
        const game = new Game(config)
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
