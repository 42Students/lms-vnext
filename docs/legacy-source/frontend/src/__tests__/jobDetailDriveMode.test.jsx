/**
 * Drive mode on the student job page: where the drive happens and, off campus, the company link (the fields were sent, never shown).
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

const showJob = (extra) => Api.get.mockImplementation((url) => {
  if (url.includes('/visibility/')) return Promise.resolve({ data: { status: 'success', data: { job: { ...job, ...extra }, isVisible: true } } });
  if (url.includes('/applied/')) return Promise.resolve({ data: { status: 'success', data: { applied: false } } });
  return Promise.reject(new Error(`Unexpected URL: ${url}`));
});

describe('JobDetailContent: where the drive happens', () => {
  it('an off-campus drive gives the company link to apply on', async () => {
    showJob({ driveMode: 'OFF_CAMPUS', externalApplyUrl: 'https://careers.example.com/apply/9' });
    render(<JobDetailContent basePath="/learn/my-placements" />);
    const where = await screen.findByTestId('job.drive-mode');
    expect(where).toHaveTextContent('Off campus');
    expect(screen.getByRole('link', { name: 'open the application' })).toHaveAttribute('href', 'https://careers.example.com/apply/9');
  });

  it('a pool drive names the host college, the reporting time and the travel note', async () => {
    showJob({ driveMode: 'POOL', hostCollegeName: 'KL University', reportingAt: '2026-11-03T03:30:00', travelNote: 'Bus from the main gate at 7 AM' });
    render(<JobDetailContent basePath="/learn/my-placements" />);
    const where = await screen.findByTestId('job.drive-mode');
    expect(where).toHaveTextContent('Pool drive at KL University');
    expect(where).toHaveTextContent(/Report by 3 Nov/);
    expect(where).toHaveTextContent('Bus from the main gate at 7 AM');
  });
});

describe('JobDetailContent: withdraw (BE-0011)', () => {
  it('withdraws the application, by its own id, not the job id', async () => {
    const { withdrawApplication, getApplicationById } = jest.requireMock('@/api/Services/jobService');
    withdrawApplication.mockResolvedValue({ data: { status: 'success' } });
    getApplicationById.mockResolvedValue({ data: { status: 'success', data: { id: 9001, appliedAt: null } } });
    Api.get.mockImplementation((url) => {
      if (url.includes('/visibility/')) return Promise.resolve({ data: { status: 'success', data: { job, isVisible: true } } });
      if (url.includes('/applied/')) return Promise.resolve({ data: { status: 'success', data: { applied: true, applicationStatus: 'APPLIED', applicationId: 9001 } } });
      return Promise.resolve({ data: { status: 'success', data: {} } });
    });
    render(<JobDetailContent basePath="/learn/my-placements" />);
    const { fireEvent } = require('@testing-library/react');
    fireEvent.click(await screen.findByText('Withdraw this application'));
    const buttons = await screen.findAllByText('Withdraw');
    fireEvent.click(buttons[buttons.length - 1].closest('button'));
    await waitFor(() => expect(withdrawApplication).toHaveBeenCalledWith(9001, 42));
  });
});
