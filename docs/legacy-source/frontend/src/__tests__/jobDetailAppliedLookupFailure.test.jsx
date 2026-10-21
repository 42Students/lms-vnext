/**
 * Finding #7 (Placements UI/UX register): a failed /applied lookup must not be treated as
 * "not applied" — that risks showing an active Apply button to a learner who may have already
 * applied. Apply must block on an unresolved lookup, with a visible retry.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import JobDetailContent from '@/components/Placements/JobDetailContent';
import Api from '@/api/ApiMethod';
import { getStudentDetails } from '@/api/Services/UserServices';
import { getLearnerApplications, getSavedJobIds } from '@/api/Services/jobService';

const mockRouter = {
  isReady: true, asPath: '/learn/my-placements/jobs/501', query: { jobId: '501' }, push: jest.fn(),
};
const mockSession = { id: 42, userType: 'LEARNER', organizationId: 3, collegeId: 7 };

jest.mock('next/router', () => ({ useRouter: () => mockRouter }));
jest.mock('react-redux', () => ({ useSelector: (selector) => selector({ loginUser: mockSession }) }));
jest.mock('@/api/ApiMethod', () => ({ get: jest.fn(), post: jest.fn() }));
// The drive's own rules pass (BE-0012: a failed rules check now blocks Apply, so it is answered here).
jest.mock('@/api/Services/TpoHubService', () => ({ getDriveEligibility: jest.fn(() => Promise.resolve({ data: { eligible: true, checks: [] } })), getApplyCheck: jest.fn(() => Promise.resolve({ data: { canApply: true, code: "OPEN" } })), getPlacementJourney: jest.fn(() => Promise.resolve({ data: { applications: [], schedule: [], offers: [] } })), getDriveProcess: jest.fn(() => Promise.resolve({ data: [] })) }));
jest.mock('@/api/Services/UserServices', () => ({ getStudentDetails: jest.fn() }));
jest.mock('@/api/Services/jobService', () => ({
  applyToJob: jest.fn(), checkIfApplied: jest.fn(), withdrawApplication: jest.fn(),
  saveJob: jest.fn(), unsaveJob: jest.fn(), getSavedJobIds: jest.fn(),
  getLearnerApplications: jest.fn(), getApplicationById: jest.fn(),
}));
jest.mock('@/components/Placements/PlacementsCompanyAvatar', () => {
  const ReactLocal = require('react');
  return function MockAvatar() { return ReactLocal.createElement('span'); };
});

const job = {
  id: 501, jobTitle: 'Backend Engineer', companyName: 'Synthetic Co', jobType: 'Full-time',
  applicationDeadline: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  getStudentDetails.mockResolvedValue({ data: { data: {} } });
  getLearnerApplications.mockResolvedValue({ data: { data: [] } });
  getSavedJobIds.mockResolvedValue({ data: { data: [] } });
});

describe('JobDetailContent: unresolved /applied lookup blocks Apply', () => {
  it('disables Apply and shows a retry message when the applied lookup fails, without asserting not-applied', async () => {
    Api.get.mockImplementation((url) => {
      if (url.includes('/visibility/')) {
        return Promise.resolve({ data: { status: 'success', data: { job, isVisible: true } } });
      }
      if (url.includes('/applied/')) {
        return Promise.reject(new Error('Network error'));
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    render(<JobDetailContent basePath="/learn/my-placements" />);

    const applyButtons = await screen.findAllByRole('button', { name: /can't confirm application status/i });
    expect(applyButtons.length).toBeGreaterThan(0);
    applyButtons.forEach((button) => expect(button).toBeDisabled());
    expect(await screen.findByText(/we couldn't confirm whether you've already applied/i)).toBeInTheDocument();
    // Never silently claims the learner has not applied — no "Apply now" label should appear.
    expect(screen.queryByRole('button', { name: /^apply now$/i })).not.toBeInTheDocument();
  });

  it('retry re-runs the lookup and unblocks Apply once it succeeds', async () => {
    let appliedCallCount = 0;
    Api.get.mockImplementation((url) => {
      if (url.includes('/visibility/')) {
        return Promise.resolve({ data: { status: 'success', data: { job, isVisible: true } } });
      }
      if (url.includes('/applied/')) {
        appliedCallCount += 1;
        if (appliedCallCount === 1) return Promise.reject(new Error('Network error'));
        return Promise.resolve({ data: { status: 'success', data: { applied: false } } });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    render(<JobDetailContent basePath="/learn/my-placements" />);

    const retryButtons = await screen.findAllByRole('button', { name: /^retry$/i });
    retryButtons[0].click();

    await waitFor(() => expect(appliedCallCount).toBe(2));
    const applyButtons = await screen.findAllByRole('button', { name: /^apply now$/i });
    expect(applyButtons.length).toBeGreaterThan(0);
    applyButtons.forEach((button) => expect(button).toBeEnabled());
  });
});
