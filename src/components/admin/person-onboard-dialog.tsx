"use client";

import {
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  MEMBERSHIP_ROLES,
  type MembershipRole,
} from "@/modules/identity/constants";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { onboardingRoleSelection } from "@/modules/people/college-faculty-onboarding-model";
import {legacyPersonName,indianMobileToE164} from "@/modules/people/college-onboard-mobile-model";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import { LEGACY_FACULTY_TYPES } from "@/modules/people/college-faculty-type-model";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

function roleLabel(role: MembershipRole) {
  return role
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");
}

export function PersonOnboardDialog({
  collegeId,
  forcedRole,
  departments = [],
}: {
  collegeId: string;
  forcedRole?: MembershipRole;
  departments?: readonly { id: string; name: string }[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [firstName,setFirstName]=useState("");
  const [lastName,setLastName]=useState("");
  const [phoneE164, setPhoneE164] = useState("");
  const [email, setEmail] = useState("");
  const [registerAsMentor,setRegisterAsMentor]=useState(false);
  const [departmentId,setDepartmentId]=useState("");
  const [facultyType,setFacultyType]=useState("");
  const [gender,setGender]=useState("");
  const [dateOfBirth,setDateOfBirth]=useState("");
  const [address,setAddress]=useState("");
  const [bio,setBio]=useState("");
  const [fieldError,setFieldError]=useState<{ field: string; message: string } | null>(null);
  const [discardOpen,setDiscardOpen]=useState(false);
  const [profileIncomplete,setProfileIncomplete]=useState(false);
  const [onboardError,setOnboardError]=useState("");
  const [roles, setRoles] = useState<MembershipRole[]>(
    onboardingRoleSelection(forcedRole),
  );
  const [pending, startTransition] = useTransition();
  const inFlightRef=useRef(false);

  function reset() {
    setDisplayName("");setFirstName("");setLastName("");
    setPhoneE164("");
    setEmail("");setRegisterAsMentor(false);
    setDepartmentId("");setFacultyType("");setGender("");setDateOfBirth("");setAddress("");setBio("");
    setFieldError(null);setDiscardOpen(false);setProfileIncomplete(false);setOnboardError("");
    setRoles(onboardingRoleSelection(forcedRole));
  }

  function isDirty() {
    return Boolean(displayName.trim() || firstName.trim() || lastName.trim() || phoneE164.trim() ||
      email.trim() || registerAsMentor || departmentId || facultyType || gender || dateOfBirth ||
      address.trim() || bio.trim() ||
      (!forcedRole && roles.join(",") !== onboardingRoleSelection(forcedRole).join(",")));
  }
  function requestClose() {
    if (pending || inFlightRef.current) return;
    if (isDirty() && !profileIncomplete) { setDiscardOpen(true); return; }
    setOpen(false);reset();
  }

  function toggleRole(role: MembershipRole) {
    setRoles((current) =>
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role],
    );
  }

  function submit() {
    if(pending||inFlightRef.current||profileIncomplete)return;
    if(!forcedRole && !displayName.trim()){setFieldError({field:"displayName",message:"Enter a name"});return;}
    if(forcedRole && !firstName.trim()){setFieldError({field:"firstName",message:"Enter the first name"});return;}
    if(forcedRole && !lastName.trim()){setFieldError({field:"lastName",message:"Enter the last name"});return;}
    if(!phoneE164.trim()){setFieldError({field:"phone",message:forcedRole==="FACULTY"?"Enter the mobile number":"Mobile required"});return;}
    if(forcedRole && !indianMobileToE164(phoneE164)){setFieldError({field:"phone",message:"Mobile number must be 10 digits"});return;}
    if(forcedRole==="FACULTY"&&!departmentId){setFieldError({field:"department",message:"Choose a department"});return;}
    if(forcedRole==="FACULTY"&&!facultyType){setFieldError({field:"facultyType",message:"Choose a faculty type"});return;}
    if(email.trim()&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){
      setFieldError({field:"email",message:"Enter a valid email"});return;
    }
    setFieldError(null);setOnboardError("");
    inFlightRef.current=true;
    startTransition(async () => {
      try {
      const response = await fetch("/api/people/onboard", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          collegeId,
          displayName:forcedRole?legacyPersonName(firstName,lastName):displayName,
          phoneE164:forcedRole?indianMobileToE164(phoneE164):phoneE164,
          ...(email.trim() ? { email } : {}),
          roles:forcedRole==="FACULTY"&&registerAsMentor?["FACULTY","MENTOR"]:onboardingRoleSelection(forcedRole,roles),
          ...(forcedRole==="FACULTY"?{facultyProfile:{kind:"FACULTY",primaryDepartmentId:departmentId,
            employmentType:facultyType,academicTitle:"",gender,dateOfBirth,address,bio,
            contactPhone:"",contactEmail:""}}:{}),
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message=
            payload?.error === "IDENTITY_COLLISION"
              ? "Mobile or email is linked to another canonical identity. Check existing memberships before creating a duplicate."
              : payload?.error === "EMAIL_ALREADY_EXISTS"
              ? "Email already exists in this college. Check the linked user before creating a duplicate."
              : payload?.error === "PHONE_ALREADY_EXISTS" || payload?.error === "MOBILE_ALREADY_EXISTS_IN_COLLEGE"
              ? "Mobile number already belongs to a member of this college. Check the existing account."
              : "The person could not be onboarded. Check the fields and try again.";
        setOnboardError(message);
        showToast({tone:"error",title:"Onboarding failed",description:message});
        return;
      }

      if (forcedRole==="FACULTY" && payload?.profileIncomplete) {
        setProfileIncomplete(true);
        showToast({tone:"error",title:"Faculty created, profile needs completion",
          description:"Open Edit Faculty in the roster to finish the department and faculty type. Do not register a duplicate."});
        router.refresh();
        return;
      }
      setOpen(false);
      reset();
      showToast({
        tone: "success",
        title: forcedRole === "FACULTY" ? "Faculty registered successfully! They can now login with their mobile number."
          : forcedRole ? roleLabel(forcedRole)+" created"
          : roles.length===1 ? roleLabel(roles[0])+" created" : "Person onboarded",
        description:
          "The canonical user and college membership are ready. No invitation or message was sent.",
      });
      router.refresh();
      }catch{
        setOnboardError("The person could not be onboarded. Check the fields and try again.");
        showToast({tone:"error",title:"Onboarding failed",description:"The person could not be onboarded. Check the fields and try again."});
      }
      finally{inFlightRef.current=false;}
    });
  }

  return (
    <>
      <Button className="min-h-11 w-full md:min-h-9 md:w-auto" aria-label={forcedRole === "COLLEGE_ADMIN" ? "Onboard College Admin" : forcedRole === "TPO" ? "Onboard TPO" : undefined} onClick={() => setOpen(true)}>
        {forcedRole === "FACULTY" ? "Register New Faculty" : "Onboard person"}
      </Button>
      <Dialog
        open={open}
        onOpenChange={next=>{if(!next)requestClose();}}
        dismissible={!pending}
        title={forcedRole === "FACULTY" ? "Register New Faculty" : "Onboard person"}
        description="Create or reuse a canonical identity and an active college membership. No external invitation is sent."
        footer={
          <div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end [&>button]:w-full md:[&>button]:w-auto">
            <Button className="min-h-11 md:min-h-9"
              variant="secondary"
              disabled={pending}
              onClick={requestClose}
            >
              Cancel
            </Button>
            <Button className="min-h-11 md:min-h-9"
              loading={pending}
              disabled={
                pending ||
                roles.length === 0 ||
                profileIncomplete ||
                (forcedRole==="FACULTY" && departments.length===0)
              }
              onClick={submit}
            >
              {pending ? "Onboarding…" : forcedRole === "FACULTY" ? "Register Faculty" : "Onboard person"}
            </Button>
          </div>
        }
      >
        <div className="grid min-w-0 gap-[var(--lms-space-4)] md:grid-cols-2">
          {onboardError?<Alert tone="error" className="md:col-span-2">
            {forcedRole==="FACULTY"?"Faculty was not registered.":"Admin user was not created"} {onboardError}
          </Alert>:null}
          {forcedRole?<div className="grid min-w-0 gap-[var(--lms-space-4)] md:col-span-2 md:grid-cols-2">
            <label className="grid gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">First Name
              <Input className="min-h-11 md:min-h-9" value={firstName} maxLength={120} required
                aria-invalid={fieldError?.field==="firstName"} onChange={e=>{setFirstName(e.target.value);setFieldError(null);}} placeholder="First name"/>
              {fieldError?.field==="firstName"?<span role="alert" className="text-xs text-error">{fieldError.message}</span>:null}
            </label>
            <label className="grid gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Last Name
              <Input className="min-h-11 md:min-h-9" value={lastName} maxLength={120} required
                aria-invalid={fieldError?.field==="lastName"} onChange={e=>{setLastName(e.target.value);setFieldError(null);}} placeholder="Last name"/>
              {fieldError?.field==="lastName"?<span role="alert" className="text-xs text-error">{fieldError.message}</span>:null}
            </label>
          </div>:<div className="min-w-0 md:col-span-2">
            <label
              htmlFor={`onboard-name-${collegeId}`}
              className="mb-[var(--lms-space-2)] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"
            >
              Display name
            </label>
            <Input className="min-h-11 md:min-h-9"
              id={`onboard-name-${collegeId}`}
              value={displayName}
              onChange={(event) => {setDisplayName(event.target.value);setFieldError(null);}}
              aria-invalid={fieldError?.field==="displayName"}
              maxLength={255}
              placeholder="Full name"
            />
            {fieldError?.field==="displayName"?<p role="alert" className="mt-1 text-xs text-error">{fieldError.message}</p>:null}
          </div>
}
          <div>
            <label
              htmlFor={`onboard-phone-${collegeId}`}
              className="mb-[var(--lms-space-2)] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"
            >
              Phone
            </label>
            <Input className="min-h-11 md:min-h-9"
              id={`onboard-phone-${collegeId}`}
              value={phoneE164}
              onChange={(event) => {setPhoneE164(event.target.value);setFieldError(null);}}
              aria-invalid={fieldError?.field==="phone"}
              placeholder={forcedRole?"9876543210":"+919876543210"}
              inputMode="tel"
            />
            {fieldError?.field==="phone"?<p role="alert" className="mt-1 text-xs text-error">{fieldError.message}</p>:
              forcedRole?<p className="mt-1 text-xs text-muted-foreground">Mobile number must be 10 digits</p>:null}
          </div>
          <div>
            <label
              htmlFor={`onboard-email-${collegeId}`}
              className="mb-[var(--lms-space-2)] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"
            >
              Email · optional
            </label>
            <Input className="min-h-11 md:min-h-9"
              id={`onboard-email-${collegeId}`}
              type="email"
              value={email}
              onChange={(event) => {setEmail(event.target.value);setFieldError(null);}}
              aria-invalid={fieldError?.field==="email"}
              maxLength={320}
              placeholder="name@example.com"
            />
            {fieldError?.field==="email"?<p role="alert" className="mt-1 text-xs text-error">{fieldError.message}</p>:null}
          </div>
          {forcedRole==="FACULTY" ? <fieldset className="grid min-w-0 gap-[var(--lms-space-3)] border-y border-border py-[var(--lms-space-4)] md:col-span-2">
            <legend className="text-[var(--lms-font-sm)] font-semibold text-body">Faculty details</legend>
            <label className="grid gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">Department
              <Select required disabled={pending || departments.length===0} value={departmentId}
                onChange={event=>{setDepartmentId(event.target.value);setFieldError(null);}}>
                <option value="">Select department</option>
                {departments.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
              </Select>
              {fieldError?.field==="department"?<span role="alert" className="text-xs text-error">{fieldError.message}</span>:null}
            </label>
            {departments.length===0?<p role="alert" className="text-xs text-error">
              Departments unavailable. Refresh the faculty roster after verifying your selected college.
            </p>:null}
            <label className="grid gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">Faculty Type
              <Select required disabled={pending} value={facultyType}
                onChange={event=>{setFacultyType(event.target.value);setFieldError(null);}}>
                <option value="">Select faculty type</option>
                {LEGACY_FACULTY_TYPES.map(type=><option key={type} value={type}>{type}</option>)}
              </Select>
              {fieldError?.field==="facultyType"?<span role="alert" className="text-xs text-error">{fieldError.message}</span>:null}
            </label>
            <label className="grid gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">Gender
              <Select disabled={pending} value={gender} onChange={event=>setGender(event.target.value)}>
                {["","Male","Female","Other","Prefer not to say"].map(value=>
                  <option key={value} value={value}>{value||"Not specified"}</option>)}
              </Select>
            </label>
            <label className="grid gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">Date of Birth
              <Input type="date" disabled={pending} value={dateOfBirth} onChange={event=>setDateOfBirth(event.target.value)}/>
            </label>
            <label className="grid gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">Address
              <Textarea rows={2} maxLength={1000} disabled={pending} value={address} onChange={event=>setAddress(event.target.value)}/>
            </label>
            <label className="grid gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]">Bio
              <Textarea rows={3} maxLength={3000} disabled={pending} value={bio} onChange={event=>setBio(event.target.value)}/>
            </label>
            <legend className="text-[var(--lms-font-sm)] font-semibold text-body">Faculty type</legend>
            <label className="flex min-h-11 items-center gap-2 text-sm font-semibold text-body md:min-h-9">
              <Checkbox checked={registerAsMentor} disabled={pending}
                onChange={event=>setRegisterAsMentor(event.target.checked)}/>
              Mentor
            </label>
            <p className="text-xs text-muted-foreground">A mentor receives the Mentor membership role in addition to Faculty.</p>
          </fieldset> : null}
          {profileIncomplete?<p role="alert" className="md:col-span-2 text-sm text-error">
            Faculty identity created, but the profile still needs completion. Open Edit Faculty in the roster to finish. Do not register the person twice.
          </p>:null}
          {forcedRole && forcedRole!=="FACULTY" ? <p className="md:col-span-2 text-sm text-body">
            Membership role: <strong>{roleLabel(forcedRole)}</strong>.
          </p> : !forcedRole ? <fieldset className="md:col-span-2">
            <legend className="mb-2 text-xs font-semibold text-body">
              Membership roles
            </legend>
            <div className="divide-y divide-border border-y border-border">
              {MEMBERSHIP_ROLES.map((role) => (
                <label
                  key={role}
                  className="flex min-h-11 cursor-pointer items-center justify-between gap-[var(--lms-space-3)] px-[var(--lms-space-3)] py-[var(--lms-space-2)] hover:bg-[var(--lms-primary-subtle)] md:min-h-9"
                >
                  <span className="text-sm font-semibold text-body">
                    {roleLabel(role)}
                  </span>
                  <Checkbox
                    disabled={pending}
                    checked={roles.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="size-5"
                  />
                </label>
              ))}
            </div>
            {roles.length === 0 ? (
              <p className="mt-2 text-xs font-semibold text-error">
                Select at least one membership role.
              </p>
            ) : null}
          </fieldset> : null}
        </div>
      </Dialog>
      <ConfirmDialog open={discardOpen} onOpenChange={setDiscardOpen}
        title="Discard unsaved onboarding details?"
        description="Your unsaved changes will be lost."
        confirmLabel="Discard changes" onConfirm={()=>{setDiscardOpen(false);setOpen(false);reset();}}/>
    </>
  );
}
