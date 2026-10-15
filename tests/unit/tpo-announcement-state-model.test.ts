import {it,expect} from "vitest";
import {announcementActionAllowed} from "@/modules/announcements/tpo-announcement-state-model";
it("does not allow reminders for deleted notices",()=>{expect(announcementActionAllowed({deleted:true,action:"REMIND"})).toBe(false);expect(announcementActionAllowed({deleted:true,action:"UNDO_DELETE"})).toBe(true)});
