import { SerialPort } from 'serialport';

const Timbangan = new SerialPort({
    path: '/dev/ttyUSB1',
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    }); 
    
let currentWeight=0;
let holdDelay = false;
export const getScales50Kg =(io) => {
    try {
         let response;
       /* console.log("TEt");
        setInterval(function(){
            response = { weight50Kg: 20 };
            io.emit('data', response);
        },5000); */
        Timbangan.on('data', (rawData) => {
           // console.log('Data Timbangan:', weight50Kg.toString());
            // Kirim data yang diterima sebagai respons ke clien
	  // console.log(rawData.toString());
	    const data = parseFloat(rawData.toString().replace("=","")).toString();
	 // console.log(data);
	    let res='';
	    const point = data.indexOf(".");
            for (let i=data.length-1;i>=0;i--)
    	    {
        	if (((data.length-1) - i) == point)
            		res += ".";
        	if (parseInt(data[i]))
            		res += data[i];
	    }
	    const parsed = parseFloat(res.toString());
//            if ( Math.abs(currentWeight - parsed) < 0.5)
//		return;
	    if (holdDelay && (currentWeight > parsed))
		return;
	    if (!holdDelay)
	    {
		holdDelay=  true;
		setTimeout(()=>{
			holdDelay=false;
	        },500);
	    }
	    currentWeight = parsed;
            response = { weight50Kg: res.toString() };
            io.emit('data', response);
        });

        Timbangan.on('error', (error) => {
            console.log(error);
        });
        if (response != undefined && response != null) {
            res.status(200).json(response);
        }
    } catch (error) {
	console.log(error);
//      res.status(500).json({ msg: error.message });
    }
};


