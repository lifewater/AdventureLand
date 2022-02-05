const myParty = ['Dough', 'LifeWater', 'Chasun', 'Bezos'];
const myPartyLeader = "Bezos";

setupQData()


function distanceFromEntity(cx, cy, tx, ty)
{
	// sqrt( sq(tx-cx) + sq(ty-cy) )
	return Math.sqrt( Math.pow(tx-cx, 2) + Math.pow(ty-cy, 2) );
	
}

function logit(msg) {
	log(msg);
	console.log(msg);
}

function kite(tx,ty,cx,cy,angle) {
	let distanceX = cx - tx;
	let distanceY = cy - ty;
	let cos = Math.cos(angle);
	let sin = Math.sin(angle);
	let x2 = ( (cos*distanceX) - (sin*distanceY) ) + tx;
	let y2 = ( (sin*distanceX) + (cos*distanceY) ) + ty;
	return ([x2,y2]);
}

function ms_to_next_skill(skill) {
    const next_skill = parent.next_skill[skill]
    if (next_skill == undefined) return 0
    const ms = parent.next_skill[skill].getTime() - Date.now()
    return ms < 0 ? 0 : ms
}

function setupQData() {
  if(parent.qDataSetup) 
	  return
	
	parent.socket.on('q_data', (data) => {
		if (data.p.success) {
			const chance = data.p.chance * 100;
			const rolled = Number.parseFloat(`${data.p.nums[3]}${data.p.nums[2]}.${data.p.nums[1]}${data.p.nums[0]}`);
			//const success = data.p.success;

		logit("Chance: " + chance.toFixed(2) + "% Roll: " + rolled);

		}
		
		
		if (data.p.failure) {
			const chance = data.p.chance * 100;
			const rolled = Number.parseFloat(`${data.p.nums[3]}${data.p.nums[2]}.${data.p.nums[1]}${data.p.nums[0]}`);
			//const success = data.p.success;

			logit("Chance: " + chance.toFixed(2) + "% Roll: " + rolled);
		}
		});
	parent.qDataSetup = true;
}

async function managePartyLoop() {
    try {
		if (character.rip) {
			setTimeout(async () => { managePartyLoop() }, 1000);
            return;
		}

		// Merchant will handle group invites 
		if (character.name == myPartyLeader) {
			for (let player of myParty) {
				if (!parent.party_list.includes(player)) {
					send_party_invite(player);
				}
			}
		}

    }
	catch (e) {
            console.log ("Error Encountered in lootLoop()");
            console.error(e)
    }
	setTimeout(async () => { managePartyLoop() }, 1000);
}

function fixAddLog()
{
    if (parent.addLogFixed) {
        return;
    }

    const oldAddLog = parent.add_log;
    const regex = /killed|gold/;
    parent.add_log = (message, color) => {
        if (typeof message === 'string' && !message.match(regex)) {
            oldAddLog(message, color);
        }
    };

    parent.addLogFixed = true;
}

function discardJunk() {
	for (junk of throwAwayItems) {
		if (locate_item(junk) == -1)
			continue;
		let item = character.items[locate_item(junk)];
		if (item.level > 0)
			continue;
		destroy(locate_item(junk));
	}
}


function followLeader(){
	//var leader = get_player(character.party);
	var leader = get_player(tank);
	var safeRange = 200;
	
	if(leader){
		var distance = Math.hypot(
			character.real_x - leader.real_x,
			character.real_y - leader.real_y
		);
	}
	// Comfortable range
	if (distance >= safeRange && leader) {
		move(
			character.real_x + (leader.real_x - character.real_x) / 2,
			character.real_y + (leader.real_y - character.real_y) / 2
		);
	}
}
 
 
 function getNearestBoss(args)
{
	for (i in parent.entities)
	{
		let entity = parent.entities[i];
		// if dead, or type isnt monster,get out
		if (entity.dead || entity.type != "monster") { continue; }
		if (args.mtype && entity.mtype != args.mtype) { continue; }
		let distance = parent.distance(character, entity);
		if (distance < 999)
			return entity;
	}
}


function getTarget(m = farmMob) {
	var t;
	
	//if (!t)
	//	t = getNearestBoss({ mtype: "phoenix" });
	if (!t)
		t = getNearestBoss({ mtype: "tiger" });
	if (!t)
		t = getNearestBoss({ mtype: "grinch" });
	if (!t)
		t = getNearestBoss({ mtype: "goldenbat" });
	if (!t)
		t = getNearestBoss({ mtype: "snowman" });
	if (!t)
		t = getNearestBoss({ mtype: "franky" });
	if (!t)
		t = getNearestBoss({ mtype: "dragold" });
	if (!t)	
		t = get_nearest_monster({ target: character.id });
	if (!t)	
		t = get_nearest_monster({type:m});
	if (!t)
		t = false;
	
	return t;
}