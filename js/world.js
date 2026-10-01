// World Class - Manages rooms, NPCs, and environment
class World {
    constructor() {
        this.currentRoom = 'outskirts';
        this.rooms = {};
        this.npcs = [];
        this.objects = [];
        this.triggers = [];
        this.shiftState = false;
        this.initRooms();
        this.initNpcs();
        this.initObjects();
        this.triggeredBoss = null;
    }

    initRooms() {
        // The Outskirts - peaceful starting area
        this.rooms.outskirts = {
            name: 'The Outskirts',
            width: 2560,
            height: 1440,
            tileSize: 32,
            backgroundColor: '#2a5a3a',
            collisionMap: this.generateOutskirtsCollisions(),
            shiftedBackgroundColor: '#1a1a2a',
            description: 'A quiet forest path with dirt roads and scattered houses.'
        };

        // Morrow's Wonderland - circus area
        this.rooms.morrowsWonderland = {
            name: 'Morrow\'s Wonderland',
            width: 2560,
            height: 1440,
            tileSize: 32,
            backgroundColor: '#3a1a0a',
            collisionMap: this.generateCircusCollisions(),
            shiftedBackgroundColor: '#0a0a0a',
            description: 'An eerie abandoned circus with faded tents and distant music.'
        };

        // Fallen Knight's domain
        this.rooms.fallenKnightDomain = {
            name: 'The Sacred Grounds',
            width: 2560,
            height: 1440,
            tileSize: 32,
            backgroundColor: '#2a3a5a',
            collisionMap: this.generateKnightCollisions(),
            shiftedBackgroundColor: '#1a0a1a',
            description: 'Abandoned temple grounds with ancient stone structures.'
        };
    }

    generateOutskirtsCollisions() {
        // Create a simple collision map for the Outskirts
        const map = new Array(45).fill(null).map(() => new Array(80).fill(0));
        
        // Add some walls/trees
        for (let i = 0; i < map.length; i++) {
            for (let j = 0; j < map[i].length; j++) {
                // Create some random obstacles
                if (Math.random() < 0.05 && (i > 5 && i < 40 && j > 5 && j < 75)) {
                    map[i][j] = 1;
                }
            }
        }
        return map;
    }

    generateCircusCollisions() {
        const map = new Array(45).fill(null).map(() => new Array(80).fill(0));
        // Circus tents and structures create walls
        for (let i = 10; i < 35; i++) {
            for (let j = 10; j < 70; j++) {
                if (Math.random() < 0.08) {
                    map[i][j] = 1;
                }
            }
        }
        return map;
    }

    generateKnightCollisions() {
        const map = new Array(45).fill(null).map(() => new Array(80).fill(0));
        // Stone temple structures
        for (let i = 15; i < 30; i++) {
            for (let j = 20; j < 60; j++) {
                if (Math.random() < 0.06) {
                    map[i][j] = 1;
                }
            }
        }
        return map;
    }

    initNpcs() {
        this.npcs = [
            new NPC('elder', 300, 300, 'The Elder', 'outskirts', false),
            new NPC('traveler', 600, 400, 'A Traveler', 'outskirts', false),
            new NPC('child', 400, 500, 'A Child', 'outskirts', false),
            new NPC('morrow', 720, 420, 'Morrow', 'morrowsWonderland', true),
            new NPC('fallenKnight', 740, 430, 'Fallen Knight', 'fallenKnightDomain', true),
        ];
    }

    initObjects() {
        this.objects = [
            { id: 'sign1', x: 200, y: 200, width: 32, height: 32, type: 'sign', text: 'You are at the edge of the Outskirts.' },
            { id: 'tree1', x: 800, y: 600, width: 64, height: 64, type: 'tree', solid: true },
            { id: 'pond1', x: 1000, y: 800, width: 128, height: 96, type: 'pond', text: 'A quiet pond. The water seems normal... for now.' },
        ];
    }

    checkCollision(x, y, width, height) {
        const room = this.rooms[this.currentRoom];
        if (!room) return false;

        // Convert pixel coords to tile coords
        const startTile = Math.floor(x / room.tileSize);
        const endTile = Math.floor((x + width) / room.tileSize);
        const startRow = Math.floor(y / room.tileSize);
        const endRow = Math.floor((y + height) / room.tileSize);

        for (let i = startRow; i <= endRow; i++) {
            for (let j = startTile; j <= endTile; j++) {
                if (room.collisionMap[i] && room.collisionMap[i][j] === 1) {
                    return true;
                }
            }
        }

        // Check solid objects
        for (let obj of this.objects) {
            if (obj.solid && this.objectsIntersect(x, y, width, height, obj.x, obj.y, obj.width, obj.height)) {
                return true;
            }
        }

        return false;
    }

    objectsIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
    }

    getNearbyInteractable(player) {
        const interactionRadius = 64;

        // Check NPCs
        for (let npc of this.npcs) {
            if (npc.room === this.currentRoom) {
                const dist = Math.hypot(player.x - npc.x, player.y - npc.y);
                if (dist < interactionRadius) {
                    return npc;
                }
            }
        }

        // Check objects
        for (let obj of this.objects) {
            if (obj.text) {
                const dist = Math.hypot(player.x - obj.x, player.y - obj.y);
                if (dist < interactionRadius) {
                    return obj;
                }
            }
        }

        return null;
    }

    checkBattleTrigger(player) {
        // Check if player is near a boss NPC
        for (let npc of this.npcs) {
            if (npc.isBoss && npc.room === this.currentRoom) {
                const dist = Math.hypot(player.x - npc.x, player.y - npc.y);
                if (dist < 40) {
                    if (npc.id === 'morrow' && !player.morrowDefeated) {
                        this.triggeredBoss = {
                            id: 'morrow',
                            name: 'Morrow',
                            maxHealth: 90,
                            attack: 12,
                            defense: 4,
                            speed: 8
                        };
                        return true;
                    }
                    if (npc.id === 'fallenKnight' && !player.fallenKnightDefeated) {
                        this.triggeredBoss = {
                            id: 'fallenKnight',
                            name: 'Fallen Knight',
                            maxHealth: 130,
                            attack: 16,
                            defense: 6,
                            speed: 7
                        };
                        return true;
                    }
                }
            }
        }
        return false;
    }

    update(player, shiftActive) {
        this.shiftState = shiftActive;
        
        // Update NPCs
        for (let npc of this.npcs) {
            if (npc.room === this.currentRoom) {
                npc.update();
            }
        }
    }

    updateForShift(isShifted, room) {
        // World changes based on SHIFT state
        // This affects NPC dialogue, environment, and secrets
        this.shiftState = isShifted;
    }

    onBattleComplete() {
        // Update world state after battle
        if (this.triggeredBoss && this.triggeredBoss.id === 'morrow') {
            window.game.player.morrowDefeated = true;
        }
        if (this.triggeredBoss && this.triggeredBoss.id === 'fallenKnight') {
            window.game.player.fallenKnightDefeated = true;
        }
        this.triggeredBoss = null;
    }

    render(ctx, player, shiftActive) {
        const room = this.rooms[this.currentRoom];
        if (!room) return;

        // Background
        ctx.fillStyle = shiftActive ? room.shiftedBackgroundColor : room.backgroundColor;
        ctx.fillRect(0, 0, 1280, 720);

        // Draw grid for debugging (can be removed)
        ctx.strokeStyle = shiftActive ? '#1a1a3a' : '#1a3a1a';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 1280; i += 32) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 720);
            ctx.stroke();
        }
        for (let i = 0; i <= 720; i += 32) {
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(1280, i);
            ctx.stroke();
        }

        // Draw objects
        ctx.fillStyle = '#555';
        for (let obj of this.objects) {
            if (obj.type === 'tree') {
                ctx.fillStyle = shiftActive ? '#2a2a1a' : '#4a6a3a';
                ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
            } else if (obj.type === 'sign') {
                ctx.fillStyle = '#8b4513';
                ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
                ctx.fillStyle = '#fff';
                ctx.font = '8px Arial';
                ctx.fillText('!', obj.x + 12, obj.y + 20);
            } else if (obj.type === 'pond') {
                ctx.fillStyle = shiftActive ? '#1a1a4a' : '#3a5a7a';
                ctx.beginPath();
                ctx.ellipse(obj.x + obj.width / 2, obj.y + obj.height / 2, obj.width / 2, obj.height / 2, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw NPCs
        for (let npc of this.npcs) {
            if (npc.room === this.currentRoom) {
                npc.render(ctx, shiftActive);
            }
        }
    }
}

// Room Class - Manages individual room properties
class Room {
    constructor(id, name, description, x, y) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.x = x;
        this.y = y;
        this.objects = {};
        this.npcs = [];
        this.exits = {};
        this.visited = false;
        this.ambient = null;
        this.properties = {};
    }

    addObject(id, obj) {
        this.objects[id] = obj;
    }

    removeObject(id) {
        delete this.objects[id];
    }

    getObject(id) {
        return this.objects[id] || null;
    }

    addNPC(npc) {
        this.npcs.push(npc);
    }

    removeNPC(npcId) {
        this.npcs = this.npcs.filter(npc => npc.id !== npcId);
    }

    getNPCs() {
        return this.npcs;
    }

    addExit(direction, targetRoomId) {
        this.exits[direction] = targetRoomId;
    }

    getExit(direction) {
        return this.exits[direction] || null;
    }

    getAllExits() {
        return this.exits;
    }

    setVisited() {
        this.visited = true;
    }

    setAmbient(ambientId) {
        this.ambient = ambientId;
    }

    setProperty(key, value) {
        this.properties[key] = value;
    }

    getProperty(key) {
        return this.properties[key] || null;
    }

    getDescription(shiftActive = false) {
        if (shiftActive && this.properties['shifted_description']) {
            return this.properties['shifted_description'];
        }
        return this.description;
    }

    getStatus() {
        return {
            id: this.id,
            name: this.name,
            visited: this.visited,
            objectCount: Object.keys(this.objects).length,
            npcCount: this.npcs.length,
            exits: Object.keys(this.exits)
        };
    }
}

// WorldObject Class - Represents interactive objects in the world
class WorldObject {
    constructor(id, name, description) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.interactable = true;
        this.discoverable = false;
        this.shiftRevealed = false;
        this.usedWith = [];
        this.properties = {};
    }

    interact(player) {
        return {
            success: true,
            message: `You interact with the ${this.name}.`
        };
    }

    examine(shiftActive = false) {
        if (shiftActive && this.shiftRevealed) {
            return `${this.name}: ${this.description} (Something is hidden here...)`;
        }
        return `${this.name}: ${this.description}`;
    }

    revealOnShift() {
        this.shiftRevealed = true;
    }

    setProperty(key, value) {
        this.properties[key] = value;
    }

    getProperty(key) {
        return this.properties[key] || null;
    }
}

// NPC Class
class NPC {
    constructor(id, x, y, name, room, isBoss) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.name = name;
        this.room = room;
        this.isBoss = isBoss;
        this.width = 32;
        this.height = 48;
        this.animationFrame = 0;
        this.animationCounter = 0;
        this.dialogue = this.initDialogue();
    }

    initDialogue() {
        const dialogues = {
            elder: {
                normal: ['The Elder: I have seen many strange things in these woods...', 'The Elder: There is something odd about the circus grounds to the north.'],
                shifted: ['The Elder: ...why do you keep asking?', 'The Elder: There is nothing here. Only silence.']
            },
            traveler: {
                normal: ['A Traveler: Passing through, are you?', 'A Traveler: I would avoid the circus grounds. Strange sounds come from there at night.'],
                shifted: ['A Traveler: ...you\'re still here?', 'A Traveler: Everyone leaves eventually.']
            },
            child: {
                normal: ['A Child: Hello!', 'A Child: Have you seen the pretty lights? They come from far away...'],
                shifted: ['A Child: ...', 'A Child: Are you real?']
            }
        };
        return dialogues[this.id] || { normal: [], shifted: [] };
    }

    update() {
        this.animationCounter++;
        if (this.animationCounter >= 10) {
            this.animationCounter = 0;
            this.animationFrame = (this.animationFrame + 1) % 2;
        }
    }

    render(ctx, shiftActive) {
        const dialogueSet = shiftActive ? this.dialogue.shifted : this.dialogue.normal;
        
        // Draw NPC as simple colored box
        ctx.fillStyle = this.isBoss ? '#cc0000' : '#4a7a9a';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Name label
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.fillText(this.name, this.x, this.y - 5);

        // Interaction indicator
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(this.x + this.width + 5, this.y + 5 + (this.animationFrame * 2), 4, 4);
    }
}

// Predefined world objects
const WORLD_OBJECTS = {
    LOCKED_DOOR: {
        id: 'locked_door',
        name: 'Locked Door',
        description: 'A heavy wooden door. It is locked.',
        shiftDescription: 'The door seems to breathe. It feels... alive.'
    },
    DUSTY_SHELF: {
        id: 'dusty_shelf',
        name: 'Dusty Shelf',
        description: 'An old shelf covered in dust. Something might be hidden here.',
        shiftDescription: 'The shelf glows faintly. Behind the dust, you see symbols.'
    },
    PORTRAIT: {
        id: 'portrait',
        name: 'Portrait',
        description: 'An old painting of someone. Their eyes follow you.',
        shiftDescription: 'The portrait writhes. The figure\'s mouth opens in a silent scream.'
    },
    MIRROR: {
        id: 'mirror',
        name: 'Mirror',
        description: 'A dusty mirror. You see your reflection.',
        shiftDescription: 'Your reflection doesn\'t move with you. It smiles.'
    },
    DOOR: {
        id: 'door',
        name: 'Door',
        description: 'A door leading elsewhere.'
    }
};
