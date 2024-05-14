import express from "express";
import {getScales50Kg} from "../controllers/Scales.js"

const router = express.Router();


router.get('/Scales50Kg', getScales50Kg);



export default router;
