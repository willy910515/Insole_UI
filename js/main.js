const info=document.getElementById('info');
const full_info=document.getElementById('full-info');
const button_connect=document.getElementById('button-connect');
const data_view_r=document.getElementById('sensor-r-data-view');
const data_view_l=document.getElementById('sensor-l-data-view');

const canvas_R=document.getElementById('canvas-R');
const canvas_L=document.getElementById('canvas-L');

const button_record_left=document.getElementById('button-record-left');
const button_record_right=document.getElementById('button-record-right');
const record_info_r=document.getElementById('record-info-r');
const record_info_l=document.getElementById('record-info-l');

var recorded_r=false, recorded_l=false;;
var record_data_r=[], record_data_l=[];

button_record_left.addEventListener('click',()=>{
    if(!recorded_l){
        button_record_left.innerHTML='中止紀錄';
        record_data_l=[];
        recorded_l=true;
    }else{
        button_record_left.innerHTML='紀錄左腳';
        recorded_l=false;
        download_data(record_data_l, 'left-data.csv');
    }
});
button_record_right.addEventListener('click',()=>{
    if(!recorded_r){
        button_record_right.innerHTML='中止紀錄';
        record_data_r=[];
        recorded_r=true;
    }else{
        button_record_right.innerHTML='紀錄右腳';
        recorded_r=false;
        download_data(record_data_r, 'right-data.csv');
    }
});

function show_data(element, data){
    let out='';;
    for(let i=0;i<data.length;i++){
        out+=`<td>${data[i]}</td>`;
    }
    element.innerHTML=out;
}

function print_info(text){
    info.value+='\n'+text;
    info.scrollTop = info.scrollHeight;
}

function show_full_info(text){
    if(text){
        full_info.innerHTML=`<h1>${text.replaceAll('\n','<br>')}</h1>`;
        full_info.style.setProperty('display','flex');
    }else{
        full_info.style.setProperty('display','none');
    }
}

function delay(ms){
    ms=Math.max(0,ms);
    return new Promise((r)=>{
        setTimeout(r,ms);
    });
}

function time_to_str(time){
    const date=new Date(time);
    return `${date.getFullYear().toString().padStart(4,'0')}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}T${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}:${date.getSeconds().toString().padStart(2,'0')}.${date.getMilliseconds().toString().padStart(3,'0')}Z`;
}

function download_data(data, name='YA.csv'){
    let out_csv='time, time';
    for(let i=1;i<=15;i++) out_csv+=', v'+i.toString();
    out_csv+='\n';
    for(let i=0;i<data.length;i++){
        out_csv+=data[i].time.toString()+', '+time_to_str(data[i].time);
        for(let j=0;j<data[i].data.length;j++){
            out_csv+=', '+data[i].data[j].toString();
        }
        out_csv+='\n';
    }
    
    const a=document.createElement('a');
    a.download=name;
    a.href=window.URL.createObjectURL(new Blob([out_csv]));
    a.click();
    setTimeout(()=>{
        window.URL.revokeObjectURL(a.href);
    },10000);
}

let MAX=1000,MIN=0;

let data_R=new Array(15).fill(0);
let data_L=new Array(15).fill(0);
let connected_R=false, connected_L=false;
(async(env)=>{
    function get_data(data){
        const device_id=new Uint8Array(data.buffer, 0, 1)[0];
        // console.log(device_id)
        if(device_id===0x34){   // 右腳
            const value=Array.from(new Int16Array(new Uint8Array(data.buffer, 1, 30).slice(0,30).buffer));
            show_data(data_view_r, value);
            data_R=value;
            if(recorded_r){
                record_data_r.push({
                    time: new Date().getTime(),
                    data:value,
                });
            }
        }else if(device_id===0x33){
            const value=Array.from(new Int16Array(new Uint8Array(data.buffer, 1, 30).slice(0,30).buffer));
            show_data(data_view_l, value);
            data_L=value;
            if(recorded_l){
                record_data_l.push({
                    time: new Date().getTime(),
                    data:value,
                });
            }
        }
    }

    env.serial_R=new BleSerial();
    env.serial_R.on('connect', ()=>{
        print_info('右腳成功連接!');
        connected_R=true;
        button_record_right.disabled=false;
    });
    env.serial_R.on('disconnect', ()=>{
        print_info('右腳斷線!');
        connected_R=false;
        button_record_right.disabled=true;
    });
    env.serial_R.on('getData',(new_data)=>{
        get_data(new_data);
    });
    env.serial_L=new BleSerial();
    env.serial_L.on('connect', ()=>{
        print_info('左腳成功連接!');
        connected_L=true;
        button_record_left.disabled=false;
    });
    env.serial_L.on('disconnect', ()=>{
        print_info('左腳斷線!');
        connected_L=false;
        button_record_left.disabled=true;
    });
    env.serial_L.on('getData',(new_data)=>{
        get_data(new_data);
    });

    button_connect.addEventListener('click',async ()=>{
        let error=0;
        if(!connected_R){
            try{
                show_full_info('請選擇並連接右腳!');
                await delay(200);
                await env.serial_R.init();
            }catch(e){
                console.error('右腳: ',e);
                print_info('右腳連接失敗! 請重新嘗試。');
                error+=1;
            }
        }
        if(!connected_L){
            try{
                show_full_info('請選擇並連接左腳!');
                await delay(200);
                await env.serial_L.init();
            }catch(e){
                console.error(e);
                print_info('左腳連接失敗! 請重新嘗試。');
                error+=2;
            }
        }
        switch(error){
            case 1:
                show_full_info('右腳連接失敗!\n請重新嘗試連接');
                break;
            case 2:
                show_full_info('左腳連接失敗!\n請重新嘗試連接');
                break;
            case 3:
                show_full_info('連接失敗!\n請重新嘗試連接');
                break;
        }
        if(error!==0) await delay(1500);
        show_full_info();
    });
})(window);

function get_color(value,max=100,min=0){
    if (min === max) {
    return { r: 0, g: 255, b: 0 }; // 如果 min 和 max 相等，預設為中間值綠色
    }
    // 將數值限制在 min 和 max 之間
    let clampedValue = Math.max(min, Math.min(value, max));
    const mid = (min + max) / 2;
    let r, g, b;
    if (clampedValue <= mid) {
    // 從 min 到 mid 的區間 (藍色 -> 綠色)
    const ratio = (clampedValue - min) / (mid - min);
    r = 0;
    g = Math.round(255 * ratio);
    b = Math.round(255 * (1 - ratio));
    } else {
    // 從 mid 到 max 的區間 (綠色 -> 紅色)
    const ratio = (clampedValue - mid) / (max - mid);
    r = Math.round(255 * ratio);
    g = Math.round(255 * (1 - ratio));
    b = 0;
    }
    // 確保 RGB 值在 0-255 的範圍內
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return (`rgb(${r},${g},${b})`);
}

function draw(canvas, data=[], mirror=false, disable=false, index=false, max=100, min=0){
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#ffffff';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.textAlign = 'center';
    ctx.font = "bold 20px sans-serif";

    const line={
        board: [[160,28],[216,42],[246,68],[286,116],[310,184],[326,274],[326,346],[322,414],[310,562],[308,638],[296,712],[284,780],[270,820],[262,832],[228,840],[196,836],[174,824],[160,784],[154,746],[152,692],[150,640],[144,574],[138,518],[122,450],[90,386],[62,314],[52,238],[50,168],[62,118],[78,72],[112,42],[132,34]],
        blocks:[
            [[148,40],[148,160],[70,170],[90,90]],
            [[152,40],[228,70],[228,170],[152,160]],
            [[232,74],[280,140],[290,200],[232,170]],
            [[90,350],[168,350],[168,490],[150,490],[130,420],[90,350]],
            [[172,350],[228,350],[228,490],[172,490]],
            [[232,350],[300,350],[300,410],[290,490],[232,490]],
            [[70,190],[148,180],[148,330],[90,330],[70,260]],
            [[152,180],[228,190],[228,330],[152,330]],
            [[232,190],[300,220],[310,280],[304,330],[232,330]],
            [[222,742],[280,742],[264,810],[222,810]],
            [[222,666],[290,666],[280,738],[222,738]],
            [[222,550],[294,550],[294,580],[290,630],[222,630]],
            [[218,550],[218,630],[158,630],[150,550]],
            [[160,666],[218,666],[218,738],[160,738]],
            [[160,742],[218,742],[218,810],[174,810]]
        ],
    };

    if(mirror){
        line.board=line.board.map((v)=>([canvas.width-v[0], v[1]]));
        line.blocks=line.blocks.map((V)=>(V.map((v)=>([canvas.width-v[0], v[1]]))));
    }

    ctx.strokeStyle='#000000';
    ctx.beginPath();
    ctx.moveTo(line.board[0][0],line.board[0][1]);
    for(let i=1;i<line.board.length;i++){
        ctx.lineTo(line.board[i][0],line.board[i][1]);
    }
    ctx.closePath();
    ctx.stroke();
    line.blocks.forEach((path, i)=>{
        let ave_pos=[0,0];
        if(disable) ctx.fillStyle='#909090';
        else ctx.fillStyle=get_color(data[i], max, min);
        ctx.beginPath();
        ctx.moveTo(path[0][0],path[0][1]);
        ave_pos[0]+=path[0][0];
        ave_pos[1]+=path[0][1];
        for(let i=1;i<path.length;i++){
            ctx.lineTo(path[i][0],path[i][1]);
            ave_pos[0]+=path[i][0];
            ave_pos[1]+=path[i][1];
        }
        ctx.closePath();
        ctx.fill();
        if(index){
            ave_pos[0]/=path.length;
            ave_pos[1]/=path.length;
            ctx.fillStyle='#000000';
            ctx.fillText((i+1).toString(), ave_pos[0], ave_pos[1]);
        }
    });

    ctx.textAlign = 'left';
    const split=50, split_height=7, text_split=5;
    for(let i=0;i<split;i++){
        ctx.fillStyle=get_color(i, split-1, 0);
        ctx.fillRect(mirror?(canvas.width-20):0, canvas.height-120-i*split_height, 20, split_height);
    }
    if(!mirror){
        ctx.fillStyle='#000000';
        for(let i=0;i<text_split;i++){
            ctx.fillText(Math.round((max-min)*(i/(text_split-1))+min).toString(), 25, canvas.height-120+split_height*1.5-i*split_height*(split/(text_split-1)));
        }
    }
}

function gen_icon(){
    const path=[[160,28],[216,42],[246,68],[286,116],[310,184],[326,274],[326,346],[322,414],[310,562],[308,638],[296,712],[284,780],[270,820],[262,832],[228,840],[196,836],[174,824],[160,784],[154,746],[152,692],[150,640],[144,574],[138,518],[122,450],[90,386],[62,314],[52,238],[50,168],[62,118],[78,72],[112,42],[132,34]];
    const canvas=document.createElement('canvas');
    canvas.height=900;
    canvas.width=800;
    const ctx=canvas.getContext('2d');

    ctx.fillStyle='#808080';
    ctx.beginPath();
    ctx.moveTo(path[0][0]+400,path[0][1]);
    for(let i=1;i<path.length;i++){
        ctx.lineTo(path[i][0]+400,path[i][1]);
    }
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(400-path[0][0],path[0][1]);
    for(let i=1;i<path.length;i++){
        ctx.lineTo(400-path[i][0],path[i][1]);
    }
    ctx.closePath();
    ctx.fill();

    return canvas.toDataURL('image/png');
}

setInterval(()=>{
    draw(canvas_R, data_R, false, !connected_R, true, MAX, MIN);
    draw(canvas_L, data_L, true, !connected_L, true, MAX, MIN);

    const time=new Date().getTime();
    if(recorded_r&&record_data_r.length>0){
        record_info_r.innerHTML=`<td>R</td><td>${((time-record_data_r[0].time)/1000).toFixed(2)}</td><td>${record_data_r.length}</td>`;
    }
    if(recorded_l&&record_data_l.length>0){
        record_info_l.innerHTML=`<td>R</td><td>${((time-record_data_l[0].time)/1000).toFixed(2)}</td><td>${record_data_l.length}</td>`;
    }
},50);

window.onload=()=>{
    if(!navigator.bluetooth||!navigator.bluetooth.getAvailability()){
        show_full_info('Web Bluetooth 不可用!\n請使用其他裝置或瀏覽器嘗試!');
        button_connect.disabled=true;
    }

    const link=document.createElement('link');
    link.rel='icon';
    link.type='image/png';
    link.href=gen_icon();
    document.head.append(link);
};


/*
// https://www.ifreesite.com/image-coordinate/

const canvas=document.getElementById('canvas');
let pos=[];
canvas.addEventListener('click',()=>{
    pos.push([
       parseInt(document.getElementById('results').getElementsByTagName('td')[0].innerHTML.split(': ')[1]), 
       parseInt(document.getElementById('results').getElementsByTagName('td')[1].innerHTML.split(': ')[1]), 
    ]);
    console.log('GET');
});

console.log(JSON.stringify(pos));
pos=[];


*/
