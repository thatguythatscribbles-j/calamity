// Player Class - Parralexs
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 48;

        // Character traits
        this.name = 'Parralexs';
        this.maxHp = 20;
        this.hp = this.maxHp;
        this.sp = 10; // Special points for ACT abilities

        // Movement
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 5;
        this.isMoving = false;
        this.direction = 'down'; // up, down, left, right

        // Animation
        this.animationFrame = 0;
        this.animationCounter = 0;
        this.animationSpeed = 6;

        // Inventory
        this.inventory = [];
        this.equipment = {
            weapon: null,
            armor: null
        };

        // Story flags
        this.hasMetMorrow = false;
        this.hasMetFallenKnight = false;
        this.morrowDefeated = false;
        this.fallenKnightDefeated = false;
        this.shiftUnlocked = true; // Player always has shift

        // Dialogue tracking
        this.talkedToNpcs = {};
    }

    move(dx, dy, world) {
        const newX = this.x + dx;
        const newY = this.y + dy;

        // Check collisions with world
        if (!world.checkCollision(newX, newY, this.width, this.height)) {
            this.x = newX;
            this.y = newY;

            // Update direction based on movement
            if (Math.abs(dx) > Math.abs(dy)) {
                this.direction = dx > 0 ? 'right' : 'left';
            } else if (dy !== 0) {
                this.direction = dy > 0 ? 'down' : 'up';
            }
        }

        this.updateAnimation();
    }

    updateAnimation() {
        this.animationCounter++;
        if (this.animationCounter >= this.animationSpeed) {
            this.animationCounter = 0;
            this.animationFrame = (this.animationFrame + 1) % 4;
        }
    }

    render(ctx) {
        // Draw Parralexs with restrained idle animation
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // Body - dark silhouette
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(-16, -20, 32, 32);

        // Cape
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-18, -18, 36, 28);

        // Hood/Head
        ctx.fillStyle = '#0a0a0a';
        ctx.beginPath();
        ctx.arc(0, -22, 8, 0, Math.PI * 2);
        ctx.fill();

        // Red scarf (subtle movement)
        ctx.fillStyle = '#cc0000';
        const scarfOscillate = Math.sin(this.animationCounter / this.animationSpeed * Math.PI * 2) * 2;
        ctx.fillRect(-16, -20 + scarfOscillate, 32, 4);

        // Arms - restrained movement
        ctx.fillStyle = '#2a2a2a';
        const armBend = Math.sin(this.animationCounter / this.animationSpeed * Math.PI * 2) * 2;
        
        // Left arm
        ctx.fillRect(-18, -12 + armBend, 4, 16);
        // Right arm
        ctx.fillRect(14, -12 + armBend, 4, 16);

        // Legs (subtle swaying)
        ctx.fillStyle = '#1a1a1a';
        const legSway = Math.sin(this.animationCounter / this.animationSpeed * Math.PI * 2) * 1;
        ctx.fillRect(-8 + legSway, 8, 6, 12);
        ctx.fillRect(2 + legSway, 8, 6, 12);

        ctx.restore();
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
        return this.hp <= 0; // Returns true if dead
    }

    heal(amount) {
        this.hp += amount;
        if (this.hp > this.maxHp) this.hp = this.maxHp;
    }

    addItem(item) {
        this.inventory.push(item);
    }

    removeItem(item) {
        const index = this.inventory.indexOf(item);
        if (index > -1) {
            this.inventory.splice(index, 1);
        }
    }

    talkToNpc(npcId) {
        if (!this.talkedToNpcs[npcId]) {
            this.talkedToNpcs[npcId] = 1;
        } else {
            this.talkedToNpcs[npcId]++;
        }
    }

    hasSpokenTo(npcId) {
        return this.talkedToNpcs[npcId] > 0;
    }

    getConversationCount(npcId) {
        return this.talkedToNpcs[npcId] || 0;
    }

    reset() {
        this.hp = this.maxHp;
        this.sp = 10;
    }
}
