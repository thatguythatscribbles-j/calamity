// Main Game Engine
class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 1280;
        this.canvas.height = 720;

        this.state = 'exploration'; // exploration, battle, dialogue, menu
        this.currentRoom = 'outskirts';
        this.shiftActive = false;
        this.gameTime = 0;

        this.player = null;
        this.world = null;
        this.battle = null;
        this.dialogue = null;
        this.inventory = null;
        this.save = null;

        this.keys = {};
        this.init();
    }

    init() {
        this.setupInputHandling();
        this.player = new Player(640, 360);
        this.world = new World();
        this.dialogue = new Dialogue();
        this.inventory = new Inventory();
        this.save = new Save();
        this.shift = new Shift();

        this.gameLoop();
    }

    setupInputHandling() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();

            // Battle input handling
            if (this.state === 'battle' && this.battle && this.battle.isActive) {
                if (key === '1') {
                    this.battle.performPlayerAction('attack');
                    if (this.battle.isComplete()) {
                        this.endBattle();
                    }
                    return;
                }
                if (key === '2') {
                    this.battle.performPlayerAction('ability');
                    if (this.battle.isComplete()) {
                        this.endBattle();
                    }
                    return;
                }
                if (key === '3') {
                    this.battle.performPlayerAction('defend');
                    if (this.battle.isComplete()) {
                        this.endBattle();
                    }
                    return;
                }
                if (key === '4') {
                    this.battle.performPlayerAction('escape');
                    if (this.battle.isComplete()) {
                        this.endBattle();
                    }
                    return;
                }
            }

            // Normal exploration input
            this.keys[key] = true;

            if (e.key === 'Shift') {
                this.handleShift();
            }
            if (e.key === 'Enter') {
                this.handleInteract();
            }
            if (e.key === 'Escape') {
                this.handleMenu();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    handleShift() {
        this.shiftActive = !this.shiftActive;
        this.shift.toggle(this.currentRoom);
        this.world.updateForShift(this.shiftActive, this.currentRoom);
    }

    handleInteract() {
        if (this.state === 'exploration') {
            const nearbyEntity = this.world.getNearbyInteractable(this.player);
            if (nearbyEntity) {
                this.state = 'dialogue';
                this.dialogue.startDialogue(nearbyEntity, this.player, this.shiftActive);
            }
        } else if (this.state === 'dialogue') {
            this.dialogue.nextLine();
            if (this.dialogue.isComplete()) {
                this.state = 'exploration';
                this.dialogue.reset();
            }
        }
    }

    handleMenu() {
        if (this.state === 'exploration') {
            this.state = 'menu';
        } else if (this.state === 'menu') {
            this.state = 'exploration';
        }
    }

    update() {
        this.gameTime++;

        if (this.state === 'exploration') {
            this.updateExploration();
        } else if (this.state === 'dialogue') {
            this.dialogue.update();
        }
    }

    updateExploration() {
        // Handle movement
        let dx = 0;
        let dy = 0;

        if (this.keys['arrowup'] || this.keys['w']) dy -= 5;
        if (this.keys['arrowdown'] || this.keys['s']) dy += 5;
        if (this.keys['arrowleft'] || this.keys['a']) dx -= 5;
        if (this.keys['arrowright'] || this.keys['d']) dx += 5;

        if (dx !== 0 || dy !== 0) {
            this.player.move(dx, dy, this.world);
            this.player.isMoving = true;
        } else {
            this.player.isMoving = false;
        }

        // Update world
        this.world.update(this.player, this.shiftActive);

        // Check for battle triggers
        if (this.world.checkBattleTrigger(this.player)) {
            this.startBattle(this.world.triggeredBoss);
        }

        // Update interactable prompt
        const nearbyEntity = this.world.getNearbyInteractable(this.player);
        this.updateInteractionPrompt(nearbyEntity);
    }

    updateInteractionPrompt(entity) {
        const prompt = document.getElementById('interaction-prompt');
        if (entity) {
            prompt.textContent = '[E] Interact';
            prompt.classList.add('visible');
        } else {
            prompt.classList.remove('visible');
        }
    }

    startBattle(bossData) {
        if (!bossData) return;

        // Create player battle entity
        const playerEntity = new BattleEntity(
            'parralexs',
            this.player.name,
            this.player.maxHp,
            8,
            3,
            5
        );

        // Add heal ability
        const healAbility = new Ability('heal', 'Heal', 'Restore health', 0, 8, 'heal');
        playerEntity.addAbility(healAbility);

        // Create enemy battle entity from boss data
        const enemyEntity = new BattleEntity(
            bossData.id || 'enemy',
            bossData.name || 'Enemy',
            bossData.maxHealth || 40,
            bossData.attack || 8,
            bossData.defense || 3,
            bossData.speed || 5
        );

        this.state = 'battle';
        this.battle = new Battle(playerEntity, enemyEntity, bossData.id || 'boss_fight');
        this.battle.battleLog.push(`${enemyEntity.name} appears!`);
    }

    endBattle() {
        if (this.battle && this.battle.winner) {
            // Update player HP from battle
            this.player.hp = this.battle.player.currentHealth;
        }

        this.state = 'exploration';
        this.battle = null;
        this.world.onBattleComplete();
    }

    render() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === 'exploration') {
            this.world.render(this.ctx, this.player, this.shiftActive);
            this.player.render(this.ctx);
        } else if (this.state === 'battle') {
            if (this.battle) {
                this.battle.render(this.ctx);
            }
        } else if (this.state === 'dialogue') {
            this.world.render(this.ctx, this.player, this.shiftActive);
            this.player.render(this.ctx);
        }

        // Render dialogue if active
        if (this.state === 'dialogue') {
            this.dialogue.render();
        }
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
