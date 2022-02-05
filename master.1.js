load_code('codecostmeter');
require_code('general');

const codeToRun = 'master';
const farmMob = 'xscorpion'

ripLoop();
lootLoop();
regenLoop();
moveLoop();

//------------------------
// Loot Loop
//------------------------
async function lootLoop() {
    try {
		if (character.rip) {
			setTimeout(async () => { lootLoop() }, 100);
            return;
		}
		
		loot()
    }
	catch (e) {
            console.log ("Error Encountered in lootLoop()");
            console.error(e)
            }
	setTimeout(async () => { lootLoop() }, 100);
}

//-------------------------------------------
// Death Loop
//-------------------------------------------
async function ripLoop() {
	try {
		if (character.rip)
			respawn()
	}
	catch (e) {
		console.log ("Error Encountered ripLoop()");
		console.error(e)
	}	
	setTimeout(async () => { ripLoop() }, 10000);
}

//-------------------------------------------
// Regen Loop
//-------------------------------------------
async function regenLoop() {
    try {
        const hpRatio = character.hp / character.max_hp
        const hpMissing = character.max_hp - character.hp
        const mpRatio = character.mp / character.max_mp
        const mpMissing = character.max_mp - character.mp

        if (character.rip) {
            // Don't heal if we're dead
            setTimeout(async () => { regenLoop() }, Math.max(100, ms_to_next_skill("use_hp")))
            return;
        }

        const hpot1 = locate_item("hpot1")
        const hpot1Recovery = G.items.hpot1.gives[0][1]
        const mpot1 = locate_item("mpot1")
        const mpot1Recovery = G.items.hpot1.gives[0][1]

        if (hpot1 != -1 && mpMissing >= mpot1Recovery && mpRatio < hpRatio && can_use("use_hp")) {
            // We have an MP pot to use
            await use_skill("use_mp")
            reduce_cooldown("use_hp", Math.min(...parent.pings))
        } else if (mpot1 != -1 && hpMissing >= hpot1Recovery && can_use("use_hp")) {
            // We have an HP pot to use
            await use_skill("use_hp")
            reduce_cooldown("use_hp", Math.min(...parent.pings))
        } else if (mpRatio < hpRatio && can_use("use_hp")) {
            // We have less MP than HP, so let's regen some MP.
            await use_skill("regen_mp")
            reduce_cooldown("use_hp", Math.min(...parent.pings))
        } else if (hpRatio !== 1 && can_use("use_hp")) {
            // We have less HP than MP, so let's regen some HP.
            await use_skill("regen_hp")
            reduce_cooldown("use_hp", Math.min(...parent.pings))
        }
    } catch (e) {
        console.error(e)
    }
    setTimeout(async () => { regenLoop() }, Math.max(100, ms_to_next_skill("use_hp")))
}

//-------------------------------------------
// Movement Loop
//-------------------------------------------
async function moveLoop() {
    try {
        if (character.rip) {
			setTimeout(async () => { moveLoop() }, 250);
            return;
		}
		//------------------------
        // Event Logic
		//------------------------
        for (const key in parent.S) {
            const data = parent.S[key];
            if (!data.live) { continue; }
            if (key == 'dragold' || key == 'icegolem') { continue; }
            // exclude special event, like 'halloween', or 'egghunt'
            // they are not monster hunts, and require diff logic
            if(typeof data !== "object")  // special events are string type
                continue 
            
            set_message("Move E: " + key);
            target = getTarget(key);
            if(!target){
                log(data.map + " " + data.x + " " + data.y)
                await smart_move({map:data.map, x:data.x, y:data.y})
            }
            else {
                move(target.x, target.y -100);
            }
            setTimeout(async () => { moveLoop() }, 250);
            return;
        }
        //------------------------
		// Monster Hunt Logic
		//------------------------
        if (allowMonsterHunt) {
            if(!character.s.monsterhunt) {
                await (smart_move('monsterhunter'));
				parent.socket.emit("monsterhunt");
				mhTarget = character.s.monsterhunt.id;
				mhCount = character.s.monsterhunt.c;
				log ("Monster Hunt Accepted");
				log ("Target: " + mhTarget + " (" + mhCount + ")");
				return;
            }
			else {
				mhTarget = character.s.monsterhunt.id;
				mhCount = character.s.monsterhunt.c;
				log ("Starting Monster Hunt");
				log ("Target: " + mhTarget + " (" + mhCount + ")");
				await smart_move(mhTarget);
				return;
			}
        }
		//------------------------
		//Farm Logic
		//------------------------
		if (moveMode == "farm") {
			set_message("Farm");
			
			// Move to location if we cannot target farmMob
			tar = get_nearest_monster({"type": farmMob})
			if (!tar)
				await smart_move(farmMob)
			
			// Basic Follow Tank Logic
			tank = get_player(myPartyLeader);
			me = get_player("Chasun");
			
			if (distance(tank, me) > character.range * .50) {
				set_message("Find Tank");
				[cx, cy] = [character.x, cy = character.y];
				[tx, ty] = [tank.real_x, ty = tank.real_y];
				move (
					cx+(tx-cx)+50,
					cy+(ty-cy)+50
					);
			}
		}
		
		if (moveMode == "follow") {

		}
	}
	catch (e) {
		console.log ("Error Encountered in moveLoop()");
		console.error(e)
		}
	setTimeout(async () => { moveLoop() }, 250);
}


//-------------------------------------------
// Healing Loop
//-------------------------------------------
async function healLoop() {
    try {
        if (character.rip) {
			setTimeout(async () => { healLoop() }, 100);
            return;
		}

		if (healMode == "party") {
			var topPriority;
			var current;
			var previous;
			
			// Load up party data w/ HP info.
			for (node in party) {
				partyMember = get_player(party[node].name);
				party[node].lost_hp = partyMember.max_hp - partyMember.hp;
				party[node].ratio_hp = partyMember.hp / partyMember.max_hp;
			}
			
			// Find the highest priority target
			for (node in party) {
				
				if (topPriority === undefined) {
					topPriority = node;
					
					previous = party[node];
					continue;
				}
				
				if (previous) {
					current = party[node];
					if (current.ratio_hp < previous.ratio_hp) {
						topPriority = node;
					}
					previous = current;
				}
				
			}
			
			//log ("Priorty: " + party[topPriority].name);
			
			// Finally, if the top priority heal target
			// has lost at least healThresholdRaw hp
			// then they get a heal
			if (party[topPriority].lost_hp > healThresholdRaw) {
				healtarget = get_player(party[topPriority].name);
				change_target(healtarget);
				await heal(healtarget);
				reduce_cooldown("heal", Math.min(parent.pings));
			}
		}
	}
	catch (e) {
		console.log ("Error Encountered in healLoop()");
		console.error(e)
		}
	setTimeout(async () => { healLoop() }, Math.max(1, ms_to_next_skill("heal")));
}