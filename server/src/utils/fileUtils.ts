import { error } from 'console';
import {promises as fs } from  'fs'
export async function isdirectoryExists(dirPath:string):Promise<boolean> {
    try{
        await fs.access(dirPath);
        return true;
    }catch(error:any){
        return false;
    }
    
}