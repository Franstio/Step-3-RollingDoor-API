import ModbusRTU from 'modbus-serial';
import bin from '../models/BinModel.js';
import { plcCommandQueue } from '../index.js';

let  client = new ModbusRTU();
let sp = null;


export default client;
export const switchLamp = async (id, lampType, isAlive) => {
    const dict = {
        "RED": 30,
        "GREEN": 31
    };
    const address = dict[lampType];
//    client.setID(id);
    try {
        writeCMD({id:id,address:address,value: isAlive ? 1 : 0});
    }
    catch (error) {
    }
} 

export const checkMaxWeight = async () => {
    while (true) {
        const dataBin = await bin.findAll();
        for (let i = 0; i < dataBin.length; i++) {
            /*const latest = await bin.findOne({
                where: {id: dataBin[i].id}
            });*/
            const maxWeight =  parseFloat(dataBin[i].max_weight) * 0.95;

            await switchLamp(dataBin[i].clientId, 'RED', parseFloat(dataBin[i].weight) >= maxWeight);
        }
        await new Promise((resolve)=>setTimeout(resolve,5000));
    }
}
export const readCMD = async (address,value)=>{
    let res = {data:0};
    try
    {
        if (!client.isOpen)
            await openModbus();
        res = await client.readHoldingRegisters(address,value);
        await closeModbus();
        return res;
    }
    catch(err)
    {
        await closeModbus();
        await new Promise((resolve) => setTimeout(resolve,100));
        return await readCMD(address,value);
    }
}
export const writePLC = async (data)=>{
    let r = {data:[0]};
    try
    {
        if (!client.isOpen)
            await openModbus();

        client.setID(data.id);
        r = await client.writeRegister(data.address,data.value);
        await closeModbus();
        return {success: true,res: JSON.stringify(r)};
    }
    catch(err)
    {
        const check =err.message || err;
        console.log(err.message || err);
        await closeModbus();
        return {success:false,res: check};
    }
}
export const writeCMD = (data)=>{
    plcCommandQueue.add(data,{priority: 1,removeOnFail:{age: 60*10,count:10},timeout:5000,removeOnComplete:{age:60,count:5}});
}

export const openModbus = async () => {
    
    //await client.connectRTU("/dev/ttyUSB0", { baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none' });
    sp = new SerialPort({lock:false,path:process.env.PORT_PLC,baudRate:9600,autoOpen:true,parity:'none',dataBits:8,stopBits:1}); 
    sp.on('data',(data)=>{

    });
    sp.on('close',(c)=>{
    });
    sp.on('error',(err)=>{
        console.log(err);
    });
    client = new ModbusRTU();
    await client.connectRTU(process.env.PORT_PLC, { baudRate: 9600, dataBits: 8, stopBits: 1, parity: 'none' });
    client.setTimeout(300);
    
    client.on('error', (err) => {
        console.log('FROM MODBUS EVENT:');
        console.log(err);
    });
    client.on('close', () => {
    });
}
export const closeModbus = async () => {
    try {
        await new Promise((resolve) => {
            try {
                sp.close(() => {
                    resolve('');
                });
            }
            catch (err) {
                resolve(null);
            }
        });
    }
    catch (err) {
        console.log({close_modbus:err});
    }
}