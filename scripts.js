var json_output = {};
var fields = {};
var events = {};
var feature_sets = {};
var action_sets = {};
var action_tables = {};
var action_divs = {};

function set_editable(id, callback){
	var e = document.getElementById(id);
	e.onclick = make_editable_factory(e, id, e.tagName, callback);
	json_output[id] = e.innerHTML.trim();
	fields[id] = e;
	events[id] = callback;
}

function make_editable_factory(e, id, type, callback){
	return function(){
		var field = document.createElement("input");
		field.className = e.className;
		field.id = e.id;
		e.parentNode.insertBefore(field, e);
		field.value = e.innerHTML.trim();
		field.style.width = Math.max(20,e.offsetWidth*1.1);
		field.style.font = e.style.font;
		field.focus();
		field.onblur = revert_to_text_factory(field, id, type, callback);
		e.parentNode.removeChild(e);
	};
}

function revert_to_text_factory(e, id, type, callback){
	return function(){
		var text = document.createElement(type);
		text.className = e.className;	
		text.id = e.id;			
		if(e.value.trim() == "")
			e.value = "???";
		text.innerHTML = e.value.trim();
		text.onclick = make_editable_factory(text, id, type, callback);
		fields[id] = text;
		json_output[id] = e.value.trim();
		e.parentNode.insertBefore(text, e);
		e.parentNode.removeChild(e);
		if(callback !== undefined)
			callback(e.value.trim())
		save_character();
	};
}

function set_stat(id){
	var be = document.getElementById(id+"_bonus");
	set_editable(id, set_bonus_factory(be));
}

function set_bonus_factory(be){
	return function(score){
		var i = Math.floor((parseInt(score)-10)/2);
		be.innerHTML = "";
		if(i >= 0)
			be.innerHTML = "+";
		be.innerHTML += i;
	};
}

function set_features(id){
	json_output[id] = [];
	var e = document.createElement("div");
	var parent = document.getElementById("rightBar");

	add_feature_title(id, e);

	parent.appendChild(e);
	feature_sets[id] = e;
}

function add_feature_title(id, e){
	var title = toTitleCase(id.replace(/_/g, " "));
	var header = document.createElement("h2");

	var btn = document.createElement("span");
	btn.innerHTML = "+";
	btn.className = "button";
	btn.onclick = add_button_factory(id);

	e.className = "section empty";
	e.id = id;

	header.innerHTML = title;
	e.appendChild(header);
	header.appendChild(btn);
	save_character();
}

function add_button_factory (id) {
	return function(){
		add_feature(id, "Feature","...");
		save_character();
	};
}

function remove_button_factory (e,id, feature) {
	return function(){
		var index = json_output[id].indexOf(feature);
		if (index > -1) {
	    	json_output[id].splice(index, 1);
		}
		if(json_output[id].length==0)
			feature_sets[id].className = "section empty";
		e.parentNode.removeChild(e);
		save_character();
	};
}

function add_feature (id, name, description, affect_json) {
	var index = json_output[id].length;
	feature_sets[id].className = "section";

	if(affect_json === undefined)
		affect_json = true;

	var parent = feature_sets[id];
	var div = document.createElement("div");
	var bold = document.createElement("b");
	var list = document.createElement("ul");
	var btn = document.createElement("span");

	var feature = {'name':name, 'description':description};
	if(affect_json){
		json_output[id].push(feature);
	}

	btn.innerHTML = "x";
	btn.className = "button";
	btn.onclick = remove_button_factory(div, id, feature);

	bold.innerHTML = name;
	string_to_items(list, description);
	list.onclick = list_to_textbox_factory(list,id, feature);
	bold.onclick = data_to_field_factory(bold, id, feature);

	div.appendChild(bold);
	div.appendChild(btn);
	div.appendChild(list);
	parent.appendChild(div);

	save_character();
}

function list_to_textbox_factory (e,id, feature) {
	return function(){
		var field = document.createElement("textarea");
		field.className = e.className;
		e.parentNode.insertBefore(field, e);

		console.log(e.innerHTML.trim());
		var text = e.innerHTML.trim()

		text = text.replace(/<ul>(.*?)<\/ul>/g,function(a,b){
			return b.replace(/<li>/g,"(*)")
		})

		text = text.replace(/<li>/g,"").replace(/<\/li>/g,"\n");

		text = text.replace(/\<b\>(\w.*?)\<\/b\>/g, function(a,b){
				return "*"+b+"*";
		});
		text = text.replace(/<\/ul>/g,"");
		text = text.replace(/<ul>/g,"");


		field.innerHTML = text;

		field.style.width = Math.max(20,e.offsetWidth*1.1);
		field.style.height = "100px";
		field.style.font = e.style.font;
		field.focus();
		field.onblur = revert_to_list_factory(field, id, feature);
		e.parentNode.removeChild(e);
	};
}

function revert_to_list_factory(e, id, feature){
	return function(){
		var list = document.createElement("ul");
		list.className = e.className;				

		string_to_items(list, e.value);

		list.onclick = list_to_textbox_factory(list, id, feature);

		feature['description'] = e.value;
		console.log(json_output[id]);

		e.parentNode.insertBefore(list, e);
		e.parentNode.removeChild(e);
		save_character();
	};
}

function string_to_items (list, string) {
	var items = string.split("\n");
	var flag = true;
	var sublist = null;
	for (var i = 0; i < items.length; i++){
		if(items[i].trim().length > 0){
			var li = document.createElement("li");
			var text = items[i].trim();

			text = text.replace(/</g,"&lt;");
			text = text.replace(/>/g,"&gt;");

			var text = text.replace(/\*(\w.*?)\*/g, function(a,b){
				return "<b>"+b+"</b>";
			});


			if(text.indexOf("(*)")!=-1){
				li.innerHTML = text.replace("(*)","");
				if(sublist === null){
					sublist = document.createElement("ul");
					list.appendChild(sublist);
				}
				sublist.appendChild(li);
			}else{
				li.innerHTML = text;
				list.appendChild(li);
				flag = false;
				sublist = null;
			}
		}
	}
	if(flag){
		var li = document.createElement("li");
		li.innerHTML = "???";
		list.appendChild(li);
	}
}

function data_to_field_factory(e,id,feature, data){
	if(data === undefined)
		data = "name";
	return function(){
		var field = document.createElement("input");
		field.className = e.className;
		e.parentNode.insertBefore(field, e);
		field.value = e.innerHTML.trim();
		field.style.width = Math.max(20,e.offsetWidth*1.1);
		field.style.font = e.style.font;
		field.focus();
		field.onblur = revert_to_data_factory(field, id, feature, e.tagName, data);
		e.parentNode.removeChild(e);
	};
}

function revert_to_data_factory(e, id, feature, tag, data){
	return function(){
		var text = document.createElement(tag);
		text.className = e.className;				
		if(e.value.trim() == "")
			e.value = "???";
		text.innerHTML = e.value.trim();
		text.onclick = data_to_field_factory(text, id, feature, data);
		feature[data] = e.value.trim();
		e.parentNode.insertBefore(text, e);
		e.parentNode.removeChild(e);
		save_character();
	};
}

function toTitleCase(str){
    return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}

function load_from_json(string){
	json_output = JSON.parse(string);
	for(key in fields){
		fields[key].innerHTML = json_output[key];
		if(events[key]!=undefined)
			events[key](json_output[key]);
	}

	add_features_in_json();
	save_character();
}

function add_features_in_json () {
	var json = JSON.parse(JSON.stringify(json_output));
	for(key in feature_sets){
		feature_sets[key].innerHTML = "";
		add_feature_title(key, feature_sets[key]);
		feature_sets[key].className = "section empty";
		json_output[key] = [];
		if(json[key] !== undefined) for(var i = 0; i < json[key].length; i++){
			var feature = json[key][i];
			add_feature(key, feature.name, feature.description);
		}
	}
	for(key in action_sets){
		action_sets[key].innerHTML = "";
		json_output[key] = [];
		if(json[key] !== undefined) for(var i = 0; i < json[key].length; i++){
			var action_orig = json[key][i];
			var action = add_action(key, action_orig.name, action_orig.description);
			for(var j = 0; j<action_orig.info.length; j++){
				var info = action_orig.info[j];
				add_action_info(action_divs[action],key,action_tables[action],action,info.name, info.data);
			}
		}
	}
}

function set_action_set(id){
	json_output[id] = [];
	action_sets[id] = document.getElementById(id);
	var btn = document.getElementById(id+"_add");
	btn.onclick = function(){
		add_action(id, "Action","Info","???");
	};
	set_editable(id+"_notes",function(string){
		if(!string || string == '' || string == '???'){
			document.getElementById(id+"_notes").innerHTML = 'notes...';
			document.getElementById(id+"_notes").className = '';
			document.getElementById(id+"_notes").className = 'notes empty';
		}else{
			document.getElementById(id+"_notes").className = '';
			document.getElementById(id+"_notes").className = 'notes';
		}
	});
}

function add_action(id, name, info_name, data){
	document.getElementById(id+"_section").className = "section";
	var action = {name:name, info:[]};

	var table = document.createElement("table")
	var title = document.createElement("h3");
	var editable_title = document.createElement("span");
	var e = document.createElement("div");
	var btn = document.createElement("span");

	btn.className = "button";
	btn.innerHTML = "+";
	btn.onclick = function(){
		add_action_info(e,id,table,action,"info", "???");
	}
 	
 	editable_title.onclick = data_to_field_factory(editable_title, id, action);
	editable_title.innerHTML = name;
	action_sets[id].appendChild(e);
	e.appendChild(title);
	title.appendChild(editable_title);
	title.appendChild(btn);
	e.appendChild(table);
	json_output[id].push(action);

	action_tables[action] = table;
	action_divs[action] = e;

	if(info_name !== undefined)
		add_action_info(e,id,table,action,info_name, data);

	save_character();
	return action;
}

function add_action_info(e,id,table,action, name, data){
	var data_object = {name:name, data:data};
	action.info.push(data_object);

	var row = document.createElement("tr");
	var name_item = document.createElement("td");
	var data_item = document.createElement("td");
	var btn_item = document.createElement("td");
	var btn = document.createElement("span");

	btn.innerHTML ="x";
	btn.className ="button"

	btn.onclick = function(){
		remove_action_info(table,row,e,id,action,data_object);
	};

	name_item.innerHTML = name;
	name_item.onclick = data_to_field_factory(name_item, id, data_object);
	data_item.innerHTML = data;
	data_item.onclick = data_to_field_factory(data_item, id, data_object,"data");
	btn_item.appendChild(btn);

	row.appendChild(name_item);
	row.appendChild(data_item);
	row.appendChild(btn_item);
	table.appendChild(row);

	save_character();
}

function remove_action_info(table,row,e,id,action,data_object){
	row.parentNode.removeChild(row);
	var i = action.info.indexOf(data_object);
	action.info.splice(i, 1);
	if(action.info.length == 0){
		i = json_output[id].indexOf(action);
		json_output[id].splice(i,1);
		e.parentNode.removeChild(e);
		if(json_output[id].length == 0){
			document.getElementById(id+"_section").className="section empty";
		}
	}
	save_character();
}

function save_character(){
	window.localStorage.character = JSON.stringify(json_output);
}

window.onload = function(){
	var loaded_character = localStorage["character"];

	set_editable("name");
	set_editable("armor_class");
	set_editable("armor_equiped");
	set_editable("hit_points");
	set_editable("hit_die");
	set_editable("proficiency", function(prof){
		document.getElementById("prof_copy").innerHTML = prof;
	});
	set_editable("weapon_proficiencies");
	set_editable("armor_proficiencies");
	set_editable("saving_throw_proficiencies",function(saving_throws){
		var abiltites = ["strength","dexterity","constituion","wisdom","charisma","intelligence"];
		for(var i = 0; i < abiltites.length;  i++){
			var ab = abiltites[i];
			var regex = "/"+ab+"/i";
			if(saving_throws.toLowerCase().indexOf(ab) == -1)document.getElementById(ab+"_saving_throw").innerHTML = "";
			else document.getElementById(ab+"_saving_throw").innerHTML = "*";
		}
	});
	set_editable("skill_proficiencies");
	set_stat("strength");
	set_stat("dexterity");
	set_stat("constituion");
	set_stat("wisdom");
	set_stat("charisma");
	set_stat("intelligence");

	set_features("racial_features");
	set_features("class_features");
	set_features("background_features");
	set_action_set("actions");
	set_action_set("bonus_actions");
	set_action_set("reactions");

	document.getElementById("export_button").onclick = function(){
		document.getElementById('export_popup').className = 'popup';
		document.getElementById('export').value = JSON.stringify(json_output);
	}

	document.getElementById("import_button").onclick = function(){
		load_from_json(window.prompt("Enter Valid JSON character data:"));
	}

	document.getElementById("import_close").onclick = function(){
		document.getElementById('export_popup').className = 'popup closed';
		
	}

	document.getElementById("clear_button").onclick = function(){
		var string = document.getElementById('blank_character').innerHTML;
		load_from_json(string);
	}

	if(!loaded_character){
		var string = document.getElementById('default_character').innerHTML;
		load_from_json(string);
	}else{
		load_from_json(loaded_character);
	}

}