import express from "express";
import {rollingdoorUp,rollingDoorDown,triggerAvailableBin} from "../controllers/TriggerRollingDoor.js"

const router = express.Router();


router.post('/rollingdoorUp', rollingdoorUp);
router.post('/rollingdoorDown',rollingDoorDown );
router.post('/triggerAvailbleBin',triggerAvailableBin);


export default router;