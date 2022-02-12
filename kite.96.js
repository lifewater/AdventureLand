//Extra range to add to a monsters attack range, to give a little more wiggle room to the algorithm.
var rangeBuffer = 150;

//How far away we want to consider monsters for
var calcRadius = 100;

//What types of monsters we want to try to avoid
var avoidTypes = ["frog", "squigtoad", "snake", "osnake", "armadillo", "croc", "scorpion", "greenjr", "bigbird", "porcupine", "cgoo", "boar", "snowman", "poisio", "stoneworm", "jr", "crabx", "iceroamer", "goldenbat"];

var avoidPlayers = false;//Set to false to not avoid players at all
var playerBuffer = 30;//Additional Range around players
var avoidPlayersWhitelist = [];//Players want to avoid differently
var avoidPlayersWhitelistRange = 30; //Set to null here to not avoid whitelisted players
var playerRangeOverride = 85; //Overrides how far to avoid, set to null to use player range.
var playerAvoidIgnoreClasses = ["merchant"];//Classes we don't want to try to avoid

//Tracking when we send movements to avoid flooding the socket and getting DC'd
var lastMove;

//Whether we want to draw the various calculations done visually
var drawDebug = true;

async function kiteLoop()
{
    try {
        
        if (character.ctype == "merchant") return;
        if (character.ctype == "warrior") return;
        if (smart.moving) return
        if (character.rip) return
        if (drawDebug)
        {
            clear_drawings();
        }
        
        var goal = null;
        
        for(id in parent.entities)
        {
            var entity = parent.entities[id];
            
            if(entity.mtype == "") {
                goal = {x: entity.real_x, y: entity.real_y};
                break;
            }
        }
        
        //Try to avoid monsters, 
        var avoiding = avoidMobs(goal);
        
        if(!avoiding && goal != null)
        {
            if(lastMove == null || new Date() - lastMove > 100) {
                await move(goal.x, goal.y);
                lastMove = new Date();
            }
        }
    }
    catch(e) {
        logit (character.name + ": Error: kiteLoop()");
        logit (e);
    }
    setTimeout(async () => { kiteLoop() }, 25);
}

async function avoidMobs(goal)
{
	var noGoal = false;
	
	if(goal == null || goal.x == null || goal.y == null)
	{
		noGoal = true;
	}
	
	if(drawDebug && !noGoal)
	{
		draw_circle(goal.x, goal.y, 25, 1, 0xDFDC22);
	}
	
	var maxWeight;
	var maxWeightAngle;
	var movingTowards = false;
	
	var monstersInRadius = getMonstersInRadius();
	
	var avoidRanges = getAnglesToAvoid(monstersInRadius);
	var inAttackRange = isInAttackRange(monstersInRadius);
	if(!noGoal)
	{
		var desiredMoveAngle = angleToPoint(character, goal.x, goal.y);

		

		var movingTowards = angleIntersectsMonsters(avoidRanges, desiredMoveAngle);

		var distanceToDesired = distanceToPoint(character.real_x, character.real_y, goal.x, goal.y);

		var testMovePos = pointOnAngle(character, desiredMoveAngle, distanceToDesired);
	
		if(drawDebug)
		{
			draw_line(character.real_x, character.real_y, testMovePos.x, testMovePos.y, 1, 0xDFDC22);
		}
	}
	
	
	//If we can't just directly walk to the goal without being in danger, we have to try to avoid it
	if(inAttackRange || movingTowards || (!noGoal && !can_move_to(goal.x, goal.y)))
	{
		//Loop through the full 360 degrees (2PI Radians) around the character
		//We'll test each point and see which way is the safest to  go
		for(i = 0; i < Math.PI*2; i += Math.PI/60)
		{
			var weight = 0;

			var position = pointOnAngle(character, i, 75);
			
			//Exclude any directions we cannot move to (walls and whatnot)
			if(can_move_to(position.x, position.y))
			{
				
				//If a direction takes us away from a monster that we're too close to, apply some pressure to that direction to make it preferred
				var rangeWeight = 0;
				var inRange = false;
				for(id in monstersInRadius)
				{
					var entity = monstersInRadius[id];
					var monsterRange = getRange(entity);

					var distToMonster = distanceToPoint(position.x, position.y, entity.real_x, entity.real_y);

					var charDistToMonster = distanceToPoint(character.real_x, character.real_y, entity.real_x, entity.real_y);

					if(charDistToMonster < monsterRange)
					{
						inRange = true;
					}

					if(charDistToMonster < monsterRange && distToMonster > charDistToMonster)
					{
						rangeWeight += distToMonster - charDistToMonster;
					}

				}

				if(inRange)
				{
					weight = rangeWeight;
				}
				
				//Determine if this direction would cause is to walk towards a monster's radius
				var intersectsRadius = angleIntersectsMonsters(avoidRanges, i);
				
				//Apply some selective pressure to this direction based on whether it takes us closer or further from our intended goal
				if(goal != null && goal.x != null && goal.y != null)
				{
					var tarDistToPoint = distanceToPoint(position.x, position.y, goal.x, goal.y);

					weight -= tarDistToPoint/10;
				}
				
				//Exclude any directions which would make us walk towards a monster's radius
				if(intersectsRadius === false)
				{
					//Update the current max weight direction if this one is better than the others we've tested
					if(maxWeight == null || weight > maxWeight)
					{
						maxWeight = weight;
						maxWeightAngle = i;
					}
				}
			}
		}
		
		//Move towards the direction which has been calculated to be the least dangerous
		var movePoint = pointOnAngle(character, maxWeightAngle, 20);

		if(lastMove == null || new Date() - lastMove > 100)
		{
			lastMove = new Date();
			await move(movePoint.x, movePoint.y);
		}
		
		if(drawDebug)
		{
			draw_line(character.real_x, character.real_y, movePoint.x, movePoint.y, 2, 0xF20D0D);
		}
		
		return true;
	}
	else
	{
		return false;
	}
	
}

function getRange(entity)
{
	var monsterRange;
			
	if(entity.type != "character")
	{
			
		monsterRange = parent.G.monsters[entity.mtype].range + rangeBuffer;
	}
	else
	{
		if(avoidPlayersWhitelist.includes(entity.id) && avoidPlayersWhitelistRange != null)
		{
			monsterRange = avoidPlayersWhitelistRange;
		}
		else if(playerRangeOverride != null)
		{
			monsterRange = playerRangeOverride + playerBuffer;
		}
		else
		{
			monsterRange = entity.range + playerBuffer;
		}
	}
	
	return monsterRange;
}

function isInAttackRange(monstersInRadius)
{
	for(id in monstersInRadius)
	{
		var monster = monstersInRadius[id];
		var monsterRange = getRange(monster);
		
		var charDistToMonster = distanceToPoint(character.real_x, character.real_y, monster.real_x, monster.real_y);
		
		if(charDistToMonster < monsterRange)
		{
			return true;
		}
	}
	
	return false;
}

function angleIntersectsMonsters(avoidRanges, angle)
{
	for(id in avoidRanges)
	{
		var range = avoidRanges[id];

		var between = isBetween(range[1], range[0], angle);



		if(between)
		{
			return true;
		}
	}
	
	return false;
}

function getAnglesToAvoid(monstersInRadius)
{
	var avoidRanges = [];
	
	if(monstersInRadius.length > 0)
	{
		for(id in monstersInRadius)
		{
			var monster = monstersInRadius[id];
			
			var monsterRange = getRange(monster);
			
			var tangents = findTangents({x: character.real_x, y: character.real_y}, {x: monster.real_x, y: monster.real_y, radius: monsterRange});
			
			//Tangents won't be found if we're within the radius
			if(!isNaN(tangents[0].x))
			{
				var angle1 = angleToPoint(character, tangents[0].x, tangents[0].y);
				var angle2 = angleToPoint(character, tangents[1].x, tangents[1].y);

				if(angle1 < angle2)
				{
					avoidRanges.push([angle1, angle2]);
				}
				else
				{
					avoidRanges.push([angle2, angle1]);
				}
				if(drawDebug)
				{
					draw_line(character.real_x, character.real_y, tangents[0].x, tangents[0].y, 1, 0x17F20D);
					draw_line(character.real_x, character.real_y, tangents[1].x, tangents[1].y, 1, 0x17F20D);
				}
			}
			
			if(drawDebug)
			{
				draw_circle(monster.real_x, monster.real_y, monsterRange, 1, 0x17F20D);
			}
		}
	}
	
	return avoidRanges;
}

function getMonstersInRadius()
{
	var monstersInRadius = [];
	
	for(id in parent.entities)
	{
		var entity = parent.entities[id];
		var distanceToEntity = distanceToPoint(entity.real_x, entity.real_y, character.real_x, character.real_y);
		
		var range = getRange(entity);
		
		if(entity.type === "monster" && avoidTypes.includes(entity.mtype))
		{
			
			var monsterRange = getRange(entity);

			if(distanceToEntity < calcRadius)
			{
				monstersInRadius.push(entity);
			}
		}
		else
		{
			if(avoidPlayers && entity.type === "character" && !entity.npc && !playerAvoidIgnoreClasses.includes(entity.ctype))
			{
				if(!avoidPlayersWhitelist.includes(entity.id) || avoidPlayersWhitelistRange != null)
				{
					if(distanceToEntity < calcRadius || distanceToEntity < range)
					monstersInRadius.push(entity);
				}
			}
		}
	}
	
	return monstersInRadius;
}


function normalizeAngle(angle) {
    return Math.atan2(Math.sin(angle), Math.cos(angle));
}  

//Source: https://stackoverflow.com/questions/11406189/determine-if-angle-lies-between-2-other-angles
function isBetween(angle1, angle2, target)
{
	if(angle1 <= angle2) {
		if(angle2 - angle1 <= Math.PI) {
			return angle1 <= target && target <= angle2;
		} else {
			return angle2 <= target || target <= angle1;
		}
	} else {
		if(angle1 - angle2 <= Math.PI) {
			return angle2 <= target && target <= angle1;
		} else {
			return angle1 <= target || target <= angle2;
		}
	}
}

//Source: https://stackoverflow.com/questions/1351746/find-a-tangent-point-on-circle
function findTangents(point, circle)
{
	var dx = circle.x - point.x;
	var dy = circle.y - point.y;
	var dd = Math.sqrt(dx * dx + dy * dy);
	var a = Math.asin(circle.radius/dd);
	var b = Math.atan2(dy, dx);
	
	var t = b - a;
	
	var ta = {x:circle.x + (circle.radius * Math.sin(t)), y: circle.y + (circle.radius * -Math.cos(t))};
	
	t = b + a;
	var tb = {x: circle.x + circle.radius * -Math.sin(t), y: circle.y + circle.radius * Math.cos(t)}
	
	
	
	return [ta, tb];
}

function offsetToPoint(x, y)
{
	var angle = angleToPoint(x, y) + Math.PI/2;
	
	return angle - characterAngle();
	
}

function pointOnAngle(entity, angle, distance)
{
	var circX = entity.real_x + (distance * Math.cos(angle));
	var circY = entity.real_y + (distance * Math.sin(angle));
	
	return {x: circX, y: circY};
}

function entityAngle(entity)
{
	return (entity.angle * Math.PI)/180;
}

function angleToPoint(entity, x, y) {
    var deltaX = entity.real_x - x;
    var deltaY = entity.real_y - y;

    return Math.atan2(deltaY, deltaX) + Math.PI;
}

function characterAngle() {
    return (character.angle * Math.PI) / 180;
}

function distanceToPoint(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}