/**
 * Fields a placement job needs before `publishPlacementJob` accepts it:
 * an application deadline in the future and at least one pay figure.
 * Spread into `createPlacementJob` inputs; later keys in the input override.
 */
export const publishableJobTerms = {
  applicationDeadline: new Date("2099-12-31T00:00:00.000Z"),
  minimumAnnualCtcInr: 600000,
  maximumAnnualCtcInr: 900000,
};
