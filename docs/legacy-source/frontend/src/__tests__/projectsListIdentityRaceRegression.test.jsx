/**
 * Worker C: C-PJ-01/02/03/07/13 and C-AU-03/09 (PARTIAL MOCKED_COMPONENT).
 * Exercises the actual Projects list and its real identity-keyed page wrapper,
 * not a mocked ProjectsContent. getProjectsPage is mocked; these assertions
 * cannot prove the backend has enforced membership or tenancy.
 */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import LearnProjectsPage from '@/pages/learn/projects';
import MentorProjectsPage from '@/pages/mentor/projects';
import { getProjectsPage } from '@/api/Services/projectService';

let mockSession;
const mockRouter = {
  isReady: true,
  pathname: '/learn/projects',
  query: {},
  push: jest.fn(),
  replace: jest.fn(),
};

jest.mock('react-redux', () => ({ useSelector: (selector) => selector({ loginUser: mockSession }) }));
jest.mock('next/router', () => ({ useRouter: () => mockRouter }));
jest.mock('@/api/Services/projectService', () => ({
  getProjectsPage: jest.fn(),
  normalizeProjectsList: jest.fn((records) => records),
}));
jest.mock('@/components/Projects/ProjectsShell', () => {
  const React = require('react');
  return function MockProjectsShell({ children }) {
    return React.createElement('main', { 'aria-label': 'Projects list' }, children);
  };
});
jest.mock('@/utils/useCollegeFeatureFlags', () => ({
  __esModule: true,
  default: () => ({ projectsEnabled: true, modules: { projects: true } }),
}));

const page = (records, totalRecords = records.length) => ({ data: { data: { records, totalRecords } } });
const project = (id, title, overrides = {}) => ({ id, title, status: 'ACTIVE', ...overrides });
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

beforeEach(() => {
  jest.clearAllMocks();
  getProjectsPage.mockReset();
  mockSession = { id: 42, userType: 'LEARNER', organizationId: 3, collegeId: 7 };
  mockRouter.isReady = true;
  mockRouter.pathname = '/learn/projects';
  mockRouter.query = {};
});

describe('Projects list: real component, mocked API', () => {
  it('shows the empty assigned-project state and sends the expected first-page query', async () => {
    getProjectsPage.mockResolvedValueOnce(page([]));
    render(<LearnProjectsPage />);
    expect(await screen.findByText('No projects assigned yet.')).toBeInTheDocument();
    expect(getProjectsPage).toHaveBeenCalledTimes(1);
    expect(getProjectsPage).toHaveBeenCalledWith({
      page: 0, size: 25, search: '', status: undefined, attention: undefined,
    });
    expect(screen.queryByText('Projects could not be loaded')).not.toBeInTheDocument();
  });

  it('shows a safe failure, clears stale rows and reloads successfully only after Retry', async () => {
    getProjectsPage
      .mockRejectedValueOnce(new Error('synthetic backend error with private detail'))
      .mockResolvedValueOnce(page([project(91, 'Recovered workspace')]));
    render(<LearnProjectsPage />);
    expect(await screen.findByText('Projects could not be loaded')).toBeInTheDocument();
    expect(screen.getByText('Check your connection, then try again. Your project data has not been changed.'))
      .toBeInTheDocument();
    expect(screen.queryByText('Recovered workspace')).not.toBeInTheDocument();
    expect(getProjectsPage).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Recovered workspace')).toBeInTheDocument();
    expect(getProjectsPage).toHaveBeenCalledTimes(2);
    expect(screen.queryByText('Projects could not be loaded')).not.toBeInTheDocument();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('hides the previous scope while a new search is loading, then renders only the new results', async () => {
    const nextScope = deferred();
    getProjectsPage
      .mockResolvedValueOnce(page([project(90, 'Alpha workspace')]))
      .mockReturnValueOnce(nextScope.promise);

    render(<LearnProjectsPage />);
    expect(await screen.findByText('Alpha workspace')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search my projects'), { target: { value: 'beta' } });
    await waitFor(() => expect(getProjectsPage).toHaveBeenCalledTimes(2), { timeout: 1500 });

    expect(screen.queryByText('Alpha workspace')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading projects');

    await act(async () => {
      nextScope.resolve(page([project(91, 'Beta workspace')]));
      await nextScope.promise;
    });

    expect(await screen.findByText('Beta workspace')).toBeInTheDocument();
    expect(screen.queryByText('Alpha workspace')).not.toBeInTheDocument();
  });

  it('rejects a malformed records object instead of silently treating it as a valid empty project list', async () => {
    getProjectsPage.mockResolvedValueOnce({ data: { data: { records: null, totalRecords: 7 } } });
    render(<LearnProjectsPage />);
    expect(await screen.findByText('Projects could not be loaded')).toBeInTheDocument();
    expect(screen.queryByText('No projects assigned yet.')).not.toBeInTheDocument();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('preserves College B projects when a same-ID College A request resolves after the identity switch', async () => {
    const oldRequest = deferred();
    const newRequest = deferred();
    getProjectsPage.mockReturnValueOnce(oldRequest.promise).mockReturnValueOnce(newRequest.promise);
    const view = render(<LearnProjectsPage />);
    await waitFor(() => expect(getProjectsPage).toHaveBeenCalledTimes(1));

    mockSession = { ...mockSession, collegeId: 8 }; // same numeric user and workspace IDs
    view.rerender(<LearnProjectsPage />);
    await waitFor(() => expect(getProjectsPage).toHaveBeenCalledTimes(2));
    await act(async () => {
      newRequest.resolve(page([project(101, 'College B current workspace')]));
      await newRequest.promise;
    });
    expect(await screen.findByText('College B current workspace')).toBeInTheDocument();
    await act(async () => {
      oldRequest.resolve(page([project(101, 'College A private workspace')]));
      await oldRequest.promise;
    });
    expect(screen.getByText('College B current workspace')).toBeInTheDocument();
    expect(screen.queryByText('College A private workspace')).not.toBeInTheDocument();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('does not replace a successfully loaded new account with a late failure from the old account', async () => {
    const oldRequest = deferred();
    getProjectsPage.mockReturnValueOnce(oldRequest.promise)
      .mockResolvedValueOnce(page([project(202, 'New account workspace')]));
    const view = render(<LearnProjectsPage />);
    await waitFor(() => expect(getProjectsPage).toHaveBeenCalledTimes(1));
    mockSession = { ...mockSession, id: 43 };
    view.rerender(<LearnProjectsPage />);
    expect(await screen.findByText('New account workspace')).toBeInTheDocument();
    await act(async () => {
      oldRequest.reject(new Error('old account request failed'));
      await expect(oldRequest.promise).rejects.toThrow('old account request failed');
    });
    expect(screen.getByText('New account workspace')).toBeInTheDocument();
    expect(screen.queryByText('Projects could not be loaded')).not.toBeInTheDocument();
  });

  it('sorts archived projects last and does not offer blocked or review actions on archived work', async () => {
    getProjectsPage.mockResolvedValueOnce(page([
      project(7, 'Archived workspace', {
        status: 'ARCHIVED', blocker: 'Old blocker', nextAction: 'Submit old sprint',
        resolvedDelivery: { reviewStatus: 'submitted' },
      }),
      project(8, 'Current workspace', { status: 'ACTIVE' }),
    ]));
    render(<LearnProjectsPage />);
    expect(await screen.findByText('Current workspace')).toBeInTheDocument();
    expect(Array.from(document.querySelectorAll('.learn-projects-card h3')).map((node) => node.textContent))
      .toEqual(['Current workspace', 'Archived workspace']);
    const archivedCard = screen.getByText('Archived workspace').closest('button');
    expect(archivedCard).toHaveTextContent('Archived');
    expect(archivedCard).not.toHaveTextContent('Old blocker');
    expect(archivedCard).not.toHaveTextContent('Submit old sprint');
    expect(archivedCard).not.toHaveTextContent('Needs review');
  });

  it('does not expose mentor-only needs-review indicators to a nonmentor on a mentor URL', async () => {
    mockRouter.pathname = '/mentor/projects';
    mockSession = { ...mockSession, userType: 'FACULTY', facultyType: 'COORDINATOR' };
    getProjectsPage.mockResolvedValue(page([project(7, 'Reviewable workspace', {
      resolvedDelivery: { reviewStatus: 'submitted' },
    })]));
    const view = render(<MentorProjectsPage />);
    expect(await screen.findByText('Reviewable workspace')).toBeInTheDocument();
    expect(screen.queryByText('Needs review')).not.toBeInTheDocument();

    mockSession = { ...mockSession, facultyType: 'MENTOR' };
    view.rerender(<MentorProjectsPage />);
    expect(await screen.findByText('Needs review')).toBeInTheDocument();
    expect(getProjectsPage).toHaveBeenCalledTimes(2);
  });
});
