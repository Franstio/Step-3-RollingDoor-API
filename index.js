import {config} from 'dotenv';
config();
import express from "express";
import RollingDoorRoute from "./routes/RollingDoorRoute.js";
import ScannerRoute from "./routes/ScannerRoute.js";
import cors from  "cors";
import ScalesRoute from "./routes/ScalesRoute.js";
import http from 'http';
import { Server } from "socket.io";
import db from "./config/db.js";
import {getScales50Kg} from "./controllers/Scales.js";
import bodyParser from "body-parser";
import { checkMaxWeight } from "./Lib/PLCUtility.js";
import { syncEmployeePIDSG, syncPIDSGBin, syncPIDSGContainer, SyncTransaction } from './controllers/Employee.js';
const app = express();
const server = http.createServer(app);

try {
  await db.authenticate();
  console.log('Database terhubung..');
  
} catch (error) {
  console.log(error);
  
}

const port = 5000;
app.use(cors({
  credentials: false,
  origin: '*'
}));

app.use(bodyParser.json());

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

export { Server, io };

app.use(RollingDoorRoute);
app.use(ScannerRoute);
app.use(ScalesRoute);


 io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
}); 

server.listen(port, () => {
  console.log(`Server up and running on port ${port}`);
});
const doSync = async() =>{
  await SyncTransaction();
  setImmediate(doSync);
}
const doSyncEmp = async()=>{
  await syncEmployeePIDSG();
  await syncPIDSGBin();
  await syncPIDSGContainer();
  setTimeout(doSyncEmp,10*10*1000);
}
doSync();
doSyncEmp();
getScales50Kg(io);
console.log("check max weight");
//checkMaxWeight();