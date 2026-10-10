import { describe, expect, it } from "vitest";
import {
  emptyFacultyProfileDocument,
  facultyProfileDocumentSchema,
} from "@/modules/people/faculty-profile-document";

const id = "cec83342-dda2-4e5c-a189-19a82f7dbff7";

describe("DB04 Faculty profile document contract", () => {
  it("matches Faculty-only publications and awards while keeping Resume out", () => {
    const profile = facultyProfileDocumentSchema.parse({
      publications: [{
        id,
        title: "Source-backed systems",
        journal: "Journal",
        year: "2026",
        doi: "10.42/example",
        link: "https://example.edu/paper",
        authors: "Faculty One",
        description: "Abstract",
      }],
      awards: [{
        id,
        title: "Teaching Award",
        year: "2025",
        awardedBy: "University",
      }],
    });

    expect(profile.publications).toHaveLength(1);
    expect(profile.awards).toHaveLength(1);
    expect(() =>
      facultyProfileDocumentSchema.parse({
        resumeDocumentId: id,
      }),
    ).toThrow();
  });

  it("refuses raw Aadhaar/PAN fields in generic profile JSON", () => {
    expect(() =>
      facultyProfileDocumentSchema.parse({
        identity: {
          aadhaarNumber: "123456789012",
          panNumber: "ABCDE1234F",
        },
      }),
    ).toThrow();

    const safe = facultyProfileDocumentSchema.parse({
      identitySummary: {
        aadhaarLast4: "9012",
        panMasked: "ABCDE****F",
        aadhaarDocumentId: id,
        panDocumentId: id,
      },
    });
    expect(safe.identitySummary.aadhaarLast4).toBe("9012");
  });

  it("keeps legacy Faculty contact and social shapes bounded", () => {
    const profile = facultyProfileDocumentSchema.parse({
      contact: {
        contactMobile: "9876543210",
        contactPhone: "04012345678",
        contactMail: "faculty@example.edu",
      },
      socialProfiles: {
        linkedIn: "https://linkedin.com/in/faculty",
        github: "",
        portfolio: "",
        twitter: "",
        googleScholar: "https://scholar.google.com/example",
        researchGate: "https://researchgate.net/example",
      },
    });

    expect(profile.contact.contactMobile).toBe("9876543210");
    expect(() =>
      facultyProfileDocumentSchema.parse({
        contact: { contactMobile: "123" },
      }),
    ).toThrow();
    expect(() =>
      facultyProfileDocumentSchema.parse({
        socialProfiles: { linkedIn: "javascript:alert(1)" },
      }),
    ).toThrow();
  });

  it("uses private receipt ids instead of uploaded public URLs", () => {
    const profile = facultyProfileDocumentSchema.parse({
      profileImageDocumentId: id,
      education: [{
        id,
        institutionName: "42 University",
        certificateDocumentId: id,
      }],
      certifications: [{
        id,
        name: "Certification",
        certificateDocumentId: id,
      }],
      experiences: [{
        id,
        organization: "42Students",
        experienceCertificateDocumentId: id,
        offerLetterDocumentId: id,
      }],
    });

    expect(profile.profileImageDocumentId).toBe(id);
    expect(profile.education[0].certificateDocumentId).toBe(id);
  });

  it("provides a complete stable empty document", () => {
    expect(emptyFacultyProfileDocument).toMatchObject({
      about: { description: "" },
      contact: {
        contactMobile: "",
        contactPhone: "",
        contactMail: "",
      },
      publications: [],
      awards: [],
      identitySummary: {
        aadhaarLast4: "",
        panMasked: "",
        aadhaarDocumentId: null,
        panDocumentId: null,
      },
    });
  });
});
