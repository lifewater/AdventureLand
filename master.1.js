load_code('codecostmeter');
load_code('general');
load_code('kite');
load_code('events');
load_code('monsterhunts');
load_code('farming');
load_code('merchant_functions');


const codeBase = 'master';
const states = {};

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
    healThresholdRaw: 1200
};

states.warrior = { 
    active: false,
    events: false,
    monsterhunt: false,
    movement: true,
    attack: true,
    movementMode: 'farm',
    attackMode: 'group', // group,solo,monsterhunt
};
states.mage = { 
    active: false,
    events: false,
    monsterhunt: true,
    movement: true,
    attack: true,
    movementMode: 'monsterhunt',
    attackMode: 'monsterhunt', // group,solo,monsterhunt

};

//----------------
// Priest Variables
//
const healMode = 'group';
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
const mageAttackMode = 'monsterhunt';  //group, solo, monsterhunt
const monster_hunt_whitelist = ["arcticbee", "bee", "crab", "minimush", "frog", "squigtoad", "snake", "rat", "armadillo", "croc", "squig", "spider", "scorpion", "porcupine", "goo", "cgoo", "poisio", "tortoise","bat"]; 
var avoidTypes = ["frog", "squigtoad", "osnake", "armadillo", "croc", "scorpion", "greenjr", "bigbird", "porcupine", "cgoo", "boar", "snowman", "poisio", "stoneworm", "jr", "crabx", "iceroamer","mole", "wolfie","xscorpion","mummy","skeletor","wolf"];

//-----------------
// Global Variables
//
const inventoryWhitelist = ['hpot1','mpot1', 'stand0', 'stand1', 'tracker', 'pickaxe', 'rod'];

const farmMob = 'arcticbee';

const moveMode = '';

const allowMonsterHunt = true;

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
var upgradeables = {};
var compoundables = {};
var returnHome = "";

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
	"firestaff": 7,
	"frankypants": 5,
	"helmet": 7,
	"shoes": 7,
	"gloves":7,
	"pants":7,
	"tigerhelmet":7,
	"tigershield":7,
    "mmgloves":5,
    "mmpants":5,
    "mmarmor":5
};
var compound_whitelist = [
	'hpamulet', 'hpbelt', 'ringsj', 
	'strearring', 'intearring', 'dexearring', 'vitearring',
	'strring', 'intring', 'dexring', 'vitring',
	'wbookhs',
	'stramulet', 'intamulet', 'dexamulet'
];


if (character.ctype == "merchant") {
    logit("Loading Merchant " + character.name);

    lootLoop();
    ripLoop();
    regenLoop();
	merchantLoop();
}


// Main loop
if (character.ctype == "warrior") {
    logit("Loading Warrior " + character.name);
    states[character.ctype].active = true;
    lootLoop();
    ripLoop();
    regenLoop();
    moveLoop();
    attackLoop();
    merchantDump();
}
if (character.ctype == "priest") {
    logit("Loading Priest " + character.name);
    states[character.ctype].active = true;
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
    states[character.ctype].active = true;
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
        if (states[character.ctype].active && states[character.ctype].events) {
            await doEvents();
            setTimeout(async () => { moveLoop() }, 250);
            return;
        }

        //------------------------
		// Monster Hunt Logic
		//------------------------
        if (states[character.ctype].active && states[character.ctype].monsterhunt) {
            await doMonsterHunts();
            setTimeout(async () => { moveLoop() }, 250);
            return;
        }

		//------------------------
		//Farm Logic
		//------------------------
        if (states[character.ctype].active && states[character.ctype].movementMode == 'farm') {
            await doFarming();
            setTimeout(async () => { moveLoop() }, 250);
            return;
        }

	}
	catch (e) {
        logit (character.name + ": Error: moveLoop()");
        logit(e);
    }
	setTimeout(async () => { moveLoop() }, 250);
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


		if (target) {

            if (character.ctype == "warrior") {
			    if(!is_on_cooldown('attack') && can_attack(target)) {
				    await attack(target);
				    reduce_cooldown("attack", Math.min(...parent.pings));
			    }
            }

            if (character.ctype == "mage") {
                if (mageAttackMode == 'group') {
                    let tankObj = get_player(tank);
                    let tankTarget = get_target_of(tankObj);
                    let targetsTarget = get_target_of(tankTarget);
                    if(!is_on_cooldown('attack') && can_attack(tankTarget) && tankTarget) {
                        await attack(tankTarget);
                        reduce_cooldown("attack", Math.min(...parent.pings));
                    }
                }
                else if (mageAttackMode == 'solo') {
                    if(!is_on_cooldown('attack') && can_attack(target) && target) {
                        await attack(target);
                        reduce_cooldown("attack", Math.min(...parent.pings));
                    }
                }
                else if (mageAttackMode == 'monsterhunt') {
                    if(!is_on_cooldown('attack') &&  can_attack(target) && target) {
                        await attack(target);
                        reduce_cooldown("attack", Math.min(...parent.pings));
                    }
                }
            }

            if (character.ctype == "priest"){
                let tankObj = get_player(tank);
                let tankTarget = get_target_of(tankObj);
                let targetsTarget = get_target_of(tankTarget)
			    if(!is_on_cooldown('attack') && can_attack(tankTarget) && tankTarget) {
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



function on_party_invite(name) {
    if (character.ctype != "merchant") {
        log("Party invite from " + name);
        if (name == 'Bezos')
            accept_party_invite(name);
    }
}

