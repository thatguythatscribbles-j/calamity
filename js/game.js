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
        this.testBattleUsed = false;

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

            // Press B at any time during exploration to start a safe test fight.
            // This makes the battle system immediately testable without reaching a boss room.
            if (this.state === 'exploration' && key === 'b') {
                this.startTestBattle();
                return;
            }

            if (this.state === 'battle' && this.battle && this.battle.isActive) {
                const actions = {
                    '1': 'attack',
                    '2': 'ability',
                    '3': 'defend',
                    '4': 'escape'
                };

                if (actions[key]) {
                    e.preventDefault();
                    this.battle.performPlayerAction(actions[key]);
                    if (this.battle.isComplete()) {
                        this.endBattle();
                    }
                    return;
                }
            }

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

        this.world.update(this.player, this.shiftActive);

        if (this.world.checkBattleTrigger(this.player)) {
            this.startBattle(this.world.triggeredBoss);
        }

        const nearbyEntity = this.world.getNearbyInteractable(this.player);
        this.updateInteractionPrompt(nearbyEntity);
    }

    updateInteractionPrompt(entity) {
        const prompt = document.getElementById('interaction-prompt');
        if (!prompt) return;

        if (entity) {
            prompt.textContent = '[Enter] Interact  |  [B] Test Battle';
            prompt.classList.add('visible');
        } else {
            prompt.textContent = '[B] Test Battle';
            prompt.classList.add('visible');
        }
    }

    createPlayerBattleEntity() {
        const playerEntity = new BattleEntity(
            'parralexs',
            this.player.name,
            this.player.maxHp,
            8,
            3,
            5
        );
        playerEntity.currentHealth = Math.max(1, Math.min(this.player.hp, playerEntity.maxHealth));
        playerEntity.addAbility(new Ability('heal', 'Heal', 'Restore health', 0, 8, 'heal'));
        return playerEntity;
    }

    startTestBattle() {
        this.startBattle({
            id: 'shadow_creature',
            name: 'Shadow Creature',
            maxHealth: 45,
            attack: 7,
            defense: 2,
            speed: 5,
            isTestBattle: true
        });
    }

    startBattle(bossData) {
        if (!bossData || typeof BattleEntity === 'undefined' || typeof Battle === 'undefined') {
            console.error('Battle dependencies are unavailable.', { bossData });
            return;
        }

        const playerEntity = this.createPlayerBattleEntity();
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
        if (!this.battle) return;

        const won = this.battle.winner === this.battle.player;
        const escaped = won && this.battle.player.currentHealth > 0 && this.battle.enemy.isAlive();

        if (this.battle.player.currentHealth > 0) {
            this.player.hp = this.battle.player.currentHealth;
        } else {
            this.player.reset();
        }

        // Only mark a boss as defeated after an actual victory, not after escaping.
        if (won && !escaped && this.world.triggeredBoss) {
            this.world.onBattleComplete();
        }

        this.state = 'exploration';
        this.battle = null;
    }

    render() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.state === 'exploration') {
            this.world.render(this.ctx, this.player, this.shiftActive);
            this.player.render(this.ctx);
        } else if (this.state === 'battle') {
            if (this.battle) this.battle.render(this.ctx);
        } else if (this.state === 'dialogue') {
            this.world.render(this.ctx, this.player, this.shiftActive);
            this.player.render(this.ctx);
        }

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

window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
