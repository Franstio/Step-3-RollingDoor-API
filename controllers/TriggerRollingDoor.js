//import ModbusRTU from 'modbus-serial';
import client, { switchLamp } from '../Lib/PLCUtility.js';
import Container from "../models/ContainerModel.js"
import waste from "../models/WesteModel.js";
import bin from "../models/BinModel.js";
export const rollingdoorUp = async (req, res) => {
    try {
        const {idRollingDoor} = req.body;
	console.log({id: idRollingDoor});

       client.setID(idRollingDoor);
        if (!client.isOpen) {
            client.open( () => {
                console.log("modbus open");
           });
        }
        const address = 20;
        const value = 1;
        const log = await client.writeRegister(address,value);
//        const data = await client.readHoldingRegisters(address, 8);
//        console.log({ log: log, data: data });
        if (value === 1) {
            res.status(200).json({ msg: `Rolling Door Buka` });
        } else {
            res.status(200).json({ msg: `Kunci dengan address ${address} berhasil ditutup.` });
        }


    } catch (error) {
        res.status(500).json({ msg: error });
    }
};
export const triggerAvailableBin = async (req,res) =>{
    const { wasteId, valueIsOpen } = req.body;
    const availableBin = await bin.findAll(
        {
            where:{
                type_waste: wasteId
            }
        }
    );
    if (availableBin.length < 1)
    {
        res.status(200).json({msg: 'Success but no bin available'});
    }
    for (let i=0;i<availableBin.length;i++)
    {
        console.log([parseFloat(availableBin[i].weight) , parseFloat(availableBin[i].max_weight),valueIsOpen,availableBin[i].id])
        await switchLamp(availableBin[i].id, "RED",parseFloat(availableBin[i].weight) >= parseFloat(availableBin[i].max_weight) && valueIsOpen);
        await switchLamp(availableBin[i].id,"GREEN",parseFloat(availableBin[i].weight) < parseFloat(availableBin[i].max_weight) && valueIsOpen);
    }
    res.status(200).json({msg:"Success Trigger bin"});
}
export const rollingDoorDown = async (req, res) => {
    try {
        const address = 21;
        const value = 1;
        const {idRollingDoor} = req.body;
	console.log(idRollingDoor);

        client.setID(idRollingDoor);
//	await new Promise(resolve => setTimeout(resolve,5000));
        await client.writeRegister(address, value);
//        const data = await client.readHoldingRegisters(address, 8);

        if (value === 1) {
            res.status(200).json({ msg: `Rolling Door Ditutup ` + address + " " + value });
        } else {
            res.status(200).json({ msg: `Kunci dengan address ${address} berhasil ditutup.` });
        }
    } catch (error) {
        res.status(500).json({ msg: error});
    }
};

export const switchLampAPI = async (req,res) => {
    const {id,lamp,value} = req.query;
    console.log([id,lamp,value,value ? 1 : 0]);
    await switchLamp(id,lamp,value=='1');
    res.status(200).json({msg:"ok"});
}


export const rollingdoorUpManualWeb = async (req, res) => {
    try {
        const {idRollingDoor,role} = req.body;
        
        if (role !== 1) {
            return res.status(403).json({ msg: 'Access denied.' });
        }

	   console.log({id: idRollingDoor});
       client.setID(idRollingDoor);
        if (!client.isOpen) {
            client.open( () => {
                console.log("modbus open");
           });
        }
        const address = 20;
        const value = 1;
        const log = await client.writeRegister(address,value);
//        const data = await client.readHoldingRegisters(address, 8);
//        console.log({ log: log, data: data });
        if (value === 1) {
            res.status(200).json({ msg: `Rolling Door Buka` });
        } else {
            res.status(200).json({ msg: `Kunci dengan address ${address} berhasil ditutup.` });
        }


    } catch (error) {
        res.status(500).json({ msg: error });
    }
};

export const rollingDoorDownManualWeb = async (req, res) => {
    try {
        const address = 21;
        const value = 1;
        const {idRollingDoor,role} = req.body;
        if (role !== 1) {
            return res.status(403).json({ msg: 'Access denied.' });
        }
	console.log(idRollingDoor);

        client.setID(idRollingDoor);
//	await new Promise(resolve => setTimeout(resolve,5000));
        await client.writeRegister(address, value);
//        const data = await client.readHoldingRegisters(address, 8);

        if (value === 1) {
            res.status(200).json({ msg: `Rolling Door Ditutup ` + address + " " + value });
        } else {
            res.status(200).json({ msg: `Kunci dengan address ${address} berhasil ditutup.` });
        }
    } catch (error) {
        res.status(500).json({ msg: error});
    }
};

export const step4ActivedDoor = async (req,res) => {
    const {doorStatus, name} = req.body;
    const container = await Container.findOne({attributes : ['containerId', 'name','station',"weightbin","idWaste"],include:[{model:waste,as:'waste',required:true,duplicating:false,attributes:['name'], include:[{model:bin,as:'bin',required:true,duplicating:false,attributes:["name","id","type_waste"], where: { name: name }}] }] });
//    res.status(200).json([container,doorStatus ? 1: 0 ]);
    if (!container)
    {
        res.status(500).json({msg:'Container Not Found'});
        return;
    }
    let action = doorStatus ? 20 : 21;
    const val = 1;
    console.log([container,action,doorStatus]);
    client.setID(container.containerId);
    await client.writeRegister(action,val);
    if (doorStatus) {
        res.status(200).json({ msg: `Rolling Door Buka` });
    } else {
        res.status(200).json({ msg: `Rolling Door Tutup` });
    }
}