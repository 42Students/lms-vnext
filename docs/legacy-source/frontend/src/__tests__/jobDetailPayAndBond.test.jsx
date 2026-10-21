/**
 * Student V1 "Drives list/detail": pay and bond next to CTC. roleOptionsJson already round-trips
 * through the /visibility endpoint's full Job entity — this proves the detail page actually
 * renders it, including the explicit "no bond" case (bondNone, not merely absent fields).
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

beforeEach(() => {
  jest.clearAllMocks();
  getStudentDetails.mockResolvedValue({ data: { data: {} } });
  getLearnerApplications.mockResolvedValue({ data: { data: [] } });
  getSavedJobIds.mockResolvedValue({ data: { data: [] } });
});

function mockVisibility(job) {
  Api.get.mockImplementation((url) => {
    if (url.includes('/visibility/')) {
      return Promise.resolve({ data: { status: 'success', data: { job, isVisible: true } } });
    }
    if (url.includes('/applied/')) {
      return Promise.resolve({ data: { status: 'success', data: { applied: false } } });
    }
    return Promise.reject(new Error(`Unexpected URL: ${url}`));
  });
}

describe('JobDetailContent: pay (the bond was removed on 8 Oct 2026)', () => {
  it('shows each package\'s CTC, split and joining bonus, and never a bond an older drive still stores', async () => {
    mockVisibility({
      id: 501, jobTitle: 'Backend Engineer', companyName: 'Synthetic Co', jobType: 'Full-time',
      applicationDeadline: null,
      roleOptionsJson: [
        { name: 'Digital', ctcLpa: 12, fixedLpa: 9, variableLpa: 3, joiningBonusLpa: 1, bondMonths: 12, bondAmount: 2 },
        { name: 'Ninja', ctcLpa: 8, bondNone: true },
      ],
    });
    render(<JobDetailContent basePath="/learn/my-placements" />);
    await waitFor(() => expect(screen.getByText('Pay')).toBeInTheDocument());
    expect(screen.getByText(/Digital:/)).toBeInTheDocument();
    expect(screen.getByText(/12 LPA/)).toBeInTheDocument();
    expect(screen.getByText(/9 fixed \+ 3 variable/)).toBeInTheDocument();
    expect(screen.getByText(/Joining bonus 1 LPA/)).toBeInTheDocument();
    expect(screen.getByText(/Ninja:/)).toBeInTheDocument();
    expect(screen.queryByText(/12 months/)).not.toBeInTheDocument();
    expect(screen.queryByText(/bond/i)).not.toBeInTheDocument();
  });

  it('hides the Pay block entirely when the drive has no packages', async () => {
    mockVisibility({
      id: 502, jobTitle: 'No Options Role', companyName: 'Synthetic Co', jobType: 'Full-time',
      applicationDeadline: null, roleOptionsJson: null,
    });
    render(<JobDetailContent basePath="/learn/my-placements" />);
    await waitFor(() => expect(screen.getAllByText('No Options Role').length).toBeGreaterThan(0));
    expect(screen.queryByText('Pay')).not.toBeInTheDocument();
  });
});
