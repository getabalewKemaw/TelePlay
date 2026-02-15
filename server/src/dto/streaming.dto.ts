
import type {
    StreamingPreparationOptions
} from '../types/streaming/StreamingTypes.js';


export interface CreateSessionRequestDto {
    filePath: string;
    options?: StreamingPreparationOptions;
}
