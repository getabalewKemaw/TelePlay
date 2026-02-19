
import { promises as fs } from 'fs'
import type { FileMetadataDto } from '../dto/file.dto.js';
import type { AudioCodec,SampleRate,ChannelConfig } from '../types/ffmpeg/FFmpegTypes.js';
import path from 'path'

const processedDir = path.resolve(process.env.PROCESSED_DIR || './processed');
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
    const relative = path.relative(process.cwd(), normalized);
    const variations = new Set([normalized, filePath, relative]);
    for (const value of Array.from(variations)) {
        variations.add(value.replace(/\\/g, '/'));
    }
    return Array.from(variations);
};

// check if the file is decoded or not 
export const parseDecodedFilename = (filename: string): string | null => {
    const match = filename.match(/^(.*)_decoded\.(wav|mp3|aac|ogg)$/i);
    return match ? match[1]! : null;
};


export const inferDecodeCodec = (filename: string, codec?: string | null): AudioCodec | undefined => {
    const codecName = (codec || '').toLowerCase();
    const name = filename.toLowerCase();
    if (codecName) {
        if (codecName.includes('alaw') || codecName === 'pcm_alaw') return 'pcm_alaw';
        if (codecName.includes('mulaw') || codecName === 'pcm_mulaw') return 'pcm_mulaw';
        if (codecName.includes('g726') || codecName === 'adpcm_g726') return 'g726';
        if (codecName.includes('g728')) return 'g728';
    }

    //  USE FILENAME ONLY AS A FALLBACK (If codec is missing/null)
    if (name.includes('g711a') || name.includes('alaw')) return 'pcm_alaw';
    if (name.includes('g711u') || name.includes('mulaw') || name.includes('g711')) return 'pcm_mulaw';
    if (name.includes('g726')) return 'g726';
    
    return undefined;
};


export const inferSampleRate = (codec?: AudioCodec): SampleRate | undefined => {
    if (codec === 'g728') return 16000;
    if (codec === 'g726' || codec === 'pcm_mulaw' || codec === 'pcm_alaw') return 8000;
    return undefined;
};

export const inferChannels = (codec?: AudioCodec): ChannelConfig | undefined => {
    if (codec === 'g728' || codec === 'g726' || codec === 'pcm_mulaw' || codec === 'pcm_alaw') return 1;
    return undefined;
};

export const inferG726Bitrate = (bitrate?: number | null): number | undefined => {

    if (bitrate===null ||bitrate===undefined || !Number.isFinite(bitrate)){
        return 32;
    } 
    const kbps = bitrate >= 1000 ? Math.round(bitrate / 1000) : bitrate;
    const supported = [16, 24, 32,40];
    return supported.reduce((prev,curr)=>Math.abs(curr-kbps)< Math.abs(prev-kbps)?curr:prev);
};

export const buildDecodedOutputPath = (filename: string): string => {
    const base = path.parse(filename).name;
    return path.join(processedDir, `${base}_decoded.mp3`);
};

export const buildTempDecodedOutputPath = (fileId: string, filename: string): string => {
    const base = path.parse(filename).name;
    return path.join(processedDir, `${base}_decoded.${fileId}.partial.mp3`);
};

export const coerceDecodeProgress = (value: unknown): number | undefined => {
    //conver a  numbe if the value comes in the string form
    const parsed=Number(value);
    if(isNaN(parsed) || !Number.isFinite(parsed)||value===null){
        return undefined;
    }
        return Math.max(0, Math.min(100, parsed));
};

export const toFileMetadataDto = (file: any): FileMetadataDto => {
    const decodeProgress = coerceDecodeProgress(file?.metadata?.decodeProgress);
    return {
        ...file,
        fileSize: file.fileSize?.toString(),
        decodeProgress
    };
};
