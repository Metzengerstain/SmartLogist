const CONTAINER_LENGTH = 12.02, CONTAINER_WIDTH = 2.35, CONTAINER_HEIGTH = 2.7;
const COL_GOODS_ID = 0, COL_NAME = 1, COL_FRAGILE = 2, COL_DENSITY = 3, COL_WEIGTH = 4, COL_VOLUME = 5, COL_ITEM_WEIGTH = 6;
const COL_NUMBER_OF_BOXES = 7, COL_ITEMS_IN_BOX = 8, COL_NUMBER_OF_ITEMS = 9, COL_NET_WEIGTH = 10, COL_POS_WEIGTH = 11, COL_POS_VOL = 12;
const DENSITY_THRESHOLD = 1.1, SUPER_HEAVY_THRESHOLD = 6;
const NUMBER_OF_BLOCKS = 6, BLOCK_WIDTH = 2, MAX_BLOCK_VOLUME = parseFloat((BLOCK_WIDTH * CONTAINER_WIDTH * CONTAINER_HEIGTH).toFixed(2), 10);
const MAX_VOL_LVL_1 = 30, BEST_VOL_LVL_1 = 25, MAX_HEIGHT_LVL_1 = 1;	//ограничение для 1го уровня, чтобы оставить около 1.7 м для работы на 2-м 

var user_data = [], Join_Positions_1 = true, Join_Positions_2 = false, Min_Block_Len_1 = BLOCK_WIDTH, Min_Block_Len_2 = BLOCK_WIDTH, Density_Threshold = DENSITY_THRESHOLD;

function change_param() {
	var res;
	switch (event.target.id) {
		case 'join_positions_1':
			Join_Positions_1 = !Join_Positions_1;
			res = document.getElementById('div_min_block_len_1');
			if (res.style.visibility == "visible") { 
				res.style.visibility = "hidden"; 
			} else { 
				res.style.visibility = "visible";
				res = document.getElementById('min_block_len_1'); 
				res.value = Min_Block_Len_1;
			}
			break;
		case 'join_positions_2':
			Join_Positions_2 = !Join_Positions_2;
			res = document.getElementById('div_min_block_len_2');
			if (res.style.visibility == "visible") { 
				res.style.visibility = "hidden"; 
			} else { 
				res.style.visibility = "visible";
				res = document.getElementById('min_block_len_2'); 
				res.value = Min_Block_Len_1;
			}			
			break;
		case 'min_block_len_1':
			res = document.getElementById(event.target.id);
			Min_Block_Len_1 = parseFloat(res.value, 10);
			break;
		case 'min_block_len_2':
			res = document.getElementById(event.target.id);
			Min_Block_Len_2 = parseFloat(res.value, 10);
			break;
		case 'density_threshold':
			res = document.getElementById(event.target.id);
			Density_Threshold = res.value;
			res = document.getElementById('gv_trshld_show');
			res.value = Density_Threshold;
			break;
		case 'gv_trshld_show':
			res = document.getElementById(event.target.id);
			res.value = Density_Threshold;
			break;
		default :
			alert('Нет обработчика для элемента ' + event.target.id);	
	}
}
	
function calcLoad() {
	calcLoad3(user_data);
}

function calcLoad3(data_arr) {
	if (user_data.length ==  0) { alert('Загрузите данные!'); return; }
	var res = document.getElementById('results');
	
	res.innerHTML = 'Всего позиций: ' + data_arr.length;
	res.innerHTML += ' Общий объём: ' + data_arr.reduce(function(sum, current){ return sum+parseFloat(current[COL_POS_VOL],10); }, 0).toFixed(2);
	res.innerHTML += ' Общий вес: ' + data_arr.reduce(function(sum, current){ return sum+parseFloat(current[COL_POS_WEIGTH],10); }, 0).toFixed(2) + '</br>';

	ClearAllTables();
		
    var hdr = [['Блок','№№ позиции','Кол. коробок','Вес','Объём','Г/В','Длина','Высота'],['Вес','Объём'],['Голова','Хвост','Разница'],['№ позиции', 'Наименование позиции', 'Xp','G/V','Вес кор.','Кубы','Вес шт.','Кол. коробок','В кор.','Всего','Нетто','Брутто','Объём','Цена стр.'],['Г/Х','Вес','Объём']];
	var data_1_level = data_arr.filter(function(current){ return current[COL_DENSITY] > Density_Threshold; })	//фильтр по плотности

	var result = MakeLowLev_v4(data_1_level); 
	var level1 = result[0], extra_pos = result[1];
	var balance1 = CalcBalance3(level1);
	var bal_wgth = balance1[1][0] - balance1[0][0]; //если голова тяжелее, значение будет отрицательным
	var heigth_1_lvl = parseFloat(level1[level1.length - 1]["heigth"], 10);

	res.innerHTML += 'Высота нижнего ряда: ' + heigth_1_lvl + ' ';		
	res.innerHTML += 'Количество блоков: ' + level1[level1.length - 1]["block_num"] + ' ';
	res.innerHTML += 'Объём нижнего ряда: ' + level1.reduce(function(sum, current){ return sum+parseFloat(current['vol'],10); }, 0).toFixed(2) + ' ';
	res.innerHTML += 'Баланс нижнего ряда: ' + bal_wgth.toFixed(2) + '</br>';		
	
	DrawTableInBlock(level1, "load_lev1", hdr[0]);
	DrawTableInBlock(balance1, "balance1", hdr[1]);
	DrawTableInBlock(extra_pos, "extra_1_LVL", hdr[3]);
	
// 	Верхний уровень загрузки  \/
	var data_2_level = data_arr.filter(function(current){ return current[COL_DENSITY] <= Density_Threshold; }).concat(extra_pos);
	result = MakeHiLev_v4(data_2_level, level1, CONTAINER_HEIGTH - heigth_1_lvl, bal_wgth);
	var level2 = result[0];
	var sgruz  = result[1];
	var balance2 = CalcBalance3(level2);
	var balance3 = BalanceTotal(balance1,balance2);
	
	res.innerHTML += 'Высота верхнего ряда: ' + (CONTAINER_HEIGTH - heigth_1_lvl).toFixed(2) + ' ';		
	res.innerHTML += 'Количество блоков: ' + level2.length + ' ';
	res.innerHTML += 'Объём верхнего ряда: ' + level2.reduce(function(sum, current){ return sum+parseFloat(current['vol'],10); }, 0).toFixed(2) + '</br>';
	res.innerHTML += 'Баланс: ' + (1 * balance3[1][1] - 1 * balance3[0][1]).toFixed(2) + '</br>';

	DrawTableInBlock(level2, "load_lev2", hdr[0]);	
	DrawTableInBlock(balance2, "balance2", hdr[1]);
	DrawTableInBlock(balance3, "balance", hdr[4]);
	DrawTableInBlock(sgruz, "sgruz", hdr[3]);
} //CalcLoad3

function CalcBalance3(in_arr) {
	var total_len = in_arr.reduce(function(sum, current){ return sum + parseFloat(current["len"], 10); }, 0);
	var len = 0, left_wgt = 0, left_vol = 0, right_wgt = 0, right_vol = 0;
	for (var i = 0; i < in_arr.length; i++) {
		if (len + in_arr[i]["len"] * 1 < total_len / 2) {
			left_wgt += in_arr[i]["weigth"] * 1;
			left_vol += in_arr[i]["vol"] * 1;
		} else if (len < total_len / 2) {
			left_wgt += (total_len / 2 - len) / (1 * in_arr[i]["len"]) * (1 * in_arr[i]["weigth"]);
			left_vol += (total_len / 2 - len) / (1 * in_arr[i]["len"]) * (1 * in_arr[i]["vol"]);
			right_wgt += (len + 1 * in_arr[i]["len"] - (total_len / 2)) / (1 * in_arr[i]["len"]) * (1 * in_arr[i]["weigth"]);
			right_vol += (len + 1 * in_arr[i]["len"] - (total_len / 2)) / (1 * in_arr[i]["len"]) * (1 * in_arr[i]["vol"]);
		} else {
			right_wgt += in_arr[i]["weigth"] * 1;
			right_vol += in_arr[i]["vol"] * 1;
		}
		len += in_arr[i]["len"] * 1;		
	}
	return [[parseFloat(left_wgt.toFixed(2)), parseFloat(left_vol.toFixed(2))], [parseFloat(right_wgt.toFixed(2)), parseFloat(right_vol.toFixed(2))]];
} //CalcBalance3

function block_balance(item, cur_len, item_len, item_heigth, total_len, L_R) {
	var bal = 0, mid = total_len/2, square = CONTAINER_WIDTH * item_heigth, item_weigth = item[COL_POS_WEIGTH] * 1;
	var x1 = cur_len > mid ? mid : cur_len;
	var y1 = cur_len + item_len > mid ? mid : cur_len + item_len;
	var z1 = y1 - x1;
	var x2 = cur_len < mid ? mid : cur_len;
	var y2 = cur_len + item_len < mid ? mid : cur_len + item_len;
	var z2 = y2 - x2;
/*	if (L_R == 'R' || L_R == 'r') { bal = z1 / item_len * item_weigth - z2 / item_len * item_weigth; }
	else if (L_R == 'L' || L_R == 'l') { bal = z2 / item_len * item_weigth - z1 / item_len * item_weigth; }
	else { throw new SyntaxError('Wrong parameter L_R in block_balance()!'); }
*/
	bal = (z1-z2)*item_weigth*item_len;
	return bal;
} //block_balance()

function MakeHiLev_v4(in_arr, level1, max_heigth, cur_balance) {
	var balance_1_lev = cur_balance;
	var max_vol = CONTAINER_LENGTH * CONTAINER_WIDTH * max_heigth;
	var total_len 	 = in_arr.reduce(function(sum, current){ return sum + parseFloat(current[COL_POS_VOL] / CONTAINER_WIDTH / max_heigth, 10); }, 0);
	var weigth_1_lvl = level1.reduce(function(sum, current){ return sum + parseFloat(current['weigth'], 10); }, 0);
	var weigth_2_lvl = in_arr.reduce(function(sum, current){ return sum + parseFloat(current[COL_POS_WEIGTH], 10); }, 0);
	var vol_2_lvl 	 = in_arr.reduce(function(sum, current){ return sum + parseFloat(current[COL_POS_VOL], 10); }, 0);
	var min_blk_vol = CONTAINER_WIDTH * BLOCK_WIDTH * max_heigth;
	var out_arr = [], sgruz = [], curr_weigth = 0, total_vol = 0;
	if (Join_Positions_2) {
		min_blk_vol = CONTAINER_WIDTH * Min_Block_Len_2 * max_heigth;
		var jb = join_blocks(in_arr, min_blk_vol, vol_2_lvl);
		var in_arr10 = jb[0].sort(function(b1, b2){ return parseFloat(b1[COL_POS_WEIGTH],10) < parseFloat(b2[COL_POS_WEIGTH],10) ? 1 : parseFloat(b2[COL_POS_WEIGTH],10) > parseFloat(b1[COL_POS_WEIGTH],10) ? -1 : 0}); 
		sgruz = jb[1];
	} else { var in_arr10 = in_arr.sort(function(b1, b2){ return parseFloat(b1[COL_POS_WEIGTH],10) < parseFloat(b2[COL_POS_WEIGTH],10) ? 1 : parseFloat(b2[COL_POS_WEIGTH],10) > parseFloat(b1[COL_POS_WEIGTH],10) ? -1 : 0}); }		
	
	var vol_arr = in_arr10.reduce(function(sum, current){ return sum + parseFloat(current[COL_POS_VOL], 10); }, 0);
	var vol_sgruz = sgruz.reduce(function(sum, current){ return sum + parseFloat(current[COL_POS_VOL], 10); }, 0);
	// debugger;
	var dbgr='',dbgl='';
	var l_idx = 0,	r_idx = in_arr10.length - 1, l_len = 0, r_len = 0, pos_len = 0, bb = 0;
	for (var i = 0; i < in_arr10.length; i++) {
		pos_len = 1 * in_arr10[i][COL_POS_VOL] / max_heigth / CONTAINER_WIDTH;
		if(total_vol + parseFloat(in_arr10[i][COL_POS_VOL], 10) <= max_vol) {
			//добавить найденный блок в выходной массив. выбираем, ставить в голову или в хвост
			if ((cur_balance - 1 * in_arr10[i][COL_POS_WEIGTH]) < 0 || Math.abs(cur_balance + 1 * in_arr10[i][COL_POS_WEIGTH]) < Math.abs(cur_balance - 1 * in_arr10[i][COL_POS_WEIGTH])) {
				block_num = r_idx;
				r_idx --;
				bb = block_balance(in_arr10[i], r_len, pos_len, max_heigth, total_len, 'R');
				//if (bb<0) alert('!');
				cur_balance += bb;
				r_len += pos_len;
				dbgr += '+' + bb;
			} else {
				block_num = l_idx;
				l_idx ++;
				bb = block_balance(in_arr10[i], l_len, pos_len, max_heigth, total_len, 'L');
				cur_balance -= bb;
				l_len += pos_len;
				dbgl += '-' + bb;			}
			out_arr[block_num] = [];		
			out_arr[block_num]["block_num"] = block_num + 1;
			out_arr[block_num]["id"] 		= in_arr10[i][COL_GOODS_ID];
			out_arr[block_num]["boxes"] 	= in_arr10[i][COL_NUMBER_OF_BOXES];
			out_arr[block_num]["weigth"] 	= in_arr10[i][COL_POS_WEIGTH] * 1 ;
			out_arr[block_num]["vol"] 		= in_arr10[i][COL_POS_VOL] * 1;
			out_arr[block_num]["G/V"] 		= in_arr10[i][COL_DENSITY];
			out_arr[block_num]["len"] 		= (in_arr10[i][COL_POS_VOL] / CONTAINER_WIDTH / max_heigth).toFixed(2);
			out_arr[block_num]["heigth"] 	= max_heigth.toFixed(2);
			total_vol 						+= 1 * in_arr10[i][COL_POS_VOL];
			// curr_weigth 					+= 1 * in_arr10[i][COL_POS_WEIGTH];
		} else { 
			sgruz.push(in_arr10[i]); 
		}
	} //for

//alert(cur_balance);
	var BBB = CalcBalance3(out_arr);
	cur_balance = BBB[1][0] - BBB[0][0] + balance_1_lev;
	var loop_cnt = 0, swap = [], swap_cnt = 0;
	r_idx = (out_arr.length - (out_arr.length % 2)) / 2 + (out_arr.length % 2); //начать с середины + 1
	while ((cur_balance < 0 || Math.abs(cur_balance) > 10) && loop_cnt < 1000 && r_idx < out_arr.length) { //если баланс плох, "играем в тетрис"
		loop_cnt++;
		l_idx = (out_arr.length - (out_arr.length % 2)) / 2;// - 1;	//начать с середины - 1
		while (l_idx >= 0) { //ищем блок из головы легче, чем текущий из хвоста
			var try_arr = out_arr.slice();
			swap = try_arr[l_idx];
			try_arr[l_idx] = try_arr[r_idx];
			try_arr[r_idx] = swap;
			BBB = CalcBalance3(try_arr);
			var try_bal = BBB[1][0] - BBB[0][0] + balance_1_lev;
			// if ( (try_bal > 0) && (Math.abs(try_bal) < Math.abs(cur_balance)) ) {
			if ((cur_balance < 0 && try_bal > 0) || (Math.abs(try_bal) < Math.abs(cur_balance))) {
				swap = out_arr[l_idx];
				out_arr[l_idx] = out_arr[r_idx];
				out_arr[r_idx] = swap;
				swap_cnt ++;
				BBB = CalcBalance3(out_arr);
				cur_balance = BBB[1][0] - BBB[0][0] + balance_1_lev;
				break;
			}
			l_idx --;
		}
		r_idx++;
		if (cur_balance == 0) { break; }
		if (r_idx == out_arr.length - 1) { r_idx = (out_arr.length - (out_arr.length % 2)) / 2 + (out_arr.length % 2); } //вернуться для еще 1й попытки сортировки
	} //тетрис
	alert('Количество перестановок: ' + swap_cnt);
	for (i = 0; i < out_arr.length; i++) {
		out_arr[i]['block_num'] = i + 1;
	}
	return [out_arr, sgruz];
} //MakeHiLev_v4

function MakeHiLev_v3(in_arr, level1, max_heigth) {
	var out_arr = [], sgruz = [];
	var weigth_1_lvl = level1.reduce(function(sum, current){ return sum + parseFloat(current['weigth'], 10); }, 0);
	var weigth_2_lvl = in_arr.reduce(function(sum, current){ return sum + parseFloat(current[COL_POS_WEIGTH], 10); }, 0);
	var avg_wgt_1m = (weigth_1_lvl + weigth_2_lvl) / 12;
	var max_vol = CONTAINER_LENGTH * CONTAINER_WIDTH * max_heigth, total_vol = 0;
	//var data = in_arr.sort(function(curr, next){ return curr[COL_POS_DENSITY] > next[COL_POS_DENSITY] ? -1 : curr[COL_POS_DENSITY] < next[COL_POS_DENSITY]} ? 1 : 0);
	var data = in_arr.slice();
	var free_space = 0, best_weigth = 0, curr_weigth = 0, best_GV = 0, min_block_GV_1_lvl = 0, best_block_id = 0;
	for (var i = 0; i < level1.length; i++) {
		free_space =  level1[i]["len"] * CONTAINER_WIDTH * max_heigth;
		best_weigth = level1[i]["len"] * avg_wgt_1m - (1 * level1[i]["weigth"]);
		curr_weigth = 0;
		// best_GV = best_weigth / free_space / 100;
		min_block_GV_1_lvl = level1[i]["G/V"].toString().split(";").reduce(function(min, curr){ return parseFloat(min) >= parseFloat(curr) ? parseFloat(curr) : parseFloat(min)});

		var loop_cnt = 0;
		while(!(curr_weigth >= best_weigth || loop_cnt > in_arr.length)) {	 //eternal loop
			loop_cnt++;
			//ищем блок наиболее подходящий по весу и с ГВ не больше, чем внизу
			best_block_id = in_arr.filter(function(itm){ return typeof(itm) != 'undefined'; })
				.reduce(function(id, curr, index, arr){ 
				if(typeof(arr[index]["del"]) ==  'undefined' && (arr[index][COL_DENSITY] <= min_block_GV_1_lvl) && 
					(Math.abs(arr[id][COL_POS_WEIGTH] - best_weigth) > Math.abs(arr[index][COL_POS_WEIGTH] - best_weigth)))	
					return index; else return id;
			}, 0);

			if(total_vol + in_arr[best_block_id][COL_POS_VOL] <= max_vol){
			//добавить найденный блок в выходной массив
				block_num = i;
				out_arr[block_num] = [];		
				out_arr[block_num]["block_num"] = block_num + 1;
				out_arr[block_num]["id"] 		= in_arr[best_block_id][COL_GOODS_ID];
				out_arr[block_num]["boxes"] 	= in_arr[best_block_id][COL_NUMBER_OF_BOXES];
				out_arr[block_num]["weigth"] 	= in_arr[best_block_id][COL_POS_WEIGTH];
				out_arr[block_num]["vol"] 		= in_arr[best_block_id][COL_POS_VOL];
				out_arr[block_num]["G/V"] 		= in_arr[best_block_id][COL_DENSITY];
				out_arr[block_num]["len"] 		= (in_arr[best_block_id][COL_POS_VOL] / CONTAINER_WIDTH / max_heigth).toFixed(2);
				out_arr[block_num]["heigth"] 	= max_heigth.toFixed(2);
				total_vol 						+= 1 * in_arr[best_block_id][COL_POS_VOL];
				curr_weigth 					+= 1 * in_arr[best_block_id][COL_POS_WEIGTH];
				in_arr[best_block_id]["del"]	= "Deleted";
			} else { 
				sgruz.push(in_arr[best_block_id]); 
				in_arr[best_block_id]["del"] = "Deleted";
			}
			//?если он выступает за границу нижнего, проверить ГВ следующего блока внизу
		}
	}
	return [out_arr, sgruz];
} //MakeHiLev_v3

function BalanceTotal(a1, a2){
	var res = [], line = [];
	for(var i = 0; i < a1.length; i++){
		line = [];
		if(i%2 == 0) line[0]='Голова'; else line[0]='Хвост';
		for(var j = 0; j < a2.length; j++) {
			line[j+1] = (a1[i][j] + a2[i][j]).toFixed(2);
		}
		res.push(line);
	}
	return res;
}

function join_blocks(data, min_blk_vol, max_level_vol) { //объединяет маленькие блоки; все что не помещаются в объем ряда, помещает в отдельный массив
	data.sort(function(item1, item2){
//		return item1[COL_DENSITY] < item2[COL_DENSITY] ? -1 : item1[COL_DENSITY] > item2[COL_DENSITY] ? 1 : 0;   //возрастание ГВ
		return item1[COL_DENSITY] < item2[COL_DENSITY] ? 1 : item1[COL_DENSITY] > item2[COL_DENSITY] ? -1 : 0;   //убываниe ГВ
	}); 

	var item, len = data.length, vol_total = 0, overload = [];
	for (var i = 0; i < len; i++) {	
		if ( (vol_total + data[i][COL_POS_VOL] > max_level_vol) || (vol_total >= BEST_VOL_LVL_1) ) { //превышен макс объём нижнего ряда?
			overload.push(data[i]);
			data[i] = 'undefined';
			continue;
		}
		vol_total += data[i][COL_POS_VOL];

		if (data[i][COL_POS_VOL] < min_blk_vol) {			
			if (item == 'undefined' || typeof(item) == 'undefined') {
				item = data[i].slice();
			} else {
				item[0] += ';' + data[i][0];
				item[1] += ';' + data[i][1];
				item[2] += ';' + data[i][2];
				item[3] += ';' + data[i][3];
				item[4] += ';' + data[i][4];
				item[5] += ';' + data[i][5];
				item[6] += ';' + data[i][6];
				item[7] += ';' + data[i][7];
				item[8] += ';' + data[i][8];
				item[9] += ';' + data[i][9];
				item[10] = (parseFloat(item[10], 10) + parseFloat(data[i][10], 10)).toFixed(2); //NETTO  
				item[11] = (parseFloat(item[11], 10) + parseFloat(data[i][11], 10)).toFixed(2); //BRUTTO
				item[12] = (parseFloat(item[12], 10) + parseFloat(data[i][12], 10)).toFixed(2); //VOLUME
				item[13] += ';' + data[i][13];
				item[14] = 'Mixed';
		    }
			data[i] = 'undefined';
			if (item[COL_POS_VOL] >= min_blk_vol || i == len - 1) {
				data.push(item);
				item = 'undefined';
			}
		}
	} //for
	if (item != 'undefined' && typeof(item) != 'undefined' /*08.01.18*/) {	//если остался нераспределенный блок, найти ему самый легкий, подходящий по Г/В
		var id = 0,  done = false, cur_wgth = 0;
		for (i = 0; i < data.length; i++) {
			if (data[i] == 'undefined') continue;
			var is_GV_fit = false;
			var GVs = data[i][COL_DENSITY].toString().split(';');				///
			for (var j = 0; j < GVs.length; j++) {
				if(Math.abs(item[COL_DENSITY] - GVs[j]) <= 0.2) is_GV_fit = true;
			}
			if (is_GV_fit && (data[i][COL_POS_WEIGTH] < cur_wgth || cur_wgth == 0)) {
				cur_wgth = data[i][COL_POS_WEIGTH];
				id = i;
				done = true;
			}
		}
	
		if (!done) data.push(item);	
		else {
			data[id][0] += ';' + item[0] 
			data[id][1] += ';' + item[1] 
			data[id][2] += ';' + item[2] 
			data[id][3] += ';' + item[3] 
			data[id][4] += ';' + item[4] 
			data[id][5] += ';' + item[5] 
			data[id][6] += ';' + item[6] 
			data[id][7] += ';' + item[7] 
			data[id][8] += ';' + item[8] 
			data[id][9] += ';' + item[9] 
			data[id][10] = (parseFloat(data[id][10], 10) + parseFloat(item[10], 10)).toFixed(2);
			data[id][11] = (parseFloat(data[id][11], 10) + parseFloat(item[11], 10)).toFixed(2);
			data[id][12] = (parseFloat(data[id][12], 10) + parseFloat(item[12], 10)).toFixed(2);
			data[id][13] += ';' + item[13]
			data[id][14] = 'Mixed';			
		}
	}	//if
	var dataflt = data.filter(function(current) { return current != 'undefined'; }); 
	return [dataflt, overload];
} //join_blocks()

function MakeLowLev_v4(in_arr0) {	//изменение: блоки начинаем расставлять от центра в обе стороны для загрузки сверхтяжей, начиная с самого большого ГВ и чередуя с самым маленьким ГВ
	var sum_volume_1 = in_arr0.reduce(function(sum, current) {
		return sum + current[COL_POS_VOL];}, 0);
		
	var block_heigth = sum_volume_1 > MAX_VOL_LVL_1 ? MAX_HEIGHT_LVL_1 : (sum_volume_1 / (CONTAINER_LENGTH * CONTAINER_WIDTH)).toFixed(2);

	var sum_weigth_1 = in_arr0.reduce(function(sum, current) {
		return sum + current[COL_POS_WEIGTH];
	},0 );
	var avg_weigth = sum_weigth_1 / in_arr0.length;

	//объединение маленьких позиций
	var in_arr20 = [], jb = [], overload = [];
	var min_blk_vol = CONTAINER_WIDTH * BLOCK_WIDTH * block_heigth;	
	if (Join_Positions_1) {
		min_blk_vol = CONTAINER_WIDTH * Min_Block_Len_1 * block_heigth;	
		jb = join_blocks(in_arr0, min_blk_vol, MAX_VOL_LVL_1);
		in_arr20 = jb[0];
		overload = jb[1];
	} else {
		jb = join_blocks(in_arr0, 0, MAX_VOL_LVL_1);
		in_arr20 = jb[0];
		overload = jb[1];
	}	

	//Сортировка по среднему ГВ	
	in_arr20.sort(function(i1,i2){
		var GVarr = i1[COL_DENSITY].toString().split(";")
		var GV1 = GVarr.reduce(function(sum, curr){ return sum  + parseFloat(curr);}, 0) / GVarr.length;
		GVarr = i2[COL_DENSITY].toString().split(";")
		var GV2 = GVarr.reduce(function(sum, curr){ return sum  + parseFloat(curr);}, 0) / GVarr.length;
		return GV1 < GV2 ? 1 : -1;
	});
	
	//Сортировка ТЛТ, начиная с середины	
	var out_arr = [], block_num = 0, last_block = in_arr20.length - 1, block_length = 0, delta = 0, index = 0;
	if (in_arr20.length % 2 == 0)  var mid = in_arr20.length / 2; else var mid = (in_arr20.length - (in_arr20.length % 2)) / 2;
	var direct_hv = 'right', direct_lt = 'right', delta_hv = 0, delta_lt = 0, idx_hv = 0, idx_lt = last_block;
	for (var i = 0; i < in_arr20.length; i++) {
		if (i % 2 == 0) {						//четный шаг - берем блок из головы ("тяжелый")
			if (direct_hv == 'left') {
				block_num = mid - delta_hv < 0 ? 0 : mid - delta_hv;
				direct_hv = 'right';
			} else {
				block_num = mid + delta_hv;
				direct_hv = 'left';
				delta_hv += 2;
			}
			index = idx_hv;
			idx_hv++;
		} else {								//нечетный шаг - берем блок из хвоста ("легкий")
			if (direct_lt == 'left') {
				block_num = mid + 1 - delta_lt;
				direct_lt = 'right';
			} else {
				block_num = mid + 1 + delta_lt;
				direct_lt = 'left';
				delta_lt += 2;
			}
			index = idx_lt;
			idx_lt--;
		}
		
		out_arr[block_num] = [];		
		out_arr[block_num]["block_num"] = block_num + 1;
		out_arr[block_num]["id"] = in_arr20[index][COL_GOODS_ID];
		out_arr[block_num]["boxes"] = in_arr20[index][COL_NUMBER_OF_BOXES];
		out_arr[block_num]["weigth"] = in_arr20[index][COL_POS_WEIGTH];
		out_arr[block_num]["vol"] = in_arr20[index][COL_POS_VOL];
		out_arr[block_num]["G/V"] = in_arr20[index][COL_DENSITY];
		block_length = (in_arr20[index][COL_POS_VOL] / CONTAINER_WIDTH / block_heigth).toFixed(2);
		out_arr[block_num]["len"] = block_length;
		out_arr[block_num]["heigth"] = block_heigth;
	}

	return [out_arr, overload];
}   //MakeLowLev_v4

function MakeLowLev_v3(in_arr0) {
	var sum_volume_1 = in_arr0.reduce(function(sum, current) {
		return sum + current[COL_POS_VOL];}, 0);
		
	var block_heigth = sum_volume_1 > MAX_VOL_LVL_1 ? MAX_HEIGHT_LVL_1 : (sum_volume_1 / (CONTAINER_LENGTH * CONTAINER_WIDTH)).toFixed(2);

	var sum_weigth_1 = in_arr0.reduce(function(sum, current) {
		return sum + current[COL_POS_WEIGTH];
	},0 );
	var avg_weigth = sum_weigth_1 / in_arr0.length;

	//разбивка слишком объёмных позиций. Нужно добавить анализ, чтобы после разбиения блок не был меньше минимума
/*	for (var i = 0; i < in_arr0.length; i++) {	
		if (in_arr0[i][COL_POS_WEIGTH] > avg_weigth * 2) {
			in_arr0[i] = split_block(in_arr0[i]);
		}
	}
*/	
	//объединение маленьких позиций
	var in_arr20 = [], jb = [], overload = [];
	var min_blk_vol = CONTAINER_WIDTH * BLOCK_WIDTH * block_heigth;	
	if (Join_Positions_1) {
		min_blk_vol = CONTAINER_WIDTH * Min_Block_Len_1 * block_heigth;	
		jb = join_blocks(in_arr0, min_blk_vol, MAX_VOL_LVL_1);
		in_arr20 = jb[0];
		overload = jb[1];
	} else {
//		in_arr20 = in_arr0.slice(0);
		jb = join_blocks(in_arr0, 0, MAX_VOL_LVL_1);
		in_arr20 = jb[0];
		overload = jb[1];
	}	

	//Сортировка по среднему ГВ	
	in_arr20.sort(function(i1,i2){
		var GVarr = i1[COL_DENSITY].toString().split(";")
		var GV1 = GVarr.reduce(function(sum, curr){ return sum  + parseFloat(curr);}, 0) / GVarr.length;
		GVarr = i2[COL_DENSITY].toString().split(";")
		var GV2 = GVarr.reduce(function(sum, curr){ return sum  + parseFloat(curr);}, 0) / GVarr.length;
		return GV1 < GV2 ? -1 : 1;
	});
	
	//Сортировка ТЛТ	
	var out_arr = [], block_num = 0, last_block = in_arr20.length - 1, block_length = 0;
	if (in_arr20.length % 2 == 0)  var mid = in_arr20.length / 2; else var mid = (in_arr20.length - (in_arr20.length % 2)) / 2;

	for (var i = 0; i < mid; i++) {
		// block_num = (i % 2 == 0) ? i : in_arr.length - 1;
		block_num = i * 2;	//блок из головы
		out_arr[block_num] = [];		
		out_arr[block_num]["block_num"] = block_num + 1;
		out_arr[block_num]["id"] = in_arr20[i][COL_GOODS_ID];
		out_arr[block_num]["boxes"] = in_arr20[i][COL_NUMBER_OF_BOXES];
		out_arr[block_num]["weigth"] = in_arr20[i][COL_POS_WEIGTH];
		out_arr[block_num]["vol"] = in_arr20[i][COL_POS_VOL];
		out_arr[block_num]["G/V"] = in_arr20[i][COL_DENSITY];
		block_length = (in_arr20[i][COL_POS_VOL] / CONTAINER_WIDTH / block_heigth).toFixed(2);
		out_arr[block_num]["len"] = block_length;
		out_arr[block_num]["heigth"] = block_heigth;

		block_num = i * 2 + 1;	//блок из хвоста
		out_arr[block_num] = [];		
		out_arr[block_num]["block_num"] = block_num + 1;		
		out_arr[block_num]["id"] = in_arr20[last_block - i][COL_GOODS_ID];		
		out_arr[block_num]["boxes"] = in_arr20[last_block - i][COL_NUMBER_OF_BOXES];
		out_arr[block_num]["weigth"] = in_arr20[last_block - i][COL_POS_WEIGTH];
		out_arr[block_num]["vol"] = in_arr20[last_block - i][COL_POS_VOL];
		out_arr[block_num]["G/V"] = in_arr20[last_block - i][COL_DENSITY];
		block_length = (in_arr20[last_block - i][COL_POS_VOL] / CONTAINER_WIDTH / block_heigth).toFixed(2);
		out_arr[block_num]["len"] = block_length;
		out_arr[block_num]["heigth"] = block_heigth;
	}
	
	var dyn_TLT_LTL_switch = true, item = [];
	if (in_arr20.length % 2 != 0) {	//если на входе нечетное число элементов - взять последний из середины
		item["block_num"] = 0;
		item["id"] = in_arr20[i][COL_GOODS_ID];
		item["boxes"] = in_arr20[i][COL_NUMBER_OF_BOXES];
		item["weigth"] = in_arr20[i][COL_POS_WEIGTH];
		item["vol"] = in_arr20[i][COL_POS_VOL];
		item["G/V"] = in_arr20[i][COL_DENSITY];
		block_length = (in_arr20[i][COL_POS_VOL] / CONTAINER_WIDTH / block_heigth).toFixed(2);
		item["len"] = block_length;
		item["heigth"] = block_heigth;

  		var GV_left = out_arr[0]["G/V"].toString().split(';');	///
		var	GV_right = out_arr[out_arr.length - 1]["G/V"].toString().split(';')
		var GV_curr = item["G/V"].toString().split(';');
		var GV_left_avg = GV_left.reduce(function(sum, current)   { return sum + current * 1; }, 0) / GV_left.length;
		var GV_right_avg = GV_right.reduce(function(sum, current) { return sum + current * 1; }, 0) / GV_right.length;
		var GV_curr_avg = GV_curr.reduce(function(sum, current)   { return sum + current * 1; }, 0) / GV_curr.length;
		
		if (dyn_TLT_LTL_switch && (Math.abs(GV_curr_avg - GV_left_avg) > (Math.abs(GV_curr_avg - GV_right_avg)))) {
			out_arr.unshift(item);  
			for (i = 0; i < out_arr.length; i++) out_arr[i]["block_num"] = i + 1;
		} else {
			item["block_num"] = i * 2;
			out_arr.push(item); 
		}
	}

	return [out_arr, overload];

	function split_block(block) {
		var block_new = block.slice(0);
		var boxes_old = block[COL_NUMBER_OF_BOXES];
		var boxes_new = (boxes_old - (boxes_old % 2)) / 2;
		var boxes = boxes_old - boxes_new;
		var koef = boxes / boxes_old;

		block[COL_NUMBER_OF_BOXES] = boxes;
		block[COL_NUMBER_OF_blockS] *= koef;
		block[COL_NET_WEIGTH] = parseFloat((block[COL_NET_WEIGTH] * koef).toFixed(2), 10);
		block[COL_POS_WEIGTH] = parseFloat((block[COL_POS_WEIGTH] * koef).toFixed(2), 10);
		block[COL_POS_VOL] = parseFloat((block[COL_POS_VOL] * koef).toFixed(2), 10);

		koef = boxes_new / boxes_old;
		block_new[COL_NUMBER_OF_BOXES] = boxes_new;
		block_new[COL_NUMBER_OF_ITEMS] *= koef;
		block_new[COL_NET_WEIGTH] = parseFloat((block_new[COL_NET_WEIGTH] * koef).toFixed(2), 10);
		block_new[COL_POS_WEIGTH] = parseFloat((block_new[COL_POS_WEIGTH] * koef).toFixed(2), 10);
		block_new[COL_POS_VOL] = parseFloat((block_new[COL_POS_VOL] * koef).toFixed(2), 10);

		in_arr0.push(block_new);
		return block;
	}
}   //MakeLowLev_v3

function calcLoad1() {
    var res = document.getElementById('results'), r = '';
	r += 'Блоков в конте: ' + NUMBER_OF_LINES + '; ' + ' Глубина блока: ' + BLOCK_WIDTH + '; Максимальный объём: ' + MAX_BLOCK_VOLUME + '</br>';
	res.innerHTML = r;
	
	var data_1_level = data_arr.filter(function(item){
		return item[COL_DENSITY] >= DENSITY_THRESHOLD;
	});
	var data_2_level = data_arr.filter(function(item){
		return item[COL_DENSITY] < DENSITY_THRESHOLD;
	});
	
    var level1 = MakeLoad(data_1_level).sort(function(item1, item2){
		return item1['weigth'] > item2['weigth'] ? 1 : item1['weigth'] < item2['weigth'] ? -1 : 0;
	});
	var level2 = MakeLoad(data_2_level).sort(function(item1, item2){
		return item2['weigth'] > item1['weigth'] ? 1 : item2['weigth'] < item1['weigth'] ? -1 : 0;
	});
	
	for (var i = 0; i < NUMBER_OF_LINES; i++) {
		level1[i]['line_num'] = i + 1;
		level2[i]['line_num'] = i + 1;
	}
	var hdr = [['Блок','№№ позиции','Кол. коробок','Вес','Объём'],['Вес','Объём'],['Голова','Хвост','Разница']];
	DrawTableInBlock(level1, "load_lev1", hdr[0]);
	DrawTableInBlock(level2, "load_lev2", hdr[0]);
	
	var rows_total = MakeTotal(level1,level2);
	DrawTableInBlock(rows_total, "load_sum", hdr[1]);
	
	var combined_load = Combain_levels(level1, level2);
	DrawTableInBlock(combined_load, "load_final", hdr[0]);	
	
	var balance = [];
	var w=combined_load[0]['weigth'] + combined_load[1]['weigth'] + combined_load[2]['weigth'];
	balance.push(combined_load[0]['weigth'] + combined_load[1]['weigth'] + combined_load[2]['weigth']);
	balance.push(combined_load[3]['weigth'] + combined_load[4]['weigth'] + combined_load[5]['weigth']);
	balance.push(parseFloat((balance[0] - balance[1]).toFixed(2)));
	DrawFlatTable(balance, "balance", hdr[2]);	
} //calcLoad1

function calcLoad2() {
    var res = document.getElementById('results'), r = '';
	//r += 'Блоков в конте: ' + NUMBER_OF_LINES + '; ' + ' Глубина блока: ' + BLOCK_WIDTH + '; Максимальный объём: ' + MAX_BLOCK_VOLUME + '</br>';
	//res.innerHTML = r;
	
	var data_1_level = data_arr.filter(function(item){
			return item[COL_DENSITY] >= DENSITY_THRESHOLD;	//фильтр по плотности
		}).sort(function(item1, item2){
		return item1[COL_POS_VOL] < item2[COL_POS_VOL] ? 1 : item1[COL_POS_VOL] > item2[COL_POS_VOL] ? -1 : 0;   //сортировка по убыванию объёма позиции 
	});
	
	var sum_volume_1 = data_1_level.reduce(function(sum, current) {
		return sum + current[COL_POS_VOL];
	},0 );
	var max_volume_1 = data_1_level.reduce(function(sum, current) {
		sum = sum < current[COL_POS_VOL] ? current[COL_POS_VOL] : sum;
		return sum;
	},0 );
	var num_of_blocks = Math.floor(sum_volume_1 / max_volume_1);
	var block_depth = (CONTAINER_LENGTH/num_of_blocks).toFixed(2);
	var block_volume = (block_depth * CONTAINER_WIDTH * CONTAINER_HEIGTH).toFixed(2);
	res.innerHTML  = 'Блоков в конте: ' + num_of_blocks + '; ' + ' Глубина блока: ' + block_depth + 'м;' 
		+ ' Объём блока: ' + block_volume + 'м3; Максимальный объём позиции: ' + max_volume_1 + 'м3</br>';
	
	var level1 = MakeLowLev_v2(data_1_level, num_of_blocks) 
	 .sort(function(item1, item2){
		return item2['volume'] < item1['volume'] ? 1 : item2['volume'] > item1['volume'] ? -1 : 0;	//убывание объёма
	 });

	var hdr = [['Блок','№№ позиции','Кол. коробок','Вес','Объём'],['Вес','Объём'],['Голова','Хвост','Разница']];
	DrawTableInBlock(level1, "load_lev1", hdr[0]);
	
	// Верхний уровень загрузки  \/
	
	var data_2_level = data_arr.filter(function(item){
		return item[COL_DENSITY] < DENSITY_THRESHOLD;
	}).sort(function(item1, item2){
		return item1[COL_POS_VOL] < item2[COL_POS_VOL] ? 1 : item1[COL_POS_VOL] > item2[COL_POS_VOL] ? -1 : 0;   //сортировка по убыванию объёма позиции
		//return item1[COL_POS_VOL] > item2[COL_POS_VOL] ? 1 : item1[COL_POS_VOL] < item2[COL_POS_VOL] ? -1 : 0;   //сортировка по возрастанию объёма позиции	
	});
	
	var make_hilev_res = MakeHiLev_v2(data_2_level, num_of_blocks, level1);
	var level2 = make_hilev_res[0];
	var sgruz = make_hilev_res[1];
	 /* .sort(function(item1, item2){
		return item2['volume'] > item1['volume'] ? 1 : item2['volume'] < item1['volume'] ? -1 : 0;	//возрастание объёма
	 }); */	
	
	DrawTableInBlock(level2, "load_lev2", hdr[0]);	

	var blocks_total = MakeTotal(level1,level2);
	DrawTableInBlock(blocks_total, "load_sum", hdr[1]);
	
	var combined_load = Combine_levels_v2(level1, level2, num_of_blocks);
	DrawTableInBlock(combined_load, "load_final", hdr[0]);	
	
	var balance = CalcBalance_v2(combined_load);
	DrawFlatTable(balance, "balance", hdr[2]);

	DrawTableInBlock(sgruz, "sgruz", hdr[0]);	
} //calcLoad2

function CalcBalance_v2(in_arr) {
	var len = in_arr.length, middle = 0, balance = [], sum1 = 0, sum2 = 0;
	if (len % 2 == 0) {
		middle = len / 2;
		for (var i = 0; i < middle; i++) sum1 += Number(in_arr[i]['weigth']); 
		for (i = middle; i < len; i++) sum2 += Number(in_arr[i]['weigth']);
	} else {
		middle = Math.ceil(len / 2);
		for (var i = 0; i < middle - 1; i++) sum1 += Number(in_arr[i]['weigth']);
		for (i = middle; i < len; i++) sum2 += Number(in_arr[i]['weigth']);
		sum1 += Number(in_arr[middle - 1]['weigth']) / 2;
		sum2 += Number(in_arr[middle - 1]['weigth']) / 2;
	}
	balance.push(sum1.toFixed(0));
	balance.push(sum2.toFixed(0));
	balance.push((sum1 - sum2).toFixed(0));
	return balance;
} //CalcBalance_v2

function MakeHiLev_v2(in_arr, num_of_blocks, low_level_arr) {
	var BLOCKS = num_of_blocks || NUMBER_OF_BLOCKS;
    var out_arr = [], sgruz_arr = [], block_num = 0, wgth = 0, vol = 0, boxes = 0, too_much_blocks = false, items_left = in_arr.length;
    var in_arr_weigth = in_arr.reduce(function(sum, current) {				//общий вес
		return sum + current[COL_WEIGTH] * current[COL_NUMBER_OF_BOXES];
	},0 );
	var in_arr_volume = in_arr.reduce(function(sum, current) {				//общий объем
		return sum + current[COL_VOLUME] * current[COL_NUMBER_OF_BOXES];
	},0 );
	var AvgWeigth = in_arr_weigth / BLOCKS;
	var AvgVol = in_arr_volume / BLOCKS ;
	
	var occupied_volume = low_level_arr.reduce(function(sum, current) {			//объем, занятый нижним рядом
		return sum + current[COL_VOLUME] * current[COL_NUMBER_OF_BOXES];
	},0 );
	
	var overload = CONTAINER_LENGTH * CONTAINER_WIDTH * CONTAINER_HEIGTH - occupied_volume - in_arr_volume;
//	if (overload < 0) { //упаковка которых менее 0.1 м3 или имеет наименьший объём
		var id = "", box_vol = 0;
		for (var i = 0; i < in_arr.length; i++) {
			id = in_arr[i][COL_GOODS_ID];
			box_vol = 0;
			for (var j = 0; j < data_arr.length; j++) {
				if (data_arr[j][COL_GOODS_ID] == id) {
					box_vol = data_arr[j][COL_VOLUME];
					break;
				}
			}
		in_arr[i]["box_vol"] = box_vol;
		}
		
		in_arr = in_arr.sort(function(item1, item2){ //по убыванию объёма партии и одной коробки
			if (item1['box_vol'] > item2['box_vol'])
			return item1['volume'] < item2['volume'] ? 1 : item1['volume'] > item2['volume'] ? -1 : 
				item1['box_vol'] < item2['box_vol'] ? 1 : item1['box_vol'] > item2['box_vol'] ? -1 :0;
		});

//	} // if end  

	var row, max_vol = CONTAINER_WIDTH * CONTAINER_HEIGTH * CONTAINER_LENGTH / BLOCKS, free_space = 0;
	for (i = 0; i < low_level_arr.length; i++) {
		// row = [];
		out_arr[i] = [];
		out_arr[i]["block_num"] = low_level_arr[i]['block_num'];
		out_arr[i]["id"] = "";
		out_arr[i]["boxes"] = "";
		out_arr[i]["weigth"] = "";
		out_arr[i]["volume"] = "";

		free_space = max_vol - low_level_arr[i]['volume'];
		for (j = 0; j < in_arr.length; j++) {
			if (typeof(in_arr[j]) == 'undefined' || in_arr[j][COL_POS_VOL] > free_space) continue;
			else {
                out_arr[i]["id"] 	 = out_arr[i]["id"] 	  == "" ? in_arr[j][COL_GOODS_ID] : out_arr[i]["id"] + ';' + in_arr[j][COL_GOODS_ID];
                out_arr[i]["boxes"]  = out_arr[i]["boxes"]  == "" ? in_arr[j][COL_NUMBER_OF_BOXES] : out_arr[i]["boxes"] + ';' + in_arr[j][COL_NUMBER_OF_BOXES];
                out_arr[i]["weigth"] = out_arr[i]["weigth"] == "" ? in_arr[j][COL_POS_WEIGTH] : out_arr[i]["weigth"] + in_arr[j][COL_POS_WEIGTH];
                out_arr[i]["volume"] = out_arr[i]["volume"] == "" ? in_arr[j][COL_POS_VOL] : out_arr[i]["volume"] + in_arr[j][COL_POS_VOL];
				free_space -= in_arr[j][COL_POS_VOL];
				delete in_arr[j];	items_left--;
			}
		}
	}
	var exces = in_arr.filter(function(item){
		return typeof(item) != 'undefined';
	});

	for (i = 0; i < exces.length; i++) {
		sgruz_arr[i] = [];
		sgruz_arr[i]["block_num"] = i;
		sgruz_arr[i]["id"] 	 	  = exces[i][COL_GOODS_ID];
		sgruz_arr[i]["boxes"]  	  = exces[i][COL_NUMBER_OF_BOXES];
		sgruz_arr[i]["weigth"]    = exces[i][COL_POS_WEIGTH];
		sgruz_arr[i]["volume"]    = exces[i][COL_POS_VOL];
	}
    return [out_arr, sgruz_arr];
} //MakeHiLev_v2

function MakeLowLev_v2(in_arr, num_of_blocks) {
	var BLOCKS = num_of_blocks || NUMBER_OF_LINES;
    var out_arr = [], block_num = 0, wgth = 0, vol = 0, boxes = 0, too_much_blocks = false, items_left = in_arr.length;
    var in_arr_weigth = in_arr.reduce(function(sum, current) {				//общий вес
		return sum + current[COL_WEIGTH] * current[COL_NUMBER_OF_BOXES];
	},0 );
	var in_arr_volume = in_arr.reduce(function(sum, current) {				//общий объем
		return sum + current[COL_VOLUME] * current[COL_NUMBER_OF_BOXES];
	},0 );
	var AvgWeigth = in_arr_weigth / BLOCKS;
	var AvgVol = in_arr_volume / BLOCKS ;
	
	for (var i = 0; i < in_arr.length; i++) {
        if (typeof(in_arr[i]) == 'undefined') { continue; }    //наполнение нового блока
            out_arr[block_num] = [];
		    out_arr[block_num]["block_num"] = block_num + 1;
            out_arr[block_num]["id"] = in_arr[i][COL_GOODS_ID];
            out_arr[block_num]["boxes"] = in_arr[i][COL_NUMBER_OF_BOXES];
            wgth += in_arr[i][COL_POS_WEIGTH];
            vol  += in_arr[i][COL_POS_VOL];
            delete in_arr[i];	items_left--;
            
            for (var j = 0; j < in_arr.length; j++) {
                if (typeof(in_arr[j]) == 'undefined') { continue; }
                    
                if (vol < AvgVol - in_arr[j][COL_POS_VOL]) {
                    out_arr[block_num]["id"] += ';' + in_arr[j][COL_GOODS_ID];              
                    out_arr[block_num]["boxes"] += ';' + in_arr[j][COL_NUMBER_OF_BOXES];
                    wgth += in_arr[j][COL_POS_WEIGTH];
                    vol  += in_arr[j][COL_POS_VOL];
                    delete in_arr[j];	items_left--;
                }
            }

    		out_arr[block_num]["weigth"] = parseFloat(wgth.toFixed(2), 10);  
            out_arr[block_num]["volume"] = parseFloat(vol.toFixed(2), 10);
            wgth = 0;
            vol = 0;
		    block_num++;
		    
		if (block_num >= BLOCKS && items_left > 0) { 
			too_much_blocks = true;
			break; 
		}
	} //outer for - строки вх. массива
	
	if (too_much_blocks) {

	var protect = 0; ii = 0;
		while (items_left > 0) {
		if (protect > 999) { alert('Infinite loop detected!'); break; }
    		j = out_arr.length - 1;
    		for (i = 0; i < in_arr.length; i++) {
    			if (typeof(in_arr[i]) == 'undefined') { continue; }
                out_arr[j-ii]["id"] += ';' + in_arr[i][COL_GOODS_ID];
                out_arr[j-ii]["boxes"] += ';' + in_arr[i][COL_NUMBER_OF_BOXES];
        		out_arr[j-ii]["weigth"] = parseFloat((out_arr[j-ii]["weigth"] + in_arr[i][COL_POS_WEIGTH]).toFixed(2), 10);
                out_arr[j-ii]["volume"] = parseFloat((out_arr[j-ii]["volume"] + in_arr[i][COL_POS_VOL]).toFixed(2), 10);
    //            wgth += in_arr[j][COL_POS_WEIGTH];
    //            vol  += in_arr[i][COL_POS_VOL];
                delete in_arr[i];	items_left--;
       			ii++;
                if (j <= 1) {	//защита левой границы вых. массива
                	j = out_arr.length - 1;
                	ii = 0;
                }
    		}
    		protect++;
		}
	}
	
    return out_arr;
}   //MakeLowLev_v2

function Combine_levels_v2(in1, in2, num_of_blocks) {
	var out_arr0 = [], Line = [], i;
	for (i = 0; i < in1.length; i++) {
		Line = [];
		Line["block_num"] = in1[i]["block_num"];
        Line["id"] = in1[i]["id"] + '<=>' + in2[i]["id"];
        Line["boxes"] = in1[i]["boxes"] + '<=>' + in2[i]["boxes"];			
		Line["weigth"] = in1[i]["weigth"] + in2[i]["weigth"];
		Line["volume"] = in1[i]["volume"] + in2[i]["volume"];
		out_arr0.push(Line);
	}
	var out_arr = out_arr0.sort(function(item1, item2){
		return item2['weigth'] > item1['weigth'] ? -1 : item2['weigth'] < item1['weigth'] ? 1 : 0;	
	}); //сортировка по возрастанию веса
	
	var order = [];
	/* order[1] = [1];
	order[2] = [1, 2];
	order[3] = [1, 3, 2];
	order[4] = [1, 4, 3, 2];
	order[5] = [1, 4, 5, 3, 2];
	order[6] = [1, 4, 6, 5, 3, 2];
	order[7] = [1, 4, 5, 7, 6, 3, 2];	//WTF? 
	order[8] = [1, 4, 5, 8, 7, 6, 3, 2];
	order[9] = [1, 4, 5, 8, 9, 7, 6, 3, 2];
	order[10] = [1, 4, 5, 8, 10, 9, 7, 6, 3, 2]; */
	order[1] = [1];
	order[2] = [1, 2];
	order[3] = [1, 3, 2];
	order[4] = [1, 4, 2, 3];	//вот как надо!
	order[5] = [1, 5, 4, 2, 3];
	order[6] = [1, 6, 5, 2, 4, 3];
	order[7] = [1, 7, 6, 2, 3, 5, 4];
	order[8] = [1, 8, 7, 2, 3, 6, 5, 4];
	order[9] = [1, 9, 8, 2, 3, 7, 6, 4, 5];
	order[10] = [1, 10, 9, 2, 3, 8, 7, 4, 6, 5];

	//var j, last = out_arr.length - 1, far_near = 0, head_tail = 0;
	var len = out_arr.length;
	for (var i = 0; i < out_arr.length; i++) {	//установка порядка по шаблону
		out_arr[i]['block_num'] = order[len][i];		
	}
	// debugger;
 	return out_arr.sort(function(item1, item2){
		return item1['block_num'] > item2['block_num'] ? 1 : item1['block_num'] < item2['block_num'] ? -1 : 0;	
	});; 
} //Combine_levels_v2

function Combine_levels(in1, in2) {
	var out_arr0 = [], Line = [], i, order = [2, 3, 4, 1, 0, 5];
	for (i = 0; i < in1.length; i++) {
		Line = [];
		Line["line_num"] = i;
        Line["id"] = in1[i]["id"] + '<=>' + in2[i]["id"];
        Line["boxes"] = in1[i]["boxes"] + '<=>' + in2[i]["boxes"];			
		Line["weigth"] = in1[i]["weigth"] + in2[i]["weigth"]
		Line["volume"] = in1[i]["volume"] + in2[i]["volume"]
		out_arr0.push(Line);
	}
	var out_arr = out_arr0.sort(function(item1, item2){
		return item2['weigth'] > item1['weigth'] ? 1 : item2['weigth'] < item1['weigth'] ? -1 : 0;	
	}); //сортировка по убыванию веса
	
	for (var i = 0; i < NUMBER_OF_BLOCKS; i++) {
		out_arr[i]['line_num'] = order[i] + 1;
	}	//установка сначала в центр, затем по краям
	
	return out_arr.sort(function(item1, item2){
		return item1['line_num'] > item2['line_num'] ? 1 : item1['line_num'] < item2['line_num'] ? -1 : 0;	
	});
} //Combine_levels

function MakeLoad(in_arr, num_of_blocks) {
	var BLOCKS = num_of_blocks || NUMBER_OF_LINES;
    var out_arr = [], Line = [], line_num = 0, wgth = 0, vol = 0, boxes = 0 ;
    var in_arr_weigth = in_arr.reduce(function(sum, current) {
		return sum + current[COL_WEIGTH] * current[COL_NUMBER_OF_BOXES];
	},0 );
	var in_arr_volume = in_arr.reduce(function(sum, current) {
		return sum + current[COL_VOLUME] * current[COL_NUMBER_OF_BOXES];
	},0 );
	//AvgWeigth = in_arr_weigth / NUMBER_OF_LINES;
	AvgWeigth = in_arr_weigth / BLOCKS;
	for(var i = 0; i < in_arr.length; i++) {
        var done = false;
        boxes = 0;
        //boxesleft = in_arr[i][COL_NUMBER_OF_BOXES];
    	for (var j = 0; j < in_arr[i][COL_NUMBER_OF_BOXES]; j++) {
			wgth += in_arr[i][COL_WEIGTH];
			vol += in_arr[i][COL_VOLUME];
			boxes++;
			if (wgth >= AvgWeigth) {
				done = true;
                if (typeof(out_arr[line_num])==='undefined') {
                    out_arr[line_num] = [];
					out_arr[line_num]["line_num"] = line_num + 1;
        		    out_arr[line_num]["id"] = in_arr[i][COL_GOODS_ID];
        	    	out_arr[line_num]["boxes"] = boxes;
                } else {					
            	   	out_arr[line_num]["id"] += ';' + in_arr[i][COL_GOODS_ID];
        	    	out_arr[line_num]["boxes"] += ';' + boxes;
                }
            	if (done) {
           			out_arr[line_num]["weigth"] = parseFloat(wgth.toFixed(2), 10);  
        		    out_arr[line_num]["volume"] = parseFloat(vol.toFixed(2), 10);
        			line_num++;
                    if(vol > MAX_BLOCK_VOLUME) alert('Объём блока № ' + line_num + ' превысил максимальный!');
                    wgth = 0;
                    vol = 0;
                    boxes = 0;
        		}
			}			
		} //inner for - внутри строки
                if (typeof(out_arr[line_num])==='undefined') {
                    out_arr[line_num] = [];
					out_arr[line_num]["line_num"] = line_num + 1;
        		    out_arr[line_num]["id"] = in_arr[i][COL_GOODS_ID];
        	    	out_arr[line_num]["boxes"] = boxes;
                } else {
            	   	out_arr[line_num]["id"] += ';' + in_arr[i][COL_GOODS_ID];
        	    	out_arr[line_num]["boxes"] += ';' + boxes;
                }

	} //outer for - строки вх. массива
//    if (true) {
        out_arr[line_num]["weigth"] = parseFloat(wgth.toFixed(2), 10);
        out_arr[line_num]["volume"] = parseFloat(vol.toFixed(2), 10); 
//    }
    return out_arr;
}   //MakeLoad()

function MakeTotal(in1, in2) {
	var out_arr = [], Line = [], i;
	for (i = 0; i < in1.length; i++) {
		Line = [];
		Line[0] = (parseFloat(0 + in1[i]["weigth"], 10) + parseFloat(0 + in2[i]["weigth"], 10)).toFixed(2);
		Line[1] = (parseFloat(0 + in1[i]["volume"], 10) + parseFloat(0 + in2[i]["volume"], 10)).toFixed(2);
		out_arr.push(Line);
	}
	return out_arr;
} //MakeTotal

function ClearAllTables() {
	var tbls = document.getElementsByClassName("output-table");
	for (var i = 0; i < tbls.length; i++) {
		tbls[i].innerText = '';
	}                  
}

function DrawTableInBlock(t, blockId, hdr) {
    var output = document.getElementById(blockId),
    table = document.createElement('table'),
    tbody = document.createElement('tbody');
	output.innerHTML = ''; 
    table.appendChild(tbody);
	var h = '';
	for (var i = 0; i < hdr.length; i++) {
		h += '<th>' + hdr[i] + '</th>';
	}
	tbody.innerHTML = '<tr>' + h + '</tr>';
	for (var i in t) {
		var tr = document.createElement('tr');
		for(var j in t[i]) {
			td = document.createElement('td');
			/*if (j == t[i].length - 1 && t[i][j] > MAX_BLOCK_VOLUME) {
				td.bgColor = 'red';
				//td.style.color = 'blue';
			}*/
			td.innerHTML = t[i][j] || ':';
			tr.appendChild(td);
		}
		tbody.appendChild(tr);
	} 
	output.appendChild(table);
} //DrawTableInBlock

function DrawFlatTable(t, blockId, hdr) {
    var output = document.getElementById(blockId),
    table = document.createElement('table'),
    tbody = document.createElement('tbody');
	output.innerHTML = ''; 
    table.appendChild(tbody);
	var h = '';
	for (var i = 0; i < hdr.length; i++) {
		h += '<th>' + hdr[i] + '</th>';
	}
	tbody.innerHTML = '<tr>' + h + '</tr>';
	var tr = document.createElement('tr');
	for (var i in t) {
			td = document.createElement('td');
			td.innerHTML = t[i] || ':';
			tr.appendChild(td);
	} 
	tbody.appendChild(tr);
	output.appendChild(table);
} //DrawFlatTable

function checkBrowser() {
 if(window.File && window.FileReader && window.FileList && window.Blob) {
    document.querySelector('input').addEventListener('change', onFilesSelect, false);
 } else {
  alert('К сожалению, ваш браузер не поддерживает file API');  
 }
} //checkBrowser()

function onFilesSelect(e){
 var file = e.target.files[0], reader;
 reader = new FileReader();
 reader.readAsText(file, "windows-1251");
 reader.onloadend = function(e) {		 
    var import_arr=this.result.split(String.fromCharCode(13) + String.fromCharCode(10)),  row_arr = [];
    user_data = [];
	for (var i = 0; i < import_arr.length; i++) {			
		row_arr = import_arr[i].split(';');
		var rgx = /\d{3,} \d{3,}/;
		var s = '', n = 0, val = 0;
		if (rgx.test(row_arr[0])) { //совпадает с '123 456'
			for (var k = 3; k < row_arr.length; k++) {
				var val = Number(row_arr[k].toString().replace(',', '.'));
				if (isNaN(val)) { row_arr[k] = val.toString() } else { row_arr[k] = val };
			}
		user_data.push(row_arr);			
		}
	}
    var hdr = ['№ позиции', 'Наименование позиции', 'Xp','G/V','Вес кор.','Кубы','Вес шт.','Кол. коробок','В кор.','Всего','Нетто','Брутто','Объём','Цена стр.'];
	DrawTableInBlock(user_data, "tbl", hdr);
 }
} //onFilesSelect()
