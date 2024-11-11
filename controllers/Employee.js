import Users from "../models/EmployeeModel.js"
import Container from "../models/ContainerModel.js"
import waste from "../models/WesteModel.js";
import transaction from "../models/TransactionModel.js"
import bin from "../models/BinModel.js";
import moment from 'moment';
import { ToggleRollingDoor } from "./TriggerRollingDoor.js";
import db from "../config/db.js";   
import axios from 'axios';
import { QueryTypes } from "sequelize";
//import { switchLamp } from "../Lib/PLCUtility.js";
const apiClient = axios.create({
    withCredentials: false,
    timeout: 1000,
});
export const ScanBadgeid = async (req, res) => {
    const { badgeId } = req.body;
    try {
        const user = await Users.findOne({ attributes: ['badgeId',"username"], where: { badgeId } });
        if (user) {
            res.json({ user: user });
        } else {
            res.json({ error: 'Badge ID not found' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Terjadi kesalahan server'  });
    }
};

export const ScanContainer = async (req, res) => {
    const { containerId } = req.body;
    try {
        const container = await Container.findOne({attributes : ['containerId', 'name','station',"weightbin","step2value","idWaste"],include:[{model:waste,as:'waste',required:true,duplicating:false,attributes:['name'], include:[{model:bin,as:'bin',required:true,duplicating:false,attributes:["name","id","type_waste"]}] }], where: { name: containerId } });
        if (container) {
            res.json({ container:container });
        } else {
            res.json({ error: 'Container ID not found' });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: 'Terjadi kesalahan server' });
    }
};
export const SaveTransaksi = async (req,res) => {
    const {payload} = req.body;
    payload.recordDate = moment().format("YYYY-MM-DD HH:mm:ss");
    let state = await transaction.create(payload);
    state = await state.save();
    await db.query(`Update container set step2value=0 where name='${payload.containerName}';`);
    res.status(200).json({msg:state});
}
export const UpdateBinWeight = async (req,res) =>{
    const {binId,neto} = req.body;
    const data = await bin.findOne({where: {id:binId}});
    data.weight = parseFloat(neto) + parseFloat(data.weight);
    data.save();
    await ToggleRollingDoor(data.clientId,false);
   // await switchLamp(data.id,"RED",data.weight >= parseFloat(data.max_weight))
    res.status(200).json({msg:'ok'});
}
export const SyncTransaction = async ()=>{
    const data = await db.query("Select t.id,t.status,t.isSuccess,t.containerName,t.binName,t.neto from transaction t where t.status like '%PENDING%';");
    if (!data || data.length < 1)
        return data;
    const pending = data[0];
    if (!pending || pending.length<1 )
        return pending;
    
    for (let i=0;i<pending.length;i++)
    {
        try
        {
            const weightResponse = await apiClient.post(`http://${process.env.REACT_APP_PIDSG}/api/pid/sendWeight`,{
                        binname: pending[i].name,
                        weight: pending[i].step2value
            });
            const response = await apiClient.post(`http://${process.env.PIDSG}/api/pid/activityLogTempbyPc`, {
                badgeno: pending[i].badgeId,
                stationname: "STEP 3 COLLECTION",
                frombin: pending[i].containerName,//"2-PCS-5",
                weight: pending[i].neto,
                activity: 'Movement by System',
                filename: null,
                postby: "Local Step 3"

            });
            const response2 = await apiClient.post(`http://${process.env.PIDSG}/api/pid/activityLogbypc`, {
                stationname: "STEP 3 COLLECTION",
                frombin: pending[i].containerName,
                tobin: pending[i].binName ,
            });
            pending[i].status  ='Done';
            pending[i].isSuccess = true;
            console.log([pending[i],[response.status,response.data],[response2.status,response2.data],[weightResponse.status,weightResponse.data]]);
        }
        catch(err)
        {
            pending[i].status  = 'Pending|PIDSG';
            pending[i].isSuccess = false;
            console.log(err?.message|| 'ERROR');
        }
        
        await db.query(`Update transaction set status='${pending[i].status}',isSuccess=${pending[i].isSuccess ? 1 : 0 } where id='${pending[i].id || pending[i].Id}' `);
    }
    return pending;
}
export const SyncAPI =async (req,res) =>
{
    const data = await SyncTransaction();
    return res.json({msg:data});
}
export const CheckBinCapacity = async (req, res) => {
    const { type_waste, neto } = req.body;

    try {
        // Mengambil semua tempat sampah yang sesuai dengan type_waste dari database
        const bins = await bin.findAll({
            where: {
                type_waste: type_waste
            }
        });

        // Jika tidak ada tempat sampah yang ditemukan untuk type_waste yang diberikan
        if (!bins || bins.length === 0) {
            return res.status(404).json({ success: false, message: 'No bins found for the given waste type' });
        }

        // Menyaring tempat sampah yang memiliki kapasitas cukup untuk neto
        let eligibleBins = bins.filter(bin => (parseFloat(bin.weight) + parseFloat(neto)) <= parseFloat(bin.max_weight));

        // Jika tidak ada tempat sampah yang memenuhi kapasitas
        if (eligibleBins.length === 0) {
            return res.status(200).json({ success: false, message: 'No bins with enough capacity found' });
        }

        // Mengurutkan tempat sampah berdasarkan kapasitas yang hendak penuh terlebih dahulu
        eligibleBins = eligibleBins.sort((a, b) =>  (parseFloat(a.max_weight) - (parseFloat(a.weight) + parseFloat(neto))) -    (parseFloat(b.max_weight) - (parseFloat(b.weight) + parseFloat(neto))));
        // Memilih tempat sampah yang hendak penuh
        let selectedBin = eligibleBins[0];
        let remainingNeto = neto;

     /*    while (selectedBin && remainingNeto > 0) {
            const availableCapacity = selectedBin.max_weight - selectedBin.weight;
            
            if (remainingNeto <= availableCapacity) {
                selectedBin.weight += remainingNeto;
                remainingNeto = 0;
            } else {
                selectedBin.weight += availableCapacity;
                remainingNeto -= availableCapacity;
                eligibleBins.shift(); // Menghapus bin yang sudah penuh dari daftar
                selectedBin = eligibleBins[0]; // Memilih bin berikutnya
            }
        } */

        if (eligibleBins.length < 1) {
            return res.status(200).json({ success: false, message: 'Not enough capacity in any bins' });
        }
        console.log(selectedBin.clientId);
        await ToggleRollingDoor(selectedBin.clientId,true);
        res.status(200).json({ success: true, bin: selectedBin });
    } catch (error) {
        console.log('Error checking bin capacity:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

export const UpdateStep2Value = async (req,res)=>{
    const {value,fromRack} = req.body;
    const {containerName} = req.params;
    const _container = await Container.findOne({where:{
        name: containerName
    }});
    if (!_container)
        return res.status(404).json('Container Not Found');
    _container.step2value = parseFloat(value)+ parseFloat(_container.step2value ??0);
//    _container.step2value = fromRack ? parseFloat(value) : (parseFloat(value) + _container.step2value);
    await _container.save();
    return res.status(200).json({msg:'ok'});
}
export const syncEmployeePIDSGAPI = async (req,res)=>{
    return res.json(await syncEmployeePIDSG());
}

export const syncEmployeePIDSG = async ()=>{
    try
    {
        const apiRes = await apiClient.get(
            `http://${process.env.PIDSG}/api/pid/employee-sync?f1=${process.env.STATION}`);
        const syncEmp = apiRes.data.result[0];
        for (let i=0;i<syncEmp.length;i++)
        {
            const empRes = await db.query("Select badgeId,username from employee where badgeId=?",{type:QueryTypes.SELECT,replacements:[syncEmp[i].badgeno]});
            if (empRes.length < 1)
            {
                await db.query("Insert Into employee(username,active,badgeId) values(?,1,?)",
                {
                    type:QueryTypes.INSERT,
                    replacements: [syncEmp[i].employeename,syncEmp[i].badgeno]
                });
            }
            else
            {
                await db.query("Update employee set username=? where badgeId=?",{
                    type: QueryTypes.UPDATE,
                    replacements: [syncEmp[i].employeename,syncEmp[i].badgeno]
                })
            }
        }
        return syncEmp;
    }
    catch (er)
    {
        console.log(er);
        return  er.message || er;
    }
}