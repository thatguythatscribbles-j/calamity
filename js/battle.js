// Battle and Combat System
class BattleEntity {
    constructor(id, name, maxHealth, attack, defense, speed) {
        this.id = id;
        this.name = name;
        this.maxHealth = maxHealth;
        this.currentHealth = maxHealth;
        this.attack = attack;
        this.defense = defense;
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
        this.type = type; // 'attack', 'heal', 'buff', 'debuff'
        this.cooldown = 0;
        this.maxCooldown = 0;
    }

    use(user, target) {
        if (this.cooldown > 0) {
            return { success: false, message: `${this.name} is on cooldown for ${this.cooldown} more turns.` };
        }

        let result = { success: true, message: '' };

        switch (this.type) {
            case 'attack':
                const damage = Math.max(1, user.attack + this.power - target.defense);
                const actualDamage = target.takeDamage(damage);
                result.message = `${user.name} used ${this.name}! ${target.name} took ${actualDamage} damage.`;
                result.damage = actualDamage;
                break;
            case 'heal':
                user.heal(this.power);
                result.message = `${user.name} used ${this.name}! Restored ${this.power} HP.`;
                result.healing = this.power;
                break;
            case 'buff':
                result.message = `${user.name} used ${this.name}!`;
                break;
            case 'debuff':
                result.message = `${user.name} used ${this.name}! ${target.name} is affected.`;
                break;
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
        this.actionType = actionType; // 'attack', 'ability', 'defend', 'escape'
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
        this.currentTurn = 0;
        this.battleLog = [];
        this.isActive = true;
        this.winner = null;
        this.actions = [];
        this.shiftActive = false;
    }

    addAction(action) {
        this.actions.push(action);
    }

    executeTurn() {
        if (!this.isActive) return;

        // Sort actions by priority
        this.actions.sort((a, b) => b.priority - a.priority);

        // Execute actions
        for (let action of this.actions) {
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

            this.battleLog.push(logEntry);
        }

        this.currentTurn++;
        this.actions = [];

        // Check for battle end
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
        } else {
            return {
                turn: this.currentTurn,
                escaper: escaper.name,
                action: 'Escape',
                success: false,
                message: `${escaper.name} failed to escape!`
            };
        }
    }

    applyStatusEffects() {
        for (let entity of [this.player, this.enemy]) {
            for (let status of entity.status) {
                if (status.type === 'poison') {
                    const damage = entity.takeDamage(status.power);
                    this.battleLog.push({
                        turn: this.currentTurn,
                        target: entity.name,
                        status: 'Poison',
                        damage: damage,
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

// Predefined enemies
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

// Predefined abilities
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
