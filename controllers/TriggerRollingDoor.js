//import ModbusRTU from 'modbus-serial';
import client, { switchLamp } from '../Lib/PLCUtility.js';
import Container from "../models/ContainerModel.js"
import waste from "../models/WesteModel.js";
import bin from "../models/BinModel.js";
import { where } from 'sequelize';

const getClientId =  async (rollingDoorId)=>{
    const sBin = await bin.findOne({
        where: {id: rollingDoorId}
    });
    if (!sBin )
        return null;
    if (!sBin.toJSON().clientId)
        return null;
    return sBin.toJSON().clientId;
}
export const rollingdoorUp = async (req, res) => {
        const {idRollingDoor} = req.body;
        const clientId = await getClientId(idRollingDoor);
    	console.log({id: clientId});
        const address = 20;
        const value = 1;
        if (clientId==null)
        {
            res.status(500).json({err:"bin not found",id:idRollingDoor});
            return ;
        }
        try {
            client.setID(clientId);
        if (!client.isOpen) {
            client.open( () => {
                console.log("modbus open");
           });
        }
        const log = await client.writeRegister(address,value);
        const data = await client.readHoldingRegisters(address, 8);
        console.log({ log: log, data: data });
        if (value === 1) {
            res.status(200).json({ msg: `Rolling Door Buka` });
        } else {
            res.status(200).json({ msg: `Kunci dengan address ${address} berhasil ditutup.` });
        }


    } catch (error) {
        if (error.name=="TransactionTimedOutError")
        {
            if (value === 1) {
                res.status(200).json({ msg: `Rolling Door Buka` });
            } else {
                res.status(200).json({ msg: `Kunci dengan address ${address} berhasil ditutup.` });
            }
    
        }
        else
            res.status(500).json({ msg: error,clientId:clientId,id:idRollingDoor });
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
//        console.log([parseFloat(availableBin[i].weight) , parseFloat(availableBin[i].max_weight),valueIsOpen,availableBin[i].id])
        await switchLamp(availableBin[i].clientId, "RED",parseFloat(availableBin[i].weight) >= parseFloat(availableBin[i].max_weight) && valueIsOpen);
        await switchLamp(availableBin[i].clientId,"GREEN",parseFloat(availableBin[i].weight) < parseFloat(availableBin[i].max_weight) && valueIsOpen);
    }
    res.status(200).json({msg:"Success Trigger bin"});
}
export const rollingDoorDown = async (req, res) => {
        const address = 21;
        const value = 1;
        const {idRollingDoor} = req.body;

        const clientId = await getClientId(idRollingDoor);
    	console.log({id: clientId});
        if (clientId==null)
        {
            res.status(500).json({err:"bin not found",id:idRollingDoor});
            return ;
        }
        try
        {
       client.setID(clientId);
//	await new Promise(resolve => setTimeout(resolve,5000));
        await client.writeRegister(address, value);
//        const data = await client.readHoldingRegisters(address, 8);

        if (value === 1) {
            res.status(200).json({ msg: `Rolling Door Ditutup ` + address + " " + value });
        } else {
            res.status(200).json({ msg: `Kunci dengan address ${address} berhasil ditutup.` });
        }
    } catch (error) {
        if (error.name=="TransactionTimedOutError")
        {
            if (value === 1) {
                res.status(200).json({ msg: `Rolling Door Ditutup ` + address + " " + value });
            } else {
                res.status(200).json({ msg: `Kunci dengan address ${address} berhasil ditutup.` });
            }
    
        }
        else
            res.status(500).json({ msg: error,clientId:clientId,id:idRollingDoor });
    }
};

export const switchLampAPI = async (req,res) => {
    const {id,lamp,value} = req.query;
    console.log([id,lamp,value,value ? 1 : 0]);
    await switchLamp(id,lamp,value=='1');
    res.status(200).json({msg:"ok"});
}


export const rollingdoorUpManualWeb = async (req, res) => {
        const {idRollingDoor,role} = req.body;
        
        if (role !== 1) {
            return res.status(403).json({ msg: 'Access denied.' });
        }

        const address = 20;
        const value = 1;
        const clientId = await getClientId(idRollingDoor);
    	console.log({id: clientId});
        if (clientId==null)
        {
            res.status(500).json({err:"bin not found",id:idRollingDoor});
            return ;
        }
        try
        {
       client.setID(clientId);
        if (!client.isOpen) {
            client.open( () => {
                console.log("modbus open");
           });
        }
        const log = await client.writeRegister(address,value);
//        const data = await client.readHoldingRegisters(address, 8);
//        console.log({ log: log, data: data });
        if (value === 1) {
            res.status(200).json({ msg: `Rolling Door Buka` });
        } else {
            res.status(200).json({ msg: `Kunci dengan address ${address} berhasil ditutup.` });
        }


    } catch (error) {
        if (error.name=="TransactionTimedOutError")
        {
            if (value === 1) {
                res.status(200).json({ msg: `Rolling Door Buka` });
            } else {
                res.status(200).json({ msg: `Kunci dengan address ${address} berhasil ditutup.` });
            }
    
        }
        else
            res.status(500).json({ msg: error,clientId:clientId,id:idRollingDoor });
    }
};

export const rollingDoorDownManualWeb = async (req, res) => {
        const address = 21;
        const value = 1;
        const {idRollingDoor,role} = req.body;
        if (role !== 1) {
            return res.status(403).json({ msg: 'Access denied.' });
        }

        const clientId = await getClientId(idRollingDoor);
    	console.log({id: clientId});
        if (clientId==null)
        {
            res.status(500).json({err:"bin not found",id:idRollingDoor});
            return ;
        }
        try
        {
       client.setID(clientId);
//	await new Promise(resolve => setTimeout(resolve,5000));
        await client.writeRegister(address, value);
//        const data = await client.readHoldingRegisters(address, 8);

        if (value === 1) {
            res.status(200).json({ msg: `Rolling Door Ditutup ` + address + " " + value });
        } else {
            res.status(200).json({ msg: `Kunci dengan address ${address} berhasil ditutup.` });
        }
    } catch (error) {
        if (error.name=="TransactionTimedOutError")
        {
            if (value === 1) {
                res.status(200).json({ msg: `Rolling Door Ditutup ` + address + " " + value });
            } else {
                res.status(200).json({ msg: `Kunci dengan address ${address} berhasil ditutup.` });
            }
    
        }
        else
            res.status(500).json({ msg: error,clientId:clientId,id:idRollingDoor });
    }
};

export const step4ActivedDoor = async (req,res) => {
    const {doorStatus, name} = req.body;
//    const container = await Container.findOne({attributes : ['containerId', 'name','station',"weightbin","idWaste",'clientId'],include:[{model:waste,as:'waste',required:true,duplicating:false,attributes:['name'], include:[{model:bin,as:'bin',required:true,duplicating:false,attributes:["name","id","type_waste"], where: { name: name }}] }] });
//    res.status(200).json([container,doorStatus ? 1: 0 ]);
    const _bin = bin.findOne({
        attributes: ['clientId'],
        
        where: {'name': name}
    });
    if (!_bin)
    {
        res.status(500).json({msg:'Bin Not Found'});
        return;
    }
    let action = doorStatus ? 20 : 21;
    const val = 1;
    client.setID(_bin.toJSON().clientId);
    try
    {
    const res2 = await client.writeRegister(action,val);
    if (doorStatus) {
        res.status(200).json({ msg: `Rolling Door Buka `,clientId: _bin.toJSON().clientId,address:action,value:val,plcres: res2});
    } else {
        res.status(200).json({ msg: `Rolling Door Tutup`,clientId:_bin.toJSON().clientId,address:action,value:val,plcres: res2 });
    }
    }
    catch(err)
    {
        if (err.name=="TransactionTimedOutError")
        {
            if (doorStatus) {
                res.status(200).json({ msg: `Rolling Door Buka `,clientId: _bin.toJSON().clientId,address:action,value:val,plcres: res2});
            } else {
                res.status(200).json({ msg: `Rolling Door Tutup`,clientId:_bin.toJSON().clientId,address:action,value:val,plcres: res2 });
            }
        }
        else
        {
        console.log(err);
        res.status(500).json({err:err,clientId:_bin.toJSON().clientId,address:action,value:val});
        }
    }
}