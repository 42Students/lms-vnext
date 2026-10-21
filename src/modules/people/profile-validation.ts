import { z } from "zod";
import { learnerEducationValidationProblem } from "./learner-education-picker-model";

const optionalProfileText = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .nullable()
    .optional();

export const learnerProfileInputSchema = z.object({
  rollNumber: optionalProfileText(128),
  registrationNumber: optionalProfileText(128),
});

export const facultyProfileInputSchema = z.object({
  primaryDepartmentId: z.string().uuid().nullable().optional(),
  employmentType: optionalProfileText(128),
  academicTitle: optionalProfileText(128),
});

const textValue = (max: number) =>
  z.string().trim().max(max).default("");

const urlValue = z
  .string()
  .trim()
  .max(2000)
  .refine(
    (value) =>
      value === "" ||
      (() => {
        try {
          const url = new URL(value);
          return (
            (url.protocol === "https:" || url.protocol === "http:") &&
            Boolean(url.hostname) &&
            url.username === "" &&
            url.password === ""
          );
        } catch {
          return false;
        }
      })(),
    "Use a valid http or https URL without embedded credentials",
  )
  .default("");

const phoneValue = z
  .string()
  .trim()
  .max(32)
  .refine(
    (value) => {
      if (value === "") return true;
      if (!/^[+]?\d[\d\s-]*$/.test(value)) return false;
      const digitCount = value.replace(/\D/g, "").length;
      return digitCount >= 10 && digitCount <= 15;
    },
    "Phone number must be 10-15 digits",
  )
  .default("");

const emailValue = z
  .string()
  .trim()
  .max(320)
  .refine(
    (value) =>
      value === "" ||
      z.string().email().safeParse(value).success,
    "Enter a valid email address",
  )
  .default("");

const calendarDateValue = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (value === "") return true;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
      }
      const parsed = new Date(
        value + "T00:00:00Z",
      );
      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) ===
          value
      );
    },
    "Use YYYY-MM-DD",
  )
  .default("");

const itemId = z.string().uuid();

const contactsSchema = z
  .object({
    alternatePhone: phoneValue,
    contactEmail: emailValue,
  })
  .strict()
  .default({
    alternatePhone: "",
    contactEmail: "",
  });

const socialProfilesSchema = z
  .object({
    linkedinUrl: urlValue,
    githubUrl: urlValue,
    portfolioUrl: urlValue,
    twitterUrl: urlValue,
    googleScholarUrl: urlValue,
    researchGateUrl: urlValue,
  })
  .strict()
  .default({
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
    twitterUrl: "",
    googleScholarUrl: "",
    researchGateUrl: "",
  });

const addressSchema = z
  .object({
    currentAddress: textValue(1000),
    city: textValue(160),
    state: textValue(160),
    pincode: z
      .string()
      .trim()
      .max(16)
      .refine(
        (value) =>
          value === "" ||
          /^[A-Za-z0-9 -]{3,16}$/.test(value),
        "Use a valid postal code",
      )
      .default(""),
    permanentAddress: textValue(1000),
    permanentCity: textValue(160),
    permanentState: textValue(160),
    permanentPincode: z
      .string()
      .trim()
      .max(16)
      .refine(
        (value) => value === "" || /^[A-Za-z0-9 -]{3,16}$/.test(value),
        "Use a valid postal code",
      )
      .default(""),
  })
  .strict()
  .default({
    currentAddress: "",
    city: "",
    state: "",
    pincode: "",
    permanentAddress: "",
    permanentCity: "",
    permanentState: "",
    permanentPincode: "",
  });

const personalDetailsSchema = z
  .object({
    gender: z
      .enum([
        "",
        "Male",
        "Female",
        "Other",
        "Prefer not to say",
      ])
      .default(""),
    dateOfBirth: calendarDateValue,
    bloodGroup: z
      .enum([
        "",
        "A+",
        "A-",
        "B+",
        "B-",
        "AB+",
        "AB-",
        "O+",
        "O-",
      ])
      .default(""),
  })
  .strict()
  .default({
    gender: "",
    dateOfBirth: "",
    bloodGroup: "",
  });

const identitySchema = z
  .object({
    aadhaarNumber: z
      .string()
      .trim()
      .transform((value) =>
        value.replace(/[-\s]/g, ""),
      )
      .refine(
        (value) =>
          value === "" || /^\d{12}$/.test(value),
        "Aadhaar number must be 12 digits",
      )
      .default(""),
    panNumber: z
      .string()
      .trim()
      .toUpperCase()
      .refine(
        (value) =>
          value === "" ||
          /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(value),
        "PAN must be in format ABCDE1234F",
      )
      .default(""),
  })
  .strict()
  .default({
    aadhaarNumber: "",
    panNumber: "",
  });

const experienceSchema = z
  .object({
    id: itemId,
    organization: textValue(240),
    designation: textValue(200),
    experienceType: z
      .enum([
        "Full-time",
        "Part-time",
        "Internship",
        "Contract",
        "Freelance",
        "Other",
      ])
      .default("Full-time"),
    location: textValue(200),
    startDate: calendarDateValue,
    endDate: calendarDateValue,
    currentlyWorking: z.boolean().default(false),
    compensation: textValue(120),
    description: textValue(5000),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.organization) {
      ctx.addIssue({
        code: "custom",
        path: ["organization"],
        message: "Organization is required",
      });
    }
    if (!value.designation) {
      ctx.addIssue({
        code: "custom",
        path: ["designation"],
        message: "Designation is required",
      });
    }
    if (
      value.startDate &&
      value.endDate &&
      value.endDate < value.startDate
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "End date cannot be before start date",
      });
    }
  });

const educationSchema = z
  .object({
    id: itemId,
    educationType: textValue(120),
    program: textValue(200),
    specialization: textValue(200),
    institution: textValue(300),
    isCurrentlyPursuing: z.boolean().default(false),
    // Legacy application qualification marks one primary/recent education.
    // Generic optional profile education may have none.
    isRecentEducation: z.boolean().default(false),
    startYear: z
      .string()
      .trim()
      .regex(/^$|^\d{4}$/)
      .default(""),
    endYear: z
      .string()
      .trim()
      .regex(/^$|^\d{4}$/)
      .default(""),
    gradingType: z
      .enum([
        "",
        "CGPA",
        "Percentage",
        "Grade",
      ])
      .default(""),
    gradeObtained: textValue(64),
    maxGrade: textValue(64),
    qualifyingExam: textValue(120),
    examDetails: z
      .record(
        z.string().max(120),
        z.union([
          z.string().max(500),
          z.number(),
          z.boolean(),
        ]),
      )
      .default({}),
  })
  .strict();
export const learnerProfileEducationWriteSchema=z.array(educationSchema).max(30).superRefine((items,ctx)=>{
 let recentCount=0;
 for(const [index,entry] of items.entries()){
  const problem=learnerEducationValidationProblem(entry);
  if(problem)ctx.addIssue({code:"custom",path:[index,problem.field],message:problem.message});
  if(entry.isRecentEducation){
   recentCount++;
   if(recentCount>1)ctx.addIssue({code:"custom",path:[index,"isRecentEducation"],
    message:"Select only one recent education"});
  }
 }
});

const skillSchema = z
  .object({
    id: itemId,
    name: z.string().trim().min(1).max(120),
    proficiency: z
      .enum([
        "",
        "Beginner",
        "Intermediate",
        "Advanced",
        "Expert",
      ])
      .default(""),
  })
  .strict();

const projectSchema = z
  .object({
    id: itemId,
    name: z.string().trim().min(1).max(240),
    githubUrl: urlValue,
    projectUrl: urlValue,
    description: textValue(5000),
    skills: z
      .array(z.string().trim().min(1).max(120))
      .max(50)
      .default([]),
  })
  .strict();

const certificationSchema = z
  .object({
    id: itemId,
    name: z.string().trim().min(1).max(240),
    issuingAuthority: textValue(240),
    issueDate: calendarDateValue,
    expiryDate: calendarDateValue,
    credentialUrl: urlValue,
    description: textValue(3000),
  })
  .strict()
  .superRefine((entry, ctx) => {
    // Legacy learner certification editor rejects same-day and backwards expiry.
    // ISO calendar dates sort lexically once calendarDateValue has validated them.
    if (entry.issueDate && entry.expiryDate && entry.expiryDate <= entry.issueDate) {
      ctx.addIssue({
        code: "custom", path: ["expiryDate"],
        message: "Expiry date must be after issue date",
      });
    }
  });

const achievementSchema = z
  .object({
    id: itemId,
    title: z.string().trim().min(1).max(240),
    year: z
      .string()
      .trim()
      .regex(/^$|^\d{4}$/)
      .default(""),
    description: textValue(3000),
  })
  .strict();

const languageSchema = z
  .object({
    id: itemId,
    language: z.string().trim().min(1).max(120),
    proficiency: z
      .enum([
        "Beginner",
        "Intermediate",
        "Advanced",
        "Native",
      ])
      .default("Intermediate"),
  })
  .strict();

const extracurricularSchema = z
  .object({
    id: itemId,
    activity: z.string().trim().min(1).max(240),
    year: z
      .string()
      .trim()
      .regex(/^$|^\d{4}$/)
      .default(""),
    description: textValue(3000),
  })
  .strict();

const metadataEntrySchema = z
  .object({
    id: itemId,
    key: z.string().trim().min(1).max(120),
    type: z
      .enum([
        "text",
        "long_text",
        "url",
        "boolean",
        "date",
      ])
      .default("text"),
    value: z.string().trim().max(5000).default(""),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.type === "url" &&
      value.value &&
      !urlValue.safeParse(value.value).success
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Use a valid http or https URL",
      });
    }
  });

export const learnerProfileDocumentSchema = z
  .object({
    headline: textValue(240),
    bio: textValue(3000),
    contacts: contactsSchema,
    socialProfiles: socialProfilesSchema,
    address: addressSchema,
    personalDetails: personalDetailsSchema,
    identity: identitySchema,
    experiences: z
      .array(experienceSchema)
      .max(30)
      .default([]),
    education: z
      .array(educationSchema)
      .max(30)
      .default([]),
    skills: z.array(skillSchema).max(100).default([]),
    projects: z
      .array(projectSchema)
      .max(50)
      .default([]),
    certifications: z
      .array(certificationSchema)
      .max(50)
      .superRefine((entries, ctx) => {
        // An ID identifies a single editable learner credential. Duplicate
        // IDs can make React reuse a different certificate or delete both.
        const seen = new Set<string>();
        entries.forEach((entry, index) => {
          if (seen.has(entry.id)) {
            ctx.addIssue({
              code: "custom",
              path: [index, "id"],
              message: "Duplicate certification identifier",
            });
          }
          seen.add(entry.id);
        });
      })
      .default([]),
    achievements: z
      .array(achievementSchema)
      .max(50)
      .default([]),
    languages: z
      .array(languageSchema)
      .max(30)
      .default([]),
    extracurriculars: z
      .array(extracurricularSchema)
      .max(50)
      .default([]),
    hobbies: z
      .array(z.string().trim().min(1).max(120))
      .max(50)
      .transform((values) => {
        const seen = new Set<string>();
        return values.filter((value) => {
          const key = value.toLocaleLowerCase("en");
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      })
      .default([]),
    // LEARNER-profile-misc-R02: explicit learner-owned placement preferences.
    jobPreferences: z.object({
      rolePreferences:z.array(z.string().trim().min(1).max(100)).max(20).default([]),
      specificRolePreference:z.string().trim().max(200).default(""),
      workShiftPreference:z.enum(["","DAY","NIGHT","ROTATIONAL","FLEXIBLE"]).default(""),
      preferredEmploymentCity:z.string().trim().max(120).default(""),
      // Retain the six legacy DTO properties without replacing the current
      // vNext multi-role preference list. Only explicit user opt-out is false.
      rolePreference:z.string().trim().max(200).default(""),
      examSlotPreference:z.enum(["","Morning","Afternoon","Evening"]).default(""),
      jobNotificationsEnabled:z.boolean().default(true),
      papInterest:z.enum(["","Yes","No","Need more info"]).default(""),
    }).strict().default({
      rolePreferences:[],specificRolePreference:"",workShiftPreference:"",
      preferredEmploymentCity:"",rolePreference:"",examSlotPreference:"",
      jobNotificationsEnabled:true,papInterest:"",
    }),
    metadata: z
      .array(metadataEntrySchema)
      .max(50)
      .default([]),
  })
  .strict();

export const emptyLearnerProfileDocument =
  learnerProfileDocumentSchema.parse({});

export type LearnerProfileInput = z.infer<
  typeof learnerProfileInputSchema
>;
export type FacultyProfileInput = z.infer<
  typeof facultyProfileInputSchema
>;
export type LearnerProfileDocument = z.infer<
  typeof learnerProfileDocumentSchema
>;
