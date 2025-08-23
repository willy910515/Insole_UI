function copyToClipboard(text) {
    if (window.clipboardData && window.clipboardData.setData) {
        // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
        return window.clipboardData.setData("Text", text);

    }
    else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
        var textarea = document.createElement("textarea");
        textarea.textContent = text;
        textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in Microsoft Edge.
        document.body.appendChild(textarea);
        textarea.select();
        try {
            return document.execCommand("copy");  // Security exception may be thrown by some browsers.
        }
        catch (ex) {
            console.warn("Copy to clipboard failed.", ex);
            return prompt("Copy to clipboard: Ctrl+C, Enter", text);
        }
        finally {
            document.body.removeChild(textarea);
        }
    }
}

function addScript(url){
    const script=document.createElement('script');
    script.src=url;
    document.body.append(script);
}

function addStyle(styleText=''){
    const style=document.createElement('style');
    style.innerText=styleText;
    document.body.append(style);
}

function cloneJSON(obj) {
    // basic type deep copy
    if (obj === null || obj === undefined || typeof obj !== 'object')  {
        return obj
    }
    // array deep copy
    if (obj instanceof Array) {
        var cloneA = [];
        for (var i = 0; i < obj.length; ++i) {
            cloneA[i] = cloneJSON(obj[i]);
        }              
        return cloneA;
    }                  
    // object deep copy
    var cloneO = {};   
    for (var i in obj) {
        cloneO[i] = cloneJSON(obj[i]);
    }                  
    return cloneO;
}

async function download(data, name='test.txt'){
    const a=document.createElement('a');
    const url=URL.createObjectURL(new Blob([data]));
    a.href=url;
    a.download=name;
    a.click();
    await new Promise((r)=>{setTimeout(r,1000)});
    URL.revokeObjectURL(url);
}

uuid = function b(a){return a?(a^Math.random()*16>>a/4).toString(16):([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,b)}

//hash
TSH=s=>{for(var i=0,h=9;i<s.length;)h=Math.imul(h^s.charCodeAt(i++),9**9);return Math.abs(h^h>>>9).toString(16).padStart(8,0)}
const cyrb53 = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for(let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
    // return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    return (h2>>>0).toString(16).padStart(8,0)+(h1>>>0).toString(16).padStart(8,0);
};
const cyrb53Array = (str, seed = 0) => {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for(let i = 0, ch; i < str.length; i++) {
        ch = str[i];
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
    // return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    return (h2>>>0).toString(16).padStart(8,0)+(h1>>>0).toString(16).padStart(8,0);
};


//-----------IndexDb-----------
window.indexedDB=window.indexedDB||window.mozIndexedDB||window.webkitIndexedDB||window.msIndexedDB;
window.IDBTransaction=window.IDBTransaction||window.webkitIDBTransaction||window.msIDBTransaction;
window.IDBKeyRange=window.IDBKeyRange||window.webkitIDBKeyRange||window.msIDBKeyRange;

class Indexeddb{
    IndexedDB=null;
    IndexedDB_DB=null;

    openIndexedDB(db='db',name='name',keyPath=null){
        this.keyPath=keyPath;
        this.name=name;
        return new Promise((resolve,reject)=>{
            if(!window.indexedDB){
                reject('Your browser doesn\'t support a stable version of IndexedDB. Such and such feature will not be available.');
            }
            this.IndexedDB=window.indexedDB.open(name);
            this.IndexedDB.onerror=(e)=>{
                this.IndexedDB=null;
                this.IndexedDB_DB=null;
                reject(`IndexedDB Error: ${e}`);
            };
            this.IndexedDB.onupgradeneeded=(e)=>{
                this.IndexedDB_DB=e.target.result;
                if(!this.IndexedDB_DB.objectStoreNames.contains(this.name)) {
                    if(keyPath){
                        this.IndexedDB_DB.createObjectStore(this.name);
                    }else{
                        this.IndexedDB_DB.createObjectStore(this.name,{keyPath:keyPath});
                    }
                }
            };
            this.IndexedDB.onsuccess=(e)=>{
                this.IndexedDB_DB=e.target.result;
                resolve('Open IndexedDB success.');
            }
        });
    }
    
    readIndexedDB(key){
        return new Promise((resolve,reject)=>{
            if(!key){
                reject('Not Key!');
            }
            if(this.IndexedDB&&this.IndexedDB_DB){
                const transaction=this.IndexedDB_DB.transaction(this.name,'readwrite');
                const objectStore=transaction.objectStore(this.name);
                transaction.onerror=(e)=>{
                    reject(`IndexedDB read Error: ${e.target.error}`);
                }
                const objectStoreRequest=objectStore.get(key);
                objectStoreRequest.onsuccess=(e)=>{
                    resolve(e.target.result);
                }
            }else{
                reject('IndexedDB not open.');
            }
        });
    }
    
    getIndexedDBKey(){
        return new Promise((resolve,reject)=>{
            if(this.IndexedDB&&this.IndexedDB_DB){
                const transaction=this.IndexedDB_DB.transaction(this.name,'readwrite');
                const objectStore=transaction.objectStore(this.name);
                transaction.onerror=(e)=>{
                    reject(`IndexedDB read Error: ${e.target.error}`);
                }
                const objectStoreRequest=objectStore.getAllKeys();
                objectStoreRequest.onsuccess=(e)=>{
                    resolve(e.target.result);
                }
            }else{
                reject('IndexedDB not open.');
            }
        });
    }

    delectIndexedDB(key){
        return new Promise((resolve,reject)=>{
            if(!key){
                reject('Not Key!');
            }
            if(this.IndexedDB&&this.IndexedDB_DB){
                const transaction=this.IndexedDB_DB.transaction(this.name,'readwrite');
                const objectStore=transaction.objectStore(this.name);
                transaction.onerror=(e)=>{
                    reject(`IndexedDB read Error: ${e.target.error}`);
                }
                const objectStoreRequest=objectStore.delete(key);
                objectStoreRequest.onsuccess=(e)=>{
                    resolve(e.target.result);
                }
            }else{
                reject('IndexedDB not open.');
            }
        });
    }
    
    writeIndexedDB(data={},key=''){
        return new Promise((resolve,reject)=>{
            if(this.IndexedDB&&this.IndexedDB_DB){
                const transaction=this.IndexedDB_DB.transaction(this.name,'readwrite');
                const objectStore=transaction.objectStore(this.name);
                transaction.onerror=(e)=>{
                    reject(`IndexedDB write Error: ${e.target.error}`);
                }
                const objectStoreRequest=objectStore.put(data,key);
                objectStoreRequest.onsuccess=(e)=>{
                    resolve('IndexedDB write success!');
                }
            }else{
                reject('IndexedDB not open.');
            }
        });
    }
}


//---------BleSerial---------------

class BleSerial {
    // BLE Nordic UART Service (NUS) UUIDs
    NUS_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
    NUS_TX_CHAR_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"; // TX from Arduino's perspective (Notify)
    NUS_RX_CHAR_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"; // RX to Arduino's perspective (Write)

    Device = null;
    GattServer = null;
    TxCharacteristic = null; // For receiving data from Arduino
    RxCharacteristic = null; // For sending data to Arduino

    SerialEvent = {
        connect: [],
        disconnect: [],
        getData: [],
        sendData: [],
    };

    constructor(config = {}) {
        // Allow overriding default UUIDs if needed
        this.config = {
            service: config.service || this.NUS_SERVICE_UUID,
            tx: config.tx || this.NUS_TX_CHAR_UUID,
            rx: config.rx || this.NUS_RX_CHAR_UUID,
        };
    }

    async init() {
        try {
            if (!navigator.bluetooth) {
                throw new Error('Web Bluetooth API is not available on this browser!');
            }

            // Request a device that is advertising the Nordic UART Service
            this.Device = await navigator.bluetooth.requestDevice({
                filters: [{ services: [this.config.service] }],
            });

            if (!this.Device) {
                throw new Error('No device selected.');
            }

            // Add a listener for when the device disconnects
            this.Device.addEventListener('gattserverdisconnected', () => this.runEvent('disconnect'));

            this.GattServer = await this.Device.gatt.connect();
            const service = await this.GattServer.getPrimaryService(this.config.service);
            
            this.TxCharacteristic = await service.getCharacteristic(this.config.tx);
            this.RxCharacteristic = await service.getCharacteristic(this.config.rx);

            // Start listening for notifications from the TX characteristic
            await this.TxCharacteristic.startNotifications();
            this.TxCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
                // event.target.value is a DataView object
                this.runEvent('getData', event.target.value);
            });

            this.runEvent('connect');
            return this.Device.name; // Return device name instead of ID object

        } catch (err) {
            // Clear any partial connection state
            this.close();
            throw new Error(`BLE Error! ${err.message}`);
        }
    }

    on(event, fun) {
        if (this.SerialEvent[event]) {
            this.SerialEvent[event].push(fun);
        } else {
            throw new Error(`Event not exist: ${event}`);
        }
    }

    removeEvent(event) {
        if (this.SerialEvent[event]) {
            this.SerialEvent[event] = [];
        } else {
            throw new Error(`Event not exist: ${event}`);
        }
    }

    runEvent(event, value) {
        if (this.SerialEvent[event]) {
            this.SerialEvent[event].forEach((fun) => {
                fun(value);
            });
        }
    }

    async send(data) {
        try {
            if (this.Device && this.RxCharacteristic && data) {
                if (typeof data === 'string') {
                    data = new TextEncoder().encode(data);
                } else if (typeof data == 'number') {
                    data = new Uint8Array([data]);
                } else {
                    data = new Uint8Array(data);
                }

                // BLE UART usually uses writeWithoutResponse for higher throughput
                await this.RxCharacteristic.writeValueWithoutResponse(data);
                this.runEvent('sendData', data);
            } else {
                throw new Error('BLE send data Error! (Not connect to device or data is empty)');
            }
        } catch (err) {
            console.error('BLE Error: ', err);
            throw new Error('BLE send data Error!');
        }
    }

    // The read() method is no longer needed as data is received via events
    // It's handled by the 'characteristicvaluechanged' event listener in init()

    async close() {
        if (this.GattServer && this.GattServer.connected) {
            this.GattServer.disconnect();
        }
        
        // Clear all properties
        this.Device = null;
        this.GattServer = null;
        this.TxCharacteristic = null;
        this.RxCharacteristic = null;
    }
}
