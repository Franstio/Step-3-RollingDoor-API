import Users from "../models/EmployeeModel.js"
import Container from "../models/ContainerModel.js"
import waste from "../models/WesteModel.js";
import transaction from "../models/TransactionModel.js"
import bin from "../models/BinModel.js";
import moment from 'moment';
export const ScanBadgeid = async (req, res) => {
    console.log(req.body);
    const { badgeId } = req.body;
    try {
        const user = await Users.findOne({ attributes: ['badgeId',"username"], where: { badgeId } });
        if (user) {
            res.json({ user: user });
        } else {
            res.json({ error: 'Badge ID not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Terjadi kesalahan server'  });
    }
};

export const ScanContainer = async (req, res) => {
    const { containerId } = req.body;
    console.log(containerId)
    try {
        const container = await Container.findOne({attributes : ['containerId', 'name','station',"weightbin","idWaste"],include:[{model:waste,as:'waste',required:true,duplicating:false,attributes:['name'], include:[{model:bin,as:'bin',required:true,duplicating:false,attributes:["name","id"]}] }], where: { name: containerId } });
        if (container) {
            res.json({ container:container });
        } else {
            res.json({ error: 'Container ID not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Terjadi kesalahan server' });
    }
};
export const SaveTransaksi = async (req,res) => {
    const {payload} = req.body;
    payload.recordDate = moment().format("YYYY-MM-DD HH:mm:ss");
    console.log(payload);
    (await transaction.create(payload)).save();
    res.status(200).json({msg:'ok'});
}
export const UpdateBinWeight = async (req,res) =>{
    const {binId,neto} = req.body;
    const data = await bin.findOne({where: {id:binId}});
    data.weight = neto + data.weight;
    data.save();
    res.status(200).json({msg:'ok'});
}
