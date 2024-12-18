import ModbusRTU from 'modbus-serial';
import bin from '../models/BinModel.js';
import { config } from 'dotenv';
import { plcCommandQueue } from '../index.js';
config();

const  client = new ModbusRTU();


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
        res = await client.readHoldingRegisters(address,value);
        return res;
    }
    catch(err)
    {
        await new Promise((resolve) => setTimeout(resolve,1));
        return await readCMD(address,value);
    }
}
export const writePLC = async (data)=>{
    let r = {data:[0]};
    try
    {
        if (!client.isOpen)
            plcCommandQueue.add(data,{delay:1000});

        client.setID(data.id);
        r = await client.writeRegister(data.address,data.value);
        return JSON.stringify(r);
    }
    catch(err)
    {
        const check =err.message || err;
        console.log(err.message || err);
        plcCommandQueue.add(data,{delay: 500});
        return check;
    }
}
export const writeCMD = (data)=>{
    
    plcCommandQueue.add(data,{priority: 1});
}