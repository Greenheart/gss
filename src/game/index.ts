import { Scene } from 'phaser'

import logoImg from '../assets/logo.png'

export class GoaSpaceSurvival extends Scene {
    preload() {
        this.load.image('logo', logoImg)
    }

    create() {
        this.add.image(400, 300, 'logo')
    }
}
