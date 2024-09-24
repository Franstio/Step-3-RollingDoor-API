import { SerialPort } from 'serialport';


let currentWeight = 0;
let holdDelay = false;
export const getScales50Kg = (io) => {
	const Timbangan = new SerialPort({
		path: process.env.PORT_TIMBANGAN,//Note Diubah dari 1 ke 0.
		baudRate: 9600,
		dataBits: 8,
		stopBits: 1,
		parity: 'none',
	});
	console.log("Timbangan PORT: "+ process.env.PORT_TIMBANGAN);
	if (Timbangan == null)
	{
		getScales50Kg(io);
		return
	}
	try {
		let response;
		setInterval(function () {
			response = { weight50Kg: 20 };
			io.emit('data', response);
		}, 5000);
		io.on('connectScale', () => {
			Timbangan.open(() => {
			});
		});
		Timbangan.on('data', (rawData) => {
			// Kirim data yang diterima sebagai respons ke clien
			try {
				const arData = rawData.toString().split(',');
				let res = arData[arData.length-1];
				let val = res.trim().replace("Kg","");
				val = val.substring(1,val.length);
				val = parseFloat(val);
				if (res[0]=='-')
					val = val * -1;
				//            if ( Math.abs(currentWeight - parsed) < 0.5)
				//		return;
				currentWeight = val;
				response = { weight50Kg: val.toString() };
				io.emit('data', response);
			}
			catch (err) {
			}
		});

		Timbangan.on('error', (error) => {
			console.log({kg50error:error});
			Timbangan.close();
			getScales50Kg(io);
			return;
		});

		if (response != undefined && response != null) {
			res.status(200).json(response);
		}
	} catch (error) {
		//      res.status(500).json({ msg: error.message });
	}
};


