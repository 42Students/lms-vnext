/**
 * Worker C — MOCKED_COMPONENT: real JobsListContent with mocked job endpoints.
 * C-PL-01/04/05/07/12 partial only. No live API authorization or DB proof.
 */
import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import JobsListContent from '@/components/Placements/JobsListContent';
import { getApplyChecks } from '@/api/Services/TpoHubService';
import {
  getAllJobsWithEligibility, getSavedJobIds, getSavedJobs,
  getLearnerApplications, saveJob, unsaveJob,
} from '@/api/Services/jobService';

const mockRouter = { isReady: true, asPath: '/learn/my-placements/jobs', query: {}, push: jest.fn(), replace: jest.fn() };
const mockSession = { id: 42, userType: 'LEARNER', organizationId: 3, collegeId: 7 };

jest.mock('next/router', () => ({ useRouter: () => mockRouter }));
jest.mock('react-redux', () => ({ useSelector: (selector) => selector({ loginUser: mockSession }) }));
jest.mock('@/api/Services/jobService', () => ({
  getAllJobsWithEligibility: jest.fn(), getSavedJobIds: jest.fn(), getSavedJobs: jest.fn(),
  getLearnerApplications: jest.fn(), saveJob: jest.fn(), unsaveJob: jest.fn(),
}));
jest.mock('@/api/Services/TpoHubService', () => ({ getApplyChecks: jest.fn(() => Promise.resolve({ data: {} })) }));
jest.mock('@/components/Placements/PlacementsCompanyAvatar', () => {
  const React = require('react');
  return function MockCompanyAvatar({ companyName }) { return React.createElement('span', { 'aria-label': `Logo for ${companyName}` }); };
});

const job = (id, jobTitle, extra = {}) => ({
  id, jobTitle, companyName: `Synthetic Company ${id}`, jobType: 'Full-time',
  isVisible: true, isActive: true, ...extra,
});
const success = (records) => ({ data: { status: 'success', data: records } });
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

beforeEach(() => {
  jest.clearAllMocks();
  mockRouter.query = {};
  mockRouter.asPath = '/learn/my-placements/jobs';
  getAllJobsWithEligibility.mockResolvedValue(success([]));
  getSavedJobIds.mockResolvedValue(success([]));
  getSavedJobs.mockResolvedValue(success([]));
  getLearnerApplications.mockResolvedValue(success([]));
});

describe('Placements jobs: real UI, mocked learner APIs', () => {
  it('shows true empty jobs distinctly from a fetch error and requests only the active synthetic learner', async () => {
    render(<JobsListContent basePath="/learn/my-placements" />);
    expect(await screen.findByText('No open jobs right now')).toBeInTheDocument();
    expect(screen.queryByText('Failed to load drives. Please try again.')).not.toBeInTheDocument();
    expect(getAllJobsWithEligibility).toHaveBeenCalledTimes(1);
    expect(getAllJobsWithEligibility).toHaveBeenCalledWith(42, { signal: expect.any(AbortSignal) });
    expect(getLearnerApplications).toHaveBeenCalledWith(42, { signal: expect.any(AbortSignal) });
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('shows a recoverable API error without leaking the thrown message, and retries the request', async () => {
    getAllJobsWithEligibility.mockRejectedValueOnce(new Error('synthetic private backend detail'))
      .mockResolvedValueOnce(success([job(71, 'Recovered job')]));
    render(<JobsListContent basePath="/learn/my-placements" />);
    expect(await screen.findByText('Failed to load drives. Please try again.')).toBeInTheDocument();
    expect(screen.queryByText('synthetic private backend detail')).not.toBeInTheDocument();
    expect(screen.queryByText('No open jobs right now')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('link', { name: 'Recovered job' })).toBeInTheDocument();
    expect(getAllJobsWithEligibility).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('Failed to load drives. Please try again.')).not.toBeInTheDocument();
  });

  it('keeps the last successful job list visible during a failed retry', async () => {
    getAllJobsWithEligibility.mockResolvedValueOnce(success([job(83, 'Persistent role')]));
    getSavedJobIds.mockRejectedValueOnce(new Error('saved ids unavailable'));

    render(<JobsListContent basePath="/learn/my-placements" />);
    expect(await screen.findByRole('link', { name: 'Persistent role' })).toBeInTheDocument();

    const retryRequest = deferred();
    getAllJobsWithEligibility.mockReturnValueOnce(retryRequest.promise);
    getSavedJobIds.mockResolvedValue(success([]));

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(screen.getByRole('link', { name: 'Persistent role' })).toBeInTheDocument();
    expect(screen.getByText('Refreshing drive listings…')).toBeInTheDocument();

    await act(async () => { retryRequest.reject(new Error('refresh failed')); });

    expect(await screen.findByText("Couldn't refresh drive listings")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Persistent role' })).toBeInTheDocument();
    expect(screen.queryByText('No open jobs right now')).not.toBeInTheDocument();
  });

  it('rolls back an optimistic saved-job action on API failure, with no false confirmation or unsave call', async () => {
    getAllJobsWithEligibility.mockResolvedValue(success([job(72, 'Save rollback job')]));
    saveJob.mockRejectedValueOnce(new Error('synthetic save timeout'));
    render(<JobsListContent basePath="/learn/my-placements" />);
    const saveButton = await screen.findByRole('button', { name: 'Save Save rollback job for later' });
    expect(saveButton).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(saveButton);
    await waitFor(() => expect(saveButton).toHaveAttribute('aria-pressed', 'false'));
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save — try again");
    expect(saveJob).toHaveBeenCalledTimes(1);
    expect(saveJob).toHaveBeenCalledWith(72, 42);
    expect(unsaveJob).not.toHaveBeenCalled();
  });

  it('distinguishes an ineligible role from a closed role and keeps readable job links', async () => {
    getAllJobsWithEligibility.mockResolvedValue(success([
      job(73, 'Restricted job', { isVisible: false, visibilityReason: 'Different synthetic program.' }),
      job(74, 'Closed job', { isActive: false }),
    ]));
    render(<JobsListContent basePath="/learn/my-placements" />);
    // "Open to me" is the default view: an ineligible role sits in the collapsed "Not open to
    // you" section, not inline in the main list — expand it before asserting on its card.
    const closed = await screen.findByRole('link', { name: 'Closed job' });
    fireEvent.click(screen.getByRole('button', { name: /Not open to you/ }));
    const restricted = (await screen.findByRole('link', { name: 'Restricted job' })).closest('article');
    const closedArticle = closed.closest('article');
    expect(restricted).toHaveAttribute('data-state', 'ineligible');
    expect(within(restricted).getByText('Not open to you')).toBeInTheDocument();
    expect(within(restricted).getByText(/Different synthetic program/)).toBeInTheDocument();
    expect(closedArticle).toHaveAttribute('data-state', 'closed');
    expect(within(closedArticle).getByText('Applications closed')).toBeInTheDocument();
    expect(within(closedArticle).queryByText('Not open to you')).not.toBeInTheDocument();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('"Open to me" is the default view: ineligible drives start collapsed under a labeled count, and expand on demand', async () => {
    getAllJobsWithEligibility.mockResolvedValue(success([
      job(80, 'Open drive'),
      job(81, 'Restricted drive one', { isVisible: false, visibilityReason: 'Different synthetic program.' }),
      job(82, 'Restricted drive two', { isVisible: false, visibilityReason: 'Different synthetic program.' }),
    ]));
    render(<JobsListContent basePath="/learn/my-placements" />);
    await screen.findByRole('link', { name: 'Open drive' });
    // Collapsed by default: the excluded drives are not in the DOM as links yet, but the count is.
    expect(screen.queryByRole('link', { name: 'Restricted drive one' })).not.toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: /Not open to you/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(within(toggle).getByText('2')).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(await screen.findByRole('link', { name: 'Restricted drive one' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Restricted drive two' })).toBeInTheDocument();
  });

  it('carries the filtered list URL into job detail so explicit Back restores context', async () => {
    mockRouter.query = { q: 'engineer', type: 'Full-time', page: '2' };
    mockRouter.asPath = '/learn/my-placements/jobs?q=engineer&type=Full-time&page=2';
    getAllJobsWithEligibility.mockResolvedValue(success([job(84, 'Context-preserving engineer role')]));

    render(<JobsListContent basePath="/learn/my-placements" />);
    const link = await screen.findByRole('link', { name: 'Context-preserving engineer role' });
    fireEvent.click(link);

    expect(mockRouter.push).toHaveBeenCalledWith(
      '/learn/my-placements/jobs/84?returnTo=%2Flearn%2Fmy-placements%2Fjobs%3Fq%3Dengineer%26type%3DFull-time%26page%3D2'
    );
  });

  it('renders the API applicationStatus rather than silently downgrading every applied job to Applied', async () => {
    getAllJobsWithEligibility.mockResolvedValue(success([job(75, 'Shortlisted role')]));
    getLearnerApplications.mockResolvedValue(success([{
      jobId: 75, application: { jobId: 75, applicationStatus: 'SHORTLISTED' },
    }]));
    render(<JobsListContent basePath="/learn/my-placements" />);
    const card = (await screen.findByRole('link', { name: 'Shortlisted role' })).closest('article');
    expect(card).toHaveAttribute('data-state', 'applied');
    expect(within(card).getByText('Shortlisted')).toBeInTheDocument();
    expect(within(card).queryByText('Applied')).not.toBeInTheDocument();
    expect(getLearnerApplications).toHaveBeenCalledTimes(1);
  });

  it("a drive the college's own gate keeps them out of (held offer, not registered...) moves to Not open to you, with the reason", async () => {
    getAllJobsWithEligibility.mockResolvedValue(success([job(90, 'Open drive'), job(91, 'Held offer drive')]));
    getApplyChecks.mockResolvedValueOnce({ data: {
      90: { canApply: true, code: 'OPEN' },
      91: { canApply: false, code: 'HELD_OFFER', reason: 'You hold an offer of 6 LPA; this drive pays less than 8.4 LPA.' },
    } });
    render(<JobsListContent basePath="/learn/my-placements" />);
    expect(await screen.findByRole('link', { name: 'Open drive' })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('link', { name: 'Held offer drive' })).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Not open to you/ }));
    const card = screen.getByRole('link', { name: 'Held offer drive' }).closest('article');
    expect(within(card).getByText(/this drive pays less than 8\.4 LPA/)).toBeInTheDocument();
    expect(getApplyChecks).toHaveBeenCalledWith([90, 91]);
  });
});
