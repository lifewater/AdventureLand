async function doFarming() {
    try {
        if(smart.moving)
            return;
            
        set_message("Farm");

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
                if (states.mage.attackMode == 'group'){
                    let tankObj = get_player(tank);
                    let tankTarget = get_target_of(tankObj);
                    if (tankTarget){
                        [tx, ty] = [tankTarget.x, tankTarget.y];
                        move(cx + (tx - cx) - 20, cy + (ty - cy) - 20);
                    }
                }
                else if (states.mage.attackMode == 'solo') {
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
                    move(cx + (tx - cx) - 20, cy + (ty - cy) - 20);
                }
            }              
        }
    }
    catch(e) {
        logit(character.name + "Error occured in doFarming()");
        logit(e)
    }
}