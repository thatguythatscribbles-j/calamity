// Interaction System
class Interaction {
    constructor() {
        this.interactableObjects = [];
        this.interactionRadius = 64;
        this.lastInteraction = null;
    }

    registerInteractable(object) {
        this.interactableObjects.push(object);
    }

    findNearbyInteractables(player, world) {
        const nearby = [];
        
        // Check NPCs
        for (let npc of world.npcs) {
            if (npc.room === world.currentRoom) {
                const dist = Math.hypot(player.x - npc.x, player.y - npc.y);
                if (dist < this.interactionRadius) {
                    nearby.push({ type: 'npc', entity: npc, distance: dist });
                }
            }
        }

        // Check objects
        for (let obj of world.objects) {
            if (obj.type !== 'tree' || obj.text) {
                const dist = Math.hypot(player.x - obj.x, player.y - obj.y);
                if (dist < this.interactionRadius) {
                    nearby.push({ type: 'object', entity: obj, distance: dist });
                }
            }
        }

        // Sort by distance (closest first)
        nearby.sort((a, b) => a.distance - b.distance);
        return nearby;
    }

    interact(player, entity, shiftActive) {
        this.lastInteraction = { player, entity, time: Date.now() };

        if (entity instanceof NPC) {
            return this.interactWithNpc(player, entity, shiftActive);
        } else if (entity.type === 'object' || entity.text) {
            return this.interactWithObject(player, entity, shiftActive);
        }
    }

    interactWithNpc(player, npc, shiftActive) {
        player.talkToNpc(npc.id);
        
        // NPCs remember previous interactions
        const conversationCount = player.getConversationCount(npc.id);
        
        // Check if dialogue changes based on conversation count
        let dialogue;
        if (conversationCount === 1) {
            dialogue = shiftActive ? npc.dialogue.shifted : npc.dialogue.normal;
        } else if (conversationCount > 1) {
            // Repeat dialogue or show acknowledgment
            dialogue = shiftActive ? npc.dialogue.shifted : npc.dialogue.normal;
        }

        return {
            type: 'dialogue',
            content: dialogue,
            speaker: npc.name
        };
    }

    interactWithObject(player, object, shiftActive) {
        // Objects provide information or trigger events
        if (object.type === 'sign') {
            return {
                type: 'text',
                content: object.text,
                speaker: 'Sign'
            };
        } else if (object.type === 'pond') {
            const text = shiftActive 
                ? 'The water is still. Too still. You see something dark beneath the surface.'
                : object.text;
            return {
                type: 'text',
                content: text,
                speaker: 'Pond'
            };
        } else if (object.type === 'tree') {
            const text = shiftActive
                ? 'The tree is dead. Its branches are like skeletal fingers.'
                : 'A large tree. Birds sing in its branches.';
            return {
                type: 'text',
                content: text,
                speaker: 'Tree'
            };
        }

        return null;
    }

    canInteract(player, world) {
        const nearby = this.findNearbyInteractables(player, world);
        return nearby.length > 0 ? nearby[0].entity : null;
    }
}
