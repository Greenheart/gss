import { Scene, Math, GameObjects, Input, Physics } from 'phaser'
import type { Types } from 'phaser'

import { ALIEN, PLAYER, WORLD_SIZE } from './constants'

const KEYS = ['UP', 'LEFT', 'RIGHT', 'W', 'A', 'D', 'SPACE'] as const
type KeyName = typeof KEYS[number]

type GameState = {
    player: {
        nextFireTime: number
    }
    alienRate: number
    nextAlienSpawn: number
}

export class GoaSpaceSurvival extends Scene {
    player!: Types.Physics.Arcade.SpriteWithDynamicBody
    keys!: Record<KeyName, Input.Keyboard.Key>
    aliens!: GameObjects.Group

    state: GameState

    constructor() {
        super('goa-space-survival')
        this.state = {
            player: {
                nextFireTime: 0,
            },
            alienRate: ALIEN.STARTING_ALIEN_RATE,
            nextAlienSpawn: 0,
        }
    }

    preload() {
        this.load.image('background', 'assets/images/deep-space.jpg')
        this.load.image('bullet', 'assets/images/purple_ball.png')

        this.load.spritesheet('ship', 'assets/sprites/humstar.png', {
            frameWidth: 32,
            frameHeight: 32,
        })
        this.load.spritesheet('alien', 'assets/sprites/invader32x32x4.png', {
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
        this.aliens = this.createAliens()

        this.keys = this.input.keyboard.addKeys(
            'UP,LEFT,RIGHT,W,A,D,SPACE',
            true,
            true,
        ) as Record<KeyName, Input.Keyboard.Key>

        // this.addMusic()

        // this.cameras.main.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE)
        // this.add.tileSprite(0, 0, WORLD_SIZE, WORLD_SIZE, 'background')

        this.physics.add.collider(this.player, this.aliens)
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

    createAliens() {
        const aliens = this.physics.add.group({
            classType: Physics.Arcade.Sprite,
            key: 'aliens',
            collideWorldBounds: true,
            maxSize: ALIEN.MAX_SPAWNED,
            setScale: { x: 1.8, y: 1.8 },
            setOrigin: { x: 0.5, y: 0.8 },
            active: false,
            visible: false,
            frameQuantity: ALIEN.MAX_SPAWNED,
        })

        this.anims.create({
            key: 'move',
            frames: this.anims.generateFrameNumbers('alien', { start: 0 }),
            frameRate: 8,
            repeat: -1,
        })

        return aliens
    }

    spawnAlien() {
        let alienX = Math.Between(0, WORLD_SIZE)
        let alienY = Math.Between(0, WORLD_SIZE)

        while (Math.Difference(alienX, this.player.x) <= PLAYER.SAFE_RADIUS) {
            alienX = Math.Between(0, WORLD_SIZE)
        }

        while (Math.Difference(alienY, this.player.y) <= PLAYER.SAFE_RADIUS) {
            alienY = Math.Between(0, WORLD_SIZE)
        }

        const direction = Math.FloatBetween(0, 2 * window.Math.PI)
        const alien = this.aliens.getFirstDead(
            false,
            alienX,
            alienY,
        ) as Physics.Arcade.Sprite

        if (alien) {
            alien.setActive(true)
            alien.setVisible(true)
            alien.play('move')

            alien.body.velocity.x = Math.Between(
                -ALIEN.MAX_SPEED,
                ALIEN.MAX_SPEED,
            )
            alien.body.velocity.y = Math.Between(
                -ALIEN.MAX_SPEED,
                ALIEN.MAX_SPEED,
            )

            this.physics.velocityFromRotation(
                direction,
                alien.body.velocity as any,
            )

            this.aliens.add(alien)

            if (this.state.alienRate >= 800) {
                this.state.alienRate -= 100
            }
        }
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
            const now = this.game.getTime()
            const { UP, LEFT, RIGHT, W, A, D, SPACE } = this.keys
            if (UP.isDown || W.isDown) {
                this.physics.velocityFromRotation(
                    this.player.rotation + PLAYER.ROTATION_FIX,
                    200,
                    this.player.body.acceleration,
                )
            } else {
                this.player.setAcceleration(0)
            }

            if (LEFT.isDown || A.isDown) {
                this.player.setAngularVelocity(-PLAYER.MAX_ANGULAR_VELOCITY)
            } else if (RIGHT.isDown || D.isDown) {
                this.player.setAngularVelocity(PLAYER.MAX_ANGULAR_VELOCITY)
            } else {
                this.player.setAngularVelocity(0)
            }

            if (SPACE.isDown) {
                if (now > this.state.player.nextFireTime) {
                    this.state.player.nextFireTime = now + PLAYER.FIRE_RATE
                }
            }

            if (this.player.active) {
                if (now > this.state.nextAlienSpawn) {
                    if (this.aliens.countActive() < this.aliens.children.size) {
                        this.state.nextAlienSpawn = now + this.state.alienRate
                        this.spawnAlien()
                    }
                }
            }

            // IDEA: Maybe get player world bounds wrapping to work.
            // this.physics.world.wrap(this.player)
        }
    }
}
