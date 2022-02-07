character.on("target_hit", (data) => {
    if(states[character.ctype].monsterhunt == true){
        if (data.kill && character.s.monsterhunt.c) {
            logit ("Target: " + character.s.monsterhunt.id + " (" + character.s.monsterhunt.c + ")");
        }
    }
});


async function doMonsterHunts(){
    try {
        if (smart.moving) {
            return;
        }
        if(!character.s.monsterhunt) {
            set_message("MH Accept");
            await (smart_move('monsterhunter'));
            parent.socket.emit("monsterhunt");
            logit ("Monster Hunt Accepted");
            setTimeout(async () => { moveLoop() }, 250);
            return;
        }
        else {
            if (character.s.monsterhunt.c && character.s.monsterhunt.c == 0){
                set_message("MH Return");
                await (smart_move('monsterhunter'));
                parent.socket.emit("monsterhunt");	
            }
            if (character.ctype == 'mage') {
                
                mhTarget = character.s.monsterhunt.id;
                mhCount = character.s.monsterhunt.c;
                if (mhCount == 0){
                    set_message("MH Return");
                    await (smart_move('monsterhunter'));
                    parent.socket.emit("monsterhunt");	
                    setTimeout(async () => { moveLoop() }, 250);
                    return;
                }
                //logit ("Starting Monster Hunt");
                //logit ("Target: " + mhTarget + " (" + mhCount + ")");
                if (monster_hunt_whitelist.includes(mhTarget)) {
                    set_message("MH WIP");
                    target = getTarget(mhTarget);
                    if (!target) {
                        await smart_move(mhTarget);
                    }
                    else {
                        if (can_attack(target)) {

                            if (mageAttackMode == "monsterhunt") {
                                await kiteLoop();
                            }
                        }
                        else {
                            [cx, cy] = [character.x, cy = character.y];
                            [tx, ty] = [target.x, target.y];
                            xmove(cx + (tx - cx)/2, cy + (ty - cy)/2);
                        }
                    }
                }
                else
                {
                    set_message("MH Cant");
                }
            }
            //setTimeout(async () => { moveLoop() }, 250);
            return;
        }
    }
    catch(e) {
        logit (character.name + ": Error: DoMonsterHunt()");
        logit(e);       
    }
}
