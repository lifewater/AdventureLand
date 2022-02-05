load_code("codecostmeter");

var mode = "compound";
//var mode = "upgrade";

var upgrade_whitelist = {
    "wbasher": 7,
	"candycanesword": 7,
	"wattire": 7,
	"wcap": 7,
	"wshoes": 7,
	"wbreeches": 7,
	"wgloves":7,
	"blade": 8,
	"xmace": 7,
	"gcape": 7,
	"warmscarf": 7,
	"coat1": 7,
	"gloves1": 7,
	"helmet1": 7,
	"pants1": 7,
	"shoes1": 7,
	"quiver": 7,
	"fireblade": 7,
	"firestaff": 7
};
var compound_whitelist = [
	'hpamulet', 'hpbelt', 'ringsj', 
	'strearring', 'intearring', 'dexearring', 'vitearring',
	'strring', 'intring', 'dexring', 'vitring',
	'wbookhs',
	'stramulet', 'intamulet', 'dexamulet'
];

// Do you want the script to 
// buy items from the shop if
// you break the item?
var buy_more_items = false;

// The upgrade scroll required
var scroll_type = 'scroll1';
var cscroll_type = 'cscroll0';

// Do you want the script to 
// buy scrolls from the shop if
// you break the item?
var buy_more_scrolls = true;

// How much free space is required?
// Upgrade will require 1 free space
var required_free_space = 1;

//----------------------------------
//--------Compound Config-----------
//----------------------------------

// max combine level
var compound_max_level = 3;

// what we want the merchant to combine

// 'strring', 'intring', 'dexring', 'vitring', <-- make triring instead
var compound_scroll_type = 'cscroll0';
// ------------------------------------
// DO NOT MODIFY BELOW THIS UNLESS YOU
// KNOW WHAT YOUR DOING
// ------------------------------------

var current_item_slot = 0;
var current_item_level = 0;
//var prev_item_name = null;
//var prev_item_level = null;

//-------------------------------------
var items_to_compound = [];
var compound_list = {};
var nothing_to_upgrade = false;
var nothing_to_compound = false;

var current_task = null;
var batch_item = "broom";
var batch_max_level = 5;
var batch_current_level = 1;
var batch_purchase_status = false;
var batch_count = 0;
var batch_igrade = 0;

var target = null;
var gameState = null;

var returnHome = "";
var prevDist = "0";
var upgradeables = {};
var compoundables = {};

upgradeables = getUpgradeableItems();

log("Upgradable Items:");
log( upgradeables);
log( Object.keys(upgradeables).length);

//--------------------------------------------------
//--------------------------------------------------
//--------------------------------------------------
// Main Game Loop

async function mainLoop() {
	try {
		if (locate_item("whiteegg") != -1) { destroy(locate_item("whiteegg")); }
		loot();		
		
		if (character.q.upgrade) { return; }
		if (character.q.compound) { return; }
		if (smart.moving) { return; }
		
		//upgradables = getUpgradableItems();
		
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
	setTimeout(async () => { mainLoop() }, 250);
}
mainLoop();

//--------------------------------------------------
//--------------------------------------------------
//--------------------------------------------------
// Death

async function ripLoop() {
	try {
		if (character.rip)
			respawn();
	}
	catch (e) {
		console.log ("Error Encountered in ripLoop()");
		console.error(e)
		}
	setTimeout(async () => { ripLoop() }, 10000);
}
ripLoop();

//--------------------------------------------------
//--------------------------------------------------
//--------------------------------------------------
// Regen/Healing

async function regenLoop() {
    try {
        const hpRatio = character.hp / character.max_hp
        const hpMissing = character.max_hp - character.hp
        const mpRatio = character.mp / character.max_mp
        const mpMissing = character.max_mp - character.mp

        if (character.rip) {
            // Don't heal if we're dead
            setTimeout(async () => { regenLoop() }, Math.max(100, ms_to_next_skill("use_hp")))
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
regenLoop();


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

function buildCompoundList()
{
    var max_inventory_slots = 42;

    for (var i=0; i<max_inventory_slots; i++)
    {
        item = character.items[i];
		
        //skip empty inventory slot
        if (!item) { continue; }

		// if the item is in our specific whitelist
        if (inCompoundList(item.name, compound_whitelist))
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
}

//--------------------------------------------------
//--------------------------------------------------
//--------------------------------------------------
// Fishing

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
//--------------------------------------------------
//--------------------------------------------------
// Mining

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

function distanceFromEntity(cx, cy, tx, ty)
{
	// sqrt( sq(tx-cx) + sq(ty-cy) )
	return Math.sqrt( Math.pow(tx-cx, 2) + Math.pow(ty-cy, 2) );
	
}
function batchUpgrade() {

	if (batch_current_level > batch_max_level)
		return;
	
	if (character.q.upgrade)
		return;
	
	if (!batch_purchase_status) {
		log("Buyin " + batch_item + "s!");
		batch_count = character.esize - 1;
		for ( let j = 0; j < batch_count; j++) 
			buy_with_gold(batch_item);
		batch_purchase_status = true;
		
	}
	else
	{
		log ("Batchin " + batch_current_level);
		for ( var i = 0; i < 42; i++) {
			var item = character.items[i];
			
			if (i == 41)
				batch_current_level++;
			
			// if empty slot, skip
			if (!item)
				continue;

			// if item is at the current batch level, skip
			if (item.level == batch_current_level)
				continue;
			
			// if an item is under the batch level, upgrade it
			if (item.level < batch_current_level) {
				//log ("Ilvl: "+ item.level + " / " + batch_current_level); 
				batch_igrade = item_grade(item);
				
				//if (!locate_item("scroll" + igrade))
				if (locate_item("scroll" + batch_igrade) == -1)
					buy_with_gold("scroll" + batch_igrade);
				
				if ( !is_on_cooldown("massproductionpp")  && (character.mp / character.max_mp >= .50) )
					use_skill("massproductionpp");
					
				//log("Upgrading item");
				upgrade(i, locate_item(("scroll" + batch_igrade))).then(
					function(data) {
						if (data.success)
							log ("Upgraded: " + item.name + " to " + data.level);
						else 
							log("Upgrade failed, item lost.");
         	   		});
					break;
			}
		}
	}
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


function inUpgradeWhitelist(item, list)
{
	if ( list.hasOwnProperty(item.name) )
		return true;
	
	return false;

}


 
function inCompoundList(item, list)
{
	for ( var i=0; i<list.length; i++ )
	{
		if (item == list[i])
			return true;
	}
	return false;
}

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


function buyScroll(type, quant) {
	buy_with_gold(type, quant);
}

function buyItem(item) {
	buy(item);
}

function checkFreeSpace(min) {
	
	if (character.esize >= min)
		return true;
	else
		return false;
}
	
function checkScrolls(scroll) {
	let location = locate_item(scroll);
	if (location > -1)
		return true;
	else
		return false;
}
	
function findItemToUpgrade(type) {
	let slot = locate_item(type);
	if (slot == -1)
		return [-1,-1];
	let properties = item_properties(character.items[slot]);
	let level = properties.level
	log("Slot: " + slot + " Level: " + level);
	return [slot, level];
	//properties = item_properties(character.items[7]);
	//console.log(properties);
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

		log("Chance: " + chance.toFixed(2) + "% Roll: " + rolled);

		}
		
		
		if (data.p.failure) {
			const chance = data.p.chance * 100;
			const rolled = Number.parseFloat(`${data.p.nums[3]}${data.p.nums[2]}.${data.p.nums[1]}${data.p.nums[0]}`);
			//const success = data.p.success;

			log("Chance: " + chance.toFixed(2) + "% Roll: " + rolled);
		}
		});
	parent.qDataSetup = true;
}
setupQData()

