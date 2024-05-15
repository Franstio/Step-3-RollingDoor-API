export const switchLamp = async (lampType, isAlive) =>
    {
        const dict = {
            "RED" : 30,
            "GREEN" : 31
        };
        const address = dict[lampType];
        await client.writeRegister(address, isAlive ? 1 :  0);
    }