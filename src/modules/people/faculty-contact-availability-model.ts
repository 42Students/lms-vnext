import {z} from "zod";
/**
 * Registered faculty_profiles does not contain alternatePhone/contactEmail.
 * Refuse any proposed mutation rather than updating login identifiers.
 */
export const facultyContactReadQuerySchema=z.object({}).strict();
export function facultyContactStorageAvailability(){
 return {editable:false as const,
   reason:"Faculty alternate phone and contact email are not yet registered in migrated storage. Your login email and phone cannot be edited here."};
}
