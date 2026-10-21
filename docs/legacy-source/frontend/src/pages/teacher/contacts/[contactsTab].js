import React from "react";
import { useSelector } from "react-redux";
import ContactsTabLayout from "@/layouts/contactsTabLayout";
import {
  ContactsGrid,
  allContactsColumn,
  facultyContactsColumn,
  learnerContactsColumn,
} from "@/components/contacts";
import { useRouter } from "next/router";

function ContactsTab() {
  const loginUser = useSelector(state => state.loginUser);
  const router = useRouter();
  const { contactsTab } = router.query;

  function getContactsTab() {
    switch (contactsTab) {
      case "allContacts":
        return (
          <ContactsGrid
            columns={allContactsColumn}
            title="All Contacts"
            userType="All"
            collegeId={loginUser?.collegeId}
          />
        );
      case "teachers":
        return (
          <ContactsGrid
            columns={facultyContactsColumn}
            title="Teachers"
            userType="FACULTY"
            collegeId={loginUser?.collegeId}
          />
        );
      case "students":
        return (
          <ContactsGrid
            columns={learnerContactsColumn}
            title="Students"
            userType="LEARNER"
            collegeId={loginUser?.collegeId}
          />
        );
      default:
        return (
          <ContactsGrid
            columns={allContactsColumn}
            title="All Contacts"
            userType="All"
            collegeId={loginUser?.collegeId}
          />
        );
    }
  }

  return <div>{getContactsTab()}</div>;
}

ContactsTab.getLayout = ContactsTabLayout;

export default ContactsTab;
