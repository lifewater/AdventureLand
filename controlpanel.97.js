

const Goldtracker = new Object();
Goldtracker.starting_time = Date.now();
Goldtracker.fmt_start_time = new Date(new Date().getTime()).toLocaleTimeString();
Goldtracker.current_time = null;
Goldtracker.starting_gold = character.gold;
Goldtracker.current_gold = null;
Goldtracker.gold_this_session = null;
Goldtracker.gph = "Calculating...";

Goldtracker.updateGold = function() {
	this.current_gold = character.gold;
	this.gold_this_session = this.current_gold - this.starting_gold;
}
Goldtracker.updateGPH = function() {
	this.current_time = Date.now();
	let tdiff = this.current_time/1000 - this.starting_time/1000;
	let unf_gph = 3600 * this.gold_this_session / tdiff;
	this.gph = addComma(unf_gph.toFixed(0));
}

const XPtracker = new Object();
XPtracker.starting_time = Date.now();
XPtracker.fmt_start_time = new Date(new Date().getTime()).toLocaleTimeString();
XPtracker.current_time = null;
XPtracker.starting_xp = character.xp;
XPtracker.current_xp = null;
XPtracker.xp_this_session = null;
XPtracker.xph = "Calculating...";
XPtracker.xpr = 0;
XPtracker.tnl = "Calculating...";
XPtracker.ttl = 0;
XPtracker.ktnl = 0;

XPtracker.updateXP = function() {
	this.current_xp = character.xp;
	this.xp_this_session = this.current_xp - this.starting_xp;
}
XPtracker.updateXPH = function() {
	this.current_time = Date.now();
	let tdiff = this.current_time/1000 - this.starting_time/1000;
	let unf_xph = 3600 * this.xp_this_session / tdiff;
	this.xph = unf_xph.toFixed(0);
}
XPtracker.updateTNL = function () {
	this.tnl = G.levels[character.level] - character.xp;
}

XPtracker.updateTTL = function () {
	this.current_time = Date.now()
	this.xpr = this.xp_this_session / (this.current_time - this.starting_time);
	let unformatted_ttl = (this.tnl / this.xpr); //hours
	//this.ttl = unf_ttl.toFixed(2);
	this.ttl = msToTime(unformatted_ttl);
}

XPtracker.updateKTNL = function () {

}


function resetStats() {
	log("Resetting Stats");
	Goldtracker.starting_time = Date.now();
	Goldtracker.fmt_start_time = new Date(new Date().getTime()).toLocaleTimeString();
	Goldtracker.current_time = null;
	Goldtracker.starting_gold = character.gold;
	Goldtracker.current_gold = null;
	Goldtracker.gold_this_session = null;
	Goldtracker.gph = "Calculating...";

	XPtracker.starting_time = Date.now();
	XPtracker.fmt_start_time = new Date(new Date().getTime()).toLocaleTimeString();
	XPtracker.current_time = null;
	XPtracker.starting_xp = character.xp;
	XPtracker.current_xp = null;
	XPtracker.xp_this_session = null;
	XPtracker.xph = "Calculating...";
	XPtracker.xpr = 0;
	XPtracker.tnl = "Calculating...";
	XPtracker.ttl = 0;
}



function updateWindow() {
	if (!statusdiv) {
        var tempdiv = document.createElement("div");
        tempdiv.id = "controlpanel";
        //tempdiv.innerHTML = "testing<br/>testing<br/>testing";
        tempdiv.style.backgroundColor ="#566573";
        tempdiv.style.color="#FFFFFF";
		tempdiv.style.opacity=0.7;
        tempdiv.style.fontFamily="verdana";
        tempdiv.style.fontSize="1.1em";
        tempdiv.style.fontWeight=900;
        tempdiv.style.zIndex=2147483646;
        tempdiv.style.position="absolute";
        tempdiv.style.top="0px";
        tempdiv.style.left="150px";
        tempdiv.style.padding="5px";
        tempdiv.style.margin="0px";
        tempdiv.style.borderColor="#000000";
        tempdiv.style.borderWidth=2;
        tempdiv.style.borderStyle="solid";
		tempdiv.style.width="250px";
		tempdiv.style.height="350px";
        parent.$("body").append(tempdiv);
        dragstatuswindow(tempdiv);
		statusdiv=tempdiv;
	}
	else {
		
		stext = "";
		stext += "<div style='padding:0px; margin:0px; text-align:center; font-size:1.2em;'>Stats</div>";
        stext += "<div '>";
        //stext += "<p style='font-size:0.8em; font-weight:100;'>Statistics</p>";
		//stext += "<div style='display:inline'>Runtime: </div>";
		stext += "<div onmousedown='parent.$(\"#maincode\")[0].contentWindow.resetStats()' style='display:inline; background-color:#f00'>[reset]</div>";
        stext += "<table style='font-size:0.7em; font-weight:1; padding:5px;'>";
        stext += "<tr>";
        stext += "<td style='font-weight:bold;'>GP/hr:</td>";
        stext += "<td style='text-align:right;'>" + Goldtracker.gph + "</td>";
        stext += "</tr>";
        stext += "<tr>";
        stext += "<td>XP/hr: </td>";
        stext += "<td style='text-align:right;'>" + addComma(XPtracker.xph) + "</td>";
        stext += "</tr>";
        stext += "<tr>";
        stext += "<td>XP TNL: </td>";
        stext += "<td style='text-align:right;'>" + addComma(XPtracker.tnl) + "</td>";
        stext += "</tr>";
        stext += "<tr>";
        stext += "<td>TTL: </td>";
        stext += "<td style='text-align:right;'>" + XPtracker.ttl + "</td>";
        stext += "</tr>";
        stext += "</table>";
        stext += "</div>";
		statusdiv.innerHTML = stext;
	}
}

function dragstatuswindow(elmnt) {    
    elmnt.ondblclick = statusdragMouseDown;
}

function statusdragMouseDown(e) {
      e = e || window.event; e.preventDefault();
      pos3 = e.clientX; pos4 = e.clientY;
      statusdiv.onmousedown = statuscloseDragElement;
      statusdiv.onmousemove = statusDragging;
}

function statusDragging(e) {
	e = e || window.event; 
	e.preventDefault();
	statuswindowpos1 = statuswindowpos3 - e.clientX;
	statuswindowpos2 = statuswindowpos4 - e.clientY;
	windowobj=parent.$("#controlpanel");
	statusmidx=windowobj.width()/2;
	statusmidy=windowobj.height()/2;
	statuswindowpos3 = e.clientX-statusmidx;
	statuswindowpos4 = e.clientY-statusmidy;
	statusdiv.style.top = (statusdiv.offsetTop - statuswindowpos2-statusmidy) + "px";
	statusdiv.style.left = (statusdiv.offsetLeft - statuswindowpos1-statusmidx) + "px";
}

function statuscloseDragElement() {
      statusdiv.ondblclick = statusdragMouseDown;
      statusdiv.onmousemove = null;
      statusdiv.onmousedown = null;
}

function addComma(x)
{
	// replace adds commas even in decimals
	// so break up the number into sections
	// [0] = whole number
	// [1] = decimal
	var sections = x.toString().split(".");
	sections[0] = sections[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",")
	return sections.join(".")
}

function msToTime(duration) {
	var milliseconds = Math.floor((duration % 1000) / 100),
		seconds = Math.floor((duration / 1000) % 60),
		minutes = Math.floor((duration / (1000 * 60)) % 60),
		hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
	
	hours = (hours < 10) ? "0" + hours : hours;
	minutes = (minutes < 10) ? "0" + minutes : minutes;
	seconds = (seconds < 10) ? "0" + seconds : seconds;

  return hours + ":" + minutes + ":" + seconds;
}

