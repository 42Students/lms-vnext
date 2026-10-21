import Api from "../ApiMethod";

/** Every dropdown's values from one place (branches, genders, job types, education types, coding platforms...). */
export const getChoices = () => Api.get("/api/v1/choices");
