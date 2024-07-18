import Users from "../models/EmployeeModel.js"
import Container from "../models/ContainerModel.js"
import waste from "../models/WesteModel.js";
import transaction from "../models/TransactionModel.js"
import bin from "../models/BinModel.js";
import moment from 'moment';
//import { switchLamp } from "../Lib/PLCUtility.js";

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
        console.error(error);
        res.status(500).json({ msg: 'Terjadi kesalahan server'  });
    }
};

export const ScanContainer = async (req, res) => {
    const { containerId } = req.body;
    try {
        const container = await Container.findOne({attributes : ['containerId', 'name','station',"weightbin","idWaste"],include:[{model:waste,as:'waste',required:true,duplicating:false,attributes:['name'], include:[{model:bin,as:'bin',required:true,duplicating:false,attributes:["name","id","type_waste"]}] }], where: { name: containerId } });
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
    (await transaction.create(payload)).save();
    res.status(200).json({msg:'ok'});
}
export const UpdateBinWeight = async (req,res) =>{
    const {binId,neto} = req.body;
    const data = await bin.findOne({where: {id:binId}});
    data.weight = parseFloat(neto) + parseFloat(data.weight);
    data.save();
   // await switchLamp(data.id,"RED",data.weight >= parseFloat(data.max_weight))
    res.status(200).json({msg:'ok'});
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

        res.status(200).json({ success: true, bin: selectedBin });
    } catch (error) {
        console.error('Error checking bin capacity:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

