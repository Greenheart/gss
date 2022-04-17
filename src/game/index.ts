import { Scene } from 'phaser'
import type { Types, Input } from 'phaser'

import { PLAYER } from './constants'

const KEYS = ['UP', 'LEFT', 'RIGHT', 'W', 'A', 'D', 'SPACE'] as const
type KeyName = typeof KEYS[number]

type GameState = {
    player: {
        nextFireTime: number
    }
}

export class GoaSpaceSurvival extends Scene {
    player!: Types.Physics.Arcade.SpriteWithDynamicBody
    keys!: Record<KeyName, Input.Keyboard.Key>
    state: GameState

    constructor() {
        super('goa-space-survival')
        this.state = {
            player: {
                nextFireTime: 0,
            },
        }
    }

    preload() {
        this.load.image('background', 'assets/images/deep-space.jpg')
        this.load.image('bullet', 'assets/images/purple_ball.png')

        this.load.spritesheet('ship', 'assets/sprites/humstar.png', {
            frameWidth: 32,
            frameHeight: 32,
        })
        this.load.spritesheet('enemy', 'assets/sprites/invader32x32x4.png', {
            frameWidth: 32,
            frameHeight: 32,
        })
        this.load.spritesheet('explode', 'assets/sprites/explode.png', {
            frameWidth: 128,
            frameHeight: 128,
            // TODO: Use 16 frames per second or 16 frames total
        })
        this.load.audio('shoot', 'assets/sounds/shotgun.wav')
        this.load.audio('alienDeath', 'assets/sounds/alien_death1.wav')
        this.load.audio('playerExplosion', 'assets/sounds/explosion.mp3')
        this.load.audio('pickUpItem', 'assets/sounds/key.wav')

        this.load.audio('tommyInGoa', 'assets/music/tommy_in_goa.mp3')
    }

    create() {
        this.add.image(400, 300, 'background')

        this.player = this.createPlayer()

        this.keys = this.input.keyboard.addKeys(
            'UP,LEFT,RIGHT,W,A,D,SPACE',
            true,
            true,
        ) as Record<KeyName, Input.Keyboard.Key>

        // this.addMusic()

        // this.cameras.main.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE)
        // this.add.tileSprite(0, 0, WORLD_SIZE, WORLD_SIZE, 'background')
    }

    createPlayer() {
        const player = this.physics.add.sprite(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'ship',
        )
        player.scale = 1.5
        player.body.drag.set(PLAYER.DRAG)
        player.body.setSize(
            (player.body.width * 3) / 4,
            (player.body.height * 3) / 4,
        )
        player.body.maxVelocity.set(PLAYER.MAX_SPEED)
        player.body.collideWorldBounds = true
        player.setDamping(true)

        this.anims.create({
            key: 'fly',
            frames: this.anims.generateFrameNumbers('ship', { start: 0 }),
            frameRate: 10,
            repeat: -1,
        })
        this.cameras.main.startFollow(player)

        player.play('fly')
        return player
    }

    addMusic() {
        const music = this.sound.add('tommyInGoa', { loop: true, volume: 0.4 })
        this.sound.pauseOnBlur = false
        music.play()
    }

    update() {
        // if (this.player.visible) {
        //     this.physics.overlap(this.player, this.aliens, this.die)
        //     this.physics.overlap(this.player, this.ammoClips, this.refillAmmo)
        // }

        // this.physics.overlap(this.bullets, this.aliens, this.bulletAlienCollision)

        if (this.player.active) {
            const { UP, LEFT, RIGHT, W, A, D, SPACE } = this.keys
            if (UP.isDown || W.isDown) {
                this.physics.velocityFromRotation(
                    this.player.rotation + Math.PI / 2,
                    200,
                    this.player.body.acceleration,
                )
            } else {
                this.player.setAcceleration(0)
            }

            // Maybe use
            if (LEFT.isDown || A.isDown) {
                this.player.setAngularVelocity(-PLAYER.MAX_ANGULAR_VELOCITY)
            } else if (RIGHT.isDown || D.isDown) {
                this.player.setAngularVelocity(PLAYER.MAX_ANGULAR_VELOCITY)
            } else {
                this.player.setAngularVelocity(0)
            }

            if (SPACE.isDown) {
                const now = this.game.getTime()
                if (now > this.state.player.nextFireTime) {
                    this.state.player.nextFireTime = now + PLAYER.FIRE_RATE
                }
            }

            this.physics.world.wrap(this.player)
        }
    }
}
