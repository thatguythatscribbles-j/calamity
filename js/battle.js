// Battle and Combat System
class BattleEntity {
    constructor(id, name, maxHealth, attack, defense, speed) {
        this.id = id;
        this.name = name;
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        this.attack = attack;
        this.defense = defense;
        this.baseDefense = defense;
        this.speed = speed;
        this.status = [];
        this.abilities = [];
        this.level = 1;
        this.experience = 0;
    }

    takeDamage(damage) {
        const mitigatedDamage = Math.max(1, damage - this.defense);
        this.currentHealth = Math.max(0, this.currentHealth - mitigatedDamage);
        return mitigatedDamage;
    }

    heal(amount) {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }

    addAbility(ability) {
        this.abilities.push(ability);
    }

    getAbilities() {
        return this.abilities;
    }

    addStatus(status) {
        this.status.push(status);
    }

    removeStatus(statusType) {
        this.status = this.status.filter(s => s.type !== statusType);
    }

    isAlive() {
        return this.currentHealth > 0;
    }

    getHealthPercent() {
        return (this.currentHealth / this.maxHealth) * 100;
    }

    getStats() {
        return {
            id: this.id,
            name: this.name,
            health: this.currentHealth,
            maxHealth: this.maxHealth,
            attack: this.attack,
            defense: this.defense,
            speed: this.speed,
            status: this.status.map(s => s.type),
            level: this.level
        };
    }
}

class Ability {
    constructor(id, name, description, cost, power, type) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.cost = cost;
        this.power = power;
        this.type = type;
        this.cooldown = 0;
        this.maxCooldown = 0;
    }

    use(user, target) {
        if (this.cooldown > 0) {
            return { success: false, message: `${this.name} is on cooldown for ${this.cooldown} more turns.` };
        }

        let result = { success: true, message: '' };

        switch (this.type) {
            case 'attack': {
                const damage = Math.max(1, user.attack + this.power - target.defense);
                const actualDamage = target.takeDamage(damage);
                result.message = `${user.name} used ${this.name}! ${target.name} took ${actualDamage} damage.`;
                result.damage = actualDamage;
                break;
            }
            case 'heal': {
                user.heal(this.power);
                result.message = `${user.name} used ${this.name}! Restored ${this.power} HP.`;
                result.healing = this.power;
                break;
            }
            case 'buff': {
                result.message = `${user.name} used ${this.name}!`;
                break;
            }
            case 'debuff': {
                result.message = `${user.name} used ${this.name}! ${target.name} is affected.`;
                break;
            }
        }

        this.cooldown = this.maxCooldown;
        return result;
    }

    reduceCooldown() {
        if (this.cooldown > 0) {
            this.cooldown--;
        }
    }
}

class BattleAction {
    constructor(entity, actionType, target = null, ability = null) {
        this.entity = entity;
        this.actionType = actionType;
        this.target = target;
        this.ability = ability;
        this.priority = this.calculatePriority();
    }

    calculatePriority() {
        switch (this.actionType) {
            case 'attack':
                return this.entity.speed + 10;
            case 'ability':
                return this.entity.speed + 5;
            case 'defend':
                return this.entity.speed + 15;
            case 'escape':
                return this.entity.speed;
            default:
                return 0;
        }
    }
}

class Battle {
    constructor(player, enemy, battleId = 'battle') {
        this.id = battleId;
        this.player = player;
        this.enemy = enemy;
        this.currentTurn = 1;
        this.battleLog = [`${this.enemy.name} enters the fight!`];
        this.isActive = true;
        this.winner = null;
        this.actions = [];
        this.shiftActive = false;
        this.player.baseDefense = this.player.defense;
        this.enemy.baseDefense = this.enemy.defense;
    }

    addAction(action) {
        this.actions.push(action);
    }

    performPlayerAction(actionType) {
        if (!this.isActive) return false;

        let message = '';
        switch (actionType) {
            case 'attack': {
                const damage = Math.max(1, this.player.attack + 4 - this.enemy.defense);
                const actualDamage = this.enemy.takeDamage(damage);
                message = `${this.player.name} strikes ${this.enemy.name} for ${actualDamage} damage.`;
                break;
            }
            case 'ability': {
                const healAbility = this.player.abilities.find(a => a.type === 'heal');
                if (healAbility) {
                    healAbility.use(this.player, this.player);
                    message = `${this.player.name} uses ${healAbility.name} and restores health.`;
                } else {
                    const damage = Math.max(1, this.player.attack + 8 - this.enemy.defense);
                    const actualDamage = this.enemy.takeDamage(damage);
                    message = `${this.player.name} unleashes a strong attack for ${actualDamage} damage.`;
                }
                break;
            }
            case 'defend': {
                this.player.defense = this.player.baseDefense + 5;
                message = `${this.player.name} braces for impact and gains extra defense.`;
                break;
            }
            case 'escape': {
                const escaped = Math.random() < 0.45;
                if (escaped) {
                    this.isActive = false;
                    this.winner = this.player;
                    message = `${this.player.name} escapes the fight!`;
                    this.battleLog.push(message);
                    return true;
                }
                message = `${this.player.name} fails to escape.`;
                break;
            }
            default:
                message = 'You hesitate.';
        }

        this.battleLog.push(message);

        if (!this.enemy.isAlive()) {
            this.isActive = false;
            this.winner = this.player;
            this.battleLog.push(`${this.enemy.name} is defeated!`);
            return true;
        }

        this.enemyTurn();

        if (!this.player.isAlive()) {
            this.isActive = false;
            this.winner = this.enemy;
            this.battleLog.push(`${this.player.name} has fallen.`);
        }

        this.currentTurn += 1;
        this.player.defense = this.player.baseDefense;
        return true;
    }

    enemyTurn() {
        if (!this.isActive) return;

        const damage = Math.max(1, this.enemy.attack - this.player.defense);
        const actualDamage = this.player.takeDamage(damage);
        this.battleLog.push(`${this.enemy.name} attacks for ${actualDamage} damage.`);
    }

    executeTurn() {
        if (!this.isActive) return;
        this.actions.sort((a, b) => b.priority - a.priority);

        for (const action of this.actions) {
            if (!action.entity.isAlive()) continue;
            let logEntry = {};

            switch (action.actionType) {
                case 'attack':
                    logEntry = this.executeAttack(action.entity, action.target);
                    break;
                case 'ability':
                    logEntry = this.executeAbility(action.entity, action.target, action.ability);
                    break;
                case 'defend':
                    logEntry = this.executeDefend(action.entity);
                    break;
                case 'escape':
                    logEntry = this.executeEscape(action.entity);
                    break;
            }

            this.battleLog.push(logEntry.message || 'The battle continues.');
        }

        this.currentTurn += 1;
        this.actions = [];

        if (!this.player.isAlive()) {
            this.isActive = false;
            this.winner = this.enemy;
        } else if (!this.enemy.isAlive()) {
            this.isActive = false;
            this.winner = this.player;
        }

        this.applyStatusEffects();
    }

    executeAttack(attacker, defender) {
        const damage = Math.max(1, attacker.attack - defender.defense);
        const actualDamage = defender.takeDamage(damage);
        return {
            turn: this.currentTurn,
            attacker: attacker.name,
            action: 'Attack',
            target: defender.name,
            damage: actualDamage,
            message: `${attacker.name} attacks ${defender.name} for ${actualDamage} damage!`
        };
    }

    executeAbility(user, target, ability) {
        const result = ability.use(user, target);
        return {
            turn: this.currentTurn,
            user: user.name,
            action: ability.name,
            target: target.name,
            success: result.success,
            message: result.message
        };
    }

    executeDefend(defender) {
        defender.defense += 5;
        return {
            turn: this.currentTurn,
            defender: defender.name,
            action: 'Defend',
            message: `${defender.name} takes a defensive stance!`
        };
    }

    executeEscape(escaper) {
        const escapeChance = escaper.speed * 0.1;
        const escaped = Math.random() < escapeChance;
        if (escaped) {
            this.isActive = false;
            return {
                turn: this.currentTurn,
                escaper: escaper.name,
                action: 'Escape',
                success: true,
                message: `${escaper.name} escaped!`
            };
        }

        return {
            turn: this.currentTurn,
            escaper: escaper.name,
            action: 'Escape',
            success: false,
            message: `${escaper.name} failed to escape!`
        };
    }

    applyStatusEffects() {
        for (const entity of [this.player, this.enemy]) {
            for (const status of entity.status) {
                if (status.type === 'poison') {
                    const damage = entity.takeDamage(status.power);
                    this.battleLog.push({
                        turn: this.currentTurn,
                        target: entity.name,
                        status: 'Poison',
                        damage,
                        message: `${entity.name} is damaged by poison!`
                    });
                }
                status.duration--;
                if (status.duration <= 0) {
                    entity.removeStatus(status.type);
                }
            }
        }
    }

    render(ctx) {
        ctx.fillStyle = '#110b18';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Battle', 50, 60);

        this.drawHealthBar(ctx, 50, 90, 300, 22, this.player.currentHealth, this.player.maxHealth, '#4ddc7f');
        this.drawHealthBar(ctx, 930, 90, 300, 22, this.enemy.currentHealth, this.enemy.maxHealth, '#d9534f');

        ctx.font = '18px Arial';
        ctx.fillText(this.player.name, 50, 80);
        ctx.fillText(this.enemy.name, 930, 80);

        ctx.fillStyle = '#cfd8dc';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        const logLines = this.battleLog.slice(-6);
        for (let i = 0; i < logLines.length; i++) {
            const text = typeof logLines[i] === 'string' ? logLines[i] : logLines[i].message;
            ctx.fillText(text, 50, 170 + i * 24);
        }

        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';
        ctx.font = '18px Arial';
        ctx.fillText('Controls: 1 Attack  2 Ability  3 Defend  4 Escape', 50, 670);
    }

    drawHealthBar(ctx, x, y, width, height, current, max, color) {
        ctx.fillStyle = '#2d2d2d';
        ctx.fillRect(x, y, width, height);

        const percent = Math.max(0, Math.min(1, current / max));
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width * percent, height);

        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(x, y, width, height);

        ctx.font = '14px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText(`${current}/${max}`, x + width / 2, y + height - 6);
    }

    getBattleState() {
        return {
            turn: this.currentTurn,
            isActive: this.isActive,
            player: this.player.getStats(),
            enemy: this.enemy.getStats(),
            winner: this.winner ? this.winner.name : null,
            lastActions: this.battleLog.slice(-3)
        };
    }

    getBattleLog() {
        return this.battleLog;
    }

    isComplete() {
        return !this.isActive;
    }
}

class BattleManager {
    constructor() {
        this.currentBattle = null;
        this.battleHistory = [];
        this.listeners = [];
    }

    startBattle(player, enemy, battleId = 'battle') {
        this.currentBattle = new Battle(player, enemy, battleId);
        return this.currentBattle;
    }

    getCurrentBattle() {
        return this.currentBattle;
    }

    endBattle() {
        if (this.currentBattle) {
            this.battleHistory.push(this.currentBattle);
            const result = this.currentBattle.isActive ? null : this.currentBattle.winner;
            this.currentBattle = null;
            return result;
        }
        return null;
    }

    addListener(callback) {
        this.listeners.push(callback);
    }

    notifyListeners(event, data) {
        this.listeners.forEach(callback => callback(event, data));
    }

    getBattleHistory() {
        return this.battleHistory;
    }
}

const ENEMIES = {
    SHADOW_CREATURE: {
        id: 'shadow_creature',
        name: 'Shadow Creature',
        maxHealth: 50,
        attack: 8,
        defense: 3,
        speed: 5
    },
    MORROW: {
        id: 'morrow',
        name: 'Morrow',
        maxHealth: 150,
        attack: 15,
        defense: 8,
        speed: 10
    },
    FALLEN_KNIGHT: {
        id: 'fallen_knight',
        name: 'Fallen Knight',
        maxHealth: 200,
        attack: 20,
        defense: 12,
        speed: 8
    }
};

const ABILITIES = {
    BASIC_ATTACK: new Ability('basic_attack', 'Attack', 'A basic physical attack', 0, 5, 'attack'),
    POWER_STRIKE: new Ability('power_strike', 'Power Strike', 'A devastating attack', 0, 15, 'attack'),
    HEAL: new Ability('heal', 'Heal', 'Restore health', 0, 30, 'heal'),
    SHADOW_BOLT: new Ability('shadow_bolt', 'Shadow Bolt', 'Strikes with shadow energy', 0, 12, 'attack'),
    DEFEND: new Ability('defend', 'Defend', 'Increase defense', 0, 0, 'buff')
};

const Battle_System = {
    BattleEntity,
    Ability,
    BattleAction,
    Battle,
    BattleManager,
    ENEMIES,
    ABILITIES
};
