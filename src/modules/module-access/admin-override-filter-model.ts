import {z} from "zod";
import {OPTIONAL_MODULE_KEYS} from "./service";
/** Only the production resolver module keys are searchable. */
export const adminModuleOverrideFilterSchema=z.enum(OPTIONAL_MODULE_KEYS).optional();
