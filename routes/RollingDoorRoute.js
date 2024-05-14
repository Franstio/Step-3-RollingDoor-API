import express from "express";
import {rollingdoorUp,rollingDoorDown} from "../controllers/TriggerRollingDoor.js"

const router = express.Router();


router.post('/rollingdoorUp', rollingdoorUp);
router.post('/rollingdoorDown',rollingDoorDown );



export default router;