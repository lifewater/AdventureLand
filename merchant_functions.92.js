async function merchantLoop() {
	try {
		
		if (locate_item("whiteegg") != -1)
            destroy(locate_item("whiteegg")); 
	
		if (character.q.upgrade || character.q.compound || smart.moving) {
            setTimeout(async () => { merchantLoop() }, 250);
            return;
        }

		upgradeables = getUpgradeableItems();
		upgradeLength = Object.keys(upgradeables).length;
        //console.log("Upgradable: " + upgradeLength)
		
        compoundables = getCompoundableItems();
		compoundLength = Object.keys(compoundables).length;
		//console.log("Compoundable: " + compoundLength)
		
		if (upgradeLength > 0) {
			set_message("Upgrading");
			await newUpgrade(upgradeables);				
		}
		else if (compoundLength > 0) {
			set_message("Compunding");
			await newCompound(compoundables);				
		}
		else if (!is_on_cooldown('fishing')) {
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

	}
	catch (e) {
		console.log ("Error Encountered in merchantLoop()");
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

async function newUpgrade(items) {
	try {
		console.log("Items Keys: " + Object.keys(items).length);
		for (let i in items) {
			for (let j in items[i]){
				for (let k in items[i][j]){
					var item = i;
					var level = j
					var slot = items[i][j][k];
					var igrade = item_grade(character.items[items[i][j][k]])
					
					//console.log("Item: " + item + " Current Level: " + level + " Slot: " + slot + " Grade: " + igrade);
					
					if(!checkScrolls("scroll" + igrade)) { 
						log("Buy Scroll");
        	    		await buy_with_gold("scroll" + igrade, 1);
					}
					
					if(typeof character.s["massproductionpp"] === 'undefined') 
						use_skill("massproductionpp");
					
					await upgrade(slot, locate_item(("scroll" + igrade))).then(
					function(data) {
						if (data.success)
							log ("Upgraded: " + item.name + " to " + data.level);
						else 
							log("Upgrade failed, item lost.");
            		});
				}
			}
		}
			
	}
	catch (e) {
		logit("Error Encountered in newUpgrade");
		logit(e)
	}
}

async function newCompound(items) {
	try {
		items_to_compound = [];
		
		for (let i in items) {
			for (let j in items[i]){
				for (let k=0; k<3; k++) {
					items_to_compound.push(items[i][j][k]);
				}
			}
		}
		
		let igrade = item_grade(character.items[items_to_compound[0]]);
		
		if(!checkScrolls("cscroll" + igrade)) { 
			log("Buy Scroll");
			await buy_with_gold("cscroll" + igrade, 1);
		}
					
		if(typeof character.s["massproductionpp"] === 'undefined') 
			use_skill("massproductionpp");
					
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
	catch (e) {
		logit("Error Encountered in newUpgrade");
		logit(e)
	}
}

function getCompoundableItems()
{
	var compound_list = {}
	
	// This will create an "unclean" list of compoundable
	// items, its unclean because it can contain lists of 
	// items that cant be compounded.
	// Example: 2 int rings, 1 dex ring
	// Data Format is:  {itemtype}{itemlevel}[slots]
    for (var i=0; i<character.isize; i++)
    {
        item = character.items[i];
		
        //skip empty inventory slot
        if (!item) { continue; }

		// if the item is in our specific whitelist
        if (compound_whitelist.includes(item.name))
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
	// Since we can only compound items in groups of 3
	// lets remove the lists of items less than 3 in size
	// so we have a clean compound list of ONLY actual
	// compoundable items
	// Note: This loop will be cancerous.
	for (i in compound_list) {
        //console.log ("ItemType: " + i);
		for (j in compound_list[i]) {
            let cKeyCount = Object.keys(compound_list[i]).length;
			let cItemCount = Object.values(compound_list[i][j]).length;
            //console.log ("ItemLevel: " + j + " -> " + cItemCount);
			if(cItemCount < 3) {
				compound_list[i][j] = [];
				delete compound_list[i][j];
                //continue;
                cKeyCount--;
			}
            if(cKeyCount == 0){
                delete compound_list[i];
            }

		}
	}
	
    return compound_list;
}


function getUpgradeableItems() {
	//console.log("List of Upgradeable Items")
	var upgrade_list = {};
	for (let i = 0; i < character.isize; i++) {
		let item = character.items[i];
		if (!item) { continue; }
		
		if( inUpgradeWhitelist(item, upgrade_whitelist)  && item.level < upgrade_whitelist[item.name] ) {
			//console.log ("Item in upgrade list: " + item.name + "(" + i + ")");
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