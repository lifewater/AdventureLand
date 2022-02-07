async function doEvents() {
    try {
        for (const key in parent.S) {
            const data = parent.S[key];
            if (!data.live) { continue; }
            if (key == 'dragold' || key == 'icegolem' || key =='tiger' || key=='franky' || key == 'pinkgoo' || key == 'snowman') { continue; }
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
            //setTimeout(async () => { moveLoop() }, 250);
            return;
        }
    }
    catch(e) {
        logit(character.name + "Error occured in doEvents");
        logit(e)
    }
}