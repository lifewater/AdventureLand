//-------------------------------------------
// Healing Loop
//-------------------------------------------

async function healLoop() {
    try {
        if (character.rip) {
			setTimeout(async () => { healLoop() }, 100);
            return;
		}

        // if your not a healer get out of here
        if (character.ctype != 'priest')
            return;

        if (states.priest.healMode == "group") {
            var topPriority;
            var current;
            var previous;
            
            // Load up party data w/ HP info.
            for (node in party) {
                partyMember = get_player(party[node].name);
                if (!partyMember){
                    party[node].lost_hp = party[node].max_hp 
                    party[node].ratio_hp = 1
                    continue;
                }
                console.log("Parsing Party Info of: " + party[node].name);
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
            if (party[topPriority].ratio_hp > states.priest.grouphealThreshold && (character.mp/character.max_mp) < .50 ) {
               await use_skill('partyheal');
               reduce_cooldown("partyheal", Math.min(parent.pings));
            }
            /*
            states.priest = { 
                active: false,
                events: false,
                monsterhunt: false,
                movement: true,
                attack: true,
                heal: true,
                movementMode: 'farm',
                attackMode: 'group', // group,solo,monsterhunt
                healMode: 'group',
                healThresholdRatio: .75,
                healThresholdRaw: 1200,
                grouphealThreshold: .50
            };*/
            if (party[topPriority].lost_hp > states.priest.healThresholdRaw) {
                    healtarget = get_player(party[topPriority].name);
                    change_target(healtarget);
                    await heal(healtarget);
                    logit("Healed " + healtarget.name);
                    reduce_cooldown("heal", Math.min(parent.pings));
            }
        }
	}
	catch (e) {
        logit (character.name + ": Error: healLoop()");
        logit (e);
	}
	setTimeout(async () => { healLoop() }, Math.max(1, ms_to_next_skill("heal")));
}

//------------------------
// Curse Loop
//------------------------

async function curseLoop() {
    try {
        if (!target){
            setTimeout(async () => { curseLoop() }, Math.max(1, ms_to_next_skill("curse")));
            return;
        }
		let ToT = get_target_of(target);
		let targethp = target.hp / target.max_hp;
		
		if (!target.cursed && !is_on_cooldown('curse') && ToT && targethp > .80){
			change_target(target);
			use_skill('curse', target);
		}
    }
	catch (e) {
            console.log ("Error Encountered in curseLoop()");
            console.error(e)
	}
	setTimeout(async () => { curseLoop() }, Math.max(1, ms_to_next_skill("curse")));
}


function on_party_invite(name){
    if (name == myPartyLeader && character.name != myPartyLeader){
        accept_party_invite(name)
    }
}