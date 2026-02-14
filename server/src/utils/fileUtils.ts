import { error } from 'console';
import {promises as fs } from  'fs'
import path from 'path'
export async function isdirectoryExists(dirPath:string):Promise<boolean> {
    try{
        await fs.access(dirPath);
        return true;
    }catch(error:any){
        return false;
    }
    
}



export const AUDIO_EXTENSIONS = ['.g711', '.g711u', '.g711a', '.g726', '.g728', '.pcm', '.wav', '.mp3', '.aac', '.ogg'];
export const getPathVariations = (filePath: string) => {
    const normalized = path.resolve(filePath);
    return [
        normalized,
        filePath,
        path.relative(process.cwd(), normalized)
    ];
};

// check if the file is decoded or not 
export const parseDecodedFilename = (filename: string): string | null => {
    const match = filename.match(/^(.*)_decoded\.(wav|mp3|aac|ogg)$/i);
    return match ? match[1]! : null;
};
