// Input and Control System
class InputManager {
    constructor() {
        this.keys = {};
        this.keybinds = {
            moveUp: ['w', 'arrowup'],
            moveDown: ['s', 'arrowdown'],
            moveLeft: ['a', 'arrowleft'],
            moveRight: ['d', 'arrowright'],
            interact: ['e'],
            inventory: ['i'],
            questLog: ['q'],
            pause: ['escape'],
            shift: ['shift'],
            sprint: ['control']
        };
        this.listeners = {};
        this.mouse = {
            x: 0,
            y: 0,
            pressed: false,
            justPressed: false
        };
        this.bindGlobalEvents();
    }

    bindGlobalEvents() {
        window.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();
            this.keys[key] = true;
            this.triggerAction(key, true);

            if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
                event.preventDefault();
            }
        });

        window.addEventListener('keyup', (event) => {
            const key = event.key.toLowerCase();
            this.keys[key] = false;
            this.triggerAction(key, false);
        });

        window.addEventListener('mousemove', (event) => {
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
        });

        window.addEventListener('mousedown', () => {
            this.mouse.pressed = true;
            this.mouse.justPressed = true;
        });

        window.addEventListener('mouseup', () => {
            this.mouse.pressed = false;
        });
    }

    bindAction(action, callback) {
        this.listeners[action] = callback;
    }

    triggerAction(key, isDown) {
        const action = this.getActionForKey(key);
        if (!action || !this.listeners[action]) return;

        this.listeners[action](isDown, key);
    }

    getActionForKey(key) {
        for (const [action, keys] of Object.entries(this.keybinds)) {
            if (keys.includes(key)) {
                return action;
            }
        }
        return null;
    }

    isPressed(key) {
        return !!this.keys[key.toLowerCase()];
    }

    isActionPressed(action) {
        const binds = this.keybinds[action];
        if (!binds) return false;
        return binds.some(key => this.keys[key]);
    }

    clearJustPressed() {
        this.mouse.justPressed = false;
    }
}

class Controller {
    constructor(player, world, ui, game) {
        this.player = player;
        this.world = world;
        this.ui = ui;
        this.game = game;
        this.input = new InputManager();
        this.bindControls();
    }

    bindControls() {
        this.input.bindAction('moveUp', (isDown) => {
            if (isDown) this.player.direction = 'up';
        });

        this.input.bindAction('moveDown', (isDown) => {
            if (isDown) this.player.direction = 'down';
        });

        this.input.bindAction('moveLeft', (isDown) => {
            if (isDown) this.player.direction = 'left';
        });

        this.input.bindAction('moveRight', (isDown) => {
            if (isDown) this.player.direction = 'right';
        });

        this.input.bindAction('interact', (isDown) => {
            if (isDown && this.game) {
                this.game.interact();
            }
        });

        this.input.bindAction('inventory', (isDown) => {
            if (isDown && this.ui) {
                this.ui.menus.open('inventory');
            }
        });

        this.input.bindAction('questLog', (isDown) => {
            if (isDown && this.ui) {
                this.ui.menus.open('quests');
            }
        });

        this.input.bindAction('pause', (isDown) => {
            if (isDown && this.game) {
                this.game.togglePause();
            }
        });

        this.input.bindAction('shift', (isDown) => {
            if (isDown && this.game) {
                this.game.toggleShift();
            }
        });
    }

    update() {
        const moveX = (this.input.isActionPressed('moveRight') ? 1 : 0) - (this.input.isActionPressed('moveLeft') ? 1 : 0);
        const moveY = (this.input.isActionPressed('moveDown') ? 1 : 0) - (this.input.isActionPressed('moveUp') ? 1 : 0);

        if (moveX !== 0 || moveY !== 0) {
            const speed = this.input.isActionPressed('sprint') ? this.player.sprintSpeed || 4 : this.player.speed || 2;
            const nextX = this.player.x + (moveX * speed);
            const nextY = this.player.y + (moveY * speed);

            if (!this.world.checkCollision(nextX, this.player.y, this.player.width, this.player.height)) {
                this.player.x = nextX;
            }

            if (!this.world.checkCollision(this.player.x, nextY, this.player.width, this.player.height)) {
                this.player.y = nextY;
            }
        }

        this.input.clearJustPressed();
    }
}

const Controls = {
    InputManager,
    Controller
};
