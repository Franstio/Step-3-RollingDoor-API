//import ModbusRTU from 'modbus-serial';
import client, { readCMD, switchLamp, writeCMD } from '../Lib/PLCUtility.js';
import Container from "../models/ContainerModel.js"
import waste from "../models/WesteModel.js";
import bin from "../models/BinModel.js";
import { where } from 'sequelize';

const getClientId =  async (rollingDoorId)=>{
    try
    {
    const sBin = await bin.findOne({
        where: {id: rollingDoorId}
    });
        if (!sBin )
            return null;
        if (!sBin.toJSON().clientId)
            return null;
        return sBin.toJSON().clientId;
    }
    catch(err)
    {
        return null;
    }
}
export const ToggleRollingDoor  = async (id,openDoor)=>{
    const address  =openDoor  ?20 : 1;
    const value = 1;
    await writeCMD({id:id,address:address,value:value}); 
}

export const rollingdoorUp = async (req, res) => {
        const {idRollingDoor} = req.body;
        const clientId = await getClientId(idRollingDoor);
        const address = 20;
        const value = 1;
        if (clientId==null)
        {
            res.status(500).json({err:"bin not found",id:idRollingDoor});
            return ;
        }
        try {
        const log = await writeCMD({id:clientId,address:address,value:value});
        const data = await readCMD(address, 8);
        if (value === 1) {
            res.status(200).json({ msg: `Rolling Door Buka`,client:clientId,address:address,val:value,plc_response:log });
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
        await switchLamp(availableBin[i].clientId,"GREEN",parseFloat(availableBin[i].weight) < parseFloat(availableBin[i].max_weight) && valueIsOpen);
    for (let i= 0 ;i<availableBin.length;i++)
    {
        const maxWeight =  parseFloat(availableBin[i].max_weight) * 0.95;
        await switchLamp(availableBin[i].clientId, "RED",parseFloat(availableBin[i].weight) >= maxWeight && valueIsOpen);
    }
    res.status(200).json({msg:"Success Trigger bin"});
}
export const rollingDoorDown = async (req, res) => {
        const address = 21;
        const value = 1;
        const {idRollingDoor} = req.body;

        const clientId = await getClientId(idRollingDoor);
        if (clientId==null)
        {
            res.status(500).json({err:"bin not found",id:idRollingDoor});
            return ;
        }
        try
        {
//	await new Promise(resolve => setTimeout(resolve,5000));
       const resPlc =  await writeCMD({id:clientId,address:address,value: value});
//        const data = await client.readHoldingRegisters(address, 8);

        res.status(200).json({ msg: `Rolling Door Ditutup `,client:clientId,address:address,val:value,plc_response:resPlc});
        return;
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
        if (clientId==null)
        {
            res.status(500).json({err:"bin not found",id:idRollingDoor});
            return ;
        }
        try
        {
        const log = await writeCMD({id:clientId,address:address,value:value});
//        const data = await client.readHoldingRegisters(address, 8);
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
        if (clientId==null)
        {
            res.status(500).json({err:"bin not found",id:idRollingDoor});
            return ;
        }
        try
        {
//	await new Promise(resolve => setTimeout(resolve,5000));
        await writeCMD({id:clientId,address:address,value: value});
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
    const _bin = await bin.findOne({
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
    try
    {
    const res2 = await writeCMD({id:_bin.toJSON().clientId,address:action,value:val});
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
        res.status(500).json({err:err,clientId:_bin.toJSON().clientId,address:action,value:val});
        }
    }
}