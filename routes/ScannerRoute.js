import express from "express";
import {ScanBadgeid,ScanContainer,SaveTransaksi,UpdateBinWeight} from "../controllers/Employee.js"

const router = express.Router();

router.post('/ScanBadgeid', ScanBadgeid);
router.post('/ScanContainer', ScanContainer);
router.post("/SaveTransaksi",SaveTransaksi);
router.post('/UpdateBinWeight',UpdateBinWeight)

export default router;