import redisClient from "../config/redisClient";

export const setCache = async (key: string, value: any, ttl?: number)=>{
    try{
        const StringValue = JSON.stringify(value);
        if(ttl){
            await redisClient.set(key, StringValue, {EX: ttl});
        }
        else{
            await redisClient.set(key, StringValue);
        }
        return true;
    }
    catch(error){
        console.error(error);
    }
}


export const getCache = async (key: string)=>{
    try{
        const data = await redisClient.get(key);
        return data ? JSON.parse(data) : null;
    }
    catch(error){
        console.error(error);
        return null;
    }
}

export async function deleteCache(key: string) {
    try {
      await redisClient.del(key);
      return true;
    } catch (err) {
      console.error("Redis deleteCache error:", err);
      return false;
    }
  }