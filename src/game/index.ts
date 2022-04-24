import { Scene, Math, Input, Physics, GameObjects } from 'phaser'
import type { Types } from 'phaser'

import { ALIEN, PLAYER, WORLD_SIZE } from './constants'

const KEYS = ['UP', 'LEFT', 'RIGHT', 'W', 'A', 'D', 'SPACE'] as const
type KeyName = typeof KEYS[number]

type GameState = {
    player: {
        cooldownTime: number
        ammo: number
        kills: number
        score: number
        alive: boolean
    }
    sessionStartTime: number
    alienRate: number
    nextAlienSpawn: number
}

type UI = {
    startText: GameObjects.Text
    scoreText: GameObjects.Text
}

export class GoaSpaceSurvival extends Scene {
    player!: Types.Physics.Arcade.SpriteWithDynamicBody
    keys!: Record<KeyName, Input.Keyboard.Key>
    aliens!: Physics.Arcade.Group
    bullets!: Physics.Arcade.Group

    ui!: UI
    state!: GameState

    constructor() {
        super('goa-space-survival')
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
        })
        this.load.audio('shoot', 'assets/sounds/shotgun.wav')
        this.load.audio('alienDeath', 'assets/sounds/alien_death1.wav')
        this.load.audio('explosion', 'assets/sounds/explosion.mp3')
        this.load.audio('pickUpItem', 'assets/sounds/key.wav')

        this.load.audio('tommyInGoa', 'assets/music/tommy_in_goa.mp3')
    }

    create() {
        this.add
            .tileSprite(0, 0, WORLD_SIZE, WORLD_SIZE, 'background')
            .setOrigin(0)

        this.startNewGame()

        this.player = this.createPlayer()
        this.aliens = this.createAliens()
        this.bullets = this.createBullets()

        this.keys = this.input.keyboard.addKeys(
            'UP,LEFT,RIGHT,W,A,D,SPACE',
            true,
            true,
        ) as Record<KeyName, Input.Keyboard.Key>

        this.anims.create({
            key: 'explode',
            frames: this.anims.generateFrameNumbers('explode', { start: 0 }),
            frameRate: 24,
            repeat: 0,
        })

        // this.addMusic()

        this.physics.add.collider(this.player, this.aliens, ((a, b) =>
            this.die(
                ...([a, b] as Parameters<GoaSpaceSurvival['die']>),
            )) as ArcadePhysicsCallback)
        this.physics.add.collider(this.aliens, this.aliens)

        this.physics.add.collider(this.bullets, this.aliens, ((a, b) =>
            this.bulletAlienCollision(
                ...([a, b] as Parameters<
                    GoaSpaceSurvival['bulletAlienCollision']
                >),
            )) as ArcadePhysicsCallback)

        this.createUI()
    }

    startNewGame() {
        this.state = {
            player: {
                cooldownTime: 0,
                ammo: PLAYER.STARTING_AMMO,
                kills: 0,
                score: 0,
                alive: true,
            },
            sessionStartTime: this.game.getTime(),
            alienRate: ALIEN.STARTING_ALIEN_RATE,
            nextAlienSpawn: 0,
        }
    }

    createUI() {
        const scoreText = this.add.text(
            this.cameras.main.x + 15,
            this.cameras.main.y + 15,
            'Score: 0',
        )
        scoreText.setScrollFactor(0)

        const startText = this.add
            .text(
                this.cameras.main.centerX,
                this.cameras.main.centerY - 80,
                'Press SPACE to start',
            )
            .setOrigin(0.5)
        startText.visible = false
        startText.setScrollFactor(0)

        this.ui = {
            startText,
            scoreText,
        }
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

    updateUI() {
        this.ui.scoreText.text = `Score: ${this.state.player.score}`
    }

    createRestartPrompt() {
        this.ui.startText.visible = true
    }

    createAliens() {
        const aliens = this.physics.add.group({
            classType: Physics.Arcade.Sprite,
            key: 'alien',
            collideWorldBounds: true,
            maxSize: ALIEN.MAX_SPAWNED,
            setScale: { x: 1.8, y: 1.8 },
            frameQuantity: ALIEN.MAX_SPAWNED,
            bounceX: 1,
            bounceY: 1,
        })

        // @ts-expect-error TODO: fix this type to be correct
        aliens.children.each((alien: Physics.Arcade.Sprite) => {
            alien.body.setCircle(alien.body.width / 2.7, 4, 10)
            alien.disableBody(true, true)
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
            key: 'bullet',
        })

        // @ts-expect-error TODO: fix this type to be correct
        bullets.children.each((bullet: Physics.Arcade.Image) => {
            bullet.body.setCircle(bullet.body.halfWidth, 0, 0)
            bullet.disableBody(true, true)
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
        const alien = this.aliens.getFirstDead(false) as Physics.Arcade.Sprite

        if (alien) {
            alien.enableBody(true, alienX, alienY, true, true)
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
            ) as Physics.Arcade.Image

            if (bullet) {
                bullet.enableBody(
                    true,
                    this.player.x,
                    this.player.y,
                    true,
                    true,
                )

                this.physics.velocityFromRotation(
                    this.player.rotation + PLAYER.ROTATION_FIX,
                    PLAYER.BULLET_SPEED,
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

    die(player: Physics.Arcade.Sprite, alien: Physics.Arcade.Sprite) {
        const boom = this.add.sprite(player.x, player.y, 'explode', 16)
        alien.disableBody(true, true)
        this.sound.play('explosion', { volume: 0.05 })
        boom.play('explode')
        player.disableBody(true, true)

        boom.on('animationcomplete-explode', () => {
            boom.destroy()
        })
        this.createRestartPrompt()
        this.state.player.alive = false
    }

    bulletAlienCollision(
        bullet: Physics.Arcade.Image,
        alien: Physics.Arcade.Sprite,
    ) {
        // 30% chance that the alien dropAmmo
        // const outcome = window.Math.random();
        // if (outcome >= 0.7) {
        //     // drop ammo on the alien's anchor position
        //     dropAmmo(alien.body.x + alien.body.width / 2, alien.body.y + alien.body.height / 2);
        // }
        console.log(bullet, alien)

        bullet.disableBody(true, true)
        alien.disableBody(true, true)
        this.state.player.score++
        this.state.player.kills++
        this.updateUI()
        this.sound.play('alienDeath', { volume: 0.05 })
    }

    dropAmmo() {}

    restart() {
        this.ui.startText.visible = false
        this.startNewGame()
        this.player.enableBody(
            true,
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            true,
            true,
        )

        // @ts-expect-error TODO: fix this type to be correct
        this.aliens.children.each((alien: Physics.Arcade.Sprite) => {
            alien.disableBody(true, true)
        })

        // @ts-expect-error TODO: fix this type to be correct
        this.bullets.children.each((bullet: Physics.Arcade.Sprite) => {
            bullet.disableBody(true, true)
        })
    }

    update(time: number, delta: number) {
        const { UP, LEFT, RIGHT, W, A, D, SPACE } = this.keys

        if (!this.state.player.alive && SPACE.isDown) {
            this.restart()
            this.updateUI()
        }

        if (!this.player.active) return
        // if (this.player.visible) {
        //     this.physics.overlap(this.player, this.aliens, this.die)
        //     this.physics.overlap(this.player, this.ammoClips, this.refillAmmo)
        // }

        if (UP.isDown || W.isDown) {
            this.physics.velocityFromRotation(
                this.player.rotation + PLAYER.ROTATION_FIX,
                200,
                this.player.body.velocity,
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

        if (
            SPACE.isDown &&
            time > this.state.sessionStartTime + PLAYER.WEAPON_ACTIVATION_TIME
        ) {
            if (time > this.state.player.cooldownTime) {
                this.state.player.cooldownTime = time + PLAYER.COOLDOWN
                this.fire()
            }
        }

        if (time > this.state.nextAlienSpawn) {
            if (this.aliens.countActive() < this.aliens.children.size) {
                this.state.nextAlienSpawn = time + this.state.alienRate
                if (this.state.alienRate > ALIEN.MIN_ALIEN_RATE) {
                    this.state.alienRate -= 100
                }
                this.spawnAlien()
            }
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
            object.disableBody(true, true)
        }
    })
}
