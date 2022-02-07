load_code('codecostmeter');
load_code('general');

const codeBase = 'master';

//----------------
// Priest Variables
//
const healMode = 'party';
const healThresholdRaw = 1500; // Minumum Lost HP required before Healing
const healThresholdRatio = .75; // c.hp / c.max_hp -> 75 / 100 = .75
party = [
    { name: "Dough",     ratio_hp: 0, lost_hp: null	},
	{ name: "LifeWater", ratio_hp: 0, lost_hp: null	},
	{ name: "Chasun",	 ratio_hp: 0, lost_hp: null	}
];

//----------------
// Mage Variables
//
const mageAttackMode = 'solo';  //group, solo

//----------------
// Global Variables
//
const inventoryWhitelist = ['hpot1','mpot1', 'stand0', 'stand1', 'tracker', 'pickaxe', 'rod'];

const farmMob = 'arcticbee';

const moveMode = 'farm';

const allowMonsterHunt = false;

var target;

var tank = "Dough";

start_character('Dough', codeBase);
start_character('LifeWater', codeBase);
start_character('Chasun', codeBase);

managePartyLoop();
//-------------------
// Merchant Variables
//
var items_to_compound = [];
var compound_list = {};
var upgradeables = {};
var compoundables = {};
var returnHome = "";


if (character.ctype == "merchant") {
    logit("Loading Merchant " + character.name);

    lootLoop();
    ripLoop();
    regenLoop();

    //merchantLoop();
}

if (character.ctype == "warrior") {
    logit("Loading Warrior " + character.name);
    lootLoop();
    ripLoop();
    regenLoop();
    moveLoop();
    attackLoop();
    merchantDump();
}
if (character.ctype == "priest") {
    logit("Loading Priest " + character.name);
    lootLoop();
    ripLoop();
    regenLoop();
    moveLoop();
    healLoop();
    curseLoop();
    //attackLoop();
    merchantDump();
}
if (character.ctype == "mage") {
    logit("Loading Mage " + character.name);
    lootLoop();
    ripLoop();
    regenLoop();
    moveLoop();
    attackLoop();
    merchantDump();
}


async function merchantDump() {
    try {
		if (character.rip) {
			setTimeout(async () => { merchantDump() }, 250);
            return;
		}
		
        let merchant = get_player("Bezos");

		if (merchant == null) {
            setTimeout(async () => { merchantDump() }, 250);
            return;         
        }

        let distance = distanceFromEntity(character.x, character.y, merchant.real_x, merchant.real_y);

        if (distance <= 300) {
            for (let slotNum in character.items){
                let item = character.items[slotNum];

                if (!item)
                    continue;

               if(!inventoryWhitelist.includes(item.name)) {
                   send_item(merchant, slotNum, 9999);
               }

            }
        }
    }
	catch (e) {
            logit (character.name + ": Error: merchantDump()");
            logit(e)
    }
	setTimeout(async () => { merchantDump() }, 250);   
}
//------------------------
// Loot Loop
//------------------------
async function lootLoop() {
    try {
		if (character.rip) {
			setTimeout(async () => { lootLoop() }, 100);
            return;
		}
		loot();
    }
	catch (e) {
        logit (character.name + ": Error: lootLoop()");
        logit(e)
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
		logit ("Error Encountered ripLoop()");
		logit(e)
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
        logit(character.name + ": Error: regenLoop()");
        logit(e);
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
            if (key == 'dragold' || key == 'icegolem' || key =='tiger' || key=='franky' || key == 'pinkgoo') { continue; }
            // exclude special event, like 'halloween', or 'egghunt'
            // they are not monster hunts, and require diff logic
            if(typeof data !== "object")  // special events are string type
                continue 
            
            set_message("Move E: " + key);
            target = getTarget(key);

            if(!target){
                logit(data.map + " " + data.x + " " + data.y)
                await smart_move({map:data.map, x:data.x, y:data.y})
            }
            else {
                [cx, cy] = [character.x, cy = character.y];
				[tx, ty] = [target.x, ty = target.y];

                if (character.ctype == "Warrior")
                    if (!can_attack('attack')) {
                        move(cx + (tx - cx)/2, cy + (ty - cy)/2);
                    }
                
                if (character.ctype == "Mage")
                    move(cx + (tx - cx)+20, cy + (ty - cy)+ 20)

                if (character.ctype == "Priest")
                    move(cx + (tx - cx)-20, cy + (ty - cy)-20)
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
				logit ("Monster Hunt Accepted");
				logit ("Target: " + mhTarget + " (" + mhCount + ")");
				return;
            }
			else {
				mhTarget = character.s.monsterhunt.id;
				mhCount = character.s.monsterhunt.c;
				logit ("Starting Monster Hunt");
				logit ("Target: " + mhTarget + " (" + mhCount + ")");
				await smart_move(mhTarget);
				return;
			}
        }
		//------------------------
		//Farm Logic
		//------------------------
		if (moveMode == "farm") {
			set_message("Farm");
            //logit(character.name + ": Farming")
			
			// Move to location if we cannot target farmMob
			//target = get_nearest_monster({"type": farmMob})
            target = getTarget();
			if (!target)
				await smart_move(farmMob)
			else {
                [cx, cy] = [character.x, cy = character.y];
				[tx, ty] = [target.x, target.y];

                if (character.ctype == "warrior"){
                    move(cx + (tx - cx)/2, cy + (ty - cy)/2);
                }
                
                if (character.ctype == "mage"){
                    if (mageAttackMode == 'group'){
                        let tankObj = get_player(tank);
                        let tankTarget = get_target_of(tankObj);
                        if (tankTarget){
                            [tx, ty] = [tankTarget.x, tankTarget.y];
                            move(cx + (tx - cx) - 20, cy + (ty - cy) - 20);
                        }
                    }
                    else if (mageAttackMode == 'solo') {
                        if (!is_in_range(target, attack)) {
                            move(cx + (tx - cx)/2, cy + (ty - cy)+10);
                        }
                    }
                }
                if (character.ctype == "priest"){
                    let tankObj = get_player(tank);
                    let tankTarget = get_target_of(tankObj);
                    if (tankTarget){
                        [tx, ty] = [tankTarget.x, tankTarget.y];
                        move(cx + (tx - cx) + 20, cy + (ty - cy) - 20);
                    }
                }              
            }
		}
		
		if (moveMode == "phoenix") {

		}
	}
	catch (e) {
        logit (character.name + ": Error: moveLoop()");
        logit(e);
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

        // if your not a healer get out of here
        if (character.ctype != 'priest')
            return;

        if (healMode == "party") {
            var topPriority;
            var current;
            var previous;
            
            // Load up party data w/ HP info.
            for (node in party) {
                partyMember = get_player(party[node].name);
                if (!partyMember)
                    continue;
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
// Attack Loop
//------------------------
async function attackLoop() {
    try {
		if (character.rip) {
			setTimeout(async () => { attackLoop() }, Math.max(1, ms_to_next_skill("attack")));
            return;
		}

        if (target.dead){
            setTimeout(async () => { attackLoop() }, Math.max(1, ms_to_next_skill("attack")));
            return;
        }

		if (target) {
            if (character.ctype == "warrior") {
			    if(is_in_range(target, "attack") && can_attack(target)) {
				    await attack(target);
				    reduce_cooldown("attack", Math.min(...parent.pings));
			    }
            }

            if (character.ctype == "mage") {
                if (mageAttackMode == 'group') {
                    let tankObj = get_player(tank);
                    let tankTarget = get_target_of(tankObj);
                    let targetsTarget = get_target_of(tankTarget);
                    if(is_in_range(tankTarget, "attack") && can_attack(tankTarget) && tankTarget) {
                        await attack(tankTarget);
                        reduce_cooldown("attack", Math.min(...parent.pings));
                    }
                }
                else if (mageAttackMode == 'solo') {
                    if(is_in_range(target, "attack") && can_attack(target) && target) {
                        await attack(target);
                        reduce_cooldown("attack", Math.min(...parent.pings));
                    }
                }
            }

            if (character.ctype == "priest"){
                let tankObj = get_player(tank);
                let tankTarget = get_target_of(tankObj);
                let targetsTarget = get_target_of(tankTarget)
			    if(is_in_range(tankTarget, "attack") && can_attack(tankTarget) && tankTarget) {
				    await attack(tankTarget);
				    reduce_cooldown("attack", Math.min(...parent.pings));
			    }
            }
        }  
	}
	catch (e) {
        logit (character.name + ": Error: attackLoop()");
        logit (e);
	}
	setTimeout(async () => { attackLoop() }, Math.max(1, ms_to_next_skill("attack")));
}

//------------------------
// Curse Loop
//------------------------
async function curseLoop() {
    try {
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


//------------------------------------------------------------------
//------------------------------------------------------------------
//------------------------------------------------------------------
//------------------------------------------------------------------
//------------------------------------------------------------------
// Merchant things, needs to be factored into the rest of this code.
//------------------------------------------------------------------
//------------------------------------------------------------------
//------------------------------------------------------------------
//------------------------------------------------------------------
//------------------------------------------------------------------


async function merchantLoop() {
	try {

		if (locate_item("whiteegg") != -1)
            destroy(locate_item("whiteegg")); 
	
		if (character.q.upgrade || character.q.compound || smart.moving) {
            setTimeout(async () => { merchantLoop() }, 250);
            return;
        }

		
		upgradables = getUpgradableItems();
        compoundables = getCompoundableItems();

		
		if (!is_on_cooldown('fishing')) {
			set_message("Fishin");
			close_stand();
			await goFish();
			returnHome = true;
		}
		else if (!is_on_cooldown('mining')) {
			set_message("Minin");
			close_stand();
			await goMine();
			returnHome = true;
		}
		else
		{
			if (returnHome)
			{
				set_message("Nothin");
				log("returnHome(" + returnHome + ")");
				await smart_move({map:'main', x:-143, y:-56});
				open_stand();
				returnHome = false;
			}
		}
		
		if (mode == "compound") {
			if (character.q.compound) { return; }
			set_message("Compounding");
			buildCompoundList();
        	await compoundStuff2();
        	compound_list = {};
		}
		else if (mode == "upgrade") {
			if (character.q.upgrade) { return; }
			set_message("Upgrading");
			await upgradeItem2();

   		 }
		else if (mode == 'batchupgrade') {
			//log(character.esize);
			batchUpgrade();
		}
	}
	catch (e) {
		console.log ("Error Encountered in mainLoop()");
		console.error(e)
		}
	setTimeout(async () => { merchantLoop() }, 250);
}

async function goFish() {
	try {
		//log("goFish()");
		spot = { map: "main", x: -1368, y: -82 };
		currentWeapon = character.slots.mainhand;
		fishingrodSlot = locate_item("rod"); // returns slotnum OR -1 if cannot find
	
	
		if (currentWeapon == null || currentWeapon.name != "rod" ) {
			log ("Fishing Rod not equipped");
			if (fishingrodSlot == -1) {
				log ("You cant fish without a rod.")
				return;
			}
			else {
				log("Equipping Fishing Rod");
				equip(fishingrodSlot);
			}
		}

		if (smart.moving) 
			return;
	
		if (character.x != spot.x && character.y != spot.y) 
		{
			log ("Moving to Fishing Spot")
			await smart_move({map: spot.map, x: spot.x, y: spot.y});
		}
	

		if (character.mp > 120) {
			if (!character.c.fishing) {
				log("Fishin!");
				use_skill('fishing');
			}
		}
	}
	catch (e) {
		console.log ("Error Encountered in goFish()");
		console.error(e)
	}
}

//--------------------------------------------------
// Mining
//--------------------------------------------------

async function goMine() {
	try {
		spot = { map: 'tunnel', x: 280, y: -95 };
		currentWeapon = character.slots.mainhand.name;
		pickaxeSlot = locate_item("pickaxe"); // returns slotnum OR -1 if cannot find
	
		if (currentWeapon == null || currentWeapon != "pickaxe" || character.slots.mainhand.name == null) {
			log ("Pickaxe not equipped");
			if (pickaxeSlot == -1) {
				log ("You cant mine without a pickaxe.")
				return;
			}
			else
			{
				log("Equipping Pickaxe");
				equip(pickaxeSlot);
			}
		}
	
		if (smart.moving) 
			return;	

		if (character.x != spot.x && character.y != spot.y) {
			log ("Moving to Mining Spot")
			await smart_move({map: spot.map, x: spot.x, y: spot.y});
		}
		
		if (character.mp > 120) {
			if (!character.c.mining) {
				log("Minin!");
				use_skill('mining');
			}
		}
	}
	catch (e) {
		console.log ("Error Encountered in goMine()");
		console.error(e)
	}
}


//--------------------------------------
//----------- Upgrade Stuff -------------
//--------------------------------------
async function upgradeItem2() {
	try {
		//log("UpgradeItem2()")
		cx = character.x;
		cy = character.y;
		CueX = G.maps.main.npcs[0].position[0];
		CueY = G.maps.main.npcs[0].position[1];
		ScrollX = G.maps.main.npcs[2].position[0];
		ScrollY = G.maps.main.npcs[2].position[1];
		d1 = distanceFromEntity(cx,cy,CueX,CueY);
		d2 = distanceFromEntity(cx,cy,ScrollX,ScrollY);
	
	
		if (d1 > 150 && d2 > 150)
			return;
		
    	var max_inventory_slots = 42;
	
		// Loop through each  inventory slot
    	for (var i = 0; i < max_inventory_slots; i++) {
			if (character.q.upgrade) { return; }
		
        	let item = character.items[i];

		
			// skip slot if inventory slot is empty
			if (!item) { continue; }
		
			// if the current item is in my upgrade whitelist
			// AND below the max upgrade level I've set, then
			//proceed with the upgrade
        	if( inUpgradeWhitelist(item, upgrade_whitelist)  && item.level < upgrade_whitelist[item.name] ) {
			
				var igrade = item_grade(item)
				log("Attempting " + item.name + " Slot: [" +i+ "]");
			
     	   		if(!checkScrolls("scroll" + igrade)) { 
					log("Buy Scroll");
        	    	await buy_with_gold("scroll" + igrade, 1);
				}
			
				if(typeof character.s["massproductionpp"] === 'undefined') 
					use_skill("massproductionpp");
			
				await upgrade(i, locate_item(("scroll" + igrade))).then(
					function(data) {
						if (data.success)
							log ("Upgraded: " + item.name + " to " + data.level);
						else 
							log("Upgrade failed, item lost.");
            		});
			}
    	}
	}
	catch (e) {
		console.log ("Error Encountered in upgradeItem(2)");
		console.error(e)
	}
}

//--------------------------------------
//----------- Compound Stuff -------------
//--------------------------------------

async function compoundStuff2()
{
	try {
		//log("CompoundStuff2()");
		cx = character.x;
		cy = character.y;
		CueX = G.maps.main.npcs[0].position[0];
		CueY = G.maps.main.npcs[0].position[1];
		ScrollX = G.maps.main.npcs[2].position[0];
		ScrollY = G.maps.main.npcs[2].position[1];
		d1 = distanceFromEntity(cx,cy,CueX,CueY);
		d2 = distanceFromEntity(cx,cy,ScrollX,ScrollY);
	
		if (d1 > 150 && d2 > 150)
			return;
	
	
		if (items_to_compound.length == 3) {
			let item = character.items[items_to_compound[0]];
			let igrade = item_grade(item)
		
			log("Going to compound")
    	    if(!checkScrolls("cscroll" + igrade)){ 
				log("Buy Scroll: cscroll" + igrade);
				await buy_with_gold("cscroll" + igrade, 1);
			}
		
			if (!is_on_cooldown("massproductionpp")){
				use_skill("massproductionpp");
			}
		
	        await compound(
    	        items_to_compound[0], 
        	    items_to_compound[1], 
            	items_to_compound[2],
            	locate_item("cscroll" + igrade)
            	).then(function(data){
            	if (data.success){ log ("Compounded to level "+ data.level) }
            	else { log("Compound failed.") }
            	});
        	items_to_compound = [];
   		}
    	else {
			//log("Building list of items to compound");
    	    for (let i in compound_list) {
        	    for (let j in compound_list[i]) {
            	    if ( compound_list[i][j].length >= 3 ) {
						//log("Meet criteria: " + compound_list[i][j].length)
						if (items_to_compound.length != 3) {
							for (let k=0; k<3; k++){
								items_to_compound.push(compound_list[i][j][k]);
							}
						}
						//log("Iteration: "+items_to_compound);
						//log("Length: "+items_to_compound.length);
						break;
                	}
					// Possibly nothing left to compound?
					//else { continue; }
        	    }
       		}
    	}
	}
	catch (e) {
		console.log ("Error Encountered in compoundStuff2()");
		console.error(e)
	}
}

function getCompoundableItems()
{
    var max_inventory_slots = 42;

    for (var i=0; i<max_inventory_slots; i++)
    {
        item = character.items[i];
		
        //skip empty inventory slot
        if (!item) { continue; }

		// if the item is in our specific whitelist
        if (inCompoundWhiteList(item.name, compound_whitelist))
        {
			//log(item.name +","+ item.level +","+ i);
			// just to save on typing
			let N = item.name;
			let L = item.level;
			
			// if the hash's havent started yet,
			// we need to initialize blank ones
			// otherwise we will get undefined
			if ( !compound_list.hasOwnProperty(N) )
				compound_list[N] = {};
			if ( !compound_list[N].hasOwnProperty(L) )
				compound_list[N][L] = [];
			
			// Add to the list
			compound_list[N][L].push(i);
        }
    }
    return compound_list;
}

// currently unused?
function getUpgradeableItems() {
	var upgrade_list = {};
	for (let i = 0; i < 42; i++) {
		let item = character.items[i];
		if (!item) { continue; }
		
		if( inUpgradeWhitelist(item, upgrade_whitelist)  && item.level < upgrade_whitelist[item.name] ) {
			let N = item.name;
			let L = item.level;
			
			if ( !upgrade_list.hasOwnProperty(N) )
				upgrade_list[N] = {};
			if ( !upgrade_list[N].hasOwnProperty(L) )
				upgrade_list[N][L] = [];
			
			upgrade_list[N][L].push(i);
		}
	}
	return upgrade_list;
}

function checkScrolls(scroll) {
	let location = locate_item(scroll);
	if (location > -1)
		return true;
	else
		return false;
}

function inUpgradeWhitelist(item, list)
{
	if ( list.hasOwnProperty(item.name) )
		return true;
	
	return false;

}

function inCompoundWhiteList(item, list)
{
	for ( var i=0; i<list.length; i++ )
	{
		if (item == list[i])
			return true;
	}
	return false;
}