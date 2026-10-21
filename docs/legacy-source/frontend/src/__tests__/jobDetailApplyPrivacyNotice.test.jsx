/**
 * Student V1 "Drives list/detail": layered apply-notice privacy text. The confirm-apply modal
 * always shows a one-line summary (layer one); this proves the "What exactly gets shared?"
 * toggle reveals the detailed breakdown (layer two) on demand and hides it again, and that a
 * fresh Apply click always starts collapsed.
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
  Api.get.mockImplementation((url) => {
    if (url.includes('/visibility/')) {
      return Promise.resolve({ data: { status: 'success', data: { job, isVisible: true } } });
    }
    if (url.includes('/applied/')) {
      return Promise.resolve({ data: { status: 'success', data: { applied: false } } });
    }
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });
});

test('the disclosure starts collapsed, expands on click, and collapses again', async () => {
  render(<JobDetailContent basePath="/learn/my-placements" />);
  const applyButtons = await screen.findAllByRole('button', { name: /^apply now$/i });
  fireEvent.click(applyButtons[0]);

  const toggle = await screen.findByRole('button', { name: /what exactly gets shared/i });
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(screen.queryByText(/goes to this company once you apply/i)).not.toBeInTheDocument();

  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByText(/resume and contact details go to this company/i)).toBeInTheDocument();
  expect(screen.getByText(/checked to confirm eligibility, not sent to the company/i)).toBeInTheDocument();
  expect(screen.getByText(/placement cell can see this application/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /hide what gets shared/i }));
  await waitFor(() => expect(screen.queryByText(/goes to this company once you apply/i)).not.toBeInTheDocument());
});
