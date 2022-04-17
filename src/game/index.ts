import { Scene, Math, Input, Physics } from 'phaser'
import type { Types } from 'phaser'

import { ALIEN, PLAYER, WORLD_SIZE } from './constants'

const KEYS = ['UP', 'LEFT', 'RIGHT', 'W', 'A', 'D', 'SPACE'] as const
type KeyName = typeof KEYS[number]

type GameState = {
    player: {
        nextFireTime: number
        ammo: number
    }
    alienRate: number
    nextAlienSpawn: number
}

export class GoaSpaceSurvival extends Scene {
    player!: Types.Physics.Arcade.SpriteWithDynamicBody
    keys!: Record<KeyName, Input.Keyboard.Key>
    aliens!: Physics.Arcade.Group
    bullets!: Physics.Arcade.Group

    state: GameState

    constructor() {
        super('goa-space-survival')
        this.state = {
            player: {
                nextFireTime: 0,
                ammo: PLAYER.STARTING_AMMO,
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
        this.bullets = this.createBullets()

        this.keys = this.input.keyboard.addKeys(
            'UP,LEFT,RIGHT,W,A,D,SPACE',
            true,
            true,
        ) as Record<KeyName, Input.Keyboard.Key>

        // this.addMusic()

        // TODO: Tile the background to cover full screen
        // this.add.tileSprite(0, 0, WORLD_SIZE, WORLD_SIZE, 'background')

        this.physics.add.collider(this.player, this.aliens)
        this.physics.add.collider(this.aliens, this.aliens)
    }

    createPlayer() {
        const player = this.physics.add.sprite(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'ship',
        )
        player.scale = 1.5
        player.body.drag.set(PLAYER.DRAG)
        player.setCircle(player.body.width / 2.3, 3, 2)
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
            active: false,
            visible: false,
            frameQuantity: ALIEN.MAX_SPAWNED,
            bounceX: 1,
            bounceY: 1,
        })

        // @ts-expect-error TODO: fix this type to be correct
        aliens.children.each((alien: Physics.Arcade.Sprite) => {
            alien.body.setCircle(alien.body.width / 2.7, 4, 10)
        })

        this.anims.create({
            key: 'move',
            frames: this.anims.generateFrameNumbers('alien', { start: 0 }),
            frameRate: 8,
            repeat: -1,
        })

        return aliens
    }

    createBullets() {
        const bullets = this.physics.add.group({
            frameQuantity: PLAYER.MAX_BULLETS,
            collideWorldBounds: true,
            setScale: { x: 0.6, y: 0.6 },
            active: false,
            visible: false,
            key: 'bullet',
        })

        // @ts-expect-error TODO: fix this type to be correct
        bullets.children.each((bullet: Physics.Arcade.Image) => {
            bullet.body.setCircle(bullet.body.halfWidth, 0, 0)
        })

        return bullets
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

    fire() {
        if (this.state.player.ammo) {
            const bullet = this.bullets.getFirstDead(
                false,
                this.player.x,
                this.player.y,
                'bullet',
            ) as Physics.Arcade.Image

            if (bullet) {
                bullet.setActive(true)
                bullet.setVisible(true)

                this.physics.velocityFromRotation(
                    this.player.rotation + PLAYER.ROTATION_FIX,
                    // PLAYER.BULLET_SPEED,
                    25,
                    bullet.body.velocity,
                )

                killWhenOutOfBounds(bullet)

                this.sound.play('shoot', { volume: 0.05 })
                this.state.player.ammo--
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
                    this.fire()
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

const killWhenOutOfBounds = (
    object: Physics.Arcade.Sprite | Physics.Arcade.Image,
) => {
    // @ts-expect-error says readonly but works to overwrite.
    object.body.onWorldBounds = true

    object.body.world.on('worldbounds', (body: Physics.Arcade.Body) => {
        if (body.gameObject === object) {
            object.setActive(false)
            object.setVisible(false)
        }
    })
}
